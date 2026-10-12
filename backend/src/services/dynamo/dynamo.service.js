import mongoose from 'mongoose';
import { User } from '../../models/User.model.js';
import { Exam } from '../../models/Exam.model.js';
import { ExamAttempt } from '../../models/ExamAttempt.model.js';

// Helper to test if MongoDB connection is ready
const isMongoConnected = () => mongoose.connection.readyState === 1;

// Resilient fallback in-memory store (active when MongoDB is pending/disconnected)
const memoryStore = {
  students: new Map(),
  exams: new Map(),
  sessions: new Map(),
  flaggedEvents: [],
  riskScores: [],
};

// Seed sample exam and users for local dev
const seedDefaults = () => {
  const defaultExamId = 'exam-aws-cloud-001';
  if (!memoryStore.exams.has(defaultExamId)) {
    memoryStore.exams.set(defaultExamId, {
      examId: defaultExamId,
      _id: defaultExamId,
      title: 'AWS Certified Cloud Practitioner & AI Proctoring',
      courseCode: 'CS-AWS-401',
      description: 'Official assessment covering AWS Core Services, MongoDB, Rekognition, and Proctoring.',
      durationMinutes: 45,
      totalMarks: 30,
      passingMarks: 18,
      status: 'active',
      createdBy: 'proctor-01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      roster: ['student-01', 'demo-student'],
      questions: [
        {
          questionId: 'q1',
          text: 'Which database is a document-oriented NoSQL database that stores data in flexible JSON-like documents?',
          options: ['Amazon Aurora', 'MongoDB', 'PostgreSQL', 'SQLite'],
          correctOptionIndex: 1,
          marks: 5,
        },
        {
          questionId: 'q2',
          text: 'In the Online Proctoring Architecture, which Amazon Rekognition command indexes baseline face vectors?',
          options: ['DetectLabels', 'SearchFacesByImage', 'IndexFaces', 'CompareFaces'],
          correctOptionIndex: 2,
          marks: 5,
        },
        {
          questionId: 'q3',
          text: 'Which Amazon S3 prefix stores temporary candidate webcam frames before 1-day lifecycle expiration?',
          options: ['baselines/', 'flagged/', 'staging/', 'archive/'],
          correctOptionIndex: 2,
          marks: 5,
        },
        {
          questionId: 'q4',
          text: 'When a candidate incurs 3 strikes due to repeated anomalies, which service immediately dispatches an alert email to the proctor?',
          options: ['Amazon SQS', 'Amazon SNS', 'AWS Glue', 'Amazon Athena'],
          correctOptionIndex: 1,
          marks: 5,
        },
        {
          questionId: 'q5',
          text: 'Which service serves the React Student Portal and Proctor Console over HTTPS with global edge caching?',
          options: ['Amazon CloudFront + S3', 'AWS Direct Connect', 'Amazon EC2', 'Amazon Route 53 only'],
          correctOptionIndex: 0,
          marks: 5,
        },
        {
          questionId: 'q6',
          text: 'What Amazon Cognito component automatically triggers Lambda: signup upon candidate registration confirmation?',
          options: ['Post-confirmation trigger', 'Pre-token generation trigger', 'Custom message trigger', 'User migration trigger'],
          correctOptionIndex: 0,
          marks: 5,
        },
      ],
    });
  }

  const defaultStudentId = 'student-01';
  if (!memoryStore.students.has(defaultStudentId)) {
    memoryStore.students.set(defaultStudentId, {
      studentId: defaultStudentId,
      _id: defaultStudentId,
      cognitoSub: 'cognito-sub-sample-student-01',
      name: 'Alex Johnson',
      email: 'student@example.com',
      rollNo: 'CS-2026-042',
      role: 'student',
      status: 'enrolled',
      faceIds: ['face-idx-001', 'face-idx-002', 'face-idx-003'],
      baselineImageKeys: [
        'baselines/student-01/front.jpg',
        'baselines/student-01/left.jpg',
        'baselines/student-01/right.jpg',
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  const defaultProctorId = 'proctor-01';
  if (!memoryStore.students.has(defaultProctorId)) {
    memoryStore.students.set(defaultProctorId, {
      studentId: defaultProctorId,
      _id: defaultProctorId,
      cognitoSub: 'cognito-sub-sample-proctor-01',
      name: 'Dr. Sarah Connor',
      email: 'proctor@example.com',
      role: 'proctor',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
};

seedDefaults();

// ----------------- STUDENTS (MONGODB USER COLLECTION) -----------------
export const getStudent = async (studentId) => {
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
        };
      }
    } catch (err) {
      console.warn('[MongoDB Student Query Notice]', err.message);
    }
  }
  return memoryStore.students.get(studentId) || null;
};

export const putStudent = async (studentData) => {
  const normalized = {
    ...studentData,
    studentId: studentData.studentId || studentData._id?.toString() || `std-${Date.now()}`,
    updatedAt: new Date().toISOString(),
  };

  if (isMongoConnected()) {
    try {
      const query = studentData.email
        ? { email: studentData.email.toLowerCase() }
        : { studentId: normalized.studentId };

      const updated = await User.findOneAndUpdate(
        query,
        {
          $set: {
            name: normalized.name,
            email: normalized.email?.toLowerCase(),
            role: normalized.role || 'student',
            studentId: normalized.studentId,
            cognitoSub: normalized.cognitoSub || null,
            faceIds: normalized.faceIds || [],
            baselineImageKeys: normalized.baselineImageKeys || [],
            status: normalized.status || 'enrolled',
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();

      return {
        ...updated,
        studentId: updated.studentId || updated._id.toString(),
      };
    } catch (err) {
      console.warn('[MongoDB Student Save Notice]', err.message);
    }
  }

  memoryStore.students.set(normalized.studentId, normalized);
  if (normalized.email) {
    memoryStore.students.set(normalized.email.toLowerCase(), normalized);
  }
  if (normalized.cognitoSub) {
    memoryStore.students.set(`sub_${normalized.cognitoSub}`, normalized);
  }
  return normalized;
};

export const getStudentByCognitoSub = async (cognitoSub) => {
  if (!cognitoSub) return null;
  if (isMongoConnected()) {
    try {
      const doc = await User.findOne({ cognitoSub }).lean();
      if (doc) {
        return {
          ...doc,
          studentId: doc.studentId || doc._id.toString(),
        };
      }
    } catch (err) {
      console.warn('[MongoDB Student by Sub Notice]', err.message);
    }
  }
  return memoryStore.students.get(`sub_${cognitoSub}`) || null;
};

export const listStudents = async () => {
  if (isMongoConnected()) {
    try {
      const docs = await User.find().lean();
      if (docs && docs.length > 0) {
        return docs.map((d) => ({
          ...d,
          studentId: d.studentId || d._id.toString(),
        }));
      }
    } catch (err) {
      console.warn('[MongoDB List Students Notice]', err.message);
    }
  }
  return Array.from(memoryStore.students.values());
};

// ----------------- EXAMS (MONGODB EXAM COLLECTION) -----------------
export const getExam = async (examId) => {
  if (isMongoConnected()) {
    try {
      const isObjectId = mongoose.Types.ObjectId.isValid(examId);
      const query = isObjectId
        ? { $or: [{ _id: examId }, { examId }] }
        : { examId };

      const doc = await Exam.findOne(query).lean();
      if (doc) {
        return {
          ...doc,
          examId: doc.examId || doc._id.toString(),
        };
      }
    } catch (err) {
      console.warn('[MongoDB Exam Query Notice]', err.message);
    }
  }
  return memoryStore.exams.get(examId) || null;
};

export const putExam = async (examData) => {
  const examId = examData.examId || examData._id?.toString() || `exam-${Date.now()}`;
  const normalized = {
    ...examData,
    examId,
    updatedAt: new Date().toISOString(),
  };

  if (isMongoConnected()) {
    try {
      const isObjectId = mongoose.Types.ObjectId.isValid(examId);
      const query = isObjectId ? { _id: examId } : { examId };

      const updated = await Exam.findOneAndUpdate(
        query,
        { $set: normalized },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();

      return {
        ...updated,
        examId: updated.examId || updated._id.toString(),
      };
    } catch (err) {
      console.warn('[MongoDB Exam Save Notice]', err.message);
    }
  }

  memoryStore.exams.set(examId, normalized);
  return normalized;
};

export const listExams = async () => {
  if (isMongoConnected()) {
    try {
      const docs = await Exam.find().lean();
      if (docs && docs.length > 0) {
        return docs.map((d) => ({
          ...d,
          examId: d.examId || d._id.toString(),
        }));
      }
    } catch (err) {
      console.warn('[MongoDB List Exams Notice]', err.message);
    }
  }
  return Array.from(memoryStore.exams.values());
};

// ----------------- SESSIONS (MONGODB EXAMATTEMPT COLLECTION) -----------------
export const getSession = async (sessionId) => {
  if (isMongoConnected()) {
    try {
      const isObjectId = mongoose.Types.ObjectId.isValid(sessionId);
      const query = isObjectId
        ? { $or: [{ _id: sessionId }, { sessionId }] }
        : { sessionId };

      const doc = await ExamAttempt.findOne(query).lean();
      if (doc) {
        return {
          ...doc,
          sessionId: doc.sessionId || doc._id.toString(),
          examId: doc.exam?.toString() || doc.examId,
          studentId: doc.student?.toString() || doc.studentId,
          currentRiskScore: doc.riskScore || doc.currentRiskScore || 0,
        };
      }
    } catch (err) {
      console.warn('[MongoDB Session Query Notice]', err.message);
    }
  }
  return memoryStore.sessions.get(sessionId) || null;
};

export const putSession = async (sessionData) => {
  const sessionId = sessionData.sessionId || sessionData._id?.toString() || `sess-${Date.now()}`;
  const normalized = {
    ...sessionData,
    sessionId,
    updatedAt: new Date().toISOString(),
  };

  if (isMongoConnected()) {
    try {
      const isObjectId = mongoose.Types.ObjectId.isValid(sessionId);
      const query = isObjectId ? { _id: sessionId } : { sessionId };

      const updatePayload = {
        sessionId,
        studentName: sessionData.studentName || 'Candidate',
        studentEmail: sessionData.studentEmail || 'student@example.com',
        examTitle: sessionData.examTitle || 'Exam',
        courseCode: sessionData.courseCode || 'COURSE',
        durationMinutes: sessionData.durationMinutes || 60,
        startTime: sessionData.startTime || new Date(),
        deadlineTime: sessionData.deadlineTime || new Date(),
        endTime: sessionData.endTime || null,
        status: sessionData.status || 'in_progress',
        answers: sessionData.answers || [],
        score: sessionData.score || 0,
        totalMarks: sessionData.totalMarks || 100,
        passingMarks: sessionData.passingMarks || 40,
        percentage: sessionData.percentage || 0,
        isPassed: sessionData.isPassed || false,
        riskScore: sessionData.currentRiskScore || sessionData.riskScore || 0,
        riskLevel: sessionData.riskLevel || 'LOW',
        strikes: sessionData.strikes || 0,
        tabSwitchCount: sessionData.tabSwitchCount || 0,
        fullscreenExitCount: sessionData.fullscreenExitCount || 0,
        faceAbsenceCount: sessionData.faceAbsenceCount || 0,
        multipleFaceCount: sessionData.multipleFaceCount || 0,
      };

      if (mongoose.Types.ObjectId.isValid(sessionData.studentId)) {
        updatePayload.student = sessionData.studentId;
      }
      if (mongoose.Types.ObjectId.isValid(sessionData.examId)) {
        updatePayload.exam = sessionData.examId;
      }

      const doc = await ExamAttempt.findOneAndUpdate(
        query,
        { $set: updatePayload },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();

      return {
        ...doc,
        sessionId: doc.sessionId || doc._id.toString(),
      };
    } catch (err) {
      console.warn('[MongoDB Session Save Notice]', err.message);
    }
  }

  memoryStore.sessions.set(sessionId, normalized);
  return normalized;
};

export const listSessions = async (examId = null) => {
  if (isMongoConnected()) {
    try {
      const query = examId
        ? (mongoose.Types.ObjectId.isValid(examId) ? { $or: [{ exam: examId }, { examId }] } : { examId })
        : {};

      const docs = await ExamAttempt.find(query).lean();
      if (docs && docs.length > 0) {
        return docs.map((d) => ({
          ...d,
          sessionId: d.sessionId || d._id.toString(),
          examId: d.exam?.toString() || d.examId,
          studentId: d.student?.toString() || d.studentId,
          currentRiskScore: d.riskScore || d.currentRiskScore || 0,
        }));
      }
    } catch (err) {
      console.warn('[MongoDB List Sessions Notice]', err.message);
    }
  }

  const all = Array.from(memoryStore.sessions.values());
  return examId ? all.filter((s) => s.examId === examId) : all;
};

// ----------------- FLAGGED EVENTS & RISK LOGS -----------------
export const putFlaggedEvent = async (eventData) => {
  const item = {
    eventId: eventData.eventId || `evt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    sessionId: eventData.sessionId,
    timestamp: eventData.timestamp || new Date().toISOString(),
    eventType: eventData.eventType,
    severity: eventData.severity || 'warning',
    details: eventData.details || '',
    confidence: eventData.confidence ?? null,
    riskContribution: eventData.riskContribution || 0,
    riskScoreAfter: eventData.riskScoreAfter || 0,
    evidenceS3Key: eventData.evidenceS3Key || null,
    snapshotUrl: eventData.snapshotUrl || null,
  };

  if (isMongoConnected()) {
    try {
      const isObjectId = mongoose.Types.ObjectId.isValid(eventData.sessionId);
      const query = isObjectId ? { $or: [{ _id: eventData.sessionId }, { sessionId: eventData.sessionId }] } : { sessionId: eventData.sessionId };

      await ExamAttempt.updateOne(query, {
        $push: { proctoringEvents: item },
      });
    } catch (err) {
      console.warn('[MongoDB FlaggedEvent Push Notice]', err.message);
    }
  }

  memoryStore.flaggedEvents.push(item);
  return item;
};

export const getFlaggedEventsBySession = async (sessionId) => {
  if (isMongoConnected()) {
    try {
      const isObjectId = mongoose.Types.ObjectId.isValid(sessionId);
      const query = isObjectId ? { $or: [{ _id: sessionId }, { sessionId }] } : { sessionId };
      const doc = await ExamAttempt.findOne(query).select('proctoringEvents').lean();
      if (doc?.proctoringEvents) return doc.proctoringEvents;
    } catch (err) {
      // fallback
    }
  }
  return memoryStore.flaggedEvents.filter((e) => e.sessionId === sessionId);
};

export const putRiskScoreRecord = async (riskData) => {
  const item = {
    recordId: `risk-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    sessionId: riskData.sessionId,
    timestamp: riskData.timestamp || new Date().toISOString(),
    riskScore: riskData.riskScore || 0,
    riskLevel: riskData.riskLevel || 'LOW',
    strikes: riskData.strikes || 0,
    escalated: Boolean(riskData.escalated),
    reasons: riskData.reasons || [],
  };

  memoryStore.riskScores.push(item);
  return item;
};

export const getRiskScoresBySession = async (sessionId) => {
  return memoryStore.riskScores.filter((r) => r.sessionId === sessionId);
};

export const getDatabaseStatus = () => {
  const stateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  const readyState = mongoose.connection.readyState;

  return {
    provider: 'MongoDB',
    state: stateMap[readyState] || 'unknown',
    isConnected: readyState === 1,
    host: mongoose.connection.host || '127.0.0.1',
    dbName: mongoose.connection.name || 'adaptive_exam_db',
    memoryCacheCounts: {
      students: memoryStore.students.size,
      exams: memoryStore.exams.size,
      sessions: memoryStore.sessions.size,
      flaggedEvents: memoryStore.flaggedEvents.length,
    },
  };
};

export const getDynamoStatus = getDatabaseStatus;

export default {
  getStudent,
  getStudentByCognitoSub,
  putStudent,
  listStudents,
  getExam,
  putExam,
  listExams,
  getSession,
  putSession,
  listSessions,
  putFlaggedEvent,
  getFlaggedEventsBySession,
  putRiskScoreRecord,
  getRiskScoresBySession,
  getDatabaseStatus,
  getDynamoStatus: getDatabaseStatus, // alias for health compatibility
};
