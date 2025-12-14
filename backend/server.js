import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import { initDatabase } from './config/database.js';
import multer from 'multer';

// Import routes
import productsRoutes from './routes/products.js';
import vehiclesRoutes from './routes/vehicles.js';
import showroomsRoutes from './routes/showrooms.js';
import fuelStationsRoutes from './routes/fuelStations.js';
import homeRoutes from './routes/home.js';
import aboutRoutes from './routes/about.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import masseyRoutes from './routes/massey.js';
import careersRoutes from './routes/careers.js';
import applicationsRoutes from './routes/applications.js';
import migrateRoutes from './routes/migrate.js';
import awardsRoutes from './routes/awards.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all origins in development
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // In production, specify allowed origins
    const allowedOrigins = [
      'https://sahniauto.com',
      'https://www.sahniauto.com',
      'https://sahni-tata.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3030',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3030'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Allow all origins for now (can be restricted later)
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Accept',
    'Origin',
    'X-Requested-With',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 86400 // 24 hours
};

// Middleware
app.use(cors(corsOptions));

// Handle preflight OPTIONS requests explicitly for all routes
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://sahniauto.com',
    'https://www.sahniauto.com',
    'https://sahni-tata.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3030',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3030'
  ];
  
  // In development, allow any origin; in production, check the list
  const allowedOrigin = (process.env.NODE_ENV !== 'production' || allowedOrigins.includes(origin)) 
    ? (origin || allowedOrigins[0]) 
    : allowedOrigins[0];
  
  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept,Origin,X-Requested-With,Access-Control-Request-Method,Access-Control-Request-Headers');
  res.header('Access-Control-Max-Age', '86400');
  res.sendStatus(200);
});

// Increase body size limits for file uploads
// Note: Vercel has a 4.5MB limit for serverless functions, but we handle files via multipart/form-data
// For very large files (>4.5MB), consider using direct S3 presigned URLs from frontend
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));

// Serve static files from public directory
app.use('/images', express.static(path.join(__dirname, '../public/images')));
app.use('/catalouges', express.static(path.join(__dirname, '../public/catalouges')));
app.use('/videos', express.static(path.join(__dirname, '../public/videos')));
app.use('/resumes', express.static(path.join(__dirname, '../public/resumes')));

// Swagger Documentation
// Use CDN for Swagger UI assets to avoid issues with static file serving on Vercel
// This ensures JavaScript files load correctly in serverless environments
// For local development, swaggerUi.serve will handle local assets automatically
// Determine if we should use CDN (always on Vercel, optionally in production)
const useCDNForSwagger = process.env.VERCEL || process.env.NODE_ENV === 'production';

const swaggerOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Sahni Tata API Documentation',
  // Always use CDN on Vercel to avoid static file serving issues
  // For local development, let swagger-ui-express serve assets normally
  ...(useCDNForSwagger ? {
    customJs: [
      'https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-bundle.min.js',
      'https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-standalone-preset.min.js'
    ],
    customCssUrl: 'https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui.min.css'
  } : {}),
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true
    // URL will be set per route below
  }
};

// Helper to get base URL from request
const getBaseUrl = (req) => {
  const protocol = req.protocol || 'http';
  const host = req.get('host') || `localhost:${PORT}`;
  return `${protocol}://${host}`;
};

// Serve Swagger JSON spec first (before UI setup)
// Dynamically set server URL based on request
app.get('/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const baseUrl = getBaseUrl(req);
  const dynamicSpec = {
    ...swaggerSpec,
    servers: [
      { url: baseUrl, description: 'Current server' },
      ...swaggerSpec.servers.filter(s => s.url !== '/')
    ]
  };
  res.send(dynamicSpec);
});
app.get('/api/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const baseUrl = getBaseUrl(req);
  const dynamicSpec = {
    ...swaggerSpec,
    servers: [
      { url: baseUrl, description: 'Current server' },
      ...swaggerSpec.servers.filter(s => s.url !== '/')
    ]
  };
  res.send(dynamicSpec);
});
app.get('/docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const baseUrl = getBaseUrl(req);
  const dynamicSpec = {
    ...swaggerSpec,
    servers: [
      { url: baseUrl, description: 'Current server' },
      ...swaggerSpec.servers.filter(s => s.url !== '/')
    ]
  };
  res.send(dynamicSpec);
});
app.get('/api/docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const baseUrl = getBaseUrl(req);
  const dynamicSpec = {
    ...swaggerSpec,
    servers: [
      { url: baseUrl, description: 'Current server' },
      ...swaggerSpec.servers.filter(s => s.url !== '/')
    ]
  };
  res.send(dynamicSpec);
});

// Serve Swagger UI
// On Vercel/production with CDN, we don't use swaggerUi.serve (it tries to serve local files that don't exist)
// On local development, swaggerUi.serve handles local assets

// Create Swagger UI setup function that ensures CDN is used on Vercel
const createSwaggerSetup = (swaggerJsonUrl) => {
  if (useCDNForSwagger) {
    // On Vercel, use CDN and don't use swaggerUi.serve
    // Add middleware to handle any static asset requests and return proper CDN URLs
    const cdnMiddleware = (req, res, next) => {
      const path = req.path || req.url || '';
      // If it's a request for Swagger UI static assets that don't exist locally, 
      // return a response that tells the browser to use CDN
      if (path.includes('swagger-ui-bundle.js')) {
        return res.redirect(301, 'https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-bundle.min.js');
      }
      if (path.includes('swagger-ui-standalone-preset.js')) {
        return res.redirect(301, 'https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-standalone-preset.min.js');
      }
      if (path.includes('swagger-ui.css') && !path.includes('swagger-ui-init')) {
        return res.redirect(301, 'https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui.min.css');
      }
      // Let swagger-ui-init.js and other files through (they're generated dynamically)
      next();
    };
    
    return [cdnMiddleware, swaggerUi.setup(swaggerSpec, {
      ...swaggerOptions,
      swaggerOptions: {
        ...swaggerOptions.swaggerOptions,
        url: swaggerJsonUrl
      }
    })];
  } else {
    // Local development: use swaggerUi.serve for local assets
    return [swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      ...swaggerOptions,
      swaggerOptions: {
        ...swaggerOptions.swaggerOptions,
        url: swaggerJsonUrl
      }
    })];
  }
};

// Setup Swagger UI for /api-docs
const apiDocsSetup = createSwaggerSetup('/api-docs/swagger.json');
if (Array.isArray(apiDocsSetup)) {
  app.use('/api-docs', ...apiDocsSetup);
} else {
  app.use('/api-docs', apiDocsSetup);
}

// Setup Swagger UI for /api/api-docs
const apiApiDocsSetup = createSwaggerSetup('/api/api-docs/swagger.json');
if (Array.isArray(apiApiDocsSetup)) {
  app.use('/api/api-docs', ...apiApiDocsSetup);
} else {
  app.use('/api/api-docs', apiApiDocsSetup);
}

// Alternative Swagger UI path at /docs
const docsSetup = createSwaggerSetup('/docs/swagger.json');
if (Array.isArray(docsSetup)) {
  app.use('/docs', ...docsSetup);
} else {
  app.use('/docs', docsSetup);
}

// Setup Swagger UI for /api/docs
const apiDocsSetup2 = createSwaggerSetup('/api/docs/swagger.json');
if (Array.isArray(apiDocsSetup2)) {
  app.use('/api/docs', ...apiDocsSetup2);
} else {
  app.use('/api/docs', apiDocsSetup2);
}

// API Routes
// Support both with and without /prod stage prefix for API Gateway
const apiPrefix = process.env.API_STAGE ? `/${process.env.API_STAGE}` : '';

app.use('/api/products', productsRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/showrooms', showroomsRoutes);
app.use('/api/fuelStations', fuelStationsRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/about', aboutRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/massey', masseyRoutes);
app.use('/api/careers', careersRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/migrate', migrateRoutes);
app.use('/api/awards', awardsRoutes);

// Also support routes with /prod prefix (for API Gateway stage)
if (apiPrefix) {
  app.use(`${apiPrefix}/api/products`, productsRoutes);
  app.use(`${apiPrefix}/api/vehicles`, vehiclesRoutes);
  app.use(`${apiPrefix}/api/showrooms`, showroomsRoutes);
  app.use(`${apiPrefix}/api/fuelStations`, fuelStationsRoutes);
  app.use(`${apiPrefix}/api/home`, homeRoutes);
  app.use(`${apiPrefix}/api/about`, aboutRoutes);
  app.use(`${apiPrefix}/api/auth`, authRoutes);
  app.use(`${apiPrefix}/api/admin`, adminRoutes);
  app.use(`${apiPrefix}/api/massey`, masseyRoutes);
  app.use(`${apiPrefix}/api/careers`, careersRoutes);
  app.use(`${apiPrefix}/api/applications`, applicationsRoutes);
  app.use(`${apiPrefix}/api/migrate`, migrateRoutes);
  app.use(`${apiPrefix}/api/awards`, awardsRoutes);
  
  // Swagger JSON spec with stage prefix
  app.get(`${apiPrefix}/api-docs/swagger.json`, (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  app.get(`${apiPrefix}/docs/swagger.json`, (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  
  // Swagger UI with stage prefix
  const apiPrefixApiDocsSetup = createSwaggerSetup(`${apiPrefix}/api-docs/swagger.json`);
  if (Array.isArray(apiPrefixApiDocsSetup)) {
    app.use(`${apiPrefix}/api-docs`, ...apiPrefixApiDocsSetup);
  } else {
    app.use(`${apiPrefix}/api-docs`, apiPrefixApiDocsSetup);
  }
  
  const apiPrefixDocsSetup = createSwaggerSetup(`${apiPrefix}/docs/swagger.json`);
  if (Array.isArray(apiPrefixDocsSetup)) {
    app.use(`${apiPrefix}/docs`, ...apiPrefixDocsSetup);
  } else {
    app.use(`${apiPrefix}/docs`, apiPrefixDocsSetup);
  }
  
  // Health check with stage prefix
  app.get(`${apiPrefix}/api/health`, (req, res) => {
    res.json({ status: 'ok', message: 'Backend is running' });
  });
}

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Backend is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 */
// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// S3 configuration check endpoint
app.get('/api/health/s3', async (req, res) => {
  try {
    const { getS3Config, isS3Configured } = await import('./config/s3.js');
    const config = getS3Config();
    
    res.json({
      status: isS3Configured() ? 'configured' : 'not_configured',
      message: isS3Configured() 
        ? 'S3 is configured and ready for uploads' 
        : 'S3 is not configured. Please set AWS credentials.',
      config: {
        bucket: config.bucket,
        region: config.region,
        cloudFrontDomain: config.cloudFrontDomain,
        hasCredentials: config.hasCredentials,
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/init-db:
 *   post:
 *     summary: Initialize database tables
 *     tags: [Database]
 *     description: Creates all required database tables if they don't exist. Safe to call multiple times.
 *     responses:
 *       200:
 *         description: Database initialized successfully
 *       500:
 *         description: Database initialization failed
 */
// Initialize database endpoint (useful for Vercel/serverless)
app.post('/api/init-db', async (req, res) => {
  try {
    const { initDatabase } = await import('./config/database.js');
    const result = await initDatabase();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Database initialized successfully',
        details: result.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Database initialization failed',
        error: result.message
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database initialization error',
      error: error.message
    });
  }
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableRoutes: [
      'GET /api/health',
      'GET /api/products',
      'GET /api/vehicles',
      'GET /api/massey/products',
      'GET /api/massey/categories',
      'GET /api/showrooms',
      'GET /api/fuelStations',
      'GET /api/home/video',
      'GET /api/about',
      'GET /api/careers',
      'GET /api/careers/all (Admin)',
      'POST /api/applications',
      'GET /api-docs (Swagger documentation)',
      'GET /docs (Swagger documentation - alternative)'
    ]
  });
});

// Catch-all 404 handler for other routes
// Exclude Swagger UI paths from catch-all
app.use((req, res, next) => {
  // Skip catch-all for Swagger UI paths
  if (req.path.startsWith('/api-docs') || 
      req.path.startsWith('/docs') || 
      req.path.startsWith('/api/docs') || 
      req.path.startsWith('/api/api-docs')) {
    return next();
  }
  
  // If it's a request for /docs without trailing slash, redirect
  if (req.path === '/docs' && req.method === 'GET') {
    res.redirect(301, '/api-docs/');
    return;
  }
  
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl || req.url}`,
    availableRoutes: [
      'GET /api/health',
      'GET /api/products',
      'GET /api/vehicles',
      'GET /api/massey/products',
      'GET /api/massey/categories',
      'GET /api/showrooms',
      'GET /api/fuelStations',
      'GET /api/home/video',
      'GET /api/about',
      'GET /api-docs (Swagger documentation)',
      'GET /docs (Swagger documentation - redirects to /api-docs)'
    ]
  });
});

// Error handling middleware (must be before 404 handler)
app.use((err, req, res, next) => {
  // Handle Multer errors (file upload errors)
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: {
          code: '413',
          message: 'Request Entity Too Large',
          detail: `File size exceeds limit. Maximum file size is 200MB for videos, 50MB for images. Please compress your files or use smaller files.`
        }
      });
    }
    if (err.code === 'LIMIT_FIELD_COUNT') {
      return res.status(413).json({
        error: {
          code: '413',
          message: 'Request Entity Too Large',
          detail: 'Too many form fields. Please reduce the number of fields.'
        }
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: {
          code: '400',
          message: 'Unexpected file field',
          detail: err.message
        }
      });
    }
    return res.status(400).json({
      error: {
        code: '400',
        message: 'File upload error',
        detail: err.message
      }
    });
  }
  
  // Handle Express body parser errors (413)
  if (err.status === 413 || err.statusCode === 413) {
    return res.status(413).json({
      error: {
        code: '413',
        message: 'Request Entity Too Large',
        detail: 'Request body is too large. Maximum size is 100MB. Please reduce file sizes or upload fewer files at once. Note: Vercel has a 4.5MB limit for serverless functions - consider using direct S3 upload for very large files.'
      }
    });
  }
  
  // Handle other errors
  console.error('[Server] Error:', err);
  res.status(err.status || 500).json({
    error: {
      code: String(err.status || 500),
      message: err.message || 'Internal server error',
      detail: err.detail || null
    }
  });
});

// Initialize database on startup (only if not in Lambda/Vercel)
if (process.env.AWS_LAMBDA_FUNCTION_NAME === undefined && process.env.VERCEL === undefined) {
  initDatabase()
    .then((result) => {
      if (!result.success) {
        // Database initialization failed, but server continues
        // This is expected if PostgreSQL is not running
      }
    })
    .catch((error) => {
      // This should not happen with the new implementation, but keep as safety
      console.error('Unexpected error during database initialization:', error.message);
    });
}

// For Lambda/Vercel, we export the app, for local we start the server
if (process.env.AWS_LAMBDA_FUNCTION_NAME === undefined && process.env.VERCEL === undefined) {
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
}

export default app;

