import app from './app.js';
import { env } from './config/env.js';
import { connectDB, getDbStatus } from './config/db.js';
import { awsConfig, isAwsConfigured } from './config/aws.config.js';

const startServer = async () => {
  let dbLabel = 'DynamoDB (active)';
  if (env.DATABASE_MODE === 'mongodb') {
    await connectDB();
    const dbStatus = getDbStatus();
    dbLabel = `MongoDB (${dbStatus.state})`;
  } else {
    console.log(`[Database] Operating in DynamoDB mode (${env.AWS_REGION})`);
  }

  const server = app.listen(env.PORT, () => {
    console.log(`=======================================================`);
    console.log(` Adaptive AI Exam & Proctoring System (${env.DATABASE_MODE.toUpperCase()})  `);
    console.log(`=======================================================`);
    console.log(` Mode:        ${env.NODE_ENV}`);
    console.log(` Port:        ${env.PORT}`);
    console.log(` Database:    ${dbLabel}`);
    console.log(` Health:      http://localhost:${env.PORT}/api/health`);
    console.log(` Base API:    http://localhost:${env.PORT}/api`);
    console.log(` AWS Region:  ${awsConfig.region} (Live: ${isAwsConfigured()})`);
    console.log(` S3 Bucket:   ${awsConfig.s3Bucket}`);
    console.log(` Rekognition: Collection [proctorai-faces]`);
    console.log(` Cognito:     Pool [${awsConfig.cognitoUserPoolId}]`);
    console.log(` SNS Topic:   ${awsConfig.snsTopicArn}`);
    console.log(` Lambdas:     [signup, enrollment, session, scoring, exams, dashboard]`);
    console.log(` Client URL:  ${env.CLIENT_URL}`);
    console.log(`=======================================================`);
  });

  // Graceful shutdown
  const shutdown = (signal) => {
    console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('[Server] HTTP server closed.');
      process.exit(0);
    });

    setTimeout(() => {
      console.error('[Server] Forcefully terminating after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('unhandledRejection', (reason, promise) => {
    console.error('[Server Unhandled Rejection]:', reason);
  });

  process.on('uncaughtException', (err) => {
    console.error('[Server Uncaught Exception]:', err);
  });
};

startServer();
