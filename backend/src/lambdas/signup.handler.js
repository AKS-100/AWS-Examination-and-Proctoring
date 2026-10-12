import dynamoService from '../services/dynamo/dynamo.service.js';

/**
 * Lambda: signup
 * Triggered by: Amazon Cognito Post-Confirmation Trigger
 * Function: Auto-creates student or proctor record in Amazon DynamoDB Students table
 */
export const handler = async (event, context) => {
  try {
    // 1. Check if invoked as Cognito Post Confirmation Event
    if (event.triggerSource === 'PostConfirmation_ConfirmSignUp' || event.userName) {
      const { userName, request } = event;
      const userAttributes = request?.userAttributes || {};

      const studentId = userName || userAttributes.sub || `usr-${Date.now()}`;
      const email = userAttributes.email || `${studentId}@example.com`;
      const name = userAttributes.name || userAttributes['custom:name'] || userName;
      const role = userAttributes['custom:role'] || (email.includes('proctor') ? 'proctor' : 'student');

      const userRecord = {
        studentId,
        cognitoSub: userAttributes.sub || userName,
        name,
        email,
        rollNo: userAttributes['custom:rollNo'] || null,
        role,
        status: role === 'proctor' ? 'active' : 'pending_enrollment',
        faceIds: [],
        baselineImageKeys: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await dynamoService.putStudent(userRecord);
      return event; // Cognito post-confirmation requires returning original event
    }

    // 2. HTTP API Invocation fallback (via API Gateway)
    const body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {});
    const studentId = body.studentId || body.email?.split('@')[0] || `std-${Date.now()}`;

    const student = await dynamoService.putStudent({
      studentId,
      cognitoSub: body.cognitoSub || `cognito-${studentId}`,
      name: body.name || 'Candidate',
      email: body.email,
      rollNo: body.rollNo || null,
      role: body.role || 'student',
      status: body.role === 'proctor' ? 'active' : 'pending_enrollment',
      faceIds: [],
      baselineImageKeys: [],
    });

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, data: student }),
    };
  } catch (error) {
    console.error('[Lambda: signup error]', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};

export default handler;
