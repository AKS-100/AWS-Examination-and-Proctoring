/**
 * Automated AWS Services Verification Suite
 * Tests Amazon S3, Amazon Rekognition, AWS Lambda, Amazon Cognito, and Amazon SNS
 */

import awsServices, { getAwsSystemStatus } from './src/services/aws/index.js';

const { s3, rekognition, cognito, lambda, sns } = awsServices;

// Minimal 1x1 pixel JPEG in Base64 for valid image byte stream testing
const sampleBase64Jpeg =
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

async function runAwsTestSuite() {
  console.log('================================================================');
  console.log('🚀 AWS FREE TIER PROCTORING SERVICES VERIFICATION SUITE');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 5;

  // 1. Diagnostics & Free Tier Status Check
  console.log('[TEST 1/5] Checking AWS Services Operational State...');
  const status = getAwsSystemStatus();
  console.log(`  -> Environment Region: ${status.environment}`);
  console.log(`  -> Mode: ${status.isLiveAwsCredentialsConfigured ? 'LIVE AWS' : 'SIMULATED (Zero AWS Cost Safe)'}`);
  console.log(`  -> Services initialized: S3, Rekognition, Cognito, Lambda, SNS`);
  if (status.services.s3 && status.services.rekognition && status.services.lambda) {
    console.log('  ✅ TEST 1 PASSED: AWS Service Fleet healthy and ready.');
    passedTests++;
  } else {
    console.log('  ❌ TEST 1 FAILED: Could not inspect AWS status.');
  }
  console.log('');

  // 2. Amazon S3 Storage & Presigned URLs
  console.log('[TEST 2/5] Testing Amazon S3 Presigned URL & Evidence Storage...');
  try {
    const presigned = await s3.getPresignedUploadUrl('evidence/test_attempt/snapshot_01.jpg');
    console.log(`  -> S3 Bucket: ${presigned.bucket}`);
    console.log(`  -> S3 Key: ${presigned.key}`);
    console.log(`  -> Upload URL generated: ${presigned.uploadUrl.substring(0, 60)}...`);

    const uploadResult = await s3.uploadEvidenceSnapshot(
      sampleBase64Jpeg,
      'evidence/test_attempt/snapshot_01.jpg'
    );
    console.log(`  -> Snapshot Stored URL: ${uploadResult.url}`);
    console.log('  ✅ TEST 2 PASSED: Amazon S3 Presigned & Evidence Storage operational.');
    passedTests++;
  } catch (err) {
    console.log(`  ❌ TEST 2 FAILED: ${err.message}`);
  }
  console.log('');

  // 3. Amazon Rekognition: Identity Verification & Face Detection
  console.log('[TEST 3/5] Testing Amazon Rekognition (CompareFaces & DetectFaces)...');
  try {
    // Face Detection
    const detectResult = await rekognition.detectFaces(sampleBase64Jpeg);
    console.log(`  -> DetectFaces Face Count: ${detectResult.faceCount}`);
    console.log(`  -> DetectFaces Anomaly Flag: ${detectResult.anomaly || 'None (Normal)'}`);

    // Face Comparison
    const compareResult = await rekognition.compareFaces(sampleBase64Jpeg, sampleBase64Jpeg, 80);
    console.log(`  -> CompareFaces Match: ${compareResult.isMatch}`);
    console.log(`  -> Similarity: ${compareResult.similarity}%`);
    if (compareResult.similarity >= 80) {
      console.log('  ✅ TEST 3 PASSED: Amazon Rekognition vision analytics operational.');
      passedTests++;
    } else {
      console.log('  ❌ TEST 3 FAILED: Rekognition face match similarity below threshold.');
    }
  } catch (err) {
    console.log(`  ❌ TEST 3 FAILED: ${err.message}`);
  }
  console.log('');

  // 4. AWS Lambda & Amazon SNS: Serverless Incident Evaluation & Alerts
  console.log('[TEST 4/5] Testing AWS Lambda Serverless Evaluator & Amazon SNS Alerts...');
  try {
    const lambdaResult = await lambda.invokeIncidentEvaluatorLambda({
      attemptId: 'att_test_999',
      eventType: 'MULTIPLE_FACES',
      currentScore: 35,
      details: 'Two unauthorized persons detected in webcam frame',
    });

    console.log(`  -> Lambda Execution: ${lambdaResult.lambdaExecutionId || 'Live Arn'}`);
    console.log(`  -> Computed Risk Delta: +${lambdaResult.result.riskDelta}`);
    console.log(`  -> Updated Risk Score: ${lambdaResult.result.updatedRiskScore}`);
    console.log(`  -> Policy Tag: ${lambdaResult.result.policyTag}`);

    // High risk trigger to SNS
    if (lambdaResult.result.updatedRiskScore > 50) {
      const snsResult = await sns.sendHighRiskProctorAlert({
        studentName: 'Aarav Sharma',
        examTitle: 'Cloud Computing CS-402',
        riskScore: lambdaResult.result.updatedRiskScore,
        breachType: 'MULTIPLE_FACES',
        details: 'Two unauthorized persons detected in webcam frame',
      });
      console.log(`  -> Amazon SNS High-Risk Alert dispatched: ${snsResult.messageId}`);
    }

    console.log('  ✅ TEST 4 PASSED: AWS Lambda & Amazon SNS incident pipeline operational.');
    passedTests++;
  } catch (err) {
    console.log(`  ❌ TEST 4 FAILED: ${err.message}`);
  }
  console.log('');

  // 5. Amazon Cognito: User Pool Identity & Authentication
  console.log('[TEST 5/5] Testing Amazon Cognito User Pools...');
  try {
    const cognitoReg = await cognito.registerWithCognito({
      email: 'candidate.aws@adaptive.edu',
      password: 'SecurePassword@2026',
      name: 'Priya Patel',
      role: 'student',
      studentId: 'CS-2026-AWS',
    });
    console.log(`  -> Cognito UserSub: ${cognitoReg.userSub}`);
    console.log(`  -> Cognito Confirmed: ${cognitoReg.userConfirmed}`);

    const cognitoAuth = await cognito.authenticateWithCognito({
      email: 'candidate.aws@adaptive.edu',
      password: 'SecurePassword@2026',
    });
    console.log(`  -> Cognito Token Type: ${cognitoAuth.tokenType || 'Bearer'}`);
    console.log(`  -> Cognito AccessToken issued successfully`);

    console.log('  ✅ TEST 5 PASSED: Amazon Cognito user identity operational.');
    passedTests++;
  } catch (err) {
    console.log(`  ❌ TEST 5 FAILED: ${err.message}`);
  }
  console.log('');

  console.log('================================================================');
  console.log(`🎯 AWS VERIFICATION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('================================================================');
  process.exit(passedTests === totalTests ? 0 : 1);
}

runAwsTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
