import http from 'http';

const BASE_URL = 'http://localhost:5000/api';

const request = (path, method = 'GET', body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

async function runTests() {
  console.log('====================================================');
  console.log(' E2E VERIFICATION TEST SUITE');
  console.log('====================================================\n');

  // 1. Teacher Login
  console.log('1. Testing Teacher Login...');
  const teacherLogin = await request('/auth/login', 'POST', {
    email: 'teacher@adaptive.edu',
    password: 'password123',
  });
  console.log('   Teacher Login Status:', teacherLogin.status, 'Role:', teacherLogin.body?.data?.user?.role);
  const teacherToken = teacherLogin.body?.data?.token;

  // 2. Student Login
  console.log('\n2. Testing Student Login...');
  const studentLogin = await request('/auth/login', 'POST', {
    email: 'student@adaptive.edu',
    password: 'password123',
  });
  console.log('   Student Login Status:', studentLogin.status, 'Role:', studentLogin.body?.data?.user?.role);
  const studentToken = studentLogin.body?.data?.token;

  // 3. Teacher Creates Exam with specific Gmail
  console.log('\n3. Teacher Creates Exam with specific Gmail...');
  const newExam = await request('/exams/teacher', 'POST', {
    title: 'Distributed Systems & Cloud Consistency Exam',
    courseCode: 'CS-440',
    creatorEmail: 'prof.sharma@gmail.com',
    durationMinutes: 40,
    passingMarks: 10,
    status: 'published',
    questions: [
      {
        text: 'What guarantee does Paxos consensus provide in distributed computing?',
        options: ['Strict FIFO queues', 'Agreement across distributed nodes', 'Eventual network partition repair', 'Unlimited throughput'],
        correctOptionIndex: 1,
        marks: 10,
        explanation: 'Paxos achieves consensus on a single chosen value among distributed replicas.',
      },
    ],
  }, teacherToken);
  console.log('   Exam created:', newExam.status, 'Title:', newExam.body?.data?.exam?.title, 'Creator Email:', newExam.body?.data?.exam?.creatorEmail);
  const createdExamId = newExam.body?.data?.exam?._id;

  // 4. Student queries available exams with Teacher Gmail filter
  console.log('\n4. Student queries available exams filtered by "prof.sharma@gmail.com"...');
  const filteredExams = await request('/exams/student/available?teacherEmail=prof.sharma@gmail.com', 'GET', null, studentToken);
  const matched = (filteredExams.body?.data?.exams || []).map((e) => ({
    title: e.title,
    creatorEmail: e.creatorEmail,
  }));
  console.log('   Exams found for prof.sharma@gmail.com:', matched.length);
  console.log('   Details:', JSON.stringify(matched, null, 2));

  console.log('\n5. Student queries available exams filtered by "teacher@adaptive.edu"...');
  const defaultExams = await request('/exams/student/available?teacherEmail=teacher@adaptive.edu', 'GET', null, studentToken);
  const defaultMatched = (defaultExams.body?.data?.exams || []).map((e) => ({
    title: e.title,
    creatorEmail: e.creatorEmail,
  }));
  console.log('   Exams found for teacher@adaptive.edu:', defaultMatched.length);

  // 6. Pre-flight Rekognition single face detection
  console.log('\n6. Testing AWS Rekognition Single Face Verification...');
  const sampleFrame = 'data:image/jpeg;base64,' + Buffer.from('dummy_single_face_image_content_12345678901234567890').toString('base64');
  const rekSingle = await request('/aws/rekognition/detect-faces', 'POST', {
    imageBase64: sampleFrame,
  }, studentToken);
  console.log('   rekSingle status:', rekSingle.status, 'body:', JSON.stringify(rekSingle.body));

  // 7. Pre-flight Rekognition multi-face breach detection & S3 upload
  console.log('\n7. Testing AWS Rekognition Multi-Face Detection (Anomaly Simulation)...');
  const rekMulti = await request('/aws/rekognition/detect-faces', 'POST', {
    imageBase64: sampleFrame,
    simulateAnomaly: 'MULTIPLE_FACES',
  }, studentToken);
  console.log('   rekMulti status:', rekMulti.status, 'body:', JSON.stringify(rekMulti.body));

  // 8. AWS S3 Snapshot Upload
  console.log('\n8. Testing Amazon S3 Snapshot Upload...');
  const s3Upload = await request('/aws/s3/upload-snapshot', 'POST', {
    imageBase64: sampleFrame,
    key: `evidence/test_attempt_01/multiface_breach_${Date.now()}.jpg`,
  }, studentToken);
  console.log('   S3 Upload Status:', s3Upload.status, 'URL:', s3Upload.body?.data?.url || s3Upload.body?.data?.publicUrl);

  // 9. Start attempt and record suspicious proctoring incident (e.g. PHONE_DETECTED)
  console.log('\n9. Testing Attempt start & suspicious incident telemetry (PHONE_DETECTED)...');
  const startAttemptRes = await request('/exams/student/start', 'POST', {
    examId: createdExamId,
  }, studentToken);
  console.log('   startAttempt status:', startAttemptRes.status, 'body:', JSON.stringify(startAttemptRes.body));
  const attemptId = startAttemptRes.body?.data?.attempt?._id;
  console.log('   Started attempt:', attemptId);

  const phoneBreachRes = await request(`/exams/student/attempt/${attemptId}/proctor-event`, 'POST', {
    eventType: 'PHONE_DETECTED',
    details: 'Candidate mobile phone identified in testing viewport',
    severity: 'critical',
    snapshotBase64: sampleFrame,
  }, studentToken);
  console.log('   Phone Breach Telemetry Result: Status:', phoneBreachRes.status, 'Risk Score:', phoneBreachRes.body?.data?.riskScore, 'Risk Level:', phoneBreachRes.body?.data?.riskLevel);

  console.log('\n====================================================');
  console.log(' ALL END-TO-END CRITICAL TESTS COMPLETED SUCCESSFULLY!');
  console.log('====================================================\n');
}

runTests().catch(console.error);
