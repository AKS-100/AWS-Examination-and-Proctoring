import { docClient, rawDynamoClient, dynamoTables } from '../src/config/dynamodb.config.js';
import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import dynamoService, { isDynamoDbMode } from '../src/services/dynamo/dynamo.service.js';
import * as userService from '../src/services/user.service.js';
import * as examService from '../src/services/exam.service.js';
import { authorize } from '../src/middleware/role.middleware.js';
import { env } from '../src/config/env.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    console.log(`  ✓ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ [FAIL] ${testName} ${details ? `(${details})` : ''}`);
    throw new Error(`Test failed: ${testName}`);
  }
}

async function runTestSuite() {
  console.log('===============================================================');
  console.log(' Amazon DynamoDB Activation Verification Suite');
  console.log(' Database Mode:', env.DATABASE_MODE);
  console.log(' Target Region:', env.AWS_REGION);
  console.log(' Timestamp:', new Date().toISOString());
  console.log('===============================================================\n');

  // Test 1: Configuration & Database Mode verification
  console.log('[1. Configuration & Mode Checks]');
  assert(isDynamoDbMode() === true, 'DATABASE_MODE evaluates to dynamodb');
  const dbStatus = await dynamoService.getDatabaseStatus();
  assert(dbStatus.provider === 'DynamoDB', 'Database provider is DynamoDB');
  assert(dbStatus.state === 'connected', 'DynamoDB status is connected');
  assert(dbStatus.region === 'ap-south-1', 'DynamoDB region is ap-south-1');
  assert(Array.isArray(dbStatus.tables) && dbStatus.tables.length === 5, 'All 5 tables configured');
  assert(!dbStatus.accessKeyId && !dbStatus.secretAccessKey, 'Health status does NOT leak AWS secrets');

  // Test 2: Controlled Probe CRUD Lifecycle across all 5 tables
  console.log('\n[2. Controlled Probe CRUD Lifecycle (Write, Read, Update, Delete)]');
  const probeKey = `test_probe_${Date.now()}`;
  const now = new Date().toISOString();

  // 2a: Students probe
  await docClient.send(
    new PutCommand({
      TableName: dynamoTables.students,
      Item: { studentId: probeKey, name: 'Probe Candidate', role: 'student', createdAt: now },
    })
  );
  let readStudent = await docClient.send(
    new GetCommand({ TableName: dynamoTables.students, Key: { studentId: probeKey } })
  );
  assert(readStudent.Item?.name === 'Probe Candidate', 'Students table: Put and Get succeeded');

  await docClient.send(
    new UpdateCommand({
      TableName: dynamoTables.students,
      Key: { studentId: probeKey },
      UpdateExpression: 'SET #n = :newName',
      ExpressionAttributeNames: { '#n': 'name' },
      ExpressionAttributeValues: { ':newName': 'Updated Probe Candidate' },
    })
  );
  readStudent = await docClient.send(
    new GetCommand({ TableName: dynamoTables.students, Key: { studentId: probeKey } })
  );
  assert(readStudent.Item?.name === 'Updated Probe Candidate', 'Students table: Update succeeded');

  await docClient.send(
    new DeleteCommand({ TableName: dynamoTables.students, Key: { studentId: probeKey } })
  );
  readStudent = await docClient.send(
    new GetCommand({ TableName: dynamoTables.students, Key: { studentId: probeKey } })
  );
  assert(!readStudent.Item, 'Students table: Delete confirmed');

  // 2b: Exams probe
  await docClient.send(
    new PutCommand({
      TableName: dynamoTables.exams,
      Item: { examId: probeKey, title: 'Probe Exam', status: 'draft', createdAt: now },
    })
  );
  let readExam = await docClient.send(
    new GetCommand({ TableName: dynamoTables.exams, Key: { examId: probeKey } })
  );
  assert(readExam.Item?.title === 'Probe Exam', 'Exams table: Put and Get succeeded');

  await docClient.send(
    new DeleteCommand({ TableName: dynamoTables.exams, Key: { examId: probeKey } })
  );
  readExam = await docClient.send(
    new GetCommand({ TableName: dynamoTables.exams, Key: { examId: probeKey } })
  );
  assert(!readExam.Item, 'Exams table: Delete confirmed');

  // 2c: ExamSessions probe
  await docClient.send(
    new PutCommand({
      TableName: dynamoTables.examSessions,
      Item: { sessionId: probeKey, studentId: 'stu-test', examId: 'exam-test', status: 'in_progress', createdAt: now },
    })
  );
  let readSession = await docClient.send(
    new GetCommand({ TableName: dynamoTables.examSessions, Key: { sessionId: probeKey } })
  );
  assert(readSession.Item?.status === 'in_progress', 'ExamSessions table: Put and Get succeeded');

  await docClient.send(
    new DeleteCommand({ TableName: dynamoTables.examSessions, Key: { sessionId: probeKey } })
  );
  readSession = await docClient.send(
    new GetCommand({ TableName: dynamoTables.examSessions, Key: { sessionId: probeKey } })
  );
  assert(!readSession.Item, 'ExamSessions table: Delete confirmed');

  // 2d: FlaggedEvents probe (composite key sessionId + timestamp)
  const probeTimestamp = new Date().toISOString();
  await docClient.send(
    new PutCommand({
      TableName: dynamoTables.flaggedEvents,
      Item: { sessionId: probeKey, timestamp: probeTimestamp, eventType: 'PROBE_EVENT', severity: 'info' },
    })
  );
  let readEvent = await docClient.send(
    new GetCommand({
      TableName: dynamoTables.flaggedEvents,
      Key: { sessionId: probeKey, timestamp: probeTimestamp },
    })
  );
  assert(readEvent.Item?.eventType === 'PROBE_EVENT', 'FlaggedEvents table: Put and Get succeeded');

  await docClient.send(
    new DeleteCommand({
      TableName: dynamoTables.flaggedEvents,
      Key: { sessionId: probeKey, timestamp: probeTimestamp },
    })
  );
  readEvent = await docClient.send(
    new GetCommand({
      TableName: dynamoTables.flaggedEvents,
      Key: { sessionId: probeKey, timestamp: probeTimestamp },
    })
  );
  assert(!readEvent.Item, 'FlaggedEvents table: Delete confirmed');

  // 2e: RiskScores probe (composite key sessionId + timestamp)
  await docClient.send(
    new PutCommand({
      TableName: dynamoTables.riskScores,
      Item: { sessionId: probeKey, timestamp: probeTimestamp, riskScore: 12, riskLevel: 'LOW' },
    })
  );
  let readRisk = await docClient.send(
    new GetCommand({
      TableName: dynamoTables.riskScores,
      Key: { sessionId: probeKey, timestamp: probeTimestamp },
    })
  );
  assert(readRisk.Item?.riskScore === 12, 'RiskScores table: Put and Get succeeded');

  await docClient.send(
    new DeleteCommand({
      TableName: dynamoTables.riskScores,
      Key: { sessionId: probeKey, timestamp: probeTimestamp },
    })
  );
  readRisk = await docClient.send(
    new GetCommand({
      TableName: dynamoTables.riskScores,
      Key: { sessionId: probeKey, timestamp: probeTimestamp },
    })
  );
  assert(!readRisk.Item, 'RiskScores table: Delete confirmed');

  // Test 3: Missing Records & 404/Null handling
  console.log('\n[3. Missing Record Handling]');
  const missingStudent = await dynamoService.getStudent('non_existent_stu_id_xyz_9999');
  assert(missingStudent === null, 'Missing student returns null without crashing');

  const missingExam = await dynamoService.getExam('non_existent_exam_id_xyz_9999');
  assert(missingExam === null, 'Missing exam returns null without crashing');

  const missingSession = await dynamoService.getSession('non_existent_session_id_xyz_9999');
  assert(missingSession === null, 'Missing session returns null without crashing');

  // Test 4: Failed AWS Requests & Error Logging
  console.log('\n[4. Failed AWS Requests & Error Logging]');
  let caughtError = null;
  try {
    // Deliberately request invalid table name
    await docClient.send(
      new GetCommand({
        TableName: 'NonExistentTable_12345',
        Key: { someKey: 'val' },
      })
    );
  } catch (err) {
    caughtError = err;
  }
  assert(caughtError !== null, 'Failed DynamoDB request throws explicit error');
  assert(
    !caughtError.message.includes(env.AWS_SECRET_ACCESS_KEY || 'fake_key'),
    'Error message does NOT leak secret credentials'
  );

  // Test 5: User Profile, Cognito Sub Mapping & Password Stripping
  console.log('\n[5. User Profile Security & Cognito Sub Mapping]');
  const testSub = `sub-test-${Date.now()}`;
  const testEmail = `dynamo.test.${Date.now()}@adaptive.edu`;
  const createdUser = await dynamoService.putStudent({
    studentId: `stu_sec_${Date.now()}`,
    name: 'Security Test Candidate',
    email: testEmail,
    cognitoSub: testSub,
    password: 'SuperSecretPassword123!', // Must be stripped
    passwordHash: '$2a$10$SomeHashString', // Must be stripped
    role: 'student',
  });

  assert(createdUser.password === undefined, 'Password field stripped before write');
  assert(createdUser.passwordHash === undefined, 'PasswordHash field stripped before write');

  // Fetch directly from DynamoDB to verify DB record has no password
  const directFetch = await docClient.send(
    new GetCommand({
      TableName: dynamoTables.students,
      Key: { studentId: createdUser.studentId },
    })
  );
  assert(directFetch.Item?.password === undefined, 'DynamoDB Item strictly contains NO password');
  assert(directFetch.Item?.passwordHash === undefined, 'DynamoDB Item strictly contains NO passwordHash');

  // Lookup by sub pointer
  const foundBySub = await dynamoService.getStudentByCognitoSub(testSub);
  assert(foundBySub?.email === testEmail, 'Lookup by Cognito sub succeeded via deterministic pointer');

  // Lookup by email pointer
  const foundByEmail = await dynamoService.getStudentByEmail(testEmail);
  assert(foundByEmail?.cognitoSub === testSub, 'Lookup by email succeeded via deterministic pointer');

  // Clean up user
  await docClient.send(new DeleteCommand({ TableName: dynamoTables.students, Key: { studentId: createdUser.studentId } }));
  await docClient.send(new DeleteCommand({ TableName: dynamoTables.students, Key: { studentId: `email#${testEmail}` } }));
  await docClient.send(new DeleteCommand({ TableName: dynamoTables.students, Key: { studentId: `sub#${testSub}` } }));

  // Test 6: Role-Based Authorization
  console.log('\n[6. Role-Based Authorization Enforcement]');
  const studentUserObj = { id: 'stu_01', email: 'student@adaptive.edu', role: 'student' };
  const teacherUserObj = { id: 'tch_01', email: 'teacher@adaptive.edu', role: 'teacher' };

  let authFailed = false;
  const mockReqStudent = { user: studentUserObj };
  const mockRes = {
    status: (code) => ({
      json: (data) => {
        if (code === 403) authFailed = true;
      },
    }),
  };
  const mockNext = () => { authFailed = false; };

  const teacherCheck = authorize('teacher');
  teacherCheck(mockReqStudent, mockRes, mockNext);
  assert(authFailed === true, 'Student cannot access Teacher-restricted resources (HTTP 403)');

  const mockReqTeacher = { user: teacherUserObj };
  teacherCheck(mockReqTeacher, mockRes, mockNext);
  assert(authFailed === false, 'Teacher successfully passes Teacher-restricted authorization');

  // Verify syncCognitoIdentity cannot be elevated without institutional authorization
  const unauthorizedSync = await userService.syncCognitoIdentity({
    sub: `sub-intruder-${Date.now()}`,
    email: `intruder_${Date.now()}@gmail.com`,
    name: 'Intruder',
    intendedRole: 'teacher',
  });
  assert(unauthorizedSync.role === 'student', 'Intruder requesting teacher is strictly kept as student');
  // Clean up intruder
  await docClient.send(new DeleteCommand({ TableName: dynamoTables.students, Key: { studentId: unauthorizedSync.studentId } }));
  if (unauthorizedSync.email) {
    await docClient.send(new DeleteCommand({ TableName: dynamoTables.students, Key: { studentId: `email#${unauthorizedSync.email}` } }));
  }

  // Test 7: Exam Lifecycle, Autosave & Submission
  console.log('\n[7. Exam Authoring, Autosave & Submission Flow in DynamoDB]');
  const testExamId = `exam_test_${Date.now()}`;
  const examPayload = {
    examId: testExamId,
    title: 'Automated Cloud Assessment',
    courseCode: 'AWS-301',
    durationMinutes: 45,
    creator: 'tch_01',
    creatorEmail: 'teacher@adaptive.edu',
    status: 'published',
    questions: [
      {
        questionId: 'q1',
        text: 'What service is used for NoSQL key-value database in AWS?',
        options: ['Amazon RDS', 'Amazon DynamoDB', 'Amazon S3', 'Amazon Redshift'],
        correctOptionIndex: 1,
        marks: 5,
      },
      {
        questionId: 'q2',
        text: 'What is the default capacity mode used for this exam?',
        options: ['Provisioned', 'On-Demand', 'Reserved', 'Spot'],
        correctOptionIndex: 1,
        marks: 5,
      },
    ],
  };

  const createdExam = await examService.createExam(examPayload, teacherUserObj);
  assert(createdExam.examId === testExamId, 'Exam created in DynamoDB');

  const retrievedExam = await examService.getExamById(testExamId, false);
  assert(retrievedExam.title === 'Automated Cloud Assessment', 'Exam read from DynamoDB');

  // Start Attempt
  const studentUserForExam = { id: `stu_exam_${Date.now()}`, name: 'Dev Student', email: 'dev.student@adaptive.edu' };
  const attemptResult = await examService.startExamAttempt(testExamId, studentUserForExam);
  const sessionId = attemptResult.attempt.sessionId || attemptResult.attempt._id;
  assert(sessionId !== undefined, `Exam attempt session created: ${sessionId}`);
  assert(attemptResult.questions[0].correctOptionIndex === undefined, 'Student view sanitizes correct answer');

  // Autosave Answer
  const saveRes = await examService.saveStudentAnswer(sessionId, studentUserForExam.id, {
    questionId: 'q1',
    selectedOptionIndex: 1, // Correct answer
    isMarkedForReview: false,
  });
  assert(saveRes.success === true, 'Autosave answer succeeded');

  const sessionAfterSave = await dynamoService.getSession(sessionId);
  assert(
    sessionAfterSave.answers.find((a) => a.questionId === 'q1')?.selectedOptionIndex === 1,
    'Autosaved answer verified in DynamoDB'
  );

  // Autosave second answer
  await examService.saveStudentAnswer(sessionId, studentUserForExam.id, {
    questionId: 'q2',
    selectedOptionIndex: 1, // Correct answer
    isMarkedForReview: false,
  });

  // Submit Attempt
  const submissionRes = await examService.submitExamAttempt(sessionId, studentUserForExam.id, false);
  assert(submissionRes.status === 'completed', 'Attempt status updated to completed');
  assert(submissionRes.score === 10, 'Attempt auto-graded correctly (score = 10 / 10)');
  assert(submissionRes.percentage === 100, 'Percentage calculated correctly (100%)');
  assert(submissionRes.isPassed === true, 'Pass status evaluated to true');

  // Test 8: FlaggedEvents & RiskScores Timestamp-Ordered Querying
  console.log('\n[8. Proctoring Telemetry & Chronological Querying]');
  const t1 = new Date(Date.now() - 30000).toISOString();
  const t2 = new Date(Date.now() - 20000).toISOString();
  const t3 = new Date(Date.now() - 10000).toISOString();

  // Write 3 events out of order
  await dynamoService.putFlaggedEvent({
    sessionId,
    timestamp: t2,
    eventType: 'LOOKING_AWAY',
    severity: 'warning',
    details: 'Candidate gazed away',
  });
  await dynamoService.putFlaggedEvent({
    sessionId,
    timestamp: t1,
    eventType: 'TAB_SWITCH',
    severity: 'warning',
    details: 'Tab switched to external window',
  });
  await dynamoService.putFlaggedEvent({
    sessionId,
    timestamp: t3,
    eventType: 'PHONE_DETECTED',
    severity: 'critical',
    details: 'Mobile device detected in frame',
  });

  // Write 3 risk scores
  await dynamoService.putRiskScoreRecord({ sessionId, timestamp: t1, riskScore: 15, riskLevel: 'LOW' });
  await dynamoService.putRiskScoreRecord({ sessionId, timestamp: t2, riskScore: 35, riskLevel: 'MEDIUM' });
  await dynamoService.putRiskScoreRecord({ sessionId, timestamp: t3, riskScore: 75, riskLevel: 'HIGH' });

  // Query events
  const queriedEvents = await dynamoService.getFlaggedEventsBySession(sessionId);
  assert(queriedEvents.length === 3, 'All 3 flagged events queried');
  assert(queriedEvents[0].eventType === 'TAB_SWITCH', 'Event 1 is oldest (TAB_SWITCH)');
  assert(queriedEvents[1].eventType === 'LOOKING_AWAY', 'Event 2 is middle (LOOKING_AWAY)');
  assert(queriedEvents[2].eventType === 'PHONE_DETECTED', 'Event 3 is newest (PHONE_DETECTED)');

  // Query risk scores
  const queriedRisk = await dynamoService.getRiskScoresBySession(sessionId);
  assert(queriedRisk.length === 3, 'All 3 risk score records queried');
  assert(queriedRisk[0].riskScore === 15 && queriedRisk[2].riskScore === 75, 'Risk scores returned in chronological order');

  // Test 9: Clean up test session and exam
  console.log('\n[9. Controlled Test Cleanup]');
  for (const t of [t1, t2, t3]) {
    await docClient.send(new DeleteCommand({ TableName: dynamoTables.flaggedEvents, Key: { sessionId, timestamp: t } }));
    await docClient.send(new DeleteCommand({ TableName: dynamoTables.riskScores, Key: { sessionId, timestamp: t } }));
  }
  await docClient.send(new DeleteCommand({ TableName: dynamoTables.examSessions, Key: { sessionId } }));
  await docClient.send(new DeleteCommand({ TableName: dynamoTables.exams, Key: { examId: testExamId } }));
  console.log('  ✓ Cleaned up all test artifacts from DynamoDB tables.');

  console.log('\n===============================================================');
  console.log(` ALL TESTS PASSED: ${passedTests}/${totalTests}`);
  console.log(' Amazon DynamoDB is fully operational and verified in ap-south-1!');
  console.log('===============================================================\n');
}

runTestSuite().catch((err) => {
  console.error('\n✗ Test Suite FAILED with error:', err);
  process.exit(1);
});
