import dynamoService from '../services/dynamo/dynamo.service.js';

/**
 * Lambda: exams
 * Functions:
 * 1. authoring - Create, update, list exams and MCQ question sets
 * 2. roster    - Manage student assignment to exams
 * 3. status    - Transition exam states (draft, active, completed)
 * 4. results   - Compile scores, pass/fail status, and student attempts
 */
export const handler = async (event, context) => {
  try {
    const httpMethod = event.httpMethod || event.requestContext?.http?.method || 'GET';
    const path = event.path || event.rawPath || '';
    const body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {});
    const pathParts = path.split('/').filter(Boolean);
    const examIdFromPath = pathParts[pathParts.length - 1]?.startsWith('exam-') ? pathParts[pathParts.length - 1] : null;

    // 1. GET ALL EXAMS or SINGLE EXAM
    if (httpMethod === 'GET') {
      const examId = examIdFromPath || event.queryStringParameters?.examId;
      if (examId) {
        const exam = await dynamoService.getExam(examId);
        if (!exam) {
          return {
            statusCode: 404,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: false, message: 'Exam not found' }),
          };
        }

        // Check if requesting results
        if (path.endsWith('/results') || event.queryStringParameters?.includeResults) {
          const sessions = await dynamoService.listSessions(examId);
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              success: true,
              data: {
                exam,
                totalAttempts: sessions.length,
                completed: sessions.filter((s) => s.status === 'completed').length,
                autoEnded: sessions.filter((s) => s.status === 'auto_ended').length,
                passedCount: sessions.filter((s) => s.isPassed).length,
                attempts: sessions,
              },
            }),
          };
        }

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: true, data: exam }),
        };
      }

      const allExams = await dynamoService.listExams();
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, count: allExams.length, data: allExams }),
      };
    }

    // 2. CREATE EXAM (Authoring)
    if (httpMethod === 'POST') {
      const {
        title,
        courseCode,
        description,
        durationMinutes,
        passingMarks,
        questions = [],
        roster = [],
        createdBy = 'proctor-01',
      } = body;

      if (!title || !courseCode) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: false, message: 'Exam title and courseCode are required.' }),
        };
      }

      // Compute total marks
      const totalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);

      const examId = body.examId || `exam-${Date.now().toString(36)}`;
      const newExam = {
        examId,
        title,
        courseCode,
        description: description || '',
        durationMinutes: Number(durationMinutes) || 60,
        totalMarks: totalMarks || 100,
        passingMarks: Number(passingMarks) || Math.round(totalMarks * 0.4),
        status: body.status || 'active',
        questions: questions.map((q, idx) => ({
          questionId: q.questionId || `q-${idx + 1}`,
          text: q.text,
          options: q.options || [],
          correctOptionIndex: Number(q.correctOptionIndex) || 0,
          marks: Number(q.marks) || 1,
        })),
        roster: Array.isArray(roster) ? roster : [],
        createdBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await dynamoService.putExam(newExam);

      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'Exam successfully created in Amazon DynamoDB Exams table.',
          data: newExam,
        }),
      };
    }

    // 3. UPDATE EXAM / ROSTER / STATUS
    if (httpMethod === 'PUT' || httpMethod === 'PATCH') {
      const examId = examIdFromPath || body.examId;
      if (!examId) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: false, message: 'examId is required for updates' }),
        };
      }

      const existing = await dynamoService.getExam(examId);
      if (!existing) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: false, message: 'Exam not found' }),
        };
      }

      const updated = {
        ...existing,
        ...body,
        examId,
        updatedAt: new Date().toISOString(),
      };

      await dynamoService.putExam(updated);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, data: updated }),
      };
    }

    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: `Method ${httpMethod} not allowed.` }),
    };
  } catch (error) {
    console.error('[Lambda: exams error]', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};

export default handler;
