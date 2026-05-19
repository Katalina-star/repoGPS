/**
 * GarageHQ Storage Client
 * Uses @aws-sdk/client-s3 for S3-compatible storage
 */

const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');

// Singleton instance
let s3Client = null;
let bucketName = 'repogps-docs';

/**
 * Initialize the GarageHQ S3 client
 * Uses environment variables for configuration:
 * - GARAGE_ENDPOINT (default: http://garage-hq:3900)
 * - GARAGE_ACCESS_KEY (default: admin)
 * - GARAGE_SECRET_KEY (default: changeme)
 * - GARAGE_BUCKET (default: repogps-docs)
 */
function initGarageClient() {
  if (s3Client) {
    return s3Client;
  }

  const endpoint = process.env.GARAGE_ENDPOINT || 'http://garage-hq:3900';
  bucketName = process.env.GARAGE_BUCKET || 'repogps-docs';

  s3Client = new S3Client({
    endpoint: endpoint,
    region: 'us-east-1',
    forcePathStyle: true, // REQUIRED for S3-compatible like GarageHQ
    credentials: {
      accessKeyId: process.env.GARAGE_ACCESS_KEY || 'admin',
      secretAccessKey: process.env.GARAGE_SECRET_KEY || 'changeme',
    },
  });

  console.log('[storage] GarageHQ S3 client initialized');
  console.log('[storage] Endpoint:', endpoint);
  console.log('[storage] Bucket:', bucketName);
  return s3Client;
}

/**
 * Get the S3 client instance
 * @returns {S3Client} The S3 client instance
 */
function getS3Client() {
  if (!s3Client) {
    initGarageClient();
  }
  return s3Client;
}

/**
 * Upload a file to GarageHQ
 * @param {string} key - The storage key (e.g., "expediente_id/documento_id/v1/filename.pdf")
 * @param {Buffer} data - The file data as Buffer
 * @param {Object} options - Additional options (contentType, etc.)
 * @returns {Promise<Object>} Upload result
 */
async function uploadFile(key, data, options = {}) {
  const client = getS3Client();
  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: data,
      ContentType: options.contentType || 'application/octet-stream',
    });
    const result = await client.send(command);
    console.log(`[storage] Uploaded: ${key}`);
    return result;
  } catch (error) {
    console.error(`[storage] Upload failed for ${key}:`, error.message);
    throw error;
  }
}

/**
 * Download a file from GarageHQ
 * @param {string} key - The storage key
 * @returns {Promise<Buffer>} The file data as Buffer
 */
async function downloadFile(key) {
  const client = getS3Client();
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    const result = await client.send(command);
    // Convert streaming body to Buffer
    const stream = result.Body;
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    console.log(`[storage] Downloaded: ${key}`);
    return buffer;
  } catch (error) {
    console.error(`[storage] Download failed for ${key}:`, error.message);
    throw error;
  }
}

/**
 * Get a temporary URL for a file (not implemented for GarageHQ - returns internal URL)
 * @param {string} key - The storage key
 * @returns {string} The internal URL
 */
async function getFileUrl(key) {
  // GarageHQ doesn't support pre-signed URLs in the same way as S3
  // Return the internal endpoint URL
  const endpoint = process.env.GARAGE_ENDPOINT || 'http://garage-hq:3900';
  return `${endpoint}/${bucketName}/${key}`;
}

/**
 * Delete a file from GarageHQ
 * @param {string} key - The storage key
 * @returns {Promise<void>}
 */
async function deleteFile(key) {
  const client = getS3Client();
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    await client.send(command);
    console.log(`[storage] Deleted: ${key}`);
  } catch (error) {
    console.error(`[storage] Delete failed for ${key}:`, error.message);
    throw error;
  }
}

/**
 * Check if a file exists in storage
 * @param {string} key - The storage key
 * @returns {Promise<boolean>} True if exists
 */
async function fileExists(key) {
  const client = getS3Client();
  try {
    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    await client.send(command);
    return true;
  } catch (error) {
    if (error.name === 'NotFound' || error.message?.includes('NoSuchKey')) {
      return false;
    }
    throw error;
  }
}

/**
 * Get raw S3 client for advanced operations
 * @returns {S3Client} The underlying S3 client
 */
function getRawS3Client() {
  return getS3Client();
}

module.exports = {
  initGarageClient,
  getS3Client,
  uploadFile,
  downloadFile,
  getFileUrl,
  deleteFile,
  fileExists,
  getRawS3Client,
};