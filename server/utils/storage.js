const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const dotenv = require('dotenv');

dotenv.config();

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});

/**
 * Uploads a file buffer to R2
 * @param {Buffer} fileBuffer
 * @param {string} fileName
 * @param {string} mimeType
 * @returns {Promise<string>} - The key of the uploaded file
 */
const uploadFile = async (fileBuffer, fileName, mimeType) => {
    const uploadParams = {
        Bucket: R2_BUCKET_NAME,
        Key: fileName,
        Body: fileBuffer,
        ContentType: mimeType,
    };

    try {
        await s3Client.send(new PutObjectCommand(uploadParams));
        return fileName;
    } catch (err) {
        console.error("Error uploading to R2:", err);
        throw err;
    }
};

/**
 * Generates a signed URL for viewing/downloading
 * @param {string} fileName
 * @returns {Promise<string>}
 */
const getFileUrl = async (fileName) => {
    // Return a presigned URL that forces download
    const command = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileName,
        ResponseContentDisposition: `attachment; filename="${fileName.split('/').pop()}"`,
    });
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
};

/**
 * Fetches a file buffer from R2
 * @param {string} fileName
 * @returns {Promise<Buffer>}
 */
const getFileBuffer = async (fileName) => {
    try {
        const command = new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: fileName,
        });

        const response = await s3Client.send(command);

        // Convert stream to buffer (AWS SDK v3 helper)
        const streamToBuffer = (stream) =>
            new Promise((resolve, reject) => {
                const chunks = [];
                stream.on('data', (chunk) => chunks.push(chunk));
                stream.on('error', reject);
                stream.on('end', () => resolve(Buffer.concat(chunks)));
            });

        return await streamToBuffer(response.Body);
    } catch (err) {
        console.error(`S3 Get Error for ${fileName}:`, err);
        throw err;
    }
};

module.exports = { uploadFile, getFileUrl, getFileBuffer, s3Client };
