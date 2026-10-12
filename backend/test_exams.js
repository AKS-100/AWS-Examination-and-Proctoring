const testExamEngine = async () => {
  const baseUrl = 'http://localhost:5000/api';

  console.log('=== 1. Authenticate Teacher & Student ===');
  const teacherLoginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'teacher@adaptive.edu', password: 'Teacher@123' }),
  });
  const teacherData = await teacherLoginRes.json();
  const teacherToken = teacherData.data.token;
  console.log('Teacher Authenticated:', teacherData.data.user.name);

  const studentLoginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@adaptive.edu', password: 'Student@123' }),
  });
  const studentData = await studentLoginRes.json();
  const studentToken = studentData.data.token;
  console.log('Student Authenticated:', studentData.data.user.name);

  console.log('\n=== 2. Teacher: List Existing Exams ===');
  const listRes = await fetch(`${baseUrl}/exams/teacher`, {
    headers: { Authorization: `Bearer ${teacherToken}` },
  });
  const listData = await listRes.json();
  console.log(`Teacher has ${listData.data.exams.length} exams.`);

  console.log('\n=== 3. Teacher: Create New Examination ===');
  const createExamPayload = {
    title: 'Operating Systems & Virtualization',
    description: 'Processes, concurrency, page replacement algorithms, and memory management.',
    courseCode: 'CS-301',
    durationMinutes: 45,
    passingMarks: 10,
    questions: [
      {
        text: 'Which scheduling algorithm is non-preemptive by default?',
        options: ['Round Robin (RR)', 'First-Come, First-Served (FCFS)', 'Shortest Remaining Time First (SRTF)', 'Priority Preemptive'],
        correctOptionIndex: 1,
        marks: 10,
        explanation: 'FCFS processes tasks strictly in arrival order until completion.',
      },
      {
        text: 'What condition is NOT necessary for a deadlock to occur?',
        options: ['Mutual Exclusion', 'Hold and Wait', 'Preemption Allowed', 'Circular Wait'],
        correctOptionIndex: 2,
        marks: 10,
        explanation: 'Deadlock requires NO preemption; allowing preemption prevents deadlocks.',
      },
    ],
  };

  const createRes = await fetch(`${baseUrl}/exams/teacher`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${teacherToken}`,
    },
    body: JSON.stringify(createExamPayload),
  });
  const createData = await createRes.json();
  console.log('Created Exam Status:', createRes.status);
  const newExam = createData.data.exam;
  console.log(`Created Exam: "${newExam.title}" (Total Marks: ${newExam.totalMarks}, Status: ${newExam.status})`);

  console.log('\n=== 4. Teacher: Publish Examination ===');
  const pubRes = await fetch(`${baseUrl}/exams/teacher/${newExam._id}/publish`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${teacherToken}`,
    },
    body: JSON.stringify({ status: 'published' }),
  });
  const pubData = await pubRes.json();
  console.log(`Exam Status Updated: ${pubData.data.exam.status}`);

  console.log('\n=== 5. Student: Query Available Exams (Verify Sanitization) ===');
  const availRes = await fetch(`${baseUrl}/exams/student/available`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const availData = await availRes.json();
  console.log(`Student sees ${availData.data.exams.length} published exams.`);
  const targetExam = availData.data.exams.find((e) => e._id === newExam._id);
  console.log(`Target Exam in Student View: "${targetExam.title}" (hasAttempted: ${targetExam.hasAttempted})`);

  console.log('\n=== 6. Student: Start Examination Session ===');
  const startRes = await fetch(`${baseUrl}/exams/student/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({ examId: newExam._id }),
  });
  const startData = await startRes.json();
  console.log('Session Start Status:', startRes.status);
  const attempt = startData.data.attempt;
  const examQuestions = startData.data.exam.questions;
  console.log(`Attempt ID: ${attempt._id}, Deadline: ${attempt.deadlineTime}`);
  console.log(`Questions Loaded: ${examQuestions.length}`);

  // Confirm sanitization: correctOptionIndex must be undefined in student's exam payload
  const hasLeakedAnswer = examQuestions.some((q) => q.correctOptionIndex !== undefined);
  console.log(`Security Check: Are answers hidden from student? ${!hasLeakedAnswer ? 'YES (Secure)' : 'NO (LEAK!)'}`);

  console.log('\n=== 7. Student: Auto-Save Answers ===');
  // Q1: select option 1 (correct, +10)
  const q1Id = examQuestions[0]._id;
  const save1 = await fetch(`${baseUrl}/exams/student/attempt/${attempt._id}/answer`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({
      questionId: q1Id,
      selectedOptionIndex: 1,
      isMarkedForReview: false,
    }),
  });
  const save1Data = await save1.json();
  console.log(`Answer 1 Saved: Option ${save1Data.data.selectedOptionIndex}`);

  // Q2: select option 2 (correct, +10) and mark for review
  const q2Id = examQuestions[1]._id;
  const save2 = await fetch(`${baseUrl}/exams/student/attempt/${attempt._id}/answer`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({
      questionId: q2Id,
      selectedOptionIndex: 2,
      isMarkedForReview: true,
    }),
  });
  const save2Data = await save2.json();
  console.log(`Answer 2 Saved: Option ${save2Data.data.selectedOptionIndex} (Marked for review: ${save2Data.data.isMarkedForReview})`);

  console.log('\n=== 7b. Student: Emit Real-Time Proctoring Telemetry Events ===');
  const proctorEvent1 = await fetch(`${baseUrl}/exams/student/attempt/${attempt._id}/proctor-event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({
      eventType: 'TAB_SWITCH',
      details: 'Candidate switched tabs to external reference material',
    }),
  });
  const event1Data = await proctorEvent1.json();
  console.log(`Proctoring Event 1 Logged: Risk Score = ${event1Data.data.riskScore}% (Tier: ${event1Data.data.riskLevel})`);

  const proctorEvent2 = await fetch(`${baseUrl}/exams/student/attempt/${attempt._id}/proctor-event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({
      eventType: 'FULLSCREEN_EXIT',
      details: 'Candidate pressed Escape exiting enforced fullscreen arena',
    }),
  });
  const event2Data = await proctorEvent2.json();
  console.log(`Proctoring Event 2 Logged: Risk Score = ${event2Data.data.riskScore}% (Tier: ${event2Data.data.riskLevel})`);

  console.log('\n=== 8. Student: Submit Examination ===');
  const submitRes = await fetch(`${baseUrl}/exams/student/attempt/${attempt._id}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({ isTimeout: false }),
  });
  const submitData = await submitRes.json();
  const result = submitData.data.attempt;
  console.log('Submission Status:', submitRes.status);
  console.log(`Result: Score ${result.score}/${result.totalMarks} (${result.percentage}%) - Passed: ${result.isPassed}`);

  console.log('\n=== 9. Teacher: View Exam Analytics & Submissions ===');
  const analyticsRes = await fetch(`${baseUrl}/exams/teacher/${newExam._id}/analytics`, {
    headers: { Authorization: `Bearer ${teacherToken}` },
  });
  const analyticsData = await analyticsRes.json();
  console.log('Teacher Analytics Summary:', analyticsData.data.analytics);
  console.log(`Total Candidates in Report: ${analyticsData.data.attempts.length}`);

  console.log('\n=== 10. Teacher: Audit Proctoring Timeline for Candidate Attempt ===');
  const auditRes = await fetch(`${baseUrl}/exams/attempt/${attempt._id}/proctor-events`, {
    headers: { Authorization: `Bearer ${teacherToken}` },
  });
  const auditData = await auditRes.json();
  console.log(`Audit retrieved for ${auditData.data.studentName}: Total Events = ${auditData.data.events.length}, Risk Level = ${auditData.data.riskLevel}`);

  console.log('\n=== ALL PHASE 2 & PHASE 3 ENGINE TESTS COMPLETED SUCCESSFULLY ===');
};

testExamEngine().catch(console.error);

