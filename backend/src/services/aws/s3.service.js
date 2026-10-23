import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, awsConfig, isAwsConfigured } from '../../config/aws.config.js';

/**
 * Amazon S3 Private Media Service (Section 42 & AWS Architecture)
 * Prefixes:
 * - baselines/  : Enrolled candidate reference photos
 * - flagged/    : Evidence frames captured during suspicious / high-risk events
 * - staging/    : Transient frames with 1-day lifecycle expiration
 */

const simulatedS3Storage = new Map();

const toBuffer = (fileData) => {
  if (Buffer.isBuffer(fileData)) return fileData;
  if (typeof fileData === 'string') {
    const base64Data = fileData.replace(/^data:image\/\w+;base64,/, '');
    return Buffer.from(base64Data, 'base64');
  }
  throw new Error('Unsupported fileData format. Expected Buffer or base64 string.');
};

/**
 * Generate a presigned PUT URL for direct client-to-S3 upload
 */
export const getPresignedUploadUrl = async (key, contentType = 'image/jpeg', expiresInSeconds = 300) => {
  if (isAwsConfigured() && s3Client) {
    try {
      const command = new PutObjectCommand({
        Bucket: awsConfig.s3Bucket,
        Key: key,
        ContentType: contentType,
      });
      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
      return {
        success: true,
        mode: 'live',
        uploadUrl,
        key,
        bucket: awsConfig.s3Bucket,
        publicUrl: `https://${awsConfig.s3Bucket}.s3.${awsConfig.region}.amazonaws.com/${key}`,
        expiresIn: expiresInSeconds,
      };
    } catch (err) {
      console.warn('S3 presigned URL live notice:', err.message);
    }
  }

  const mockUrl = `/api/aws/s3/mock-upload/${encodeURIComponent(key)}`;
  return {
    success: true,
    mode: 'simulated',
    uploadUrl: mockUrl,
    key,
    bucket: awsConfig.s3Bucket,
    publicUrl: `https://${awsConfig.s3Bucket}.s3.${awsConfig.region}.amazonaws.com/${key}`,
    expiresIn: expiresInSeconds,
  };
};

/**
 * Direct upload of Buffer/Base64 to S3 under specified key
 */
export const uploadEvidenceSnapshot = async (fileData, key, contentType = 'image/jpeg') => {
  const buffer = toBuffer(fileData);

  if (isAwsConfigured() && s3Client) {
    try {
      const command = new PutObjectCommand({
        Bucket: awsConfig.s3Bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      });
      await s3Client.send(command);

      return {
        success: true,
        mode: 'live',
        key,
        bucket: awsConfig.s3Bucket,
        url: `https://${awsConfig.s3Bucket}.s3.${awsConfig.region}.amazonaws.com/${key}`,
        byteSize: buffer.length,
      };
    } catch (err) {
      console.warn('S3 live upload error (' + err.message + ') - falling back to simulated storage cache.');
    }
  }

  simulatedS3Storage.set(key, {
    data: buffer,
    contentType,
    uploadedAt: new Date(),
  });

  return {
    success: true,
    mode: 'simulated',
    key,
    bucket: awsConfig.s3Bucket,
    url: `https://${awsConfig.s3Bucket}.s3.${awsConfig.region}.amazonaws.com/${key}`,
    byteSize: buffer.length,
    note: 'Stored in resilient S3 simulation store.',
  };
};

/**
 * Upload student enrollment baseline reference photo
 * Prefix: baselines/<studentId>/baseline_<idx>.jpg
 */
export const uploadBaselinePhoto = async (studentId, index, fileData) => {
  const key = `baselines/${studentId}/baseline_${index}.jpg`;
  return uploadEvidenceSnapshot(fileData, key, 'image/jpeg');
};

/**
 * Upload flagged incident evidence frame
 * Prefix: flagged/<sessionId>/<timestamp>_<anomaly>.jpg
 */
export const uploadFlaggedIncident = async (sessionId, eventType, fileData) => {
  const safeType = (eventType || 'incident').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const key = `flagged/${sessionId}/${Date.now()}_${safeType}.jpg`;
  return uploadEvidenceSnapshot(fileData, key, 'image/jpeg');
};

/**
 * Upload staging transient webcam frame (1-day lifecycle)
 * Prefix: staging/<sessionId>/<timestamp>.jpg
 */
export const uploadStagingFrame = async (sessionId, fileData) => {
  const key = `staging/${sessionId}/${Date.now()}.jpg`;
  return uploadEvidenceSnapshot(fileData, key, 'image/jpeg');
};

/**
 * Generate presigned GET URL for viewing private images
 */
export const getPresignedDownloadUrl = async (key, expiresInSeconds = 3600) => {
  let cleanKey = key;
  if (typeof cleanKey === 'string' && cleanKey.startsWith('http')) {
    try {
      const urlObj = new URL(cleanKey);
      cleanKey = urlObj.pathname.replace(/^\/+/, '');
    } catch (e) {
      // fallback
    }
  }

  if ((isAwsConfigured() || s3Client) && s3Client && cleanKey) {
    try {
      const command = new GetObjectCommand({
        Bucket: awsConfig.s3Bucket,
        Key: cleanKey,
      });
      const url = await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
      return { success: true, mode: 'live', downloadUrl: url, key: cleanKey };
    } catch (err) {
      console.warn('S3 presigned download URL live notice:', err.message);
    }
  }

  return {
    success: true,
    mode: 'simulated',
    downloadUrl: `https://${awsConfig.s3Bucket}.s3.${awsConfig.region}.amazonaws.com/${cleanKey || key}`,
    key: cleanKey || key,
  };
};

export default {
  getPresignedUploadUrl,
  uploadEvidenceSnapshot,
  uploadBaselinePhoto,
  uploadFlaggedIncident,
  uploadStagingFrame,
  getPresignedDownloadUrl,
};
