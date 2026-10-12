# Adaptive AI-Based Online Examination & Proctoring System

A 100% Serverless AWS Reference Architecture for multi-role online examination and adaptive proctoring engineered with Amazon API Gateway, AWS Lambda, Amazon DynamoDB, Amazon S3, Amazon Rekognition, Amazon Cognito, and Amazon SNS.

---

## 🌟 Serverless AWS Architecture

```
                                 [CloudFront (HTTPS)] ◄─── [S3 Static Hosting (React 19)]
                                         ▲
                         ┌───────────────┴───────────────┐
                         │                               │
             [Student portal (browser)]      [Proctor console (browser)]
             - enrolment (IndexFaces x3)     - exam builder & authoring
             - exam (face-api.js pre-filter) - live dashboard & telemetry
             - keystrokes & tab-visibility   - marking, analytics & report
                         │                               │
                         └───────────────┬───────────────┘
                                         ▼
                          [Amazon API Gateway (HTTP API)]
                          (Cognito JWT Authorizer · 21 routes · Throttling: 10 req/s, burst 20)
                                         │
        ┌───────────────┬────────────────┼───────────────┬───────────────┐
        ▼               ▼                ▼               ▼               ▼
[Lambda: signup] [Lambda: enrollment] [Lambda: session] [Lambda: scoring] [Lambda: exams] [Lambda: dashboard]
 (Cognito post-   (IndexFaces x3       (start, resume,   (risk score,     (authoring,     (roster, marking,
  confirmation)    proctorai-faces)     autosave,submit) strikes,alerts)   roster,results) analytics, force-end)
        │               │                │               │               │               │
        └───────────────┼────────────────┼───────────────┴───────────────┴───────────────┘
                        │                │
       ┌────────────────┼────────────────┼────────────────┐
       ▼                ▼                ▼                ▼
[Amazon Rekognition] [Amazon DynamoDB] [Amazon S3 (Private)] [Amazon SNS]
 - collection:        - Students        - baselines/          - proctor alerts
   proctorai-faces    - Exams           - flagged/              (flags & auto-
 - IndexFaces x3      - ExamSessions    - staging/ (1-day       ended exams)
 - SearchFaces        - FlaggedEvents     lifecycle)
                      - RiskScores
```

---

## 📁 Repository Structure

```
adaptive-exam-proctoring/
├── package.json                   # Root monorepo scripts
├── README.md                      # Architecture & operational documentation
│
├── backend/                       # Serverless Backend & API Gateway Emulation
│   ├── .env                       # Local AWS environment configuration
│   ├── package.json               # AWS SDK v3 (dynamodb, s3, rekognition, cognito, sns)
│   └── src/
│       ├── app.js                 # API Gateway routing layer & middleware
│       ├── server.js              # Local dev server orchestrator
│       ├── config/
│       │   ├── aws.config.js      # Unified AWS SDK v3 client factory
│       │   ├── dynamodb.config.js # DynamoDB client & table definitions
│       │   └── env.js             # Environment variable parser
│       ├── lambdas/               # The 6 Serverless Lambda Handlers
│       │   ├── signup.handler.js     # Cognito Post-Confirmation Trigger
│       │   ├── enrollment.handler.js # IndexFaces x3 baselines & S3 baselines/
│       │   ├── session.handler.js    # Exam attempt start, resume, autosave, submit
│       │   ├── scoring.handler.js    # Risk score engine, strikes & SNS escalation
│       │   ├── exams.handler.js      # Exam authoring, roster, results
│       │   ├── dashboard.handler.js  # Live proctor feeds, marking & force-end
│       │   └── index.js              # Master Lambda exports
│       ├── services/
│       │   ├── dynamo/               # DynamoDB Document Store service
│       │   └── aws/                  # S3, Rekognition, Cognito, SNS clients
│       └── routes/
│           ├── index.js              # API Gateway routes (21 routes)
│           ├── apiGateway.adapter.js # Express <-> Lambda event adapter
│           └── health.routes.js      # System health & AWS diagnostic endpoint
│
└── frontend/                      # React 19 + Vite + Tailwind CSS Application
    ├── src/
    │   ├── pages/
    │   │   ├── LandingPage.jsx       # Architecture diagnostics & health check
    │   │   ├── student/
    │   │   │   ├── StudentDashboard.jsx # Student portal, enrolment & exam launcher
    │   │   │   └── ExamArena.jsx        # Exam arena with adaptive proctoring
    │   │   └── teacher/
    │   │       └── TeacherDashboard.jsx # Proctor console, exam builder & live monitor
    │   └── services/
    │       └── api.js                # API client mapped to Lambda endpoints
```

---

## 🚀 Running Locally

```bash
# Start backend (Port 5000)
npm run dev:backend

# Start frontend (Port 5173)
npm run dev:frontend
```

Verify backend health:
```bash
curl http://localhost:5000/api/health
```

---

## 🗄️ Amazon DynamoDB Tables
The data layer uses 5 DynamoDB tables:
1. **`Students`**: Student profiles, Cognito sub, indexed `faceIds`, baseline image keys.
2. **`Exams`**: Question bank, MCQs, duration, passing marks, authorized student roster.
3. **`ExamSessions`**: Candidate attempt lifecycle (`in_progress`, `completed`, `auto_ended`), answers, score.
4. **`FlaggedEvents`**: Telemetry incident log (`tab_switch`, `face_absence`, `multiple_faces`, `cell_phone`).
5. **`RiskScores`**: Calculated risk index (0–100), strikes (3 strikes threshold), escalation status.

---

## 🔐 IAM Policy for Production Deployment
To grant the backend IAM user permissions to access live DynamoDB tables, S3, Rekognition, and SNS, attach this policy to your IAM user/role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DynamoDBAccess",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:DescribeTable"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/*"
    },
    {
      "Sid": "S3PrivateMediaAccess",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::adaptive-exam-proctoring-evidence-*",
        "arn:aws:s3:::adaptive-exam-proctoring-evidence-*/*"
      ]
    },
    {
      "Sid": "RekognitionCollectionAccess",
      "Effect": "Allow",
      "Action": [
        "rekognition:CreateCollection",
        "rekognition:DescribeCollection",
        "rekognition:IndexFaces",
        "rekognition:SearchFacesByImage",
        "rekognition:DetectFaces",
        "rekognition:DetectLabels",
        "rekognition:CompareFaces"
      ],
      "Resource": "*"
    },
    {
      "Sid": "SNSPublishAlerts",
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": "arn:aws:sns:*:*:adaptive-exam-proctoring-alerts*"
    }
  ]
}
```
