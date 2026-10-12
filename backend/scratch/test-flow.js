import http from 'http';

function post(path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          ...headers,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode, raw });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method: 'GET',
        headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode, raw });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('--- 1. Login as Student (student@adaptive.edu) ---');
  const studentLogin = await post('/api/auth/login', {
    email: 'student@adaptive.edu',
    password: 'Student@123',
  });
  console.log('Student Login status:', studentLogin.status);
  const studentToken = studentLogin.data.data.token;

  console.log('\n--- 2. Fetch Available Exams for student before teacher creates any ---');
  const examsBefore = await get('/api/exams/student/available', {
    Authorization: `Bearer ${studentToken}`,
  });
  console.log('Available exams count for student:', examsBefore.data?.data?.exams?.length);
  console.log(
    'Exam titles:',
    examsBefore.data?.data?.exams?.map((e) => `${e.courseCode}: ${e.title}`)
  );

  console.log('\n--- 3. Login as Teacher (teacher@adaptive.edu) ---');
  const teacherLogin = await post('/api/auth/login', {
    email: 'teacher@adaptive.edu',
    password: 'Teacher@123',
  });
  console.log('Teacher Login status:', teacherLogin.status);
  const teacherToken = teacherLogin.data.data.token;

  console.log('\n--- 4. Teacher creates exam assigned strictly to student@adaptive.edu ---');
  const createRes = await post(
    '/api/exams/teacher',
    {
      title: 'Midterm: Cloud & Distributed Systems',
      courseCode: 'CS-501',
      description: 'Official proctored examination for enrolled CS students',
      durationMinutes: 45,
      passingMarks: 10,
      assignedStudentEmails: 'student@adaptive.edu',
      status: 'published',
      questions: [
        {
          text: 'Which consistency model guarantees linearizability?',
          options: ['Strict Consistency', 'Eventual Consistency', 'Read Uncommitted', 'None'],
          correctOptionIndex: 0,
          marks: 10,
          explanation: 'Strict consistency enforces immediate global visibility.',
        },
      ],
    },
    { Authorization: `Bearer ${teacherToken}` }
  );
  console.log('Create Exam status:', createRes.status);
  const createdExam = createRes.data?.data?.exam;
  console.log('Created Exam ID:', createdExam?._id, 'Assigned to:', createdExam?.assignedStudentEmails);

  console.log('\n--- 5. Student (student@adaptive.edu) fetches available exams ---');
  const examsAfter = await get('/api/exams/student/available', {
    Authorization: `Bearer ${studentToken}`,
  });
  console.log('Available exams count for student@adaptive.edu:', examsAfter.data?.data?.exams?.length);
  console.log(
    'Exams for student@adaptive.edu:',
    examsAfter.data?.data?.exams?.map((e) => `[${e.courseCode}] ${e.title} (Duration: ${e.durationMinutes}m)`)
  );

  console.log('\n--- 6. Register a DIFFERENT Student (unassigned@adaptive.edu) ---');
  const otherRegister = await post('/api/auth/register', {
    name: 'Unassigned Candidate',
    email: 'unassigned@adaptive.edu',
    password: 'Password@123',
    role: 'student',
    studentId: 'ST-999',
    department: 'Electrical Engineering',
  });
  console.log('Other Student Register status:', otherRegister.status);
  const otherToken = otherRegister.data?.data?.token;

  console.log('\n--- 7. Unassigned Student fetches available exams (should ONLY see the 1 Mock Test) ---');
  const otherExams = await get('/api/exams/student/available', {
    Authorization: `Bearer ${otherToken}`,
  });
  console.log('Available exams count for unassigned student:', otherExams.data?.data?.exams?.length);
  console.log(
    'Exams for unassigned student:',
    otherExams.data?.data?.exams?.map((e) => `[${e.courseCode}] ${e.title}`)
  );

  console.log('\n--- 8. Unassigned Student tries to start the teacher exam (should be 403 Forbidden) ---');
  const unauthorizedStart = await post(
    '/api/exams/student/start',
    { examId: createdExam?._id },
    { Authorization: `Bearer ${otherToken}` }
  );
  console.log('Unauthorized Start Attempt Status:', unauthorizedStart.status);
  console.log('Error message:', unauthorizedStart.data?.error?.message);

  console.log('\n--- 9. Assigned Student starts the exam successfully ---');
  const authorizedStart = await post(
    '/api/exams/student/start',
    { examId: createdExam?._id },
    { Authorization: `Bearer ${studentToken}` }
  );
  console.log('Authorized Start Attempt Status:', authorizedStart.status);
  console.log('Attempt ID:', authorizedStart.data?.data?.attempt?._id, 'Deadline:', authorizedStart.data?.data?.attempt?.deadlineTime);

  console.log('\n--- ALL VERIFICATION CHECKS COMPLETED ---');
}

run().catch(console.error);
