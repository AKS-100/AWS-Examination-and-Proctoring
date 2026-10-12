const BASE_URL = 'http://localhost:5000/api';

async function test() {
  console.log('--- 1. Login Teacher ---');
  const tLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'teacher@adaptive.edu', password: 'Teacher@123' })
  });
  const tLogin = await tLoginRes.json();
  const teacherToken = tLogin.data.token;
  console.log('Teacher logged in:', tLogin.data.user.email);

  console.log('\n--- 2. Create Exam Assigned ONLY to specific student email ---');
  const targetEmail = 'restricted.pupil@gmail.com';
  const createRes = await fetch(`${BASE_URL}/exams/teacher`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${teacherToken}`
    },
    body: JSON.stringify({
      title: 'Restricted Security Exam',
      courseCode: 'SEC-999',
      durationMinutes: 45,
      passingMarks: 10,
      creatorEmail: 'teacher@adaptive.edu',
      assignedStudentEmails: targetEmail,
      status: 'published',
      questions: [
        {
          text: 'What protocol protects data in transit?',
          options: ['HTTPS / TLS', 'FTP', 'Telnet', 'HTTP'],
          correctOptionIndex: 0,
          marks: 10,
          explanation: 'TLS encrypts communication.'
        }
      ]
    })
  });
  const createData = await createRes.json();
  console.log('Create exam status:', createRes.status);
  const exam = createData.data?.exam;
  console.log('Exam created:', exam?.title, 'Assigned to:', exam?.assignedStudentEmails);

  console.log('\n--- 3. Query as Unassigned Student (student@adaptive.edu) ---');
  const s1LoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@adaptive.edu', password: 'Student@123' })
  });
  const s1Login = await s1LoginRes.json();
  const s1Token = s1Login.data.token;

  const s1AvailRes = await fetch(`${BASE_URL}/exams/student/available`, {
    headers: { Authorization: `Bearer ${s1Token}` }
  });
  const s1Avail = await s1AvailRes.json();
  const foundByS1 = (s1Avail.data?.exams || []).find((e) => e._id === exam._id);
  console.log('Is exam visible to student@adaptive.edu?', !!foundByS1 ? 'YES (UNEXPECTED)' : 'NO (CORRECT: HIDDEN)');

  console.log('\n--- 4. Register & Query as Target Student (restricted.pupil@gmail.com) ---');
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Restricted Pupil',
      email: targetEmail,
      studentId: 'STU-999',
      password: 'Student@123',
      role: 'student'
    })
  });
  console.log('Register status:', regRes.status, await regRes.json());

  const s2LoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: targetEmail, password: 'Student@123' })
  });
  const s2Login = await s2LoginRes.json();
  console.log('Login status:', s2LoginRes.status, s2Login);
  const s2Token = s2Login.data?.token;

  const s2AvailRes = await fetch(`${BASE_URL}/exams/student/available`, {
    headers: { Authorization: `Bearer ${s2Token}` }
  });
  const s2Avail = await s2AvailRes.json();
  const foundByS2 = (s2Avail.data?.exams || []).find((e) => e._id === exam._id);
  console.log('Is exam visible to target student?', !!foundByS2 ? 'YES (CORRECT: ACCESSIBLE)' : 'NO (UNEXPECTED)');
  if (foundByS2) {
    console.log('Exam isSpecificallyAssigned flag:', foundByS2.isSpecificallyAssigned);
  }

  console.log('\n--- 5. Attempt Exam with Unassigned Student ---');
  const startUnauthorized = await fetch(`${BASE_URL}/exams/student/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${s1Token}`
    },
    body: JSON.stringify({ examId: exam._id })
  });
  console.log('Unassigned student start status:', startUnauthorized.status);
  const unauthData = await startUnauthorized.json();
  console.log('Error message received:', unauthData.error?.message);

  console.log('\n--- 6. Attempt Exam with Target Student ---');
  const startAuthorized = await fetch(`${BASE_URL}/exams/student/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${s2Token}`
    },
    body: JSON.stringify({ examId: exam._id })
  });
  console.log('Target student start status:', startAuthorized.status);
  const authData = await startAuthorized.json();
  console.log('Attempt successfully started? ID:', authData.data?.attempt?._id ? 'YES, ID: ' + authData.data.attempt._id : 'NO');

  console.log('\n--- ALL VERIFICATION CHECKS COMPLETE ---');
}

test().catch(console.error);
