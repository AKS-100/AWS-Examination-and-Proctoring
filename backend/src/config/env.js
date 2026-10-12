import dotenv from 'dotenv';
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',

  // Database (MongoDB)
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/adaptive_exam_db',
  DB_PROVIDER: process.env.DB_PROVIDER || 'mongodb',

  // DynamoDB Tables
  DYNAMODB_TABLE_STUDENTS: process.env.DYNAMODB_TABLE_STUDENTS || 'Students',
  DYNAMODB_TABLE_EXAMS: process.env.DYNAMODB_TABLE_EXAMS || 'Exams',
  DYNAMODB_TABLE_EXAM_SESSIONS: process.env.DYNAMODB_TABLE_EXAM_SESSIONS || 'ExamSessions',
  DYNAMODB_TABLE_FLAGGED_EVENTS: process.env.DYNAMODB_TABLE_FLAGGED_EVENTS || 'FlaggedEvents',
  DYNAMODB_TABLE_RISK_SCORES: process.env.DYNAMODB_TABLE_RISK_SCORES || 'RiskScores',

  // Auth / JWT
  JWT_SECRET: process.env.JWT_SECRET || 'dev_jwt_secret_adaptive_exam_phase0',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',

  // AWS Core
  AWS_REGION: process.env.AWS_REGION || 'ap-south-1',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  AWS_SESSION_TOKEN: process.env.AWS_SESSION_TOKEN || '',

  // AWS S3
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || 'adaptive-exam-proctoring-evidence',

  // AWS Cognito
  AWS_COGNITO_USER_POOL_ID: process.env.AWS_COGNITO_USER_POOL_ID || '',
  AWS_COGNITO_CLIENT_ID: process.env.AWS_COGNITO_CLIENT_ID || '',

  // AWS Rekognition
  REKOGNITION_COLLECTION_ID: process.env.REKOGNITION_COLLECTION_ID || 'proctorai-faces',

  // AWS Lambda & SNS
  AWS_LAMBDA_EVALUATOR_ARN: process.env.AWS_LAMBDA_EVALUATOR_ARN || '',
  AWS_SNS_TOPIC_ARN: process.env.AWS_SNS_TOPIC_ARN || '',
};

export default env;
