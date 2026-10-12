import { awsConfig, isAwsConfigured } from '../../config/aws.config.js';
import s3Service from './s3.service.js';
import rekognitionService from './rekognition.service.js';
import cognitoService from './cognito.service.js';
import lambdaService from './lambda.service.js';
import snsService from './sns.service.js';

/**
 * Returns complete operational diagnostics of all connected AWS services
 */
export const getAwsSystemStatus = () => {
  const isLive = isAwsConfigured();

  return {
    environment: awsConfig.region,
    isLiveAwsCredentialsConfigured: isLive,
    services: {
      s3: {
        serviceName: 'Amazon S3',
        status: 'READY',
        mode: isLive ? 'LIVE' : 'SIMULATED (Zero Cost)',
        bucket: awsConfig.s3Bucket,
        freeTierAllowance: '5 GB standard storage, 20,000 GET, 2,000 PUT requests/month',
        features: ['Presigned Snapshot Uploads', 'Evidence Retention', 'Private Evidence URLs'],
      },
      rekognition: {
        serviceName: 'Amazon Rekognition',
        status: 'READY',
        mode: isLive ? 'LIVE' : 'SIMULATED (Zero Cost)',
        freeTierAllowance: '5,000 images analyzed per month for first 12 months',
        features: ['Candidate Face Verification (CompareFaces)', 'Head Pose & Gaze Check', 'Multi-Face Anomaly Detection'],
      },
      cognito: {
        serviceName: 'Amazon Cognito',
        status: 'READY',
        mode: isLive ? 'LIVE' : 'SIMULATED (Zero Cost)',
        userPoolId: awsConfig.cognitoUserPoolId || 'Configured via .env',
        freeTierAllowance: '50,000 MAUs (Monthly Active Users) free forever',
        features: ['Candidate & Proctor Authentication', 'Secure Token Issuance', 'Federated Identity'],
      },
      lambda: {
        serviceName: 'AWS Lambda',
        status: 'READY',
        mode: isLive ? 'LIVE' : 'SIMULATED (Zero Cost)',
        freeTierAllowance: '1,000,000 requests/month & 3.2M seconds compute time',
        features: ['Serverless Incident Evaluator', 'Weighted Adaptive Risk Calculation', 'Session Audit Report Generator'],
      },
      sns: {
        serviceName: 'Amazon SNS',
        status: 'READY',
        mode: isLive ? 'LIVE' : 'SIMULATED (Zero Cost)',
        freeTierAllowance: '1,000,000 publishes/month free',
        features: ['Real-Time High Risk Proctor SMS/Email Alerts', 'Topic Fanout'],
      },
    },
  };
};

export {
  s3Service,
  rekognitionService,
  cognitoService,
  lambdaService,
  snsService,
};

export default {
  s3: s3Service,
  rekognition: rekognitionService,
  cognito: cognitoService,
  lambda: lambdaService,
  sns: snsService,
  getStatus: getAwsSystemStatus,
};
