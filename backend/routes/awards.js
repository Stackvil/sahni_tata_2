import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { upload, uploadFileToS3 } from '../middleware/multer-s3.js';
import { awardsDB } from '../utils/dbManager.js';
import { getPool, isDatabaseConnected } from '../config/database.js';
import { toCloudFrontUrl } from '../utils/imageHelper.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Award:
 *       type: object
 *       required:
 *         - brand
 *         - award_text
 *       properties:
 *         id:
 *           type: string
 *         brand:
 *           type: string
 *         logo:
 *           type: string
 *         award:
 *           type: string
 *         year:
 *           type: string
 *         display_order:
 *           type: integer
 */

/**
 * @swagger
 * /api/awards:
 *   get:
 *     summary: Get all awards
 *     tags: [Awards]
 *     parameters:
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Filter by brand
 *     responses:
 *       200:
 *         description: List of awards
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Award'
 */
router.get('/', async (req, res) => {
  try {
    const { brand, flat } = req.query; // Add 'flat' parameter for admin to get individual awards
    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_URL;
    const pool = getPool();
    const shouldUseDatabase = isVercel || (pool !== null && isDatabaseConnected());

    if (shouldUseDatabase) {
      try {
        let awards;
        if (brand) {
          awards = await awardsDB.getByBrand(brand);
        } else {
          awards = await awardsDB.getAll();
        }

        // If flat=true, return individual awards (for frontend and admin)
        if (flat === 'true') {
          const awardsWithCloudFront = awards.map(award => ({
            ...award,
            logo: award.logo ? toCloudFrontUrl(award.logo) : award.logo,
            award_text: award.award || award.award_text, // Ensure award_text is present
            image: award.logo ? toCloudFrontUrl(award.logo) : award.logo, // Add image alias
            title: award.award || award.award_text, // Add title alias
            description: award.description || `Recognized for ${award.award || award.award_text || 'excellence'}`
          }));
          return res.json(awardsWithCloudFront);
        }

        // Otherwise, group by brand for frontend compatibility
        const groupedAwards = {};
        awards.forEach(award => {
          if (!groupedAwards[award.brand]) {
            groupedAwards[award.brand] = {
              brand: award.brand,
              logo: award.logo ? toCloudFrontUrl(award.logo) : award.logo,
              awards: []
            };
          }
          groupedAwards[award.brand].awards.push(award.award);
        });

        // Convert to array format
        const brandAwards = Object.values(groupedAwards);

        return res.json(brandAwards);
      } catch (dbError) {
        console.warn('[Awards] Database error:', dbError.message);
        // Fall through to JSON fallback
      }
    }

    // Fallback: Read from JSON files
    try {
      const { readData } = await import('../utils/dataManager.js');
      const data = await readData('awards');
      const awards = data.awards || [];
      
      if (flat === 'true') {
        // Return individual awards with CloudFront URLs
        const awardsWithCloudFront = awards.map((award) => ({
          id: award.id,
          brand: award.brand,
          logo: award.logo_url ? toCloudFrontUrl(award.logo_url) : award.logo_url,
          logo_url: award.logo_url,
          award: award.award_text,
          award_text: award.award_text,
          year: award.year,
          display_order: award.display_order || 0,
          image: award.logo_url ? toCloudFrontUrl(award.logo_url) : award.logo_url,
          title: award.award_text,
          description: `Recognized for ${award.award_text || 'excellence'}`
        }));
        return res.json(awardsWithCloudFront);
      }
      
      // Group by brand for non-flat response
      const groupedAwards = {};
      awards.forEach((award) => {
        if (!groupedAwards[award.brand]) {
          groupedAwards[award.brand] = {
            brand: award.brand,
            logo: award.logo_url ? toCloudFrontUrl(award.logo_url) : award.logo_url,
            awards: []
          };
        }
        groupedAwards[award.brand].awards.push(award.award_text);
      });
      
      return res.json(Object.values(groupedAwards));
    } catch (jsonError) {
      console.error('[Awards] JSON fallback error:', jsonError);
      return res.json([]);
    }
  } catch (error) {
    console.error('[Awards] Unexpected error:', error.message);
    res.json([]);
  }
});

/**
 * @swagger
 * /api/awards/{id}:
 *   get:
 *     summary: Get award by ID
 *     tags: [Awards]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Award details
 *       404:
 *         description: Award not found
 */
router.get('/:id', async (req, res) => {
  try {
    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_URL;
    const pool = getPool();
    const shouldUseDatabase = isVercel || (pool !== null && isDatabaseConnected());

    if (shouldUseDatabase) {
      try {
        const award = await awardsDB.getById(parseInt(req.params.id));
        if (award) {
          return res.json({
            ...award,
            logo: award.logo ? toCloudFrontUrl(award.logo) : award.logo
          });
        }
        return res.status(404).json({ detail: 'Award not found' });
      } catch (dbError) {
        console.warn('[Awards] Database error:', dbError.message);
        return res.status(404).json({ detail: 'Award not found' });
      }
    }

    res.status(404).json({ detail: 'Award not found' });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

/**
 * @swagger
 * /api/awards:
 *   post:
 *     summary: Create a new award
 *     tags: [Awards]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - brand
 *               - award_text
 *             properties:
 *               brand:
 *                 type: string
 *               award_text:
 *                 type: string
 *               year:
 *                 type: string
 *               logo:
 *                 type: string
 *                 format: binary
 *               display_order:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Award created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', authenticateToken, upload.single('logo'), async (req, res) => {
  try {
    const { brand, award_text, award, year, display_order } = req.body;

    if (!brand || (!award_text && !award)) {
      return res.status(400).json({ detail: 'Brand and award text are required' });
    }

    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_URL;
    const pool = getPool();
    const shouldUseDatabase = isVercel || (pool !== null && isDatabaseConnected());

    let logoUrl = '';
    if (req.file) {
      try {
        logoUrl = await uploadFileToS3(req.file, 'images/awards');
        if (!logoUrl) {
          return res.status(500).json({ detail: 'Failed to upload logo to S3' });
        }
        // Extract path from CloudFront URL
        logoUrl = logoUrl.replace(/^https?:\/\/[^\/]+/, '');
      } catch (s3Error) {
        console.error('[Awards] S3 upload error:', s3Error.message);
        return res.status(500).json({ detail: `S3 upload failed: ${s3Error.message}` });
      }
    }

    if (shouldUseDatabase) {
      try {
        const newAward = await awardsDB.create({
          brand,
          logo_url: logoUrl || null,
          award_text: award_text || award,
          year: year || null,
          display_order: parseInt(display_order) || 0
        });

        return res.status(201).json({
          ...newAward,
          logo: newAward.logo ? toCloudFrontUrl(newAward.logo) : newAward.logo
        });
      } catch (dbError) {
        console.error('[Awards] Database error:', dbError.message);
        if (isVercel) {
          return res.status(500).json({ detail: 'Database operation failed' });
        }
      }
    }

    if (isVercel) {
      return res.status(500).json({ detail: 'Database operation failed' });
    }

    res.status(500).json({ detail: 'Database not available' });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

/**
 * @swagger
 * /api/awards/{id}:
 *   put:
 *     summary: Update an award
 *     tags: [Awards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               brand:
 *                 type: string
 *               award_text:
 *                 type: string
 *               year:
 *                 type: string
 *               logo:
 *                 type: string
 *                 format: binary
 *               display_order:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Award updated successfully
 *       404:
 *         description: Award not found
 */
router.put('/:id', authenticateToken, upload.single('logo'), async (req, res) => {
  try {
    const { brand, award_text, award, year, display_order } = req.body;
    const awardId = parseInt(req.params.id);

    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_URL;
    const pool = getPool();
    const shouldUseDatabase = isVercel || (pool !== null && isDatabaseConnected());

    let logoUrl = undefined;
    if (req.file) {
      try {
        logoUrl = await uploadFileToS3(req.file, 'images/awards');
        if (!logoUrl) {
          return res.status(500).json({ detail: 'Failed to upload logo to S3' });
        }
        // Extract path from CloudFront URL
        logoUrl = logoUrl.replace(/^https?:\/\/[^\/]+/, '');
      } catch (s3Error) {
        console.error('[Awards] S3 upload error:', s3Error.message);
        return res.status(500).json({ detail: `S3 upload failed: ${s3Error.message}` });
      }
    }

    if (shouldUseDatabase) {
      try {
        const existingAward = await awardsDB.getById(awardId);
        if (!existingAward) {
          return res.status(404).json({ detail: 'Award not found' });
        }

        const updatedAward = await awardsDB.update(awardId, {
          brand: brand || existingAward.brand,
          logo_url: logoUrl !== undefined ? logoUrl : existingAward.logo,
          award_text: award_text || award || existingAward.award,
          year: year !== undefined ? year : existingAward.year,
          display_order: display_order !== undefined ? parseInt(display_order) : existingAward.display_order
        });

        if (!updatedAward) {
          return res.status(404).json({ detail: 'Award not found' });
        }

        return res.json({
          ...updatedAward,
          logo: updatedAward.logo ? toCloudFrontUrl(updatedAward.logo) : updatedAward.logo
        });
      } catch (dbError) {
        console.error('[Awards] Database error:', dbError.message);
        if (isVercel) {
          return res.status(500).json({ detail: 'Database operation failed' });
        }
      }
    }

    if (isVercel) {
      return res.status(500).json({ detail: 'Database operation failed' });
    }

    res.status(500).json({ detail: 'Database not available' });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

/**
 * @swagger
 * /api/awards/{id}:
 *   delete:
 *     summary: Delete an award
 *     tags: [Awards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Award deleted successfully
 *       404:
 *         description: Award not found
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const awardId = parseInt(req.params.id);

    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_URL;
    const pool = getPool();
    const shouldUseDatabase = isVercel || (pool !== null && isDatabaseConnected());

    if (shouldUseDatabase) {
      try {
        const existingAward = await awardsDB.getById(awardId);
        if (!existingAward) {
          return res.status(404).json({ detail: 'Award not found' });
        }

        await awardsDB.delete(awardId);
        return res.json({ success: true });
      } catch (dbError) {
        console.error('[Awards] Database error:', dbError.message);
        if (isVercel) {
          return res.status(500).json({ detail: 'Database operation failed' });
        }
      }
    }

    if (isVercel) {
      return res.status(500).json({ detail: 'Database operation failed' });
    }

    res.status(500).json({ detail: 'Database not available' });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

export default router;

