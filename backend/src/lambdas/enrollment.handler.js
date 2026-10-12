import dynamoService from '../services/dynamo/dynamo.service.js';
import rekognitionService from '../services/aws/rekognition.service.js';
import s3Service from '../services/aws/s3.service.js';

/**
 * Lambda: enrollment
 * Functions:
 * 1. Capture and Index 3 baseline photos into Rekognition collection 'proctorai-faces'
 * 2. Upload baselines to S3 private media under 'baselines/<studentId>/'
 * 3. Update candidate record in DynamoDB Students table with faceIds & status = 'enrolled'
 * 4. Pre-exam identity verification using SearchFacesByImage
 */
export const handler = async (event, context) => {
  try {
    const httpMethod = event.httpMethod || event.requestContext?.http?.method || 'POST';
    const path = event.path || event.rawPath || '';
    const body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {});

    // Route: Verify Face before Exam (SearchFacesByImage or compare against baseline)
    if (path.endsWith('/verify') || body.action === 'verify') {
      const { studentId, liveImage } = body;
      if (!liveImage) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: false, message: 'liveImage base64 is required for verification' }),
        };
      }

      // Check Rekognition SearchFacesByImage in proctorai-faces collection
      const searchResult = await rekognitionService.searchFaceByImage(liveImage, 80);
      const student = studentId ? await dynamoService.getStudent(studentId) : null;

      const isMatch = searchResult.isMatch;
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          data: {
            verified: isMatch,
            similarity: searchResult.similarity,
            confidence: searchResult.confidence,
            matchedFaceId: searchResult.faceId,
            studentId: studentId || searchResult.externalImageId,
            studentName: student?.name || 'Verified Candidate',
            mode: searchResult.mode,
          },
        }),
      };
    }

    // Default Route: IndexFaces x3 baselines
    const { studentId, baselineImages } = body;
    if (!studentId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'studentId is required' }),
      };
    }

    if (!Array.isArray(baselineImages) || baselineImages.length < 3) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          message: 'Enrollment requires exactly 3 baseline photos (Front, Slight Left, Slight Right).',
        }),
      };
    }

    // 1. Ensure collection exists in Rekognition
    await rekognitionService.ensureCollectionExists();

    // 2. Upload the 3 baseline photos to S3 under baselines/
    const s3Keys = [];
    for (let i = 0; i < baselineImages.length; i++) {
      const uploadRes = await s3Service.uploadBaselinePhoto(studentId, i + 1, baselineImages[i]);
      s3Keys.push(uploadRes.key);
    }

    // 3. Index faces into Rekognition proctorai-faces collection
    const indexResult = await rekognitionService.indexFacesBaseline(studentId, baselineImages);

    // 4. Update Student profile in DynamoDB
    let student = await dynamoService.getStudent(studentId);
    if (!student) {
      student = {
        studentId,
        name: body.name || studentId,
        email: body.email || `${studentId}@example.com`,
        role: 'student',
      };
    }

    const updatedStudent = await dynamoService.putStudent({
      ...student,
      status: 'enrolled',
      faceIds: indexResult.faceIds,
      baselineImageKeys: s3Keys,
      enrolledAt: new Date().toISOString(),
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Student successfully enrolled with 3 baseline face vectors in Rekognition and S3.',
        data: {
          student: updatedStudent,
          collectionId: indexResult.collectionId,
          faceCount: indexResult.faceCount,
          faceIds: indexResult.faceIds,
          s3Keys,
        },
      }),
    };
  } catch (error) {
    console.error('[Lambda: enrollment error]', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};

export default handler;
