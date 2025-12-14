import express from 'express';
import { readData, writeData } from '../utils/dataManager.js';
import { authenticateToken } from '../middleware/auth.js';
import { careersDB } from '../utils/dbManager.js';
import { getPool, isDatabaseConnected } from '../config/database.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     JobPosting:
 *       type: object
 *       required:
 *         - title
 *         - department
 *         - location
 *         - description
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         department:
 *           type: string
 *         location:
 *           type: string
 *         description:
 *           type: string
 *         requirements:
 *           type: array
 *           items:
 *             type: string
 *         status:
 *           type: string
 *           enum: [active, closed]
 *         created_at:
 *           type: string
 *         updated_at:
 *           type: string
 */

/**
 * @swagger
 * /api/careers:
 *   get:
 *     summary: Get all job postings
 *     tags: [Careers]
 *     responses:
 *       200:
 *         description: List of job postings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/JobPosting'
 */
router.get('/', async (req, res) => {
  try {
    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_URL;
    const pool = getPool();
    const shouldUseDatabase = isVercel && pool !== null && isDatabaseConnected();

    if (shouldUseDatabase) {
      try {
        const allJobs = await careersDB.getAll();
        // Filter to show only active jobs for public
        const activeJobs = allJobs.filter(job => job.status === 'active');
        return res.json(activeJobs);
      } catch (dbError) {
        console.warn('[Careers] Database error, falling back to JSON:', dbError.message);
        // Fall through to JSON file reading
      }
    }

    // Fallback to JSON files
    try {
      const data = await readData('careers');
      const jobs = Array.isArray(data.jobs) ? data.jobs : [];
      const activeJobs = jobs.filter(job => job.status === 'active');
      return res.json(activeJobs);
    } catch (jsonError) {
      console.error('[Careers] Error reading from JSON:', jsonError.message);
      return res.json([]); // Return empty array instead of error
    }
  } catch (error) {
    console.error('[Careers] Unexpected error:', error.message);
    return res.json([]); // Return empty array instead of error
  }
});

/**
 * @swagger
 * /api/careers/all:
 *   get:
 *     summary: Get all job postings (including inactive) - Admin only
 *     tags: [Careers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all job postings
 */
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_URL;
    const pool = getPool();
    const shouldUseDatabase = isVercel || (pool !== null && isDatabaseConnected());

    if (shouldUseDatabase) {
      try {
        const allJobs = await careersDB.getAll();
        return res.json(allJobs);
      } catch (dbError) {
        console.warn('[Careers] Database error, falling back to JSON:', dbError.message);
        // Fall through to JSON file reading
      }
    }

    // Fallback to JSON files
    const data = await readData('careers');
    const jobs = Array.isArray(data.jobs) ? data.jobs : [];
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching all careers:', error);
    res.status(500).json({ detail: error.message });
  }
});

/**
 * @swagger
 * /api/careers:
 *   post:
 *     summary: Create a new job posting - Admin only
 *     tags: [Careers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JobPosting'
 *     responses:
 *       201:
 *         description: Job posting created
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, department, location, description, requirements, status } = req.body;
    
    if (!title || !department || !location || !description) {
      return res.status(400).json({ detail: 'Title, department, location, and description are required' });
    }

    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_URL;
    const pool = getPool();
    const shouldUseDatabase = isVercel || (pool !== null && isDatabaseConnected());

    if (shouldUseDatabase) {
      try {
        const newJob = await careersDB.create({
          title,
          department,
          location,
          description,
          requirements: requirements || [],
          status: status || 'active',
        });
        return res.status(201).json(newJob);
      } catch (dbError) {
        console.error('[Careers] Database error:', dbError.message);
        if (isVercel) {
          return res.status(500).json({ detail: 'Database operation failed on Vercel. Please check database connection.' });
        }
        // Fall through to JSON file write for local development
      }
    }

    // Fallback to JSON files (local development only)
    if (isVercel) {
      return res.status(500).json({ detail: 'Database write for careers should be handled in route handlers. Database operation failed.' });
    }

    const data = await readData('careers');
    const jobs = Array.isArray(data.jobs) ? data.jobs : [];
    const newId = jobs.length > 0 ? Math.max(...jobs.map(j => parseInt(j.id) || 0)) + 1 : 1;
    const now = new Date().toISOString();
    
    const newJob = {
      id: newId.toString(),
      title,
      department,
      location,
      description,
      requirements: requirements || [],
      status: status || 'active',
      created_at: now,
      updated_at: now
    };

    jobs.push(newJob);
    await writeData('careers', { jobs });

    res.status(201).json(newJob);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

/**
 * @swagger
 * /api/careers/:id:
 *   put:
 *     summary: Update a job posting - Admin only
 *     tags: [Careers]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);
    const { title, department, location, description, requirements, status } = req.body;

    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_URL;
    const pool = getPool();
    const shouldUseDatabase = isVercel || (pool !== null && isDatabaseConnected());

    if (shouldUseDatabase) {
      try {
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (department !== undefined) updateData.department = department;
        if (location !== undefined) updateData.location = location;
        if (description !== undefined) updateData.description = description;
        if (requirements !== undefined) updateData.requirements = requirements;
        if (status !== undefined) updateData.status = status;

        const updatedJob = await careersDB.update(jobId, updateData);
        if (!updatedJob) {
          return res.status(404).json({ detail: 'Job posting not found' });
        }
        return res.json(updatedJob);
      } catch (dbError) {
        console.error('[Careers] Database error:', dbError.message);
        if (isVercel) {
          return res.status(500).json({ detail: 'Database operation failed on Vercel.' });
        }
        // Fall through to JSON file write for local development
      }
    }

    // Fallback to JSON files (local development only)
    if (isVercel) {
      return res.status(500).json({ detail: 'Database write for careers should be handled in route handlers. Database operation failed.' });
    }

    const data = await readData('careers');
    const jobs = Array.isArray(data.jobs) ? data.jobs : [];
    const jobIndex = jobs.findIndex(j => j.id === jobId.toString());

    if (jobIndex === -1) {
      return res.status(404).json({ detail: 'Job posting not found' });
    }

    if (title !== undefined) jobs[jobIndex].title = title;
    if (department !== undefined) jobs[jobIndex].department = department;
    if (location !== undefined) jobs[jobIndex].location = location;
    if (description !== undefined) jobs[jobIndex].description = description;
    if (requirements !== undefined) jobs[jobIndex].requirements = requirements;
    if (status !== undefined) jobs[jobIndex].status = status;
    jobs[jobIndex].updated_at = new Date().toISOString();

    await writeData('careers', { jobs });

    res.json(jobs[jobIndex]);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

/**
 * @swagger
 * /api/careers/:id:
 *   delete:
 *     summary: Delete a job posting - Admin only
 *     tags: [Careers]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);

    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_URL;
    const pool = getPool();
    const shouldUseDatabase = isVercel || (pool !== null && isDatabaseConnected());

    if (shouldUseDatabase) {
      try {
        await careersDB.delete(jobId);
        return res.json({ success: true });
      } catch (dbError) {
        console.error('[Careers] Database error:', dbError.message);
        if (isVercel) {
          return res.status(500).json({ detail: 'Database operation failed on Vercel.' });
        }
        // Fall through to JSON file write for local development
      }
    }

    // Fallback to JSON files (local development only)
    if (isVercel) {
      return res.status(500).json({ detail: 'Database write for careers should be handled in route handlers. Database operation failed.' });
    }

    const data = await readData('careers');
    const jobs = Array.isArray(data.jobs) ? data.jobs : [];
    const filteredJobs = jobs.filter(j => j.id !== jobId.toString());

    if (jobs.length === filteredJobs.length) {
      return res.status(404).json({ detail: 'Job posting not found' });
    }

    await writeData('careers', { jobs: filteredJobs });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

export default router;

