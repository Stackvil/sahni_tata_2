import express from 'express';
import multer from 'multer';
import nodemailer from 'nodemailer';
import { readData, writeData } from '../utils/dataManager.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadFileToS3 } from '../middleware/multer-s3.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Configure multer for resume uploads (memory storage for S3)
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
    }
  }
});

// Email transporter configuration
const createTransporter = () => {
  // Use environment variables for email configuration
  // For Gmail, you can use app-specific password
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // Alternative: SMTP configuration (uncomment if not using Gmail)
  /*
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
  */

  return transporter;
};

/**
 * @swagger
 * /api/applications:
 *   post:
 *     summary: Submit a job application
 *     tags: [Applications]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - jobId
 *               - name
 *               - email
 *               - phone
 *               - resume
 *             properties:
 *               jobId:
 *                 type: string
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               coverLetter:
 *                 type: string
 *               resume:
 *                 type: string
 *                 format: binary
 */
router.post('/', upload.single('resume'), async (req, res) => {
  try {
    const { jobId, name, email, phone, coverLetter } = req.body;
    
    if (!jobId || !name || !email || !phone || !req.file) {
      return res.status(400).json({ 
        detail: 'Job ID, name, email, phone, and resume are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ detail: 'Invalid email format' });
    }

    // Get job details
    const careersData = await readData('careers');
    const jobs = careersData.jobs || [];
    const job = jobs.find(j => j.id === jobId);

    if (!job) {
      return res.status(404).json({ detail: 'Job posting not found' });
    }

    if (job.status !== 'active') {
      return res.status(400).json({ detail: 'This job posting is no longer accepting applications' });
    }

    // Save application
    const applicationsData = await readData('applications');
    const applications = applicationsData.applications || [];
    
    const newId = applications.length > 0 
      ? Math.max(...applications.map(a => parseInt(a.id) || 0)) + 1 
      : 1;
    
    // Upload resume to S3
    const resumeUrl = await uploadFileToS3(req.file, 'resumes');
    if (!resumeUrl) {
      return res.status(500).json({ detail: 'Failed to upload resume to S3' });
    }
    
    // Extract the path from CloudFront URL for storage
    const resumePath = resumeUrl.replace(/^https?:\/\/[^\/]+/, '');
    const now = new Date().toISOString();
    
    const newApplication = {
      id: newId.toString(),
      jobId,
      jobTitle: job.title,
      name,
      email,
      phone,
      coverLetter: coverLetter || '',
      resume: resumePath,
      status: 'pending',
      created_at: now
    };

    applications.push(newApplication);
    await writeData('applications', { applications });

    // Send email with resume attachment
    try {
      const transporter = createTransporter();
      
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.warn('Email credentials not configured. Skipping email send.');
        console.warn('Please set EMAIL_USER and EMAIL_PASSWORD in .env file');
      } else {
        const adminEmail = 'hrtatasahnigroup@gmail.com';
        
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: adminEmail,
          subject: `New Job Application: ${job.title} - ${name}`,
          html: `
            <h2>New Job Application Received</h2>
            <p><strong>Job Position:</strong> ${job.title}</p>
            <p><strong>Department:</strong> ${job.department}</p>
            <p><strong>Location:</strong> ${job.location}</p>
            <hr>
            <h3>Applicant Details:</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            ${coverLetter ? `<p><strong>Cover Letter:</strong><br>${coverLetter.replace(/\n/g, '<br>')}</p>` : ''}
            <hr>
            <p>Resume is attached to this email.</p>
            <p><small>Application submitted on: ${new Date(now).toLocaleString()}</small></p>
          `,
          attachments: [
            {
              filename: req.file.originalname,
              content: req.file.buffer
            }
          ]
        };

        await transporter.sendMail(mailOptions);
        console.log(`Application email sent successfully for ${name} - ${job.title}`);
      }
    } catch (emailError) {
      console.error('Error sending application email:', emailError);
      // Don't fail the request if email fails - application is still saved
    }

    res.status(201).json({ 
      success: true, 
      message: 'Application submitted successfully',
      applicationId: newApplication.id
    });
  } catch (error) {
    console.error('Error processing application:', error);
    res.status(500).json({ detail: error.message });
  }
});

/**
 * @swagger
 * /api/applications:
 *   get:
 *     summary: Get all applications - Admin only
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const data = await readData('applications');
    const applications = data.applications || [];
    res.json(applications);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

/**
 * @swagger
 * /api/applications/:id:
 *   get:
 *     summary: Get application by ID - Admin only
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const applicationId = req.params.id;
    const data = await readData('applications');
    const applications = data.applications || [];
    const application = applications.find(a => a.id === applicationId);

    if (!application) {
      return res.status(404).json({ detail: 'Application not found' });
    }

    res.json(application);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

/**
 * @swagger
 * /api/applications/:id/status:
 *   put:
 *     summary: Update application status - Admin only
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const applicationId = req.params.id;
    const { status } = req.body;

    if (!['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'].includes(status)) {
      return res.status(400).json({ detail: 'Invalid status' });
    }

    const data = await readData('applications');
    const applications = data.applications || [];
    const applicationIndex = applications.findIndex(a => a.id === applicationId);

    if (applicationIndex === -1) {
      return res.status(404).json({ detail: 'Application not found' });
    }

    applications[applicationIndex].status = status;
    applications[applicationIndex].updated_at = new Date().toISOString();

    await writeData('applications', { applications });

    res.json(applications[applicationIndex]);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

export default router;

