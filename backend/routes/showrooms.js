import express from 'express';
import { readData, writeData } from '../utils/dataManager.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload, uploadFileToS3 } from '../middleware/multer-s3.js';
import { getPool, isDatabaseConnected } from '../config/database.js';
import { showroomsDB } from '../utils/dbManager.js';
import { toCloudFrontUrl } from '../utils/imageHelper.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Showroom:
 *       type: object
 *       required:
 *         - city
 *         - address
 *         - phone
 *         - email
 *       properties:
 *         id:
 *           type: string
 *         city:
 *           type: string
 *         address:
 *           type: string
 *         phone:
 *           type: string
 *         email:
 *           type: string
 *         is_main:
 *           type: boolean
 *         image:
 *           type: string
 */

/**
 * @swagger
 * /api/showrooms:
 *   get:
 *     summary: Get all showrooms
 *     tags: [Showrooms]
 *     responses:
 *       200:
 *         description: List of showrooms
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Showroom'
 */
router.get('/', async (req, res) => {
  try {
    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_URL;
    
    // Try database first on Vercel, fall back to JSON
    const shouldUseDatabase = () => {
      const pool = getPool();
      if (isVercel) {
        return pool !== null && isDatabaseConnected();
      }
      return pool !== null && isDatabaseConnected();
    };

    if (shouldUseDatabase()) {
      try {
        const showrooms = await showroomsDB.getAll();
        
        // If database is empty, fall back to JSON files
        if (showrooms.length === 0) {
          console.warn('[Showrooms] Database is empty, falling back to JSON files');
          // Continue to JSON file reading below
        } else {
          // Convert image paths to CloudFront URLs
          const showroomsWithCloudFront = showrooms.map(showroom => ({
            id: showroom.id.toString(),
            city: showroom.city,
            address: showroom.address,
            phone: showroom.phone,
            email: showroom.email,
            is_main: showroom.is_main,
            image: showroom.image_url ? toCloudFrontUrl(showroom.image_url) : showroom.image_url,
            category: showroom.category || 'tata', // Include category field
            images: showroom.images || undefined // Include images array if present
          }));
          
          return res.json(showroomsWithCloudFront);
        }
      } catch (dbError) {
        console.warn('[Showrooms] Database error, falling back to JSON:', dbError.message);
        // Continue to JSON file reading below
      }
    }

    // Read from JSON files (fallback or primary for local)
    try {
      const data = await readData('showrooms');
      const showrooms = data.showrooms || [];
      console.log(`[Showrooms] Loaded ${showrooms.length} showrooms from JSON`);
      // Ensure all fields are included in JSON response, including is_branch
      const showroomsWithCategory = showrooms.map(showroom => ({
        ...showroom,
        category: showroom.category || 'tata',
        images: showroom.images || undefined,
        is_branch: showroom.is_branch || false // Preserve is_branch field
      }));
      return res.json(showroomsWithCategory);
    } catch (jsonError) {
      console.error('[Showrooms] Error reading from JSON:', jsonError.message);
      return res.json([]); // Return empty array instead of error
    }
  } catch (error) {
    console.error('[Showrooms] Unexpected error:', error.message);
    return res.json([]); // Return empty array instead of error
  }
});

// POST /api/showrooms - Create new showroom (Protected)
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { city, address, phone, email, is_main, category, images } = req.body;
    
    if (!city || !address || !phone || !email) {
      return res.status(400).json({ detail: 'City, address, phone, and email are required' });
    }

    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_URL;
    const pool = getPool();
    const shouldUseDatabase = isVercel || (pool !== null && isDatabaseConnected());

    let imagePath = '';
    if (req.file) {
      try {
        // Upload to S3 and get CloudFront URL
        const imageUrl = await uploadFileToS3(req.file, 'images/showrooms');
        if (!imageUrl) {
          return res.status(500).json({ detail: 'Failed to upload image to S3. Please check AWS credentials.' });
        }
        // Extract the path from CloudFront URL for storage
        imagePath = imageUrl.replace(/^https?:\/\/[^\/]+/, '');
      } catch (s3Error) {
        console.error('[Showrooms] S3 upload error:', s3Error.message);
        return res.status(500).json({ 
          detail: `Failed to upload image to S3: ${s3Error.message}. Please configure AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY) in environment variables.` 
        });
      }
    }

    if (shouldUseDatabase) {
      try {
        const newShowroom = await showroomsDB.create({
          city,
          address,
          phone,
          email,
          is_main: is_main === 'true' || is_main === true,
          image_url: imagePath,
          category: category || 'tata',
          images: images ? (Array.isArray(images) ? images : [images]) : undefined,
        });
        
        return res.status(201).json({
          id: newShowroom.id.toString(),
          city: newShowroom.city,
          address: newShowroom.address,
          phone: newShowroom.phone,
          email: newShowroom.email,
          is_main: newShowroom.is_main,
          image: newShowroom.image_url ? toCloudFrontUrl(newShowroom.image_url) : newShowroom.image_url,
          category: newShowroom.category || 'tata',
          images: newShowroom.images || undefined,
        });
      } catch (dbError) {
        console.error('[Showrooms] Database error:', dbError.message);
        if (isVercel) {
          return res.status(500).json({ detail: 'Database operation failed on Vercel. Please check database connection.' });
        }
        // Fall through to JSON file write for local development
      }
    }

    // Fallback to JSON files (local development only)
    if (isVercel) {
      return res.status(500).json({ detail: 'Database write for showrooms should be handled in route handlers. Database operation failed.' });
    }

    const data = await readData('showrooms');
    const showrooms = data.showrooms || [];
    const newId = showrooms.length > 0 ? Math.max(...showrooms.map(s => parseInt(s.id) || 0)) + 1 : 1;

    const newShowroom = {
      id: newId.toString(),
      city,
      address,
      phone,
      email,
      is_main: is_main === 'true' || is_main === true,
      image: imagePath,
      category: category || 'tata'
    };

    showrooms.push(newShowroom);
    await writeData('showrooms', { showrooms });

    res.status(201).json(newShowroom);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// PUT /api/showrooms/:id - Update showroom (Protected)
router.put('/:id', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { city, address, phone, email, is_main, category } = req.body;
    const showroomId = parseInt(req.params.id);

    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_URL;
    const pool = getPool();
    const shouldUseDatabase = isVercel || (pool !== null && isDatabaseConnected());

    let imagePath = undefined;
    if (req.file) {
      try {
        // Upload to S3 and get CloudFront URL
        const imageUrl = await uploadFileToS3(req.file, 'images/showrooms');
        if (!imageUrl) {
          return res.status(500).json({ detail: 'Failed to upload image to S3. Please check AWS credentials.' });
        }
        // Extract the path from CloudFront URL for storage
        imagePath = imageUrl.replace(/^https?:\/\/[^\/]+/, '');
      } catch (s3Error) {
        console.error('[Showrooms] S3 upload error:', s3Error.message);
        return res.status(500).json({ 
          detail: `Failed to upload image to S3: ${s3Error.message}. Please configure AWS credentials.` 
        });
      }
    }

    if (shouldUseDatabase) {
      try {
        const updateData = {};
        if (city !== undefined) updateData.city = city;
        if (address !== undefined) updateData.address = address;
        if (phone !== undefined) updateData.phone = phone;
        if (email !== undefined) updateData.email = email;
        if (is_main !== undefined) updateData.is_main = is_main === 'true' || is_main === true;
        if (imagePath !== undefined) updateData.image_url = imagePath;
        if (category !== undefined) updateData.category = category;

        const updatedShowroom = await showroomsDB.update(showroomId, updateData);
        if (!updatedShowroom) {
          return res.status(404).json({ detail: 'Showroom not found' });
        }

        return res.json({
          id: updatedShowroom.id.toString(),
          city: updatedShowroom.city,
          address: updatedShowroom.address,
          phone: updatedShowroom.phone,
          email: updatedShowroom.email,
          is_main: updatedShowroom.is_main,
          image: updatedShowroom.image_url ? toCloudFrontUrl(updatedShowroom.image_url) : updatedShowroom.image_url,
          category: updatedShowroom.category || 'tata',
          images: updatedShowroom.images || undefined,
        });
      } catch (dbError) {
        console.error('[Showrooms] Database error:', dbError.message);
        if (isVercel) {
          return res.status(500).json({ detail: 'Database operation failed on Vercel.' });
        }
        // Fall through to JSON file write for local development
      }
    }

    // Fallback to JSON files (local development only)
    if (isVercel) {
      return res.status(500).json({ detail: 'Database write for showrooms should be handled in route handlers. Database operation failed.' });
    }

    const data = await readData('showrooms');
    const showrooms = data.showrooms || [];
    const showroomIndex = showrooms.findIndex(s => s.id === showroomId.toString());

    if (showroomIndex === -1) {
      return res.status(404).json({ detail: 'Showroom not found' });
    }

    if (city !== undefined) showrooms[showroomIndex].city = city;
    if (address !== undefined) showrooms[showroomIndex].address = address;
    if (phone !== undefined) showrooms[showroomIndex].phone = phone;
    if (email !== undefined) showrooms[showroomIndex].email = email;
    if (is_main !== undefined) showrooms[showroomIndex].is_main = is_main === 'true' || is_main === true;
    if (category !== undefined) showrooms[showroomIndex].category = category;
    if (imagePath !== undefined) showrooms[showroomIndex].image = imagePath;

    await writeData('showrooms', { showrooms });

    res.json(showrooms[showroomIndex]);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// DELETE /api/showrooms/:id - Delete showroom (Protected)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const showroomId = parseInt(req.params.id);

    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_URL;
    const pool = getPool();
    const shouldUseDatabase = isVercel || (pool !== null && isDatabaseConnected());

    if (shouldUseDatabase) {
      try {
        await showroomsDB.delete(showroomId);
        return res.json({ success: true });
      } catch (dbError) {
        console.error('[Showrooms] Database error:', dbError.message);
        if (isVercel) {
          return res.status(500).json({ detail: 'Database operation failed on Vercel.' });
        }
        // Fall through to JSON file write for local development
      }
    }

    // Fallback to JSON files (local development only)
    if (isVercel) {
      return res.status(500).json({ detail: 'Database write for showrooms should be handled in route handlers. Database operation failed.' });
    }

    const data = await readData('showrooms');
    const showrooms = data.showrooms || [];
    const filteredShowrooms = showrooms.filter(s => s.id !== showroomId.toString());

    if (showrooms.length === filteredShowrooms.length) {
      return res.status(404).json({ detail: 'Showroom not found' });
    }

    await writeData('showrooms', { showrooms: filteredShowrooms });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

export default router;

