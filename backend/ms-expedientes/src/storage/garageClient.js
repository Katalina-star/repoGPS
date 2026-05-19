/**
 * GarageHQ Storage Client
 * Uses @haydenbleasel/files-sdk with S3 adapter for S3-compatible storage
 */

const { Files } = require('files-sdk');
const { s3 } = require('files-sdk/s3');

// Singleton instance
let filesClient = null;

/**
 * Initialize the GarageHQ files client
 * Uses environment variables for configuration:
 * - GARAGE_ENDPOINT (default: http://garage-hq:3901)
 * - GARAGE_ACCESS_KEY (default: admin)
 * - GARAGE_SECRET_KEY (default: changeme)
 * - GARAGE_BUCKET (default: repogps-docs)
 */
function initGarageClient() {
  if (filesClient) {
    return filesClient;
  }

  const config = {
    adapter: s3({
      bucket: process.env.GARAGE_BUCKET || 'repogps-docs',
      region: 'us-east-1', // Dummy region for S3-compatible
      endpoint: process.env.GARAGE_ENDPOINT || 'http://garage-hq:3901',
      forcePathStyle: true, // REQUIRED for S3-compatible like GarageHQ
      credentials: {
        accessKeyId: process.env.GARAGE_ACCESS_KEY || 'admin',
        secretAccessKey: process.env.GARAGE_SECRET_KEY || 'changeme',
      },
    }),
  };

  filesClient = new Files(config);
  console.log('[storage] GarageHQ client initialized');
  return filesClient;
}

/**
 * Get the files client instance
 * @returns {Files} The files SDK instance
 */
function getFilesClient() {
  if (!filesClient) {
    initGarageClient();
  }
  return filesClient;
}

/**
 * Upload a file to GarageHQ
 * @param {string} key - The storage key (e.g., "expediente_id/documento_id/v1/filename.pdf")
 * @param {Buffer|Blob|File|string} data - The file data
 * @param {Object} options - Additional options (contentType, etc.)
 * @returns {Promise<Object>} Upload result
 */
async function uploadFile(key, data, options = {}) {
  const client = getFilesClient();
  try {
    const result = await client.upload(key, data, {
      contentType: options.contentType || 'application/octet-stream',
    });
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
 * @returns {Promise<Blob>} The file data as Blob
 */
async function downloadFile(key) {
  const client = getFilesClient();
  try {
    const result = await client.download(key);
    console.log(`[storage] Downloaded: ${key}`);
    return result;
  } catch (error) {
    console.error(`[storage] Download failed for ${key}:`, error.message);
    throw error;
  }
}

/**
 * Get a temporary URL for a file
 * @param {string} key - The storage key
 * @param {number} expiresIn - Expiration time in seconds (default: 3600)
 * @returns {Promise<string>} The temporary URL
 */
async function getFileUrl(key, expiresIn = 3600) {
  const client = getFilesClient();
  try {
    const url = await client.url(key, {
      expiresIn,
      responseContentDisposition: 'attachment;',
    });
    return url;
  } catch (error) {
    console.error(`[storage] URL generation failed for ${key}:`, error.message);
    throw error;
  }
}

/**
 * Delete a file from GarageHQ
 * @param {string} key - The storage key
 * @returns {Promise<void>}
 */
async function deleteFile(key) {
  const client = getFilesClient();
  try {
    await client.delete(key);
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
  const client = getFilesClient();
  try {
    await client.download(key);
    return true;
  } catch (error) {
    if (error.message && error.message.includes('NoSuchKey')) {
      return false;
    }
    throw error;
  }
}

/**
 * Get raw S3 client for advanced operations
 * @returns {Object} The underlying S3 client
 */
function getRawS3Client() {
  const client = getFilesClient();
  return client.raw;
}

module.exports = {
  initGarageClient,
  getFilesClient,
  uploadFile,
  downloadFile,
  getFileUrl,
  deleteFile,
  fileExists,
  getRawS3Client,
};