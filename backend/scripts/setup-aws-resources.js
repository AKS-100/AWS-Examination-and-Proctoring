import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  ListTablesCommand,
} from '@aws-sdk/client-dynamodb';
import {
  RekognitionClient,
  CreateCollectionCommand,
  DescribeCollectionCommand,
} from '@aws-sdk/client-rekognition';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const region = process.env.AWS_REGION || 'ap-south-1';
const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  ...(process.env.AWS_SESSION_TOKEN ? { sessionToken: process.env.AWS_SESSION_TOKEN } : {}),
};

const dynamoClient = new DynamoDBClient({ region, credentials });
const rekognitionClient = new RekognitionClient({ region, credentials });

const TABLES = [
  {
    TableName: process.env.DYNAMODB_TABLE_STUDENTS || 'Students',
    KeySchema: [{ AttributeName: 'studentId', KeyType: 'HASH' }],
    AttributeDefinitions: [{ AttributeName: 'studentId', AttributeType: 'S' }],
    BillingMode: 'PAY_PER_REQUEST',
  },
  {
    TableName: process.env.DYNAMODB_TABLE_EXAMS || 'Exams',
    KeySchema: [{ AttributeName: 'examId', KeyType: 'HASH' }],
    AttributeDefinitions: [{ AttributeName: 'examId', AttributeType: 'S' }],
    BillingMode: 'PAY_PER_REQUEST',
  },
  {
    TableName: process.env.DYNAMODB_TABLE_EXAM_SESSIONS || 'ExamSessions',
    KeySchema: [{ AttributeName: 'sessionId', KeyType: 'HASH' }],
    AttributeDefinitions: [{ AttributeName: 'sessionId', AttributeType: 'S' }],
    BillingMode: 'PAY_PER_REQUEST',
  },
  {
    TableName: process.env.DYNAMODB_TABLE_FLAGGED_EVENTS || 'FlaggedEvents',
    KeySchema: [
      { AttributeName: 'sessionId', KeyType: 'HASH' },
      { AttributeName: 'timestamp', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'sessionId', AttributeType: 'S' },
      { AttributeName: 'timestamp', AttributeType: 'S' },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
  {
    TableName: process.env.DYNAMODB_TABLE_RISK_SCORES || 'RiskScores',
    KeySchema: [
      { AttributeName: 'sessionId', KeyType: 'HASH' },
      { AttributeName: 'timestamp', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'sessionId', AttributeType: 'S' },
      { AttributeName: 'timestamp', AttributeType: 'S' },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
];

async function ensureTable(tableDef) {
  const name = tableDef.TableName;
  try {
    const desc = await dynamoClient.send(new DescribeTableCommand({ TableName: name }));
    console.log(`✅ Table already exists in AWS: "${name}" (Status: ${desc.Table?.TableStatus})`);
    return;
  } catch (err) {
    if (err.name !== 'ResourceNotFoundException') {
      console.error(`❌ Error checking table "${name}":`, err.message);
      return;
    }
  }

  console.log(`⏳ Creating DynamoDB table "${name}" in region ${region}...`);
  try {
    await dynamoClient.send(new CreateTableCommand(tableDef));
    console.log(`🎉 Table "${name}" created successfully (Pay-per-request mode)!`);
  } catch (err) {
    console.error(`❌ Failed to create table "${name}":`, err.message);
  }
}

async function ensureRekognitionCollection(collectionId) {
  try {
    await rekognitionClient.send(new DescribeCollectionCommand({ CollectionId: collectionId }));
    console.log(`✅ Rekognition collection already exists: "${collectionId}"`);
  } catch (err) {
    if (err.name === 'ResourceNotFoundException') {
      console.log(`⏳ Creating Rekognition face collection "${collectionId}" in region ${region}...`);
      try {
        await rekognitionClient.send(new CreateCollectionCommand({ CollectionId: collectionId }));
        console.log(`🎉 Rekognition collection "${collectionId}" created successfully!`);
      } catch (createErr) {
        console.error(`❌ Failed to create Rekognition collection "${collectionId}":`, createErr.message);
      }
    } else {
      console.error(`❌ Rekognition check note:`, err.message);
    }
  }
}

async function run() {
  console.log('===========================================================');
  console.log('🚀 AWS SERVERLESS RESOURCES PROVISIONER');
  console.log(`Target Region: ${region}`);
  console.log(`IAM Key ID:    ${credentials.accessKeyId}`);
  console.log('===========================================================');

  for (const t of TABLES) {
    await ensureTable(t);
  }

  const collectionId = process.env.REKOGNITION_COLLECTION_ID || 'proctorai-faces';
  await ensureRekognitionCollection(collectionId);

  console.log('===========================================================');
  console.log('Setup run completed.');
}

run();
