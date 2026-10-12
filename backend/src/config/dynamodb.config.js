import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { env } from './env.js';

const isLiveConfigured = Boolean(
  env.AWS_ACCESS_KEY_ID &&
  env.AWS_SECRET_ACCESS_KEY &&
  !env.AWS_ACCESS_KEY_ID.includes('YOUR_') &&
  !env.AWS_ACCESS_KEY_ID.includes('dummy')
);

const awsCredentials = isLiveConfigured
  ? {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      ...(env.AWS_SESSION_TOKEN ? { sessionToken: env.AWS_SESSION_TOKEN } : {}),
    }
  : undefined;

const clientConfig = {
  region: env.AWS_REGION || 'ap-south-1',
  ...(awsCredentials ? { credentials: awsCredentials } : {}),
};

let rawDynamoClient = null;
let docClient = null;

try {
  rawDynamoClient = new DynamoDBClient(clientConfig);
  docClient = DynamoDBDocumentClient.from(rawDynamoClient, {
    marshallOptions: {
      removeUndefinedValues: true,
      convertEmptyValues: true,
    },
    unmarshallOptions: {
      wrapNumbers: false,
    },
  });
} catch (err) {
  console.warn('[DynamoDB] Initialization warning:', err.message);
}

export const dynamoTables = {
  students: process.env.DYNAMODB_TABLE_STUDENTS || 'Students',
  exams: process.env.DYNAMODB_TABLE_EXAMS || 'Exams',
  examSessions: process.env.DYNAMODB_TABLE_EXAM_SESSIONS || 'ExamSessions',
  flaggedEvents: process.env.DYNAMODB_TABLE_FLAGGED_EVENTS || 'FlaggedEvents',
  riskScores: process.env.DYNAMODB_TABLE_RISK_SCORES || 'RiskScores',
};

export { rawDynamoClient, docClient };
export default docClient;
