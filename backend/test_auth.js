const testAuth = async () => {
  const baseUrl = 'http://localhost:5000/api/auth';

  console.log('--- 1. Testing Teacher Login ---');
  const loginRes = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'teacher@adaptive.edu', password: 'Teacher@123' }),
  });
  const loginData = await loginRes.json();
  console.log('Login Status:', loginRes.status);
  console.log('Login User:', loginData.data?.user);
  const teacherToken = loginData.data?.token;

  console.log('\n--- 2. Testing /me with Bearer Token ---');
  const meRes = await fetch(`${baseUrl}/me`, {
    headers: { Authorization: `Bearer ${teacherToken}` },
  });
  const meData = await meRes.json();
  console.log('/me Status:', meRes.status);
  console.log('/me User:', meData.data?.user);

  console.log('\n--- 3. Testing RBAC: Teacher accessing /teacher-only ---');
  const teacherOnlyRes = await fetch(`${baseUrl}/teacher-only`, {
    headers: { Authorization: `Bearer ${teacherToken}` },
  });
  const teacherOnlyData = await teacherOnlyRes.json();
  console.log('Teacher-only Status:', teacherOnlyRes.status, teacherOnlyData.message);

  console.log('\n--- 4. Testing RBAC: Teacher accessing /student-only (Expect 403) ---');
  const studentOnlyForTeacher = await fetch(`${baseUrl}/student-only`, {
    headers: { Authorization: `Bearer ${teacherToken}` },
  });
  const studentOnlyData = await studentOnlyForTeacher.json();
  console.log('Student-only Status (for Teacher):', studentOnlyForTeacher.status, studentOnlyData.error?.message);

  console.log('\n--- 5. Testing Student Registration ---');
  const regRes = await fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Rohan Verma',
      email: 'rohan.v@adaptive.edu',
      password: 'Password@123',
      role: 'student',
      studentId: 'CS-2024-099',
      department: 'Computer Science',
    }),
  });
  const regData = await regRes.json();
  console.log('Register Status:', regRes.status);
  console.log('Registered User:', regData.data?.user);
  const studentToken = regData.data?.token;

  console.log('\n--- 6. Testing RBAC: Student accessing /teacher-only (Expect 403) ---');
  const teacherOnlyForStudent = await fetch(`${baseUrl}/teacher-only`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const teacherOnlyForStudentData = await teacherOnlyForStudent.json();
  console.log('Teacher-only Status (for Student):', teacherOnlyForStudent.status, teacherOnlyForStudentData.error?.message);

  console.log('\n--- 7. Testing RBAC: Student accessing /student-only (Expect 200) ---');
  const studentOnlyForStudent = await fetch(`${baseUrl}/student-only`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const studentOnlyForStudentData = await studentOnlyForStudent.json();
  console.log('Student-only Status (for Student):', studentOnlyForStudent.status, studentOnlyForStudentData.message);

  console.log('\n--- ALL AUTH & RBAC TESTS COMPLETED SUCCESSFULLY ---');
};

testAuth().catch(console.error);
