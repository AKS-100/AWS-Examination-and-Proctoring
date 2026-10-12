import dynamoService from '../services/dynamo/dynamo.service.js';
import snsService from '../services/aws/sns.service.js';

/**
 * Lambda: dashboard
 * Functions:
 * 1. Live Proctor Monitor: Roster status, active student sessions, risk scores & strikes
 * 2. Marking & Analytics: Pass/Fail breakdown, risk distribution, flagged incident metrics
 * 3. Proctor Session Intervention: Manual strike addition, force-end (terminate) exam session
 * 4. Audit Trail: Detailed telemetry logs per candidate
 */
export const handler = async (event, context) => {
  try {
    const httpMethod = event.httpMethod || event.requestContext?.http?.method || 'GET';
    const path = event.path || event.rawPath || '';
    const body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {});
    const query = event.queryStringParameters || {};

    // 1. PROCTOR ACTION: FORCE-END EXAM SESSION
    if (httpMethod === 'POST' && (path.endsWith('/end-session') || body.action === 'end')) {
      const { sessionId, proctorReason } = body;
      if (!sessionId) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: false, message: 'sessionId is required to end session' }),
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

      const reason = proctorReason || 'Terminated by Proctor via Proctor Console';
      session.status = 'auto_ended';
      session.endTime = new Date().toISOString();
      session.terminationReason = reason;
      session.updatedAt = new Date().toISOString();

      await dynamoService.putSession(session);

      // Record a critical flag in FlaggedEvents
      await dynamoService.putFlaggedEvent({
        sessionId,
        eventType: 'proctor_manual_termination',
        severity: 'critical',
        details: reason,
        riskScoreAfter: 100,
      });

      // Send SNS Alert
      await snsService.sendAutoEndedExamAlert({
        studentName: session.studentName,
        examTitle: session.examTitle,
        strikes: session.strikes || 3,
        riskScore: session.currentRiskScore || 100,
        reason,
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: `Session ${sessionId} has been forcefully ended by proctor.`,
          data: session,
        }),
      };
    }

    // 2. GET SESSION AUDIT TIMELINE (Flagged events and risk scores for a candidate)
    if (httpMethod === 'GET' && (query.sessionId || path.includes('/timeline'))) {
      const sessionId = query.sessionId || path.split('/').pop();
      const session = await dynamoService.getSession(sessionId);
      const events = await dynamoService.getFlaggedEventsBySession(sessionId);
      const riskHistory = await dynamoService.getRiskScoresBySession(sessionId);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          data: {
            session,
            events,
            riskHistory,
          },
        }),
      };
    }

    // 3. GET LIVE DASHBOARD & ANALYTICS OVERVIEW
    const examId = query.examId || null;
    const allSessions = await dynamoService.listSessions(examId);
    const allExams = await dynamoService.listExams();
    const allStudents = await dynamoService.listStudents();

    // Compute live metrics
    const activeSessions = allSessions.filter((s) => s.status === 'in_progress');
    const completedSessions = allSessions.filter((s) => s.status === 'completed');
    const autoEndedSessions = allSessions.filter((s) => s.status === 'auto_ended');

    const highRiskSessions = allSessions.filter((s) => (s.currentRiskScore || 0) >= 50);
    const criticalRiskSessions = allSessions.filter((s) => (s.currentRiskScore || 0) >= 75 || s.strikes >= 2);

    const averageRisk = allSessions.length > 0
      ? Math.round(allSessions.reduce((acc, s) => acc + (s.currentRiskScore || 0), 0) / allSessions.length)
      : 0;

    const passCount = completedSessions.filter((s) => s.isPassed).length;
    const passRate = completedSessions.length > 0
      ? Math.round((passCount / completedSessions.length) * 100)
      : 0;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        data: {
          metrics: {
            totalExams: allExams.length,
            enrolledStudents: allStudents.length,
            totalAttempts: allSessions.length,
            liveActive: activeSessions.length,
            completed: completedSessions.length,
            autoEnded: autoEndedSessions.length,
            highRiskCount: highRiskSessions.length,
            criticalCount: criticalRiskSessions.length,
            averageRiskScore: averageRisk,
            passRate,
          },
          roster: allSessions.map((s) => ({
            sessionId: s.sessionId,
            studentId: s.studentId,
            studentName: s.studentName,
            studentEmail: s.studentEmail,
            examId: s.examId,
            examTitle: s.examTitle,
            status: s.status,
            currentRiskScore: s.currentRiskScore || 0,
            riskLevel: s.riskLevel || 'LOW',
            strikes: s.strikes || 0,
            tabSwitchCount: s.tabSwitchCount || 0,
            faceAbsenceCount: s.faceAbsenceCount || 0,
            multipleFaceCount: s.multipleFaceCount || 0,
            startTime: s.startTime,
            deadlineTime: s.deadlineTime,
            score: s.score,
            percentage: s.percentage,
            isPassed: s.isPassed,
          })),
          exams: allExams.map((e) => ({
            examId: e.examId,
            title: e.title,
            courseCode: e.courseCode,
            durationMinutes: e.durationMinutes,
            totalMarks: e.totalMarks,
            status: e.status,
          })),
        },
      }),
    };
  } catch (error) {
    console.error('[Lambda: dashboard error]', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};

export default handler;
