import express from 'express';
import { readData, writeData } from '../utils/dataManager.js';
import { authenticateToken } from '../middleware/auth.js';
import { toCloudFrontUrl } from '../utils/imageHelper.js';
import multer from 'multer';
import { uploadFileToS3 } from '../middleware/multer-s3.js';
import { homeVideoDB } from '../utils/dbManager.js';
import { getPool, isDatabaseConnected, query } from '../config/database.js';

const router = express.Router();

// Configure multer for video uploads (memory storage for S3)
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 200 * 1024 * 1024, // 200MB limit for videos (increased for large video files)
    fieldSize: 200 * 1024 * 1024, // 200MB for form fields
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('File must be a video'));
    }
  }
});

/**
 * @swagger
 * /api/home/video:
 *   get:
 *     summary: Get home video URL
 *     tags: [Home]
 *     responses:
 *       200:
 *         description: Home video URL
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *       404:
 *         description: No video found
 *   post:
 *     summary: Upload home video
 *     tags: [Home]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Video uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 */
// GET /api/home/video - Get home video URL
router.get('/video', async (req, res) => {
  try {
    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_URL;
    const pool = getPool();
    const shouldUseDatabase = isVercel || (pool !== null && isDatabaseConnected());

    if (shouldUseDatabase) {
      try {
        const videoUrl = await homeVideoDB.get();
        if (videoUrl) {
          return res.json(toCloudFrontUrl(videoUrl));
        }
        // Database is empty, fall through to JSON
      } catch (dbError) {
        console.warn('[Home] Database error, falling back to JSON:', dbError.message);
        // Fall through to JSON file reading
      }
    }

    // Fallback to JSON files
    try {
      const data = await readData('home');
      const videoUrl = data.video || '';
      
      if (!videoUrl) {
        return res.json('');
      }
      
      const cloudFrontUrl = toCloudFrontUrl(videoUrl);
      return res.json(cloudFrontUrl);
    } catch (error) {
      // If all else fails, return empty string
      console.error('[Home] Error reading video:', error.message);
      return res.json('');
    }
  } catch (error) {
    console.error('[Home] Unexpected error:', error.message);
    res.json(''); // Return empty string instead of error
  }
});

// POST /api/home/video - Upload home video (Protected, documented in GET route above)
router.post('/video', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ detail: 'No file provided' });
    }

    try {
      // Upload to S3 and get CloudFront URL
      const videoUrl = await uploadFileToS3(req.file, 'videos');
      if (!videoUrl) {
        return res.status(500).json({ detail: 'Failed to upload video to S3. Please check AWS credentials.' });
      }

      // Extract the path from CloudFront URL for storage
      const videoPath = videoUrl.replace(/^https?:\/\/[^\/]+/, '');
      
      // Save video URL to data file
      await writeData('home', { video: videoPath });

      res.json(videoPath);
    } catch (s3Error) {
      console.error('[Home] S3 upload error for video:', s3Error.message);
      return res.status(500).json({ 
        detail: `Failed to upload video to S3: ${s3Error.message}. Please configure AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY) in environment variables.` 
      });
    }
  } catch (error) {
    console.error('[Home] Video upload error:', error.message);
    res.status(500).json({ detail: error.message });
  }
});

// GET /api/home/advertisement-video - Get advertisement video URL
router.get('/advertisement-video', async (req, res) => {
  try {
    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_URL;
    const pool = getPool();
    const shouldUseDatabase = isVercel || (pool !== null && isDatabaseConnected());

    if (shouldUseDatabase) {
      try {
        // Query for advertisement video specifically
        const result = await query('SELECT advertisement_video_url FROM home_video ORDER BY updated_at DESC LIMIT 1');
        if (result.rows.length > 0 && result.rows[0].advertisement_video_url) {
          return res.json(toCloudFrontUrl(result.rows[0].advertisement_video_url));
        }
        // Database is empty, fall through to JSON
      } catch (dbError) {
        console.warn('[Home] Database error for advertisement video, falling back to JSON:', dbError.message);
        // Fall through to JSON file reading
      }
    }

    // Fallback to JSON files
    try {
      const data = await readData('home');
      const videoUrl = data.advertisementVideo || '/videos/advertisement.mp4';
      const cloudFrontUrl = toCloudFrontUrl(videoUrl);
      return res.json(cloudFrontUrl);
    } catch (error) {
      // If all else fails, return default
      console.error('[Home] Error reading advertisement video:', error.message);
      return res.json(toCloudFrontUrl('/videos/advertisement.mp4'));
    }
  } catch (error) {
    console.error('[Home] Unexpected error:', error.message);
    res.json(toCloudFrontUrl('/videos/advertisement.mp4')); // Return default instead of error
  }
});

// POST /api/home/advertisement-video - Upload advertisement video (Protected)
router.post('/advertisement-video', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ detail: 'No file provided' });
    }

    try {
      // Upload to S3 and get CloudFront URL
      const videoUrl = await uploadFileToS3(req.file, 'videos');
      if (!videoUrl) {
        return res.status(500).json({ detail: 'Failed to upload video to S3. Please check AWS credentials.' });
      }

      // Extract the path from CloudFront URL for storage
      const videoPath = videoUrl.replace(/^https?:\/\/[^\/]+/, '');
      
      // Save video URL to data file
      const data = await readData('home');
      data.advertisementVideo = videoPath;
      await writeData('home', data);

      res.json(videoPath);
    } catch (s3Error) {
      console.error('[Home] S3 upload error for advertisement video:', s3Error.message);
      return res.status(500).json({ 
        detail: `Failed to upload video to S3: ${s3Error.message}. Please configure AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY) in environment variables.` 
      });
    }
  } catch (error) {
    console.error('[Home] Advertisement video upload error:', error.message);
    res.status(500).json({ detail: error.message });
  }
});

export default router;

