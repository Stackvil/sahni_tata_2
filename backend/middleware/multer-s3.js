import multer from 'multer';
import { uploadToS3 } from '../config/s3.js';

// Memory storage for Lambda (files go to S3, not disk)
const storage = multer.memoryStorage();

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

// Helper to upload file buffer to S3
export const uploadFileToS3 = async (file, folder = 'images') => {
  if (!file) {
    console.error('[Multer-S3] No file provided');
    return null;
  }

  if (!file.buffer) {
    console.error('[Multer-S3] File buffer is missing');
    return null;
  }

  try {
    const fileData = {
      buffer: file.buffer,
      originalname: file.originalname || 'unnamed-file',
      mimetype: file.mimetype || 'application/octet-stream',
    };

    console.log(`[Multer-S3] Preparing to upload: ${file.originalname} to folder: ${folder}`);
    const url = await uploadToS3(fileData, folder);
    return url;
  } catch (error) {
    console.error('[Multer-S3] Upload failed:', error.message);
    throw error; // Re-throw so route handlers can handle the error
  }
};

export default { upload, uploadFileToS3 };

