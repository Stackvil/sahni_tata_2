import express from 'express';
import { readData, writeData } from '../utils/dataManager.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload, uploadFileToS3 } from '../middleware/multer-s3.js';
import { aboutDB } from '../utils/dbManager.js';
import { getPool, isDatabaseConnected } from '../config/database.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     About:
 *       type: object
 *       required:
 *         - title
 *         - description
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         file:
 *           type: string
 */

/**
 * @swagger
 * /api/about:
 *   get:
 *     summary: Get all about entries
 *     tags: [About]
 *     responses:
 *       200:
 *         description: List of about entries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/About'
 */
router.get('/', async (req, res) => {
  try {
    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_URL;
    const pool = getPool();
    const shouldUseDatabase = isVercel || (pool !== null && isDatabaseConnected());

    if (shouldUseDatabase) {
      try {
        const aboutEntries = await aboutDB.getAll();
        if (aboutEntries.length > 0) {
          return res.json(aboutEntries);
        }
        // Database is empty, fall through to JSON
      } catch (dbError) {
        console.warn('[About] Database error, falling back to JSON:', dbError.message);
        // Fall through to JSON file reading
      }
    }

    // Fallback to JSON files
    try {
      const data = await readData('about');
      const about = data.about || [];
      return res.json(about);
    } catch (error) {
      console.error('[About] Error reading from JSON:', error.message);
      return res.json([]); // Return empty array instead of error
    }
  } catch (error) {
    console.error('[About] Unexpected error:', error.message);
    res.json([]); // Return empty array instead of error
  }
});

// POST /api/about - Create new about entry (Protected)
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { title, description } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ detail: 'Title and description are required' });
    }

    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_URL;
    const pool = getPool();
    const shouldUseDatabase = isVercel || (pool !== null && isDatabaseConnected());

    let filePath = '';
    if (req.file) {
      try {
        // Upload to S3 and get CloudFront URL
        const fileUrl = await uploadFileToS3(req.file, 'images/about');
        if (!fileUrl) {
          return res.status(500).json({ detail: 'Failed to upload file to S3. Please check AWS credentials.' });
        }
        // Extract the path from CloudFront URL for storage
        filePath = fileUrl.replace(/^https?:\/\/[^\/]+/, '');
      } catch (s3Error) {
        console.error('[About] S3 upload error:', s3Error.message);
        return res.status(500).json({ 
          detail: `Failed to upload file to S3: ${s3Error.message}. Please configure AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY) in environment variables.` 
        });
      }
    }

    if (shouldUseDatabase) {
      try {
        const newEntry = await aboutDB.create({
          title,
          description,
          file_url: filePath,
        });
        return res.status(201).json(newEntry);
      } catch (dbError) {
        console.error('[About] Database error:', dbError.message);
        if (isVercel) {
          return res.status(500).json({ detail: 'Database operation failed on Vercel. Please check database connection.' });
        }
        // Fall through to JSON file write for local development
      }
    }

    // Fallback to JSON files (local development only)
    if (isVercel) {
      return res.status(500).json({ detail: 'Database write for about should be handled in route handlers. Database operation failed.' });
    }

    const data = await readData('about');
    const about = data.about || [];
    const newId = about.length > 0 ? Math.max(...about.map(a => parseInt(a.id) || 0)) + 1 : 1;

    const newEntry = {
      id: newId.toString(),
      title,
      description,
      file: filePath
    };

    about.push(newEntry);
    await writeData('about', { about });

    res.status(201).json(newEntry);
  } catch (error) {
    console.error('[About] Unexpected error:', error.message);
    res.status(500).json({ detail: error.message });
  }
});

// PUT /api/about/:id - Update about entry (Protected)
router.put('/:id', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { title, description } = req.body;
    const aboutId = parseInt(req.params.id);

    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_URL;
    const pool = getPool();
    const shouldUseDatabase = isVercel || (pool !== null && isDatabaseConnected());

    let filePath = undefined;
    if (req.file) {
      try {
        // Upload to S3 and get CloudFront URL
        const fileUrl = await uploadFileToS3(req.file, 'images/about');
        if (!fileUrl) {
          return res.status(500).json({ detail: 'Failed to upload file to S3. Please check AWS credentials.' });
        }
        // Extract the path from CloudFront URL for storage
        filePath = fileUrl.replace(/^https?:\/\/[^\/]+/, '');
      } catch (s3Error) {
        console.error('[About] S3 upload error:', s3Error.message);
        return res.status(500).json({ 
          detail: `Failed to upload file to S3: ${s3Error.message}. Please configure AWS credentials.` 
        });
      }
    }

    if (shouldUseDatabase) {
      try {
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (filePath !== undefined) updateData.file_url = filePath;

        const updatedEntry = await aboutDB.update(aboutId, updateData);
        if (!updatedEntry) {
          return res.status(404).json({ detail: 'About entry not found' });
        }
        return res.json(updatedEntry);
      } catch (dbError) {
        console.error('[About] Database error:', dbError.message);
        if (isVercel) {
          return res.status(500).json({ detail: 'Database operation failed on Vercel.' });
        }
        // Fall through to JSON file write for local development
      }
    }

    // Fallback to JSON files (local development only)
    if (isVercel) {
      return res.status(500).json({ detail: 'Database write for about should be handled in route handlers. Database operation failed.' });
    }

    const data = await readData('about');
    const about = data.about || [];
    const entryIndex = about.findIndex(a => a.id === aboutId.toString());

    if (entryIndex === -1) {
      return res.status(404).json({ detail: 'About entry not found' });
    }

    if (title !== undefined) about[entryIndex].title = title;
    if (description !== undefined) about[entryIndex].description = description;
    if (filePath !== undefined) about[entryIndex].file = filePath;

    await writeData('about', { about });

    res.json(about[entryIndex]);
  } catch (error) {
    console.error('[About] Unexpected error:', error.message);
    res.status(500).json({ detail: error.message });
  }
});

// DELETE /api/about/:id - Delete about entry (Protected)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const aboutId = parseInt(req.params.id);

    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_URL;
    const pool = getPool();
    const shouldUseDatabase = isVercel || (pool !== null && isDatabaseConnected());

    if (shouldUseDatabase) {
      try {
        await aboutDB.delete(aboutId);
        return res.json({ success: true });
      } catch (dbError) {
        console.error('[About] Database error:', dbError.message);
        if (isVercel) {
          return res.status(500).json({ detail: 'Database operation failed on Vercel.' });
        }
        // Fall through to JSON file write for local development
      }
    }

    // Fallback to JSON files (local development only)
    if (isVercel) {
      return res.status(500).json({ detail: 'Database write for about should be handled in route handlers. Database operation failed.' });
    }

    const data = await readData('about');
    const about = data.about || [];
    const filteredAbout = about.filter(a => a.id !== aboutId.toString());

    if (about.length === filteredAbout.length) {
      return res.status(404).json({ detail: 'About entry not found' });
    }

    await writeData('about', { about: filteredAbout });
    res.json({ success: true });
  } catch (error) {
    console.error('[About] Unexpected error:', error.message);
    res.status(500).json({ detail: error.message });
  }
});

export default router;

