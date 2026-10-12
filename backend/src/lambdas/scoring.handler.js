import dynamoService from '../services/dynamo/dynamo.service.js';
import s3Service from '../services/aws/s3.service.js';
import snsService from '../services/aws/sns.service.js';

/**
 * Lambda: scoring
 * Functions:
 * 1. Process candidate proctoring events (face absence, multi-face, tab switches, keystrokes)
 * 2. Calculate dynamic risk score (0–100) and risk level (LOW, MEDIUM, HIGH, CRITICAL)
 * 3. Track strikes (3-strike escalation threshold)
 * 4. Record to DynamoDB tables: FlaggedEvents & RiskScores
 * 5. If evidence image is included, upload to S3 private media under flagged/
 * 6. Send SNS proctor alert upon escalation or auto-end
 */

const SEVERITY_WEIGHTS = {
  tab_switch: 15,
  fullscreen_exit: 15,
  face_absence: 20,
  multiple_faces: 35,
  cell_phone: 40,
  gaze_deviation: 10,
  keystroke_anomaly: 15,
};

export const handler = async (event, context) => {
  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {});
    const { sessionId, eventType, details, confidence, evidenceBase64 } = body;

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

    if (session.status !== 'in_progress') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: `Session is already ${session.status}. Telemetry ignored.`,
          sessionStatus: session.status,
        }),
      };
    }

    // 1. Calculate risk contribution and update event counts
    const weight = SEVERITY_WEIGHTS[eventType] || 10;
    let isStrikeCandidate = false;

    if (eventType === 'tab_switch') {
      session.tabSwitchCount = (session.tabSwitchCount || 0) + 1;
      isStrikeCandidate = true;
    } else if (eventType === 'fullscreen_exit') {
      session.fullscreenExitCount = (session.fullscreenExitCount || 0) + 1;
      isStrikeCandidate = true;
    } else if (eventType === 'face_absence') {
      session.faceAbsenceCount = (session.faceAbsenceCount || 0) + 1;
    } else if (eventType === 'multiple_faces') {
      session.multipleFaceCount = (session.multipleFaceCount || 0) + 1;
      isStrikeCandidate = true;
    } else if (eventType === 'cell_phone') {
      isStrikeCandidate = true;
    }

    // New risk score calculation (bounded 0 to 100)
    const previousScore = session.currentRiskScore || 0;
    const newRiskScore = Math.min(100, previousScore + weight);

    let riskLevel = 'LOW';
    if (newRiskScore >= 75) riskLevel = 'CRITICAL';
    else if (newRiskScore >= 50) riskLevel = 'HIGH';
    else if (newRiskScore >= 25) riskLevel = 'MEDIUM';

    // 2. Strike logic (accumulates when distinct severe anomalies occur)
    let currentStrikes = session.strikes || 0;
    if (isStrikeCandidate) {
      currentStrikes += 1;
    }

    // 3. Optional S3 Flagged Evidence Upload
    let evidenceS3Key = null;
    let snapshotUrl = null;
    if (evidenceBase64) {
      const uploadRes = await s3Service.uploadFlaggedIncident(sessionId, eventType, evidenceBase64);
      evidenceS3Key = uploadRes.key;
      snapshotUrl = uploadRes.url;
    }

    // 4. Record to DynamoDB: FlaggedEvents
    const flaggedEvent = await dynamoService.putFlaggedEvent({
      sessionId,
      eventType: eventType || 'telemetry_anomaly',
      severity: newRiskScore >= 70 ? 'critical' : newRiskScore >= 40 ? 'warning' : 'info',
      details: details || `Detected ${eventType}`,
      confidence: confidence ?? 95,
      riskContribution: weight,
      riskScoreAfter: newRiskScore,
      evidenceS3Key,
      snapshotUrl,
    });

    // 5. Record to DynamoDB: RiskScores
    const riskRecord = await dynamoService.putRiskScoreRecord({
      sessionId,
      riskScore: newRiskScore,
      riskLevel,
      strikes: currentStrikes,
      escalated: currentStrikes >= 2 || newRiskScore >= 70,
      reasons: [eventType],
    });

    // 6. Escalation & Auto-End logic
    let isTerminated = false;
    let terminationReason = null;

    if (currentStrikes >= 3) {
      isTerminated = true;
      terminationReason = `Candidate reached maximum 3 strikes (${eventType})`;
    } else if (newRiskScore >= 95) {
      isTerminated = true;
      terminationReason = 'Risk score reached critical limit (>95)';
    }

    if (isTerminated) {
      session.status = 'auto_ended';
      session.endTime = new Date().toISOString();
      session.terminationReason = terminationReason;

      // Dispatch auto-ended SNS email notification to proctor
      await snsService.sendAutoEndedExamAlert({
        studentName: session.studentName,
        examTitle: session.examTitle,
        strikes: currentStrikes,
        riskScore: newRiskScore,
        reason: terminationReason,
      });
    } else if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL' || currentStrikes === 2) {
      // Dispatch high risk proctor warning via SNS
      await snsService.sendHighRiskProctorAlert({
        studentName: session.studentName,
        examTitle: session.examTitle,
        riskScore: newRiskScore,
        breachType: eventType,
        details: `${details || ''} (Strikes: ${currentStrikes}/3)`,
      });
    }

    // Save updated session in DynamoDB ExamSessions
    session.currentRiskScore = newRiskScore;
    session.riskLevel = riskLevel;
    session.strikes = currentStrikes;
    session.updatedAt = new Date().toISOString();
    await dynamoService.putSession(session);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        data: {
          sessionId,
          eventType,
          currentRiskScore: newRiskScore,
          riskLevel,
          strikes: currentStrikes,
          status: session.status,
          isTerminated,
          terminationReason,
          eventLogged: flaggedEvent.eventId,
          riskLogged: riskRecord.recordId,
        },
      }),
    };
  } catch (error) {
    console.error('[Lambda: scoring error]', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};

export default handler;
