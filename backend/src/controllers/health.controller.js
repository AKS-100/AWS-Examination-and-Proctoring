import { getDatabaseStatus } from '../services/dynamo/dynamo.service.js';
import { awsConfig, isAwsConfigured } from '../config/aws.config.js';
import { env } from '../config/env.js';

export const getHealth = async (req, res) => {
  const dbStatus = await getDatabaseStatus();
  const memoryUsage = process.memoryUsage();

  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      architecture: '100% Serverless AWS Architecture',
      version: '2.0.0 (DynamoDB + S3 + Rekognition + Cognito + SNS + Lambda)',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: dbStatus,
      aws: {
        region: awsConfig.region,
        isLiveConfigured: isAwsConfigured(),
        database: dbStatus,
        s3: {
          bucket: awsConfig.s3Bucket,
          prefixes: ['baselines/', 'flagged/', 'staging/ (1-day lifecycle)'],
        },
        rekognition: {
          collectionId: 'proctorai-faces',
          features: ['IndexFaces x3', 'SearchFacesByImage', 'DetectFaces', 'DetectLabels'],
        },
        cognito: {
          userPoolId: awsConfig.cognitoUserPoolId,
          clientId: awsConfig.cognitoClientId,
          groups: ['students', 'proctors'],
        },
        sns: {
          topicArn: awsConfig.snsTopicArn,
          alertTypes: ['High-Risk Escalation', 'Exam Auto-Terminated'],
        },
        lambdas: [
          'Lambda: signup (Cognito trigger)',
          'Lambda: enrollment (IndexFaces x3)',
          'Lambda: session (start, resume, autosave, submit)',
          'Lambda: scoring (risk score, strikes, escalation)',
          'Lambda: exams (authoring, roster, status, results)',
          'Lambda: dashboard (roster, marking, analytics, end)',
        ],
      },
      memory: {
        rssMB: Math.round(memoryUsage.rss / 1024 / 1024),
        heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      },
    },
  });
};

export const getPing = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'pong',
    timestamp: Date.now(),
  });
};

export default {
  getHealth,
  getPing,
};
