import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  BatchGetCommand,
} from '@aws-sdk/lib-dynamodb';
import { DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { docClient, rawDynamoClient, dynamoTables } from '../../config/dynamodb.config.js';
import { env } from '../../config/env.js';
import mongoose from 'mongoose';
import { User } from '../../models/User.model.js';
import { Exam } from '../../models/Exam.model.js';
import { ExamAttempt } from '../../models/ExamAttempt.model.js';

/**
 * Determines whether Amazon DynamoDB is the active primary database.
 */
export const isDynamoDbMode = () => (env.DATABASE_MODE || env.DB_PROVIDER) === 'dynamodb';
const isMongoConnected = () => mongoose.connection.readyState === 1;

/**
 * Log sanitized DynamoDB error without exposing secrets or credentials
 */
const logDynamoError = (operation, table, err) => {
  console.error(`[DynamoDB ${operation} Error on table '${table}'] ${err.name}: ${err.message}`);
};

/**
 * Recursively converts JavaScript Date instances into ISO 8601 strings
 */
export const serializeDates = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (typeof obj === 'object') {
    if (typeof obj.toISOString === 'function') return obj.toISOString();
    if (Array.isArray(obj)) return obj.map(serializeDates);
    const res = {};
    for (const [k, v] of Object.entries(obj)) {
      res[k] = serializeDates(v);
    }
    return res;
  }
  return obj;
};

// In-Memory store (active strictly for explicit mock mode or when MongoDB mode is disconnected)
const memoryStore = {
  students: new Map(),
  exams: new Map(),
  sessions: new Map(),
  flaggedEvents: [],
  riskScores: [],
};

// =========================================================================
// 1. STUDENTS / USER PROFILES (DynamoDB Table: Students, PK: studentId)
// =========================================================================

export const getStudent = async (studentId) => {
  if (!studentId) return null;

  if (isDynamoDbMode()) {
    try {
      const cleanId = String(studentId).trim();
      const res = await docClient.send(
        new GetCommand({
          TableName: dynamoTables.students,
          Key: { studentId: cleanId },
        })
      );

      if (res.Item) {
        if (res.Item.isPointer && res.Item.targetStudentId) {
          return await getStudent(res.Item.targetStudentId);
        }
        return {
          ...res.Item,
          _id: res.Item.studentId,
          id: res.Item.studentId,
          isActive: res.Item.isActive !== false,
        };
      }

      // Check if studentId might be an email or sub pointer
      const emailPointer = await docClient.send(
        new GetCommand({
          TableName: dynamoTables.students,
          Key: { studentId: `email#${cleanId.toLowerCase()}` },
        })
      );
      if (emailPointer.Item?.targetStudentId) {
        return await getStudent(emailPointer.Item.targetStudentId);
      }

      const subPointer = await docClient.send(
        new GetCommand({
          TableName: dynamoTables.students,
          Key: { studentId: `sub#${cleanId}` },
        })
      );
      if (subPointer.Item?.targetStudentId) {
        return await getStudent(subPointer.Item.targetStudentId);
      }

      return null;
    } catch (err) {
      logDynamoError('GetItem', dynamoTables.students, err);
      throw new Error(`Failed to retrieve user profile from DynamoDB: ${err.message}`);
    }
  }

  // MongoDB Mode Fallback
  if (isMongoConnected()) {
    try {
      const isObjectId = mongoose.Types.ObjectId.isValid(studentId);
      const query = isObjectId
        ? { $or: [{ _id: studentId }, { studentId }] }
        : { studentId };

      const doc = await User.findOne(query).lean();
      if (doc) {
        return {
          ...doc,
          studentId: doc.studentId || doc._id.toString(),
          _id: doc._id.toString(),
          id: doc._id.toString(),
          isActive: doc.isActive !== false,
        };
      }
    } catch (err) {
      console.warn('[MongoDB Student Query Notice]', err.message);
    }
  }

  return memoryStore.students.get(studentId) || null;
};

export const getStudentByCognitoSub = async (cognitoSub) => {
  if (!cognitoSub) return null;

  if (isDynamoDbMode()) {
    try {
      const res = await docClient.send(
        new GetCommand({
          TableName: dynamoTables.students,
          Key: { studentId: `sub#${cognitoSub}` },
        })
      );
      if (res.Item?.targetStudentId) {
        return await getStudent(res.Item.targetStudentId);
      }
      return null;
    } catch (err) {
      logDynamoError('GetItem (SubPointer)', dynamoTables.students, err);
      throw new Error(`Failed to query user by Cognito sub from DynamoDB: ${err.message}`);
    }
  }

  if (isMongoConnected()) {
    const doc = await User.findOne({ cognitoSub }).lean();
    if (doc) {
      return {
        ...doc,
        studentId: doc.studentId || doc._id.toString(),
        _id: doc._id.toString(),
        id: doc._id.toString(),
      };
    }
  }

  return null;
};

export const getStudentByEmail = async (email) => {
  if (!email) return null;

  if (isDynamoDbMode()) {
    try {
      const res = await docClient.send(
        new GetCommand({
          TableName: dynamoTables.students,
          Key: { studentId: `email#${email.toLowerCase().trim()}` },
        })
      );
      if (res.Item?.targetStudentId) {
        return await getStudent(res.Item.targetStudentId);
      }
      return null;
    } catch (err) {
      logDynamoError('GetItem (EmailPointer)', dynamoTables.students, err);
      throw new Error(`Failed to query user by email from DynamoDB: ${err.message}`);
    }
  }

  if (isMongoConnected()) {
    const doc = await User.findOne({ email: email.toLowerCase().trim() }).lean();
    if (doc) {
      return {
        ...doc,
        studentId: doc.studentId || doc._id.toString(),
        _id: doc._id.toString(),
        id: doc._id.toString(),
      };
    }
  }

  return null;
};

export const putStudent = async (studentData) => {
  const studentId = studentData.studentId || studentData._id?.toString() || `std_${Date.now()}`;
  const now = new Date().toISOString();

  // SECURITY REQUIREMENT: Never store passwords in DynamoDB
  const cleanStudent = serializeDates({
    ...studentData,
    studentId,
    _id: studentId,
    id: studentId,
    email: studentData.email ? studentData.email.toLowerCase().trim() : undefined,
    role: studentData.role || 'student',
    status: studentData.status || 'enrolled',
    isActive: studentData.isActive !== false,
    updatedAt: now,
    createdAt: studentData.createdAt || now,
  });
  delete cleanStudent.password;
  delete cleanStudent.passwordHash;

  if (isDynamoDbMode()) {
    try {
      // 1. Write primary student record
      await docClient.send(
        new PutCommand({
          TableName: dynamoTables.students,
          Item: cleanStudent,
        })
      );

      // 2. Write deterministic email pointer record
      if (cleanStudent.email) {
        await docClient.send(
          new PutCommand({
            TableName: dynamoTables.students,
            Item: {
              studentId: `email#${cleanStudent.email}`,
              targetStudentId: studentId,
              isPointer: true,
              updatedAt: now,
            },
          })
        );
      }

      // 3. Write deterministic cognitoSub pointer record
      if (cleanStudent.cognitoSub) {
        await docClient.send(
          new PutCommand({
            TableName: dynamoTables.students,
            Item: {
              studentId: `sub#${cleanStudent.cognitoSub}`,
              targetStudentId: studentId,
              isPointer: true,
              updatedAt: now,
            },
          })
        );
      }

      // 4. Update the global students roster index item
      const rosterRes = await docClient.send(
        new GetCommand({
          TableName: dynamoTables.students,
          Key: { studentId: '__students_roster__' },
        })
      ).catch(() => ({ Item: null }));

      const existingRoster = Array.isArray(rosterRes.Item?.roster) ? rosterRes.Item.roster : [];
      if (!existingRoster.includes(studentId)) {
        existingRoster.push(studentId);
        await docClient.send(
          new PutCommand({
            TableName: dynamoTables.students,
            Item: {
              studentId: '__students_roster__',
              roster: existingRoster,
              updatedAt: now,
            },
          })
        ).catch(() => null);
      }

      return cleanStudent;
    } catch (err) {
      logDynamoError('PutItem', dynamoTables.students, err);
      throw new Error(`Failed to save student profile to DynamoDB: ${err.message}`);
    }
  }

  // MongoDB Mode Fallback
  if (isMongoConnected()) {
    try {
      const query = cleanStudent.email
        ? { email: cleanStudent.email }
        : { studentId };

      const updated = await User.findOneAndUpdate(
        query,
        { $set: cleanStudent },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();

      return {
        ...updated,
        studentId: updated.studentId || updated._id.toString(),
        _id: updated._id.toString(),
        id: updated._id.toString(),
      };
    } catch (err) {
      console.warn('[MongoDB Student Save Notice]', err.message);
    }
  }

  memoryStore.students.set(studentId, cleanStudent);
  if (cleanStudent.email) memoryStore.students.set(cleanStudent.email, cleanStudent);
  return cleanStudent;
};

export const listStudents = async () => {
  if (isDynamoDbMode()) {
    try {
      const rosterRes = await docClient.send(
        new GetCommand({
          TableName: dynamoTables.students,
          Key: { studentId: '__students_roster__' },
        })
      );

      const rosterIds = Array.isArray(rosterRes.Item?.roster) ? rosterRes.Item.roster : [];
      if (rosterIds.length === 0) return [];

      const students = [];
      for (const sId of rosterIds) {
        const item = await getStudent(sId);
        if (item && !item.isPointer) students.push(item);
      }
      return students;
    } catch (err) {
      logDynamoError('listStudents', dynamoTables.students, err);
      throw new Error(`Failed to list students from DynamoDB: ${err.message}`);
    }
  }

  if (isMongoConnected()) {
    const docs = await User.find({}).lean();
    return docs.map((d) => ({
      ...d,
      studentId: d.studentId || d._id.toString(),
      _id: d._id.toString(),
      id: d._id.toString(),
    }));
  }

  return Array.from(memoryStore.students.values()).filter((s) => !s.studentId?.includes('#'));
};

// =========================================================================
// 2. EXAMS & QUESTION BANKS (DynamoDB Table: Exams, PK: examId)
// =========================================================================

export const getExam = async (examId) => {
  if (!examId) return null;

  if (isDynamoDbMode()) {
    try {
      const res = await docClient.send(
        new GetCommand({
          TableName: dynamoTables.exams,
          Key: { examId: String(examId) },
        })
      );
      if (res.Item) {
        return {
          ...res.Item,
          _id: res.Item.examId,
          id: res.Item.examId,
        };
      }
      return null;
    } catch (err) {
      logDynamoError('GetItem', dynamoTables.exams, err);
      throw new Error(`Failed to retrieve exam from DynamoDB: ${err.message}`);
    }
  }

  if (isMongoConnected()) {
    try {
      const isObjectId = mongoose.Types.ObjectId.isValid(examId);
      const query = isObjectId ? { $or: [{ _id: examId }, { examId }] } : { examId };
      const doc = await Exam.findOne(query).lean();
      if (doc) {
        return {
          ...doc,
          examId: doc.examId || doc._id.toString(),
          _id: doc._id.toString(),
          id: doc._id.toString(),
        };
      }
    } catch (err) {
      console.warn('[MongoDB Exam Query Notice]', err.message);
    }
  }

  return memoryStore.exams.get(examId) || null;
};

export const putExam = async (examData) => {
  const examId = examData.examId || examData._id?.toString() || `exam_${Date.now()}`;
  const now = new Date().toISOString();

  const cleanExam = serializeDates({
    ...examData,
    examId,
    _id: examId,
    id: examId,
    title: examData.title || 'Untitled Examination',
    courseCode: examData.courseCode || 'GENERAL-101',
    durationMinutes: Number(examData.durationMinutes) || 60,
    totalMarks: Number(examData.totalMarks) || 100,
    passingMarks: Number(examData.passingMarks) || 40,
    status: examData.status || 'draft',
    creator: examData.creator || examData.createdBy || 'instructor',
    questions: (examData.questions || []).map((q, idx) => ({
      ...q,
      questionId: (q.questionId || q._id || q.id || `q_${idx}`).toString(),
      _id: (q._id || q.questionId || q.id || `q_${idx}`).toString(),
      marks: Number(q.marks) || 1,
    })),
    createdAt: examData.createdAt || now,
    updatedAt: now,
  });

  if (isDynamoDbMode()) {
    try {
      // 1. Write primary exam item
      await docClient.send(
        new PutCommand({
          TableName: dynamoTables.exams,
          Item: cleanExam,
        })
      );

      // 2. Update global catalog index item
      const catalogRes = await docClient.send(
        new GetCommand({
          TableName: dynamoTables.exams,
          Key: { examId: '__catalog__' },
        })
      ).catch(() => ({ Item: null }));

      const existingCatalog = Array.isArray(catalogRes.Item?.examIds) ? catalogRes.Item.examIds : [];
      if (!existingCatalog.includes(examId)) {
        existingCatalog.push(examId);
      }
      await docClient.send(
        new PutCommand({
          TableName: dynamoTables.exams,
          Item: {
            examId: '__catalog__',
            examIds: existingCatalog,
            updatedAt: now,
          },
        })
      );

      // 3. Update teacher-specific exam index item
      if (cleanExam.creator) {
        const teacherIndexKey = `__teacher__${cleanExam.creator}`;
        const tRes = await docClient.send(
          new GetCommand({
            TableName: dynamoTables.exams,
            Key: { examId: teacherIndexKey },
          })
        ).catch(() => ({ Item: null }));

        const teacherExams = Array.isArray(tRes.Item?.examIds) ? tRes.Item.examIds : [];
        if (!teacherExams.includes(examId)) {
          teacherExams.push(examId);
        }
        await docClient.send(
          new PutCommand({
            TableName: dynamoTables.exams,
            Item: {
              examId: teacherIndexKey,
              examIds: teacherExams,
              updatedAt: now,
            },
          })
        );
      }

      return cleanExam;
    } catch (err) {
      logDynamoError('PutItem', dynamoTables.exams, err);
      throw new Error(`Failed to save exam to DynamoDB: ${err.message}`);
    }
  }

  if (isMongoConnected()) {
    try {
      const isObjectId = mongoose.Types.ObjectId.isValid(examId);
      const query = isObjectId ? { $or: [{ _id: examId }, { examId }] } : { examId };
      const updated = await Exam.findOneAndUpdate(
        query,
        { $set: cleanExam },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();
      return {
        ...updated,
        examId: updated.examId || updated._id.toString(),
        _id: updated._id.toString(),
        id: updated._id.toString(),
      };
    } catch (err) {
      console.warn('[MongoDB Exam Save Notice]', err.message);
    }
  }

  memoryStore.exams.set(examId, cleanExam);
  return cleanExam;
};

export const listExams = async (teacherId = null) => {
  if (isDynamoDbMode()) {
    try {
      let targetExamIds = [];
      if (teacherId) {
        const tRes = await docClient.send(
          new GetCommand({
            TableName: dynamoTables.exams,
            Key: { examId: `__teacher__${teacherId}` },
          })
        );
        targetExamIds = Array.isArray(tRes.Item?.examIds) ? tRes.Item.examIds : [];
      } else {
        const catRes = await docClient.send(
          new GetCommand({
            TableName: dynamoTables.exams,
            Key: { examId: '__catalog__' },
          })
        );
        targetExamIds = Array.isArray(catRes.Item?.examIds) ? catRes.Item.examIds : [];
      }

      const exams = [];
      for (const eId of targetExamIds) {
        const e = await getExam(eId);
        if (e && !e.examId.startsWith('__')) {
          exams.push(e);
        }
      }
      return exams;
    } catch (err) {
      logDynamoError('listExams', dynamoTables.exams, err);
      throw new Error(`Failed to list exams from DynamoDB: ${err.message}`);
    }
  }

  if (isMongoConnected()) {
    const query = teacherId ? { creator: teacherId } : {};
    const docs = await Exam.find(query).lean();
    return docs.map((d) => ({
      ...d,
      examId: d.examId || d._id.toString(),
      _id: d._id.toString(),
      id: d._id.toString(),
    }));
  }

  const all = Array.from(memoryStore.exams.values()).filter((e) => !e.examId.startsWith('__'));
  return teacherId ? all.filter((e) => e.creator === teacherId) : all;
};

// =========================================================================
// 3. EXAM SESSIONS / ATTEMPTS (DynamoDB Table: ExamSessions, PK: sessionId)
// =========================================================================

export const getSession = async (sessionId) => {
  if (!sessionId) return null;

  if (isDynamoDbMode()) {
    try {
      const res = await docClient.send(
        new GetCommand({
          TableName: dynamoTables.examSessions,
          Key: { sessionId: String(sessionId) },
        })
      );
      if (res.Item) {
        return {
          ...res.Item,
          _id: res.Item.sessionId,
          attemptId: res.Item.sessionId,
          student: res.Item.studentId,
          exam: res.Item.examId,
        };
      }
      return null;
    } catch (err) {
      logDynamoError('GetItem', dynamoTables.examSessions, err);
      throw new Error(`Failed to retrieve exam session from DynamoDB: ${err.message}`);
    }
  }

  if (isMongoConnected()) {
    try {
      const isObjectId = mongoose.Types.ObjectId.isValid(sessionId);
      const query = isObjectId ? { $or: [{ _id: sessionId }, { sessionId }] } : { sessionId };
      const doc = await ExamAttempt.findOne(query).lean();
      if (doc) {
        return {
          ...doc,
          sessionId: doc.sessionId || doc._id.toString(),
          _id: doc._id.toString(),
          attemptId: doc._id.toString(),
          studentId: doc.student?.toString() || doc.studentId,
          examId: doc.exam?.toString() || doc.examId,
        };
      }
    } catch (err) {
      console.warn('[MongoDB Session Query Notice]', err.message);
    }
  }

  return memoryStore.sessions.get(sessionId) || null;
};

export const putSession = async (sessionData) => {
  const sessionId = sessionData.sessionId || sessionData._id?.toString() || `sess_${Date.now()}`;
  const now = new Date().toISOString();

  const cleanSession = serializeDates({
    ...sessionData,
    sessionId,
    _id: sessionId,
    attemptId: sessionId,
    studentId: sessionData.studentId || sessionData.student?.toString(),
    examId: sessionData.examId || sessionData.exam?.toString(),
    status: sessionData.status || 'in_progress',
    answers: Array.isArray(sessionData.answers) ? sessionData.answers : [],
    proctoringEvents: Array.isArray(sessionData.proctoringEvents) ? sessionData.proctoringEvents : [],
    currentRiskScore: Number(sessionData.currentRiskScore || sessionData.riskScore) || 0,
    riskScore: Number(sessionData.riskScore || sessionData.currentRiskScore) || 0,
    riskLevel: sessionData.riskLevel || 'LOW',
    updatedAt: now,
    createdAt: sessionData.createdAt || now,
  });

  if (isDynamoDbMode()) {
    try {
      // 1. Write primary session item
      await docClient.send(
        new PutCommand({
          TableName: dynamoTables.examSessions,
          Item: cleanSession,
        })
      );

      // 2. Update exam-sessions index item
      if (cleanSession.examId) {
        const examIndexKey = `__exam__${cleanSession.examId}`;
        const eRes = await docClient.send(
          new GetCommand({
            TableName: dynamoTables.examSessions,
            Key: { sessionId: examIndexKey },
          })
        ).catch(() => ({ Item: null }));

        const examSessions = Array.isArray(eRes.Item?.sessionIds) ? eRes.Item.sessionIds : [];
        if (!examSessions.includes(sessionId)) {
          examSessions.push(sessionId);
        }
        await docClient.send(
          new PutCommand({
            TableName: dynamoTables.examSessions,
            Item: {
              sessionId: examIndexKey,
              sessionIds: examSessions,
              updatedAt: now,
            },
          })
        );
      }

      // 3. Update student-sessions index item
      if (cleanSession.studentId) {
        const studentIndexKey = `__student__${cleanSession.studentId}`;
        const sRes = await docClient.send(
          new GetCommand({
            TableName: dynamoTables.examSessions,
            Key: { sessionId: studentIndexKey },
          })
        ).catch(() => ({ Item: null }));

        const studentSessions = Array.isArray(sRes.Item?.sessionIds) ? sRes.Item.sessionIds : [];
        if (!studentSessions.includes(sessionId)) {
          studentSessions.push(sessionId);
        }
        await docClient.send(
          new PutCommand({
            TableName: dynamoTables.examSessions,
            Item: {
              sessionId: studentIndexKey,
              sessionIds: studentSessions,
              updatedAt: now,
            },
          })
        );
      }

      return cleanSession;
    } catch (err) {
      logDynamoError('PutItem', dynamoTables.examSessions, err);
      throw new Error(`Failed to save exam session to DynamoDB: ${err.message}`);
    }
  }

  if (isMongoConnected()) {
    try {
      const isObjectId = mongoose.Types.ObjectId.isValid(sessionId);
      const query = isObjectId ? { $or: [{ _id: sessionId }, { sessionId }] } : { sessionId };
      const updated = await ExamAttempt.findOneAndUpdate(
        query,
        { $set: cleanSession },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();
      return {
        ...updated,
        sessionId: updated.sessionId || updated._id.toString(),
        _id: updated._id.toString(),
        attemptId: updated._id.toString(),
      };
    } catch (err) {
      console.warn('[MongoDB Session Save Notice]', err.message);
    }
  }

  memoryStore.sessions.set(sessionId, cleanSession);
  return cleanSession;
};

export const listSessions = async (examId = null) => {
  if (isDynamoDbMode()) {
    try {
      if (!examId) return [];

      const indexRes = await docClient.send(
        new GetCommand({
          TableName: dynamoTables.examSessions,
          Key: { sessionId: `__exam__${examId}` },
        })
      );

      const sessionIds = Array.isArray(indexRes.Item?.sessionIds) ? indexRes.Item.sessionIds : [];
      const sessions = [];
      for (const sId of sessionIds) {
        const s = await getSession(sId);
        if (s && !s.sessionId.startsWith('__')) {
          sessions.push(s);
        }
      }
      return sessions;
    } catch (err) {
      logDynamoError('listSessions', dynamoTables.examSessions, err);
      throw new Error(`Failed to list sessions from DynamoDB: ${err.message}`);
    }
  }

  if (isMongoConnected()) {
    const query = examId ? { exam: examId } : {};
    const docs = await ExamAttempt.find(query).lean();
    return docs.map((d) => ({
      ...d,
      sessionId: d.sessionId || d._id.toString(),
      _id: d._id.toString(),
      attemptId: d._id.toString(),
    }));
  }

  const all = Array.from(memoryStore.sessions.values()).filter((s) => !s.sessionId.startsWith('__'));
  return examId ? all.filter((s) => s.examId === examId) : all;
};

export const listStudentSessions = async (studentId) => {
  if (isDynamoDbMode()) {
    try {
      if (!studentId) return [];

      const indexRes = await docClient.send(
        new GetCommand({
          TableName: dynamoTables.examSessions,
          Key: { sessionId: `__student__${studentId}` },
        })
      );

      const sessionIds = Array.isArray(indexRes.Item?.sessionIds) ? indexRes.Item.sessionIds : [];
      const sessions = [];
      for (const sId of sessionIds) {
        const s = await getSession(sId);
        if (s && !s.sessionId.startsWith('__')) {
          sessions.push(s);
        }
      }
      return sessions;
    } catch (err) {
      logDynamoError('listStudentSessions', dynamoTables.examSessions, err);
      throw new Error(`Failed to list student sessions from DynamoDB: ${err.message}`);
    }
  }

  if (isMongoConnected()) {
    const docs = await ExamAttempt.find({ student: studentId }).lean();
    return docs.map((d) => ({
      ...d,
      sessionId: d.sessionId || d._id.toString(),
      _id: d._id.toString(),
      attemptId: d._id.toString(),
    }));
  }

  return Array.from(memoryStore.sessions.values()).filter(
    (s) => !s.sessionId.startsWith('__') && s.studentId === studentId
  );
};

// =========================================================================
// 4. FLAGGED EVENTS (DynamoDB Table: FlaggedEvents, PK: sessionId, SK: timestamp)
// =========================================================================

export const putFlaggedEvent = async (eventData) => {
  const sessionId = eventData.sessionId || eventData.attemptId;
  const timestamp = eventData.timestamp
    ? new Date(eventData.timestamp).toISOString()
    : new Date().toISOString();

  const item = serializeDates({
    sessionId: String(sessionId),
    timestamp,
    eventId: eventData.eventId || `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    eventType: eventData.eventType || 'telemetry_anomaly',
    severity: eventData.severity || 'warning',
    details: eventData.details || '',
    confidence: eventData.confidence !== undefined ? Number(eventData.confidence) : null,
    riskContribution: Number(eventData.riskContribution) || 0,
    riskScoreAfter: Number(eventData.riskScoreAfter) || 0,
    evidenceS3Key: eventData.evidenceS3Key || null,
    snapshotUrl: eventData.snapshotUrl || null,
  });

  if (isDynamoDbMode()) {
    try {
      await docClient.send(
        new PutCommand({
          TableName: dynamoTables.flaggedEvents,
          Item: item,
        })
      );
      return item;
    } catch (err) {
      logDynamoError('PutItem', dynamoTables.flaggedEvents, err);
      throw new Error(`Failed to save flagged proctoring event to DynamoDB: ${err.message}`);
    }
  }

  if (isMongoConnected()) {
    try {
      const isObjectId = mongoose.Types.ObjectId.isValid(sessionId);
      const query = isObjectId ? { $or: [{ _id: sessionId }, { sessionId }] } : { sessionId };
      await ExamAttempt.updateOne(query, { $push: { proctoringEvents: item } });
    } catch (err) {
      console.warn('[MongoDB FlaggedEvent Push Notice]', err.message);
    }
  }

  memoryStore.flaggedEvents.push(item);
  return item;
};

export const getFlaggedEventsBySession = async (sessionId) => {
  if (!sessionId) return [];

  if (isDynamoDbMode()) {
    try {
      // QueryCommand naturally returns items sorted by range key 'timestamp'
      const res = await docClient.send(
        new QueryCommand({
          TableName: dynamoTables.flaggedEvents,
          KeyConditionExpression: 'sessionId = :sid',
          ExpressionAttributeValues: { ':sid': String(sessionId) },
          ScanIndexForward: true, // chronological order (oldest to newest)
        })
      );
      return res.Items || [];
    } catch (err) {
      logDynamoError('Query', dynamoTables.flaggedEvents, err);
      throw new Error(`Failed to query flagged events from DynamoDB: ${err.message}`);
    }
  }

  if (isMongoConnected()) {
    const isObjectId = mongoose.Types.ObjectId.isValid(sessionId);
    const query = isObjectId ? { $or: [{ _id: sessionId }, { sessionId }] } : { sessionId };
    const doc = await ExamAttempt.findOne(query).select('proctoringEvents').lean();
    if (doc?.proctoringEvents) return doc.proctoringEvents;
  }

  return memoryStore.flaggedEvents.filter((e) => e.sessionId === String(sessionId));
};

// =========================================================================
// 5. RISK SCORES (DynamoDB Table: RiskScores, PK: sessionId, SK: timestamp)
// =========================================================================

export const putRiskScoreRecord = async (riskData) => {
  const sessionId = riskData.sessionId || riskData.attemptId;
  const timestamp = riskData.timestamp
    ? new Date(riskData.timestamp).toISOString()
    : new Date().toISOString();

  const item = serializeDates({
    sessionId: String(sessionId),
    timestamp,
    recordId: riskData.recordId || `risk_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    riskScore: Number(riskData.riskScore) || 0,
    riskLevel: riskData.riskLevel || 'LOW',
    strikes: Number(riskData.strikes) || 0,
    escalated: Boolean(riskData.escalated),
    reasons: Array.isArray(riskData.reasons) ? riskData.reasons : [],
  });

  if (isDynamoDbMode()) {
    try {
      await docClient.send(
        new PutCommand({
          TableName: dynamoTables.riskScores,
          Item: item,
        })
      );
      return item;
    } catch (err) {
      logDynamoError('PutItem', dynamoTables.riskScores, err);
      throw new Error(`Failed to save risk score record to DynamoDB: ${err.message}`);
    }
  }

  memoryStore.riskScores.push(item);
  return item;
};

export const getRiskScoresBySession = async (sessionId) => {
  if (!sessionId) return [];

  if (isDynamoDbMode()) {
    try {
      // QueryCommand naturally returns items sorted by range key 'timestamp'
      const res = await docClient.send(
        new QueryCommand({
          TableName: dynamoTables.riskScores,
          KeyConditionExpression: 'sessionId = :sid',
          ExpressionAttributeValues: { ':sid': String(sessionId) },
          ScanIndexForward: true, // chronological order
        })
      );
      return res.Items || [];
    } catch (err) {
      logDynamoError('Query', dynamoTables.riskScores, err);
      throw new Error(`Failed to query risk scores from DynamoDB: ${err.message}`);
    }
  }

  return memoryStore.riskScores.filter((r) => r.sessionId === String(sessionId));
};

// =========================================================================
// 6. HEALTH & DATABASE STATUS REPORTING
// =========================================================================

export const getDatabaseStatus = async () => {
  if (isDynamoDbMode()) {
    try {
      // Safe probe via DescribeTable on 'Students' (confirmed allowed without ListTables)
      const desc = await rawDynamoClient.send(
        new DescribeTableCommand({ TableName: dynamoTables.students })
      );

      return {
        provider: 'DynamoDB',
        mode: 'dynamodb',
        state: 'connected',
        isConnected: true,
        region: env.AWS_REGION || 'ap-south-1',
        tables: [
          dynamoTables.students,
          dynamoTables.exams,
          dynamoTables.examSessions,
          dynamoTables.flaggedEvents,
          dynamoTables.riskScores,
        ],
        tableStatus: desc.Table?.TableStatus || 'ACTIVE',
        billingMode: desc.Table?.BillingModeSummary?.BillingMode || 'PAY_PER_REQUEST (On-Demand)',
      };
    } catch (err) {
      return {
        provider: 'DynamoDB',
        mode: 'dynamodb',
        state: 'error',
        isConnected: false,
        region: env.AWS_REGION || 'ap-south-1',
        error: err.name || 'ConnectionError',
        errorMessage: err.message,
      };
    }
  }

  const readyState = mongoose.connection.readyState;
  const stateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

  return {
    provider: 'MongoDB',
    mode: 'mongodb',
    state: stateMap[readyState] || 'disconnected',
    isConnected: readyState === 1,
    host: mongoose.connection.host || '127.0.0.1',
    dbName: mongoose.connection.name || 'adaptive_exam_db',
  };
};

export const getDynamoStatus = getDatabaseStatus;

export default {
  isDynamoDbMode,
  getStudent,
  getStudentByCognitoSub,
  getStudentByEmail,
  putStudent,
  listStudents,
  getExam,
  putExam,
  listExams,
  getSession,
  putSession,
  listSessions,
  listStudentSessions,
  putFlaggedEvent,
  getFlaggedEventsBySession,
  putRiskScoreRecord,
  getRiskScoresBySession,
  getDatabaseStatus,
  getDynamoStatus,
};
