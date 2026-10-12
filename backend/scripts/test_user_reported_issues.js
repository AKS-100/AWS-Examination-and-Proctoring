import { syncCognitoIdentity, findUserByEmail, updateUserRole } from '../src/services/user.service.js';
import { generateToken } from '../src/services/user.service.js';
import { ROLES, normalizeRole } from '../src/utils/roles.js';

const BASE_URL = 'http://localhost:5000/api';

const runTests = async () => {
  console.log('========================================================');
  console.log(' Targeted Test Suite: Role Assignment & Exam Data Flow  ');
  console.log('========================================================\n');

  // TEST 1: Teacher Role Synchronization for User's Account
  console.log('--- TEST 1: Authorized Teacher Login (stasissoftwarepvtltd@gmail.com) ---');
  const teacherEmail = 'stasissoftwarepvtltd@gmail.com';
  const teacherSub = 'cognito-sub-user-teacher-001';

  const syncedTeacher = await syncCognitoIdentity({
    sub: teacherSub,
    email: teacherEmail,
    name: 'Sudhanshu Kumar Singh',
    intendedRole: 'teacher',
  });

  console.log('Synced User Email:', syncedTeacher.email);
  console.log('Synced User Role:', syncedTeacher.role);
  console.log('Synced User Status:', syncedTeacher.status);
  if (syncedTeacher.role !== 'teacher') {
    throw new Error(`FAIL: Expected role 'teacher' for ${teacherEmail}, got '${syncedTeacher.role}'`);
  }
  console.log('PASS: Account correctly identified as Teacher.\n');

  // TEST 2: Validate Cognito Session via API for Teacher
  console.log('--- TEST 2: /api/auth/cognito-session with intendedRole = teacher ---');
  // Log in via HTTP to obtain token from running server instance
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: teacherEmail,
      password: 'Sudhanshu@123',
      role: 'teacher',
    }),
  });
  const loginData = await loginRes.json();
  const teacherToken = loginData.data?.token;
  console.log('Login Response Status:', loginRes.status);
  console.log('User Role from Server Login:', loginData.data?.user?.role);

  const resSession = await fetch(`${BASE_URL}/auth/cognito-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${teacherToken}`,
    },
    body: JSON.stringify({ intendedRole: 'teacher' }),
  });

  const sessionData = await resSession.json();
  console.log('HTTP Status:', resSession.status);
  console.log('User Role in Response:', sessionData.data?.user?.role);
  if (resSession.status !== 200 || sessionData.data?.user?.role !== 'teacher') {
    throw new Error(`FAIL: /api/auth/cognito-session returned ${resSession.status}: ${JSON.stringify(sessionData)}`);
  }
  console.log('PASS: Teacher workspace access granted successfully.\n');

  // TEST 3: Student cannot elevate to Teacher
  console.log('--- TEST 3: Student attempting teacher elevation (Security Check) ---');
  const studentEmail = `student_${Date.now()}@example.com`;
  const studentSub = `cognito-sub-student-${Date.now()}`;

  const syncedStudent = await syncCognitoIdentity({
    sub: studentSub,
    email: studentEmail,
    name: 'Test Student',
    intendedRole: 'teacher', // Student tries to claim teacher
  });

  console.log('Student account role:', syncedStudent.role);
  if (syncedStudent.role !== 'student') {
    throw new Error(`FAIL: Unauthorized student received elevated role '${syncedStudent.role}'`);
  }

  // Register student via HTTP on live server
  const regStudentRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Student',
      email: studentEmail,
      password: 'StudentPassword@123',
      role: 'student',
      studentId: 'STU-TEST-999',
    }),
  });
  const regStudentData = await regStudentRes.json();
  const studentToken = regStudentData.data?.token;

  // Student attempts to call /cognito-session with intendedRole: 'teacher'
  const resStudentTeacherAttempt = await fetch(`${BASE_URL}/auth/cognito-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({ intendedRole: 'teacher' }),
  });

  console.log('HTTP Status for Student claiming Teacher:', resStudentTeacherAttempt.status);
  const studentAttemptData = await resStudentTeacherAttempt.json();
  console.log('Error Code:', studentAttemptData.error?.code);
  console.log('Error Message:', studentAttemptData.error?.message);
  if (resStudentTeacherAttempt.status !== 403 || studentAttemptData.error?.code !== 'ROLE_MISMATCH') {
    throw new Error(`FAIL: Expected 403 ROLE_MISMATCH, got ${resStudentTeacherAttempt.status}`);
  }
  console.log('PASS: Student successfully blocked from Teacher workspace.\n');

  // TEST 4: Student accessing Teacher-Only Endpoints
  console.log('--- TEST 4: RBAC Guard on Teacher Endpoints ---');
  const resTeacherOnly = await fetch(`${BASE_URL}/exams/teacher`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  console.log('Student access to /api/exams/teacher status:', resTeacherOnly.status);
  if (resTeacherOnly.status !== 403) {
    throw new Error(`FAIL: Student was not blocked by requireTeacher (Status: ${resTeacherOnly.status})`);
  }
  console.log('PASS: Teacher endpoints strictly protected by RBAC.\n');

  // TEST 5: Repeated Login does not duplicate users or reset roles
  console.log('--- TEST 5: Repeated Login Idempotency Check ---');
  const repeatedSync = await syncCognitoIdentity({
    sub: teacherSub,
    email: teacherEmail,
    name: 'Sudhanshu Kumar Singh',
    intendedRole: 'teacher',
  });
  console.log('Repeated sync ID matches:', repeatedSync._id === syncedTeacher._id);
  console.log('Repeated sync preserves Teacher role:', repeatedSync.role === 'teacher');
  if (repeatedSync._id !== syncedTeacher._id || repeatedSync.role !== 'teacher') {
    throw new Error('FAIL: Repeated login did not preserve identity or role.');
  }
  console.log('PASS: Repeated logins are idempotent and role-stable.\n');

  // TEST 6: Student Exam Session Data Flow (End-to-End)
  console.log('--- TEST 6: Exam Session Question Data Flow ---');
  // First, get available exams
  const resAvailable = await fetch(`${BASE_URL}/exams/student/available`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const availableData = await resAvailable.json();
  console.log('Available exams count:', availableData.data?.exams?.length);
  if (!availableData.data?.exams?.length) {
    throw new Error('FAIL: No available exams found for student');
  }

  const targetExam = availableData.data.exams[0];
  console.log(`Starting exam: "${targetExam.title}" (ID: ${targetExam._id})`);

  const resStart = await fetch(`${BASE_URL}/exams/student/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({ examId: targetExam._id }),
  });

  const startData = await resStart.json();
  console.log('Start Exam HTTP Status:', resStart.status);
  console.log('Top-level questions array present?', Array.isArray(startData.data?.questions));
  console.log('Top-level questions count:', startData.data?.questions?.length);
  console.log('Exam nested questions array present?', Array.isArray(startData.data?.exam?.questions));
  console.log('Exam nested questions count:', startData.data?.exam?.questions?.length);

  const questions = startData.data?.questions || startData.data?.exam?.questions;
  if (!questions || questions.length === 0) {
    throw new Error('FAIL: Questions array is empty! This was the cause of Question 0 of 0 bug.');
  }

  const firstQ = questions[0];
  console.log('First Question properties:');
  console.log('   - ID:', firstQ._id || firstQ.id);
  console.log('   - Text:', (firstQ.text || firstQ.question)?.substring(0, 50) + '...');
  console.log('   - Options count:', firstQ.options?.length);
  console.log('   - Marks:', firstQ.marks);
  console.log('   - Are correct answers hidden?', firstQ.correctOptionIndex === undefined);

  if (firstQ.correctOptionIndex !== undefined) {
    throw new Error('FAIL: Correct option index leaked to student!');
  }
  console.log('PASS: Exam questions load completely with full security sanitization.\n');

  console.log('========================================================');
  console.log(' ALL TARGETED VERIFICATION TESTS PASSED 100%!          ');
  console.log('========================================================');
  process.exit(0);
};

runTests().catch((err) => {
  console.error('\nTEST SUITE FAILED:', err.message);
  process.exit(1);
});
