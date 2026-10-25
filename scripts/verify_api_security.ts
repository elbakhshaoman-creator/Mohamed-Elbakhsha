import assert from 'node:assert';

const BASE_URL = 'http://localhost:3000';

async function testApiSecurity() {
  console.log('--- 1. Testing GET /api/auth/status ---');
  const statusRes = await fetch(`${BASE_URL}/api/auth/status`);
  const statusData = await statusRes.json();
  console.log('Status result:', statusData);
  assert.strictEqual(statusData.ownerEmail, 'elbakhshaoman@gmail.com', 'Owner email must be elbakhshaoman@gmail.com');
  assert.strictEqual(statusData.isOwner, false, 'Initial state should not be owner');

  console.log('--- 2. Testing Unauthenticated Mutation Rejection ---');
  const anonRes = await fetch(`${BASE_URL}/api/points`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      classId: 'grade-9-1',
      studentId: 'c1-s1',
      points: 1,
      reason: 'اختبار دون صلاحية'
    })
  });
  console.log('Anon mutation status:', anonRes.status);
  assert.strictEqual(anonRes.status, 401, 'Anonymous request must receive 401');

  console.log('--- 3. Testing Non-Owner Google Login ---');
  const nonOwnerLogin = await fetch(`${BASE_URL}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      testMode: true,
      email: 'student.guest@gmail.com',
      name: 'طالب زائر'
    })
  });
  const nonOwnerData = await nonOwnerLogin.json();
  console.log('Non-owner login result:', nonOwnerData);
  assert.strictEqual(nonOwnerData.success, true, 'Non-owner login must succeed in authentication');
  assert.strictEqual(nonOwnerData.isOwner, false, 'Non-owner must NOT be flagged as owner');
  assert.strictEqual(nonOwnerData.email, 'student.guest@gmail.com');

  console.log('--- 4. Testing Server 403 Forbidden Rejection for Non-Owner ---');
  const nonOwnerMutation = await fetch(`${BASE_URL}/api/points`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer guest-unauthorized-token`
    },
    body: JSON.stringify({
      classId: 'grade-9-1',
      studentId: 'c1-s1',
      points: 1,
      reason: 'محاولة تعديل غير مصرح بها'
    })
  });
  const nonOwnerMutationData = await nonOwnerMutation.json();
  console.log('Non-owner mutation status:', nonOwnerMutation.status, nonOwnerMutationData);
  assert.strictEqual(nonOwnerMutation.status, 403, 'Non-owner mutation must be strictly rejected with 403 Forbidden on the server');
  assert(nonOwnerMutationData.error.includes('elbakhshaoman@gmail.com'), 'Error message must specify owner restriction');

  console.log('--- 5. Testing Owner Google Login (elbakhshaoman@gmail.com) ---');
  const ownerLogin = await fetch(`${BASE_URL}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      testMode: true,
      email: 'elbakhshaoman@gmail.com',
      name: 'أستاذ الرياضيات (المالك)'
    })
  });
  const ownerData = await ownerLogin.json();
  console.log('Owner login result:', ownerData);
  assert.strictEqual(ownerData.success, true, 'Owner login must succeed');
  assert.strictEqual(ownerData.isOwner, true, 'Owner MUST be flagged as isOwner=true');
  assert.strictEqual(ownerData.email, 'elbakhshaoman@gmail.com');

  console.log('--- 6. Testing Owner Authorized Mutation ---');
  const ownerMutation = await fetch(`${BASE_URL}/api/points`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ownerData.token}`
    },
    body: JSON.stringify({
      classId: 'grade-9-1',
      studentId: 'c1-s1',
      points: 2,
      reason: 'مشاركة متميزة في الحصة'
    })
  });
  const ownerMutationData = await ownerMutation.json();
  console.log('Owner mutation status:', ownerMutation.status);
  assert.strictEqual(ownerMutation.status, 200, 'Owner mutation must succeed with 200 OK');
  assert.strictEqual(ownerMutationData.success, true);

  console.log('--- 7. Reverting test mutation to keep records clean ---');
  const dataRes = await fetch(`${BASE_URL}/api/data`);
  const currentDb = await dataRes.json();
  const testStudent = currentDb.students.find((s: any) => s.id === 'c1-s1');
  if (testStudent) {
    // Revert points on the test student so points stay 0
    testStudent.positivePoints = Math.max(0, testStudent.positivePoints - 2);
    testStudent.netPoints = testStudent.positivePoints - testStudent.negativePoints;
    testStudent.sessionPoints = Math.max(0, testStudent.sessionPoints - 2);
    testStudent.participations = Math.max(0, testStudent.participations - 1);
    currentDb.pointRecords = (currentDb.pointRecords || []).filter((r: any) => !r.reason.includes('مشاركة متميزة في الحصة'));
    await fetch(`${BASE_URL}/api/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerData.token}`
      },
      body: JSON.stringify(currentDb)
    });
    console.log('Test mutation reverted cleanly');
  }

  console.log('--- 8. Verifying 73 students integrity across 3 classes ---');
  const classroomRes = await fetch(`${BASE_URL}/api/data`);
  const classroomData = await classroomRes.json();
  const c1 = classroomData.students.filter((s: any) => s.classId === '9-1');
  const c2 = classroomData.students.filter((s: any) => s.classId === '9-2');
  const c3 = classroomData.students.filter((s: any) => s.classId === '9-3');
  console.log(`Class 9-1 students: ${c1.length}`);
  console.log(`Class 9-2 students: ${c2.length}`);
  console.log(`Class 9-3 students: ${c3.length}`);
  console.log(`Total students: ${classroomData.students.length}`);
  assert.strictEqual(c1.length, 25, 'Class 9-1 must have exactly 25 students');
  assert.strictEqual(c2.length, 24, 'Class 9-2 must have exactly 24 students');
  assert.strictEqual(c3.length, 24, 'Class 9-3 must have exactly 24 students');
  assert.strictEqual(classroomData.students.length, 73, 'Total students must be exactly 73');

  console.log('\nAll security and authentication assertions passed with flying colors!');
}

testApiSecurity().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
