import { S3Client } from '@aws-sdk/client-s3';
import { RekognitionClient } from '@aws-sdk/client-rekognition';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { LambdaClient } from '@aws-sdk/client-lambda';
import { SNSClient } from '@aws-sdk/client-sns';
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
  region: env.AWS_REGION || 'us-east-1',
  ...(awsCredentials ? { credentials: awsCredentials } : {}),
};

// Initialize clients (will use default provider chain or explicit credentials if present)
let s3Client = null;
let rekognitionClient = null;
let cognitoClient = null;
let lambdaClient = null;
let snsClient = null;

try {
  s3Client = new S3Client(clientConfig);
  rekognitionClient = new RekognitionClient(clientConfig);
  cognitoClient = new CognitoIdentityProviderClient(clientConfig);
  lambdaClient = new LambdaClient(clientConfig);
  snsClient = new SNSClient(clientConfig);
} catch (err) {
  console.warn('AWS SDK client initialization warning:', err.message);
}

export const isAwsConfigured = () => isLiveConfigured;

export const awsConfig = {
  region: env.AWS_REGION || 'us-east-1',
  s3Bucket: env.AWS_S3_BUCKET || 'adaptive-exam-proctoring-evidence',
  cognitoUserPoolId: env.AWS_COGNITO_USER_POOL_ID || 'us-east-1_mockPoolId',
  cognitoClientId: env.AWS_COGNITO_CLIENT_ID || 'mockCognitoClientId',
  lambdaFunctionArn: env.AWS_LAMBDA_EVALUATOR_ARN || 'arn:aws:lambda:us-east-1:123456789012:function:proctoring-incident-evaluator',
  snsTopicArn: env.AWS_SNS_TOPIC_ARN || 'arn:aws:sns:us-east-1:123456789012:proctor-high-risk-alerts',
  isLive: isLiveConfigured,
};

export {
  s3Client,
  rekognitionClient,
  cognitoClient,
  lambdaClient,
  snsClient,
};

export default awsConfig;
