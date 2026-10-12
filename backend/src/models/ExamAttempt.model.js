import mongoose from 'mongoose';

const answerItemSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      required: true,
    },
    selectedOptionIndex: {
      type: Number,
      default: null, // null means not answered yet
    },
    isMarkedForReview: {
      type: Boolean,
      default: false,
    },
    isCorrect: {
      type: Boolean,
      default: null, // calculated upon submission
    },
    marksAwarded: {
      type: Number,
      default: 0,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const examAttemptSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    studentEmail: {
      type: String,
      required: true,
    },
    studentRollNo: {
      type: String,
      default: null,
    },
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    examTitle: {
      type: String,
      required: true,
    },
    courseCode: {
      type: String,
      required: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
      default: null,
    },
    deadlineTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'timed_out', 'auto_ended'],
      default: 'in_progress',
    },
    answers: [answerItemSchema],
    score: {
      type: Number,
      default: 0,
    },
    totalMarks: {
      type: Number,
      default: 0,
    },
    passingMarks: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    isPassed: {
      type: Boolean,
      default: false,
    },
    // Adaptive Risk Engine (Phase 3 & Sections 30-42)
    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'LOW',
    },
    // Proctoring Telemetry Event Log
    proctoringEvents: [
      {
        eventType: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        confidence: {
          type: Number,
          default: null,
        },
        severity: {
          type: String,
          enum: ['info', 'warning', 'critical'],
          default: 'warning',
        },
        riskContribution: {
          type: Number,
          default: 0,
        },
        riskDelta: {
          type: Number,
          default: 0,
        },
        riskScoreAfter: {
          type: Number,
          default: 0,
        },
        details: {
          type: String,
          default: '',
        },
        evidenceS3Key: {
          type: String,
          default: null,
        },
        snapshotUrl: {
          type: String,
          default: null,
        },
      },
    ],
    tabSwitchCount: {
      type: Number,
      default: 0,
    },
    fullscreenExitCount: {
      type: Number,
      default: 0,
    },
    faceAbsenceCount: {
      type: Number,
      default: 0,
    },
    multipleFaceCount: {
      type: Number,
      default: 0,
    },
    phoneDetectionCount: {
      type: Number,
      default: 0,
    },
    lookingAwayCount: {
      type: Number,
      default: 0,
    },
    identityMismatchCount: {
      type: Number,
      default: 0,
    },
    copyPasteCount: {
      type: Number,
      default: 0,
    },
    cameraDisabledCount: {
      type: Number,
      default: 0,
    },
    audioAnomalyCount: {
      type: Number,
      default: 0,
    },
    // Alert Notification Deduplication State (Section 37)
    lastSnsAlertLevel: {
      type: String,
      default: null,
    },
    snsAlertsSent: [
      {
        alertType: { type: String },
        riskScore: { type: Number },
        sentAt: { type: Date, default: Date.now },
      },
    ],
    // Proctoring Final Summary at Exam Completion (Section 39)
    proctoringSummary: {
      attemptId: { type: String },
      riskScore: { type: Number, default: 0 },
      riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'LOW' },
      totalEvents: { type: Number, default: 0 },
      criticalEvents: { type: Number, default: 0 },
      eventBreakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
      identityVerification: { type: String, default: 'VERIFIED' },
      finalStatus: {
        type: String,
        enum: ['CLEAR', 'REVIEW_REQUIRED', 'HIGH_RISK', 'CRITICAL'],
        default: 'CLEAR',
      },
    },
  },
  {
    timestamps: true,
  }
);

export const ExamAttempt =
  mongoose.models.ExamAttempt ||
  mongoose.model('ExamAttempt', examAttemptSchema);

export default ExamAttempt;
