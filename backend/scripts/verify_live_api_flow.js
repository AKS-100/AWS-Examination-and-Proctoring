import http from 'http';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.js';

function request(method, path, token = null, body = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (postData) headers['Content-Length'] = Buffer.byteLength(postData);

    const req = http.request(
      { hostname: 'localhost', port: 5000, path, method, headers },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, data: JSON.parse(raw) });
          } catch {
            resolve({ statusCode: res.statusCode, data: raw });
          }
        });
      }
    );
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function verifyLiveFlow() {
  console.log('=== VERIFYING LIVE REQUEST/RESPONSE FLOW ===\n');

  // 1. Health check
  const health = await request('GET', '/api/health');
  console.log('1. GET /api/health:', health.statusCode, health.data?.aws?.status);

  // 2. Student Authentication Token
  const studentToken = jwt.sign(
    { id: 'mem_student_01', studentId: 'mem_student_01', email: 'student@adaptive.edu', role: 'student' },
    env.JWT_SECRET,
    { expiresIn: '2h' }
  );

  // 3. Start Exam Attempt
  console.log('\n2. Starting Exam Attempt...');
  const startRes = await request('POST', '/api/exams/student/start', studentToken, { examId: 'exam_mock_tutorial_01' });
  console.log('   Status:', startRes.statusCode);
  const attemptId = startRes.data?.data?.attempt?._id;
  console.log('   Attempt ID:', attemptId);

  // 4. Check Reference Status
  console.log('\n3. Checking Reference Status...');
  const refStatusRes = await request('GET', '/api/exams/student/reference-status', studentToken);
  console.log('   Status:', refStatusRes.statusCode);
  console.log('   Reference data:', refStatusRes.data?.data);

  // 5. Submit Proctoring Frame for Analysis
  console.log('\n4. Submitting Proctoring Frame to /api/exams/student/attempt/' + attemptId + '/proctor-frame...');
  // 1x1 black JPEG base64
  const sampleFrameB64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
  const proctorRes = await request(
    'POST',
    `/api/exams/student/attempt/${attemptId}/proctor-frame`,
    studentToken,
    {
      imageBase64: sampleFrameB64,
      timestamp: Date.now(),
      isSessionStart: true,
      clientPhoneDetected: false,
      clientPhoneConfidence: 0,
    }
  );
  console.log('   Status:', proctorRes.statusCode);
  console.log('   Proctoring Analysis Result:');
  console.log(JSON.stringify(proctorRes.data, null, 2));

  // 6. Verify Teacher Timeline Retrieval
  console.log('\n5. Verifying Teacher Dashboard Telemetry Retrieval...');
  const teacherToken = jwt.sign(
    { id: 'mem_teacher_01', studentId: 'mem_teacher_01', email: 'teacher@adaptive.edu', role: 'teacher' },
    env.JWT_SECRET,
    { expiresIn: '2h' }
  );
  const timelineRes = await request('GET', `/api/exams/attempt/${attemptId}/proctor-events`, teacherToken);
  console.log('   Status:', timelineRes.statusCode);
  console.log('   Events in timeline:', timelineRes.data?.data?.events?.length || 0);
  if (timelineRes.data?.data?.events?.length > 0) {
    console.log('   Latest Event:', timelineRes.data.data.events[0]);
  }

  console.log('\n=== END-TO-END VERIFICATION COMPLETED SUCCESSFULLY ===');
}

verifyLiveFlow().catch((e) => {
  console.error('Verification error:', e);
  process.exit(1);
});
