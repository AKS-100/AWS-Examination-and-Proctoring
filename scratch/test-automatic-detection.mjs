const BASE_URL = 'http://localhost:5000/api';

// 1x1 transparent JPEG base64 for test snapshot
const testSnapshot = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

async function verifyAutomaticDetectionPipeline() {
  console.log('=== 1. Login Teacher ===');
  const tLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'teacher@adaptive.edu', password: 'Teacher@123' })
  });
  const tLogin = await tLoginRes.json();
  const teacherToken = tLogin.data.token;
  console.log('Teacher token obtained for:', tLogin.data.user.email);

  console.log('\n=== 2. Create Assessment ===');
  const examRes = await fetch(`${BASE_URL}/exams/teacher`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${teacherToken}`
    },
    body: JSON.stringify({
      title: 'Automated AI Detection Final Assessment',
      courseCode: 'AI-VISION-401',
      durationMinutes: 45,
      passingMarks: 10,
      creatorEmail: 'teacher@adaptive.edu',
      status: 'published',
      questions: [
        {
          text: 'What does COCO-SSD detect in proctoring?',
          options: ['Mobile phones & persons', 'Only audio', 'Only keyboard', 'Nothing'],
          correctOptionIndex: 0,
          marks: 10,
          explanation: 'COCO-SSD detects 80 object classes including cell phones and persons.'
        }
      ]
    })
  });
  const examData = await examRes.json();
  const examId = examData.data.exam._id;
  console.log('Exam created:', examData.data.exam.title, 'ID:', examId);

  console.log('\n=== 3. Login Student & Start Attempt ===');
  const sLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@adaptive.edu', password: 'Student@123' })
  });
  const sLogin = await sLoginRes.json();
  const studentToken = sLogin.data.token;

  const startRes = await fetch(`${BASE_URL}/exams/student/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`
    },
    body: JSON.stringify({ examId })
  });
  const startData = await startRes.json();
  const attemptId = startData.data.attempt._id;
  console.log('Student started exam attempt:', attemptId);

  console.log('\n=== 4. Dispatch Automated PHONE_DETECTED Telemetry ===');
  const phoneEventRes = await fetch(`${BASE_URL}/exams/student/attempt/${attemptId}/proctor-event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      eventType: 'PHONE_DETECTED',
      details: 'Automatic AI Vision: Mobile phone detected in live camera viewport (92% confidence)',
      severity: 'critical',
      confidence: 92,
      snapshotBase64: testSnapshot,
      isAutomated: true
    })
  });
  const phoneData = await phoneEventRes.json();
  console.log('PHONE_DETECTED recorded:', phoneData.success);
  console.log('Risk score after phone breach:', phoneData.data.riskScore, 'Level:', phoneData.data.riskLevel);
  console.log('Phone detection count on attempt:', phoneData.data.attempt?.phoneDetectionCount);

  console.log('\n=== 5. Dispatch Automated MULTIPLE_FACES Telemetry ===');
  const multiFaceRes = await fetch(`${BASE_URL}/exams/student/attempt/${attemptId}/proctor-event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      eventType: 'MULTIPLE_FACES',
      details: 'Automatic AI Vision: Multiple individuals detected in camera arena (2 people present)',
      severity: 'critical',
      confidence: 94,
      snapshotBase64: testSnapshot,
      isAutomated: true
    })
  });
  const multiFaceData = await multiFaceRes.json();
  console.log('MULTIPLE_FACES recorded:', multiFaceData.success);
  console.log('Compounded Risk score:', multiFaceData.data.riskScore, 'Level:', multiFaceData.data.riskLevel);
  console.log('Multi-face count on attempt:', multiFaceData.data.attempt?.multipleFaceCount);

  console.log('\n=== 6. Dispatch Automated TAB_SWITCH Telemetry ===');
  const tabRes = await fetch(`${BASE_URL}/exams/student/attempt/${attemptId}/proctor-event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      eventType: 'TAB_SWITCH',
      details: 'Candidate switched browser tabs during live session',
      severity: 'warning'
    })
  });
  const tabData = await tabRes.json();
  console.log('TAB_SWITCH recorded, Risk score:', tabData.data.riskScore);

  console.log('\n=== 6b. Dispatch Automated AUDIO_ANOMALY Telemetry ===');
  const audioRes = await fetch(`${BASE_URL}/exams/student/attempt/${attemptId}/proctor-event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      eventType: 'AUDIO_ANOMALY',
      details: 'Acoustic sensor detected talking or elevated room noise (sensor level: 78%)',
      severity: 'warning',
      confidence: 78
    })
  });
  const audioData = await audioRes.json();
  console.log('AUDIO_ANOMALY recorded, Risk score:', audioData.data.riskScore, 'Audio Count:', audioData.data.audioAnomalyCount);

  console.log('\n=== 7. Teacher Queries Exam Analytics & Candidate Roster ===');
  const analyticsRes = await fetch(`${BASE_URL}/exams/teacher/${examId}/analytics`, {
    headers: { Authorization: `Bearer ${teacherToken}` }
  });
  const analytics = await analyticsRes.json();
  console.log('Analytics status:', analyticsRes.status);
  const targetAttempt = analytics.data.attempts.find((a) => a._id.toString() === attemptId.toString());
  console.log('Candidate in teacher table:', targetAttempt?.studentName);
  console.log('Teacher sees Risk Score:', targetAttempt?.riskScore, 'Tier:', targetAttempt?.riskLevel);
  console.log('Teacher sees Phone Count:', targetAttempt?.phoneDetectionCount);
  console.log('Teacher sees Multi-Face Count:', targetAttempt?.multipleFaceCount);
  console.log('Teacher sees Tab Switch Count:', targetAttempt?.tabSwitchCount);

  console.log('\n=== 8. Teacher Inspects Forensic Evidence Timeline ===');
  const auditRes = await fetch(`${BASE_URL}/exams/attempt/${attemptId}/proctor-events`, {
    headers: { Authorization: `Bearer ${teacherToken}` }
  });
  const audit = await auditRes.json();
  console.log('Audit timeline events count:', audit.data.events.length);
  audit.data.events.forEach((evt, i) => {
    console.log(`  Event #${i + 1}: [${evt.eventType}] Severity: ${evt.severity} | Details: ${evt.details}`);
    console.log(`    Snapshot URL / Key: ${evt.presignedSnapshotUrl || evt.snapshotUrl || evt.evidenceS3Key}`);
  });

  const hasPhoneEvent = audit.data.events.some((e) => e.eventType === 'PHONE_DETECTED');
  const hasMultiFaceEvent = audit.data.events.some((e) => e.eventType === 'MULTIPLE_FACES');
  const hasTabEvent = audit.data.events.some((e) => e.eventType === 'TAB_SWITCH');

  console.log('\n=== FINAL VERIFICATION SUMMARY ===');
  console.log('Phone detection verified in Teacher Audit:', hasPhoneEvent ? 'PASS' : 'FAIL');
  console.log('Multi-face detection verified in Teacher Audit:', hasMultiFaceEvent ? 'PASS' : 'FAIL');
  console.log('Tab switch verified in Teacher Audit:', hasTabEvent ? 'PASS' : 'FAIL');
  console.log('Teacher sees Presigned S3 evidence:', audit.data.events.some((e) => !!(e.presignedSnapshotUrl || e.snapshotUrl)) ? 'PASS' : 'FAIL');
}

verifyAutomaticDetectionPipeline().catch(console.error);
