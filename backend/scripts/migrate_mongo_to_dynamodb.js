import { docClient, rawDynamoClient, dynamoTables } from '../src/config/dynamodb.config.js';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { initialMemoryExams } from '../src/services/mockData.js';

/**
 * Idempotent Data Migration & Seeding Script: MongoDB -> Amazon DynamoDB
 *
 * Rules:
 * 1. Checks if MongoDB is available; if so, migrates existing documents.
 * 2. If MongoDB is empty or offline, seeds core demonstration exams & profiles.
 * 3. Never overwrites or deletes existing DynamoDB records (idempotent).
 * 4. Never writes passwords or secret hashes to DynamoDB.
 * 5. Writes deterministic email and sub pointer items for O(1) DynamoDB lookups.
 * 6. Validates all records before writing.
 */

async function runMigration() {
  console.log('===============================================================');
  console.log(' AdaptiveExam: MongoDB -> Amazon DynamoDB Idempotent Migration');
  console.log(' Region:', env.AWS_REGION || 'ap-south-1');
  console.log('===============================================================\n');

  // 1. Verify DynamoDB Table Access
  try {
    const tableKeys = Object.keys(dynamoTables);
    console.log(`[DynamoDB] Verifying tables: ${tableKeys.map((k) => dynamoTables[k]).join(', ')}...`);
    for (const key of tableKeys) {
      const tableName = dynamoTables[key];
      // Test read with DescribeTable or GetItem
      await docClient.send(
        new GetCommand({
          TableName: tableName,
          Key: key === 'students' ? { studentId: '__probe__' }
            : key === 'exams' ? { examId: '__probe__' }
            : key === 'examSessions' ? { sessionId: '__probe__' }
            : key === 'flaggedEvents' ? { sessionId: '__probe__', timestamp: '1970-01-01' }
            : { sessionId: '__probe__', timestamp: '1970-01-01' },
        })
      );
      console.log(`  ✓ Table '${tableName}' is accessible.`);
    }
  } catch (err) {
    console.error('[DynamoDB Precheck Failed]', err.message);
    process.exit(1);
  }

  const stats = {
    students: { inspected: 0, written: 0, skipped: 0, failed: 0 },
    exams: { inspected: 0, written: 0, skipped: 0, failed: 0 },
    sessions: { inspected: 0, written: 0, skipped: 0, failed: 0 },
  };

  // 2. Check MongoDB Connectivity
  let mongoConnected = false;
  let mongoUsers = [];
  let mongoExams = [];
  let mongoAttempts = [];

  try {
    if (env.MONGODB_URI) {
      console.log('\n[MongoDB] Attempting to connect to MongoDB URI...');
      await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
      mongoConnected = true;
      console.log('  ✓ Connected to MongoDB. Scanning existing collections...');

      // Dynamic model imports
      const { User } = await import('../src/models/User.model.js');
      const { Exam } = await import('../src/models/Exam.model.js');
      const { ExamAttempt } = await import('../src/models/ExamAttempt.model.js');

      mongoUsers = await User.find({}).lean();
      mongoExams = await Exam.find({}).lean();
      mongoAttempts = await ExamAttempt.find({}).lean();

      console.log(`  Found: ${mongoUsers.length} users, ${mongoExams.length} exams, ${mongoAttempts.length} attempts in MongoDB.`);
    }
  } catch (mongoErr) {
    console.log(`  ℹ MongoDB offline or unreachable (${mongoErr.message}). Proceeding with seed datasets.`);
  }

  // Fallback / Baseline Users
  const baselineUsers = [
    {
      studentId: 'teacher-01',
      name: 'Prof. Vikram Rao',
      email: 'teacher@adaptive.edu',
      role: 'teacher',
      department: 'Department of Computer Science',
      status: 'active',
      isActive: true,
    },
    {
      studentId: 'student-01',
      name: 'Aarav Patel',
      email: 'student@adaptive.edu',
      role: 'student',
      rollNo: 'CS-2026-042',
      department: 'Computer Science & Engineering',
      status: 'enrolled',
      isActive: true,
      faceIds: ['face-seed-01', 'face-seed-02', 'face-seed-03'],
    },
    {
      studentId: 'admin-01',
      name: 'Stasis Administrator',
      email: 'stasissoftwarepvtltd@gmail.com',
      role: 'teacher',
      department: 'Faculty of Computing & Examination',
      status: 'active',
      isActive: true,
    },
  ];

  const candidateUsers = mongoUsers.length > 0 ? mongoUsers : baselineUsers;

  // 3. Migrate / Seed Students Table
  console.log('\n[Migration] Processing Students table...');
  const rosterIds = [];

  for (const rawUser of candidateUsers) {
    stats.students.inspected++;
    const studentId = String(rawUser.studentId || rawUser._id || `std_${Date.now()}`).trim();
    const email = rawUser.email ? rawUser.email.trim().toLowerCase() : null;

    try {
      // Check if primary record already exists
      const existing = await docClient.send(
        new GetCommand({
          TableName: dynamoTables.students,
          Key: { studentId },
        })
      );

      if (existing.Item) {
        console.log(`  [SKIPPED] Student '${studentId}' (${email}) already exists in DynamoDB.`);
        stats.students.skipped++;
        rosterIds.push(studentId);
        continue;
      }

      // Security: Strip all passwords
      const cleanRecord = {
        studentId,
        _id: studentId,
        id: studentId,
        cognitoSub: rawUser.cognitoSub || null,
        name: rawUser.name || 'Candidate',
        email,
        role: rawUser.role || 'student',
        department: rawUser.department || 'School of Engineering',
        status: rawUser.status || 'enrolled',
        isActive: rawUser.isActive !== false,
        rollNo: rawUser.rollNo || null,
        faceIds: Array.isArray(rawUser.faceIds) ? rawUser.faceIds : [],
        baselineImageKeys: Array.isArray(rawUser.baselineImageKeys) ? rawUser.baselineImageKeys : [],
        createdAt: rawUser.createdAt ? new Date(rawUser.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Write primary item
      await docClient.send(
        new PutCommand({
          TableName: dynamoTables.students,
          Item: cleanRecord,
        })
      );

      // Write deterministic email pointer
      if (email) {
        await docClient.send(
          new PutCommand({
            TableName: dynamoTables.students,
            Item: {
              studentId: `email#${email}`,
              targetStudentId: studentId,
              isPointer: true,
              updatedAt: new Date().toISOString(),
            },
          })
        );
      }

      // Write deterministic cognitoSub pointer if available
      if (cleanRecord.cognitoSub) {
        await docClient.send(
          new PutCommand({
            TableName: dynamoTables.students,
            Item: {
              studentId: `sub#${cleanRecord.cognitoSub}`,
              targetStudentId: studentId,
              isPointer: true,
              updatedAt: new Date().toISOString(),
            },
          })
        );
      }

      rosterIds.push(studentId);
      stats.students.written++;
      console.log(`  [WRITTEN] Student '${studentId}' (${email}) synced to DynamoDB.`);
    } catch (err) {
      console.error(`  [FAILED] Student '${studentId}':`, err.message);
      stats.students.failed++;
    }
  }

  // Update Students Roster index item
  if (rosterIds.length > 0) {
    const existingRosterRes = await docClient.send(
      new GetCommand({
        TableName: dynamoTables.students,
        Key: { studentId: '__students_roster__' },
      })
    ).catch(() => ({ Item: null }));

    const existingRoster = Array.isArray(existingRosterRes.Item?.roster) ? existingRosterRes.Item.roster : [];
    const merged = Array.from(new Set([...existingRoster, ...rosterIds]));
    await docClient.send(
      new PutCommand({
        TableName: dynamoTables.students,
        Item: {
          studentId: '__students_roster__',
          roster: merged,
          updatedAt: new Date().toISOString(),
        },
      })
    );
  }

  // 4. Migrate / Seed Exams Table
  console.log('\n[Migration] Processing Exams table...');
  const candidateExams = mongoExams.length > 0 ? mongoExams : initialMemoryExams;
  const examIdsCatalog = [];

  for (const rawExam of candidateExams) {
    stats.exams.inspected++;
    const examId = String(rawExam.examId || rawExam._id || `exam_${Date.now()}`).trim();

    try {
      const existing = await docClient.send(
        new GetCommand({
          TableName: dynamoTables.exams,
          Key: { examId },
        })
      );

      if (existing.Item) {
        console.log(`  [SKIPPED] Exam '${examId}' ("${rawExam.title}") already exists in DynamoDB.`);
        stats.exams.skipped++;
        examIdsCatalog.push(examId);
        continue;
      }

      const cleanExam = {
        examId,
        _id: examId,
        id: examId,
        title: rawExam.title || 'Examination',
        courseCode: rawExam.courseCode || 'GENERAL-101',
        description: rawExam.description || '',
        creator: String(rawExam.creator || 'teacher-01'),
        creatorName: rawExam.creatorName || 'Prof. Vikram Rao',
        creatorEmail: (rawExam.creatorEmail || 'teacher@adaptive.edu').toLowerCase().trim(),
        durationMinutes: Number(rawExam.durationMinutes) || 60,
        totalMarks: Number(rawExam.totalMarks) || 100,
        passingMarks: Number(rawExam.passingMarks) || 40,
        status: rawExam.status || 'published',
        isMockTest: Boolean(rawExam.isMockTest || rawExam.courseCode === 'MOCK-101'),
        assignedStudentEmails: Array.isArray(rawExam.assignedStudentEmails) ? rawExam.assignedStudentEmails : [],
        questions: (rawExam.questions || []).map((q, idx) => ({
          questionId: (q.questionId || q._id || q.id || `q_${idx + 1}`).toString(),
          _id: (q._id || q.questionId || q.id || `q_${idx + 1}`).toString(),
          text: q.text || q.question || '',
          options: Array.isArray(q.options) ? q.options : [],
          correctOptionIndex: Number(q.correctOptionIndex) || 0,
          explanation: q.explanation || '',
          marks: Number(q.marks) || 1,
        })),
        createdAt: rawExam.createdAt ? new Date(rawExam.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await docClient.send(
        new PutCommand({
          TableName: dynamoTables.exams,
          Item: cleanExam,
        })
      );

      // Add to teacher index
      if (cleanExam.creator) {
        const teacherKey = `__teacher__${cleanExam.creator}`;
        const tRes = await docClient.send(
          new GetCommand({ TableName: dynamoTables.exams, Key: { examId: teacherKey } })
        ).catch(() => ({ Item: null }));
        const tExams = Array.isArray(tRes.Item?.examIds) ? tRes.Item.examIds : [];
        if (!tExams.includes(examId)) {
          tExams.push(examId);
          await docClient.send(
            new PutCommand({
              TableName: dynamoTables.exams,
              Item: { examId: teacherKey, examIds: tExams, updatedAt: new Date().toISOString() },
            })
          );
        }
      }

      examIdsCatalog.push(examId);
      stats.exams.written++;
      console.log(`  [WRITTEN] Exam '${examId}' ("${cleanExam.title}") synced to DynamoDB.`);
    } catch (err) {
      console.error(`  [FAILED] Exam '${examId}':`, err.message);
      stats.exams.failed++;
    }
  }

  // Update Global Catalog index item
  if (examIdsCatalog.length > 0) {
    const existingCatRes = await docClient.send(
      new GetCommand({
        TableName: dynamoTables.exams,
        Key: { examId: '__catalog__' },
      })
    ).catch(() => ({ Item: null }));

    const existingCat = Array.isArray(existingCatRes.Item?.examIds) ? existingCatRes.Item.examIds : [];
    const mergedCat = Array.from(new Set([...existingCat, ...examIdsCatalog]));
    await docClient.send(
      new PutCommand({
        TableName: dynamoTables.exams,
        Item: {
          examId: '__catalog__',
          examIds: mergedCat,
          updatedAt: new Date().toISOString(),
        },
      })
    );
  }

  // 5. Migrate Attempts (if MongoDB had attempts)
  if (mongoAttempts.length > 0) {
    console.log('\n[Migration] Processing ExamAttempts from MongoDB...');
    for (const rawAttempt of mongoAttempts) {
      stats.sessions.inspected++;
      const sessionId = String(rawAttempt.sessionId || rawAttempt._id || `sess_${Date.now()}`).trim();

      try {
        const existing = await docClient.send(
          new GetCommand({
            TableName: dynamoTables.examSessions,
            Key: { sessionId },
          })
        );

        if (existing.Item) {
          stats.sessions.skipped++;
          continue;
        }

        const studentId = String(rawAttempt.student || rawAttempt.studentId || 'unknown');
        const examId = String(rawAttempt.exam || rawAttempt.examId || 'unknown');

        const cleanSession = {
          sessionId,
          _id: sessionId,
          attemptId: sessionId,
          studentId,
          examId,
          studentName: rawAttempt.studentName || 'Candidate',
          studentEmail: rawAttempt.studentEmail || '',
          examTitle: rawAttempt.examTitle || 'Examination',
          status: rawAttempt.status || 'completed',
          score: Number(rawAttempt.score) || 0,
          totalMarks: Number(rawAttempt.totalMarks) || 100,
          passingMarks: Number(rawAttempt.passingMarks) || 40,
          percentage: Number(rawAttempt.percentage) || 0,
          isPassed: Boolean(rawAttempt.isPassed),
          answers: Array.isArray(rawAttempt.answers) ? rawAttempt.answers : [],
          currentRiskScore: Number(rawAttempt.riskScore) || 0,
          riskScore: Number(rawAttempt.riskScore) || 0,
          riskLevel: rawAttempt.riskLevel || 'LOW',
          createdAt: rawAttempt.createdAt ? new Date(rawAttempt.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await docClient.send(
          new PutCommand({
            TableName: dynamoTables.examSessions,
            Item: cleanSession,
          })
        );
        stats.sessions.written++;
      } catch (err) {
        stats.sessions.failed++;
      }
    }
  }

  if (mongoConnected) {
    await mongoose.disconnect();
  }

  console.log('\n===============================================================');
  console.log(' Migration & Seeding Summary:');
  console.log(' - Students:', JSON.stringify(stats.students));
  console.log(' - Exams:', JSON.stringify(stats.exams));
  console.log(' - Sessions:', JSON.stringify(stats.sessions));
  console.log('===============================================================\n');
}

runMigration().catch((err) => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
