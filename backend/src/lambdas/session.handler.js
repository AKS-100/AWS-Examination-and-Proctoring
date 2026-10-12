import dynamoService from '../services/dynamo/dynamo.service.js';

/**
 * Lambda: session
 * Functions:
 * 1. start   - Initialize an exam session for a student
 * 2. resume  - Retrieve current state, answers, and remaining time
 * 3. autosave- Store answer updates from candidate palette
 * 4. submit  - Finalize attempt, calculate score, evaluate pass/fail
 */
export const handler = async (event, context) => {
  try {
    const path = event.path || event.rawPath || '';
    const body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {});
    const action = body.action || (path.split('/').pop());

    // 1. ACTION: START EXAM SESSION
    if (action === 'start' || path.endsWith('/start')) {
      const { studentId, examId } = body;
      if (!studentId || !examId) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: false, message: 'studentId and examId are required' }),
        };
      }

      const exam = await dynamoService.getExam(examId);
      if (!exam) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: false, message: 'Exam not found' }),
        };
      }

      const student = await dynamoService.getStudent(studentId);
      const sessionId = `sess-${examId}-${studentId}-${Date.now().toString(36)}`;
      const now = new Date();
      const durationMs = (exam.durationMinutes || 60) * 60 * 1000;
      const deadline = new Date(now.getTime() + durationMs);

      // Initialize empty answers map
      const initialAnswers = (exam.questions || []).map((q) => ({
        questionId: q.questionId,
        selectedOptionIndex: null,
        isMarkedForReview: false,
        updatedAt: now.toISOString(),
      }));

      const newSession = {
        sessionId,
        studentId,
        studentName: student?.name || 'Candidate',
        studentEmail: student?.email || `${studentId}@example.com`,
        examId,
        examTitle: exam.title,
        courseCode: exam.courseCode,
        durationMinutes: exam.durationMinutes,
        startTime: now.toISOString(),
        deadlineTime: deadline.toISOString(),
        endTime: null,
        status: 'in_progress',
        answers: initialAnswers,
        score: 0,
        totalMarks: exam.totalMarks || 100,
        passingMarks: exam.passingMarks || 40,
        percentage: 0,
        isPassed: false,
        strikes: 0,
        currentRiskScore: 0,
        riskLevel: 'LOW',
        tabSwitchCount: 0,
        fullscreenExitCount: 0,
        faceAbsenceCount: 0,
        multipleFaceCount: 0,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      await dynamoService.putSession(newSession);

      // Return sanitized exam questions (omit correctOptionIndex so student can't cheat)
      const sanitizedQuestions = (exam.questions || []).map(({ correctOptionIndex, ...rest }) => rest);

      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          data: {
            session: newSession,
            exam: {
              ...exam,
              questions: sanitizedQuestions,
            },
          },
        }),
      };
    }

    // 2. ACTION: RESUME SESSION
    if (action === 'resume' || path.endsWith('/resume')) {
      const sessionId = body.sessionId || event.queryStringParameters?.sessionId;
      if (!sessionId) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: false, message: 'sessionId is required' }),
        };
      }

      const session = await dynamoService.getSession(sessionId);
      if (!session) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: false, message: 'Exam session not found' }),
        };
      }

      const exam = await dynamoService.getExam(session.examId);
      const sanitizedQuestions = (exam?.questions || []).map(({ correctOptionIndex, ...rest }) => rest);

      // Calculate remaining seconds
      const deadline = new Date(session.deadlineTime).getTime();
      const now = Date.now();
      const remainingSeconds = Math.max(0, Math.floor((deadline - now) / 1000));

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          data: {
            session,
            remainingSeconds,
            exam: {
              ...exam,
              questions: sanitizedQuestions,
            },
          },
        }),
      };
    }

    // 3. ACTION: AUTOSAVE
    if (action === 'autosave' || path.endsWith('/autosave')) {
      const { sessionId, questionId, selectedOptionIndex, isMarkedForReview } = body;
      if (!sessionId) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: false, message: 'sessionId is required' }),
        };
      }

      const session = await dynamoService.getSession(sessionId);
      if (!session) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: false, message: 'Session not found' }),
        };
      }

      if (session.status !== 'in_progress') {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: false, message: `Cannot autosave: Session is already ${session.status}` }),
        };
      }

      // Update question in answer array
      const answers = [...(session.answers || [])];
      const existingIdx = answers.findIndex((a) => a.questionId === questionId);

      if (existingIdx >= 0) {
        answers[existingIdx] = {
          ...answers[existingIdx],
          selectedOptionIndex: selectedOptionIndex !== undefined ? selectedOptionIndex : answers[existingIdx].selectedOptionIndex,
          isMarkedForReview: isMarkedForReview !== undefined ? isMarkedForReview : answers[existingIdx].isMarkedForReview,
          updatedAt: new Date().toISOString(),
        };
      } else if (questionId) {
        answers.push({
          questionId,
          selectedOptionIndex: selectedOptionIndex ?? null,
          isMarkedForReview: Boolean(isMarkedForReview),
          updatedAt: new Date().toISOString(),
        });
      }

      session.answers = answers;
      session.updatedAt = new Date().toISOString();
      await dynamoService.putSession(session);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'Answer autosaved successfully to DynamoDB ExamSessions.',
          savedAt: session.updatedAt,
        }),
      };
    }

    // 4. ACTION: SUBMIT EXAM
    if (action === 'submit' || path.endsWith('/submit')) {
      const { sessionId } = body;
      if (!sessionId) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: false, message: 'sessionId is required' }),
        };
      }

      const session = await dynamoService.getSession(sessionId);
      if (!session) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: false, message: 'Session not found' }),
        };
      }

      const exam = await dynamoService.getExam(session.examId);
      const questions = exam?.questions || [];

      // Auto-grade MCQs against master exam questions
      let totalScore = 0;
      const gradedAnswers = (session.answers || []).map((ans) => {
        const q = questions.find((item) => item.questionId === ans.questionId);
        if (!q) return ans;

        const isCorrect = ans.selectedOptionIndex !== null && ans.selectedOptionIndex === q.correctOptionIndex;
        const marksAwarded = isCorrect ? (q.marks || 1) : 0;
        totalScore += marksAwarded;

        return {
          ...ans,
          isCorrect,
          marksAwarded,
        };
      });

      const totalMarks = exam?.totalMarks || 100;
      const passingMarks = exam?.passingMarks || 40;
      const percentage = Math.round((totalScore / totalMarks) * 100 * 10) / 10;
      const isPassed = totalScore >= passingMarks;

      session.answers = gradedAnswers;
      session.score = totalScore;
      session.percentage = percentage;
      session.isPassed = isPassed;
      session.status = session.status === 'auto_ended' ? 'auto_ended' : 'completed';
      session.endTime = new Date().toISOString();
      session.updatedAt = new Date().toISOString();

      await dynamoService.putSession(session);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'Exam submitted and graded successfully.',
          data: {
            sessionId: session.sessionId,
            score: totalScore,
            totalMarks,
            percentage,
            isPassed,
            status: session.status,
            endTime: session.endTime,
          },
        }),
      };
    }

    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: `Unknown session action: ${action}` }),
    };
  } catch (error) {
    console.error('[Lambda: session error]', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};

export default handler;
