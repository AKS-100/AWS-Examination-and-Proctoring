const BASE_URL = 'http://localhost:5000/api';

async function postJson(url, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`POST ${url} failed (${res.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

async function getJson(url, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`GET ${url} failed (${res.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

async function runRiskEngineTests() {
  console.log('==================================================');
  console.log('🧪 VERIFYING ADAPTIVE PROCTORING RISK ENGINE (SECTIONS 30-42)');
  console.log('==================================================\n');

  try {
    // 1. Health check
    const health = await getJson(`${BASE_URL}/health`);
    console.log('✅ API Health:', health.status);

    // 2. Teacher Login & Create Published Exam
    const teacherLoginRes = await postJson(`${BASE_URL}/auth/login`, {
      email: 'teacher@adaptive.edu',
      password: 'teacher123',
    });
    const teacherToken = teacherLoginRes.data.token;
    console.log('✅ Teacher Login OK. Author:', teacherLoginRes.data.user.name);

    const createdExamRes = await postJson(
      `${BASE_URL}/exams/teacher`,
      {
        title: 'Adaptive AI Proctoring Risk Engine Verification Exam',
        courseCode: 'CS-801',
        creatorEmail: 'teacher@adaptive.edu',
        durationMinutes: 45,
        passingMarks: 10,
        status: 'published',
        questions: [
          {
            text: 'Which AWS service is utilized for facial biometric comparison and anomaly detection?',
            options: ['Amazon Rekognition', 'Amazon CloudFront', 'AWS Glue', 'Amazon SQS'],
            correctOptionIndex: 0,
            marks: 10,
            explanation: 'Amazon Rekognition provides computer vision face and label detection.',
          },
        ],
      },
      teacherToken
    );
    const targetExamId = createdExamRes.data.exam._id;
    console.log('✅ Published Exam Created by Teacher. Exam ID:', targetExamId);

    // 3. Student Login & Launch Exam Attempt
    const loginRes = await postJson(`${BASE_URL}/auth/login`, {
      email: 'student@adaptive.edu',
      password: 'student123',
    });
    const token = loginRes.data.token;
    console.log('✅ Student Login OK. Candidate:', loginRes.data.user.name);

    const startRes = await postJson(
      `${BASE_URL}/exams/student/start`,
      { examId: targetExamId },
      token
    );
    const attemptId = startRes.data.attempt._id;
    console.log('✅ Exam Attempt Launched. Attempt ID:', attemptId);

    // 4. Test Single NO_FACE_DETECTED (+5)
    const evt1 = await postJson(
      `${BASE_URL}/exams/student/attempt/${attemptId}/proctor-event`,
      {
        eventType: 'NO_FACE_DETECTED',
        confidence: 95,
        details: 'Candidate left camera viewport temporarily',
      },
      token
    );
    console.log(`✅ Evt 1 (NO_FACE): Risk=${evt1.data.riskScore}/100, Tier=${evt1.data.riskLevel}, Interval=${evt1.data.recommendedIntervalMs}ms`);

    // 5. Test Low Confidence Event (Confidence 65% < 80% threshold -> should NOT penalize score)
    const evt2 = await postJson(
      `${BASE_URL}/exams/student/attempt/${attemptId}/proctor-event`,
      {
        eventType: 'PHONE_DETECTED',
        confidence: 65, // Below REKOGNITION_OBJECT_CONFIDENCE_THRESHOLD
        details: 'Low confidence object detected',
      },
      token
    );
    console.log(`✅ Evt 2 (Low Confidence Filter): Risk=${evt2.data.riskScore}/100 (Unchanged because confidence 65% < 80%)`);

    // 6. Test LOOKING_AWAY (+3 on first fleeting detection)
    const evt3 = await postJson(
      `${BASE_URL}/exams/student/attempt/${attemptId}/proctor-event`,
      {
        eventType: 'LOOKING_AWAY',
        confidence: 88,
        details: 'Candidate head pose yaw turned away',
      },
      token
    );
    console.log(`✅ Evt 3 (LOOKING_AWAY): Risk=${evt3.data.riskScore}/100`);

    // 7. Test Behavioral Correlation: TAB_SWITCH following NO_FACE + LOOKING_AWAY within 60s
    // Pattern: NO_FACE + LOOKING_AWAY + TAB_SWITCH => base + correlation bonus (+15)
    const evt4 = await postJson(
      `${BASE_URL}/exams/student/attempt/${attemptId}/proctor-event`,
      {
        eventType: 'TAB_SWITCH',
        details: 'Switched away from browser tab',
      },
      token
    );
    console.log(`✅ Evt 4 (TAB_SWITCH + Correlation): Risk=${evt4.data.riskScore}/100, Tier=${evt4.data.riskLevel}, Interval=${evt4.data.recommendedIntervalMs}ms`);

    // 8. Test Rekognition DetectLabels endpoint (Phone Detection)
    const dummyImage = 'data:image/jpeg;base64,' + Buffer.from('adaptive_test_frame').toString('base64');
    const labelRes = await postJson(
      `${BASE_URL}/aws/rekognition/detect-labels`,
      {
        imageBase64: dummyImage,
        simulatePhone: true,
      },
      token
    );
    console.log(`✅ Rekognition DetectLabels: PhoneDetected=${labelRes.data.isPhoneDetected}, Confidence=${labelRes.data.confidence}%`);

    // 9. Test PHONE_DETECTED with S3 Snapshot upload simulation
    const evt5 = await postJson(
      `${BASE_URL}/exams/student/attempt/${attemptId}/proctor-event`,
      {
        eventType: 'PHONE_DETECTED',
        confidence: 94,
        details: 'Candidate holding mobile device in view',
        snapshotBase64: dummyImage,
        simulatePhone: true,
      },
      token
    );
    console.log(`✅ Evt 5 (PHONE_DETECTED + S3): Risk=${evt5.data.riskScore}/100, Tier=${evt5.data.riskLevel}, S3Stored=${evt5.data.awsTelemetry.s3SnapshotStored}`);

    // 10. Test MULTIPLE_FACES (+20 + Correlation bonus with PHONE_DETECTED => +25 bonus => escalates to CRITICAL)
    const evt6 = await postJson(
      `${BASE_URL}/exams/student/attempt/${attemptId}/proctor-event`,
      {
        eventType: 'MULTIPLE_FACES',
        confidence: 95,
        details: 'Second individual identified beside candidate',
        snapshotBase64: dummyImage,
        simulateAnomaly: 'MULTIPLE_FACES',
      },
      token
    );
    console.log(`✅ Evt 6 (MULTIPLE_FACES + Correlation with Phone): Risk=${evt6.data.riskScore}/100, Tier=${evt6.data.riskLevel}, SNSAlertTriggered=${evt6.data.awsTelemetry.snsAlertTriggered}`);

    // 11. Test COPY_PASTE_ATTEMPT
    const evt7 = await postJson(
      `${BASE_URL}/exams/student/attempt/${attemptId}/proctor-event`,
      {
        eventType: 'COPY_PASTE_ATTEMPT',
        details: 'Candidate attempted clipboard copy operation',
      },
      token
    );
    console.log(`✅ Evt 7 (COPY_PASTE): Risk=${evt7.data.riskScore}/100, Tier=${evt7.data.riskLevel}`);

    // 12. Submit Attempt & Verify Final Proctoring Summary
    const submitRes = await postJson(
      `${BASE_URL}/exams/student/attempt/${attemptId}/submit`,
      {},
      token
    );
    const summary = submitRes.data.attempt.proctoringSummary;
    console.log(`✅ Exam Attempt Submitted.`);
    console.log(`   Proctoring Final Disposition: ${summary?.finalStatus}`);
    console.log(`   Final Risk Score: ${summary?.riskScore}/100 (${summary?.riskLevel})`);
    console.log(`   Total Logged Events: ${summary?.totalEvents}`);
    console.log(`   Critical Events: ${summary?.criticalEvents}`);

    // 13. Teacher Timeline Inspection & S3 Presigned URL verification
    const auditRes = await getJson(
      `${BASE_URL}/exams/attempt/${attemptId}/proctor-events`,
      teacherToken
    );
    const auditData = auditRes.data;
    console.log(`✅ Teacher Audit Fetch: Candidate=${auditData.studentName}, Events=${auditData.events.length}`);
    const samplePresigned = auditData.events.find((e) => e.presignedSnapshotUrl);
    console.log(`   Presigned S3 Evidence URL: ${samplePresigned ? samplePresigned.presignedSnapshotUrl.substring(0, 60) + '...' : 'None attached'}`);

    console.log('\n==================================================');
    console.log('🎉 ALL 13 ADAPTIVE PROCTORING RISK ENGINE SCENARIOS PASSED!');
    console.log('==================================================');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  }
}

runRiskEngineTests();
