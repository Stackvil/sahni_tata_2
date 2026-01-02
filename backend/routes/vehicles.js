import express from 'express';
import { readData, writeData } from '../utils/dataManager.js';
import { authenticateToken } from '../middleware/auth.js';
import { toCloudFrontUrl, toCloudFrontUrls } from '../utils/imageHelper.js';
import multer from 'multer';
import { uploadFileToS3 } from '../middleware/multer-s3.js';
import { getPool, isDatabaseConnected } from '../config/database.js';
import { vehiclesDB } from '../utils/dbManager.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Vehicle:
 *       type: object
 *       required:
 *         - name
 *         - category
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         category:
 *           type: string
 *         description:
 *           type: string
 *         size:
 *           type: string
 *         popular:
 *           type: boolean
 *         specs:
 *           type: object
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         features:
 *           type: array
 *           items:
 *             type: string
 */

// Configure multer for multiple file uploads (memory storage for S3)
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 200 * 1024 * 1024, // 200MB per file (images and PDFs) - increased for large files
    fieldSize: 200 * 1024 * 1024, // 200MB for form fields
    files: 20, // Allow up to 20 files
    fields: 50, // Allow up to 50 form fields
  }
});

/**
 * @swagger
 * /api/vehicles:
 *   get:
 *     summary: Get all vehicles with pagination
 *     tags: [Vehicles]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: List of vehicles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalPages:
 *                   type: integer
 *                 vehicles:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Vehicle'
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;

    const pool = getPool();
    const useDatabase = pool !== null && isDatabaseConnected();

    if (useDatabase) {
      try {
        const result = await vehiclesDB.getAll(page, limit);
        const vehicles = result.vehicles || [];

        // If database is empty, fall back to JSON files
        if (vehicles.length === 0 && result.total === 0) {
          console.warn('[Vehicles] Database is empty, falling back to JSON files');
          // Continue to JSON file reading below
        } else {
          // Convert image paths to CloudFront URLs
          const vehiclesWithCloudFront = vehicles.map(vehicle => ({
            ...vehicle,
            images: vehicle.images ? toCloudFrontUrls(vehicle.images) : vehicle.images,
            catalog: vehicle.catalog_url ? toCloudFrontUrl(vehicle.catalog_url) : vehicle.catalog_url
          }));

          return res.json({
            totalPages: result.total_pages,
            vehicles: vehiclesWithCloudFront
          });
        }
      } catch (dbError) {
        console.warn('[Vehicles] Database error, falling back to JSON:', dbError.message);
        // Continue to JSON file reading below
      }
    }

    // Read from JSON files (fallback or primary for local)
    try {
      const data = await readData('vehicles');
      const vehicles = data.vehicles || [];

      const total = vehicles.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedVehicles = vehicles.slice(startIndex, endIndex);

      // Convert image paths to CloudFront URLs
      const vehiclesWithCloudFront = paginatedVehicles.map(vehicle => ({
        ...vehicle,
        images: vehicle.images ? toCloudFrontUrls(vehicle.images) : vehicle.images,
        catalog: vehicle.catalog ? toCloudFrontUrl(vehicle.catalog) : vehicle.catalog
      }));

      return res.json({
        totalPages,
        vehicles: vehiclesWithCloudFront
      });
    } catch (jsonError) {
      console.error('[Vehicles] Error reading from JSON:', jsonError.message);
      return res.json({ totalPages: 0, vehicles: [] }); // Return empty instead of error
    }
  } catch (error) {
    console.error('[Vehicles] Unexpected error:', error.message);
    return res.json({ totalPages: 0, vehicles: [] }); // Return empty instead of error
  }
});

// GET /api/vehicles/:id - Get vehicle by ID
router.get('/:id', async (req, res) => {
  try {
    const vehicleId = parseInt(req.params.id);

    const pool = getPool();
    const useDatabase = pool !== null && isDatabaseConnected();

    if (useDatabase) {
      try {
        const vehicle = await vehiclesDB.getById(vehicleId);
        if (vehicle) {
          // Transform database result to match frontend format
          const vehicleResponse = {
            id: vehicle.id,
            name: vehicle.name,
            category: vehicle.category,
            subcategory: vehicle.subcategory,
            description: vehicle.description,
            size: vehicle.size,
            popular: vehicle.popular,
            specs: typeof vehicle.specs === 'string' ? JSON.parse(vehicle.specs) : vehicle.specs,
            images: Array.isArray(vehicle.images) ? vehicle.images : [],
            features: Array.isArray(vehicle.features) ? vehicle.features : [],
            catalog: vehicle.catalog_url || ''
          };

          // Convert image paths to CloudFront URLs
          const vehicleWithCloudFront = {
            ...vehicleResponse,
            images: vehicleResponse.images ? toCloudFrontUrls(vehicleResponse.images) : vehicleResponse.images,
            catalog: vehicleResponse.catalog ? toCloudFrontUrl(vehicleResponse.catalog) : vehicleResponse.catalog
          };

          return res.json(vehicleWithCloudFront);
        }
        // If not found in database, continue to JSON file reading below
      } catch (dbError) {
        console.warn('[Vehicles] Database error, falling back to JSON:', dbError.message);
        // Continue to JSON file reading below
      }
    }

    // Read from JSON files (fallback or primary for local)
    try {
      const data = await readData('vehicles');
      const vehicle = data.vehicles?.find(v => v.id === vehicleId);
      
      if (!vehicle) {
        return res.status(404).json({ detail: 'Vehicle not found' });
      }
      
      // Convert image paths to CloudFront URLs
      const vehicleWithCloudFront = {
        ...vehicle,
        images: vehicle.images ? toCloudFrontUrls(vehicle.images) : vehicle.images,
        catalog: vehicle.catalog ? toCloudFrontUrl(vehicle.catalog) : vehicle.catalog
      };
      
      return res.json(vehicleWithCloudFront);
    } catch (jsonError) {
      console.error('[Vehicles] Error reading from JSON:', jsonError.message);
      return res.status(404).json({ detail: 'Vehicle not found' });
    }
  } catch (error) {
    console.error('[Vehicles] Unexpected error:', error.message);
    res.status(500).json({ detail: error.message });
  }
});

// POST /api/vehicles - Create new vehicle (Protected)
router.post('/', authenticateToken, upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'catalog', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, category, subcategory, description, size, popular, specs, features } = req.body;
    
    if (!name || !category) {
      return res.status(400).json({ detail: 'Name and category are required' });
    }

    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_URL;
    const pool = getPool();
    const shouldUseDatabase = isVercel || (pool !== null && isDatabaseConnected());
    
    // Handle images - upload to S3
    const images = [];
    if (req.files && req.files.images) {
      for (const file of req.files.images) {
        try {
          const folder = (category === 'massey' || category.includes('massey')) 
            ? 'images/sahni_vehicles/messy_ferguson' 
            : 'images/sahni_vehicles/tata';
          const imageUrl = await uploadFileToS3(file, folder);
          if (imageUrl) {
            const imagePath = imageUrl.replace(/^https?:\/\/[^\/]+/, '');
            images.push(imagePath);
          }
        } catch (s3Error) {
          console.error('[Vehicles] S3 upload error for image:', s3Error.message);
          return res.status(500).json({ 
            detail: `Failed to upload image to S3: ${s3Error.message}. Please configure AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY) in environment variables.` 
          });
        }
      }
    }

    // Handle catalog PDF - upload to S3
    let catalogPath = '';
    if (req.files && req.files.catalog && req.files.catalog[0]) {
      try {
        const file = req.files.catalog[0];
        const folder = (category === 'massey' || category.includes('massey')) 
          ? 'catalouges/tractor' 
          : 'catalouges/tata_catalouges';
        const catalogUrl = await uploadFileToS3(file, folder);
        if (catalogUrl) {
          catalogPath = catalogUrl.replace(/^https?:\/\/[^\/]+/, '');
        }
      } catch (s3Error) {
        console.error('[Vehicles] S3 upload error for catalog:', s3Error.message);
        return res.status(500).json({ 
          detail: `Failed to upload catalog to S3: ${s3Error.message}. Please configure AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY) in environment variables.` 
        });
      }
    }

    if (shouldUseDatabase) {
      try {
        const newVehicle = await vehiclesDB.create({
          name,
          category,
          subcategory: subcategory || '',
          description: description || '',
          size: size || '',
          popular: popular === 'true' || popular === true,
          specs: specs ? (typeof specs === 'string' ? JSON.parse(specs) : specs) : {},
          images,
          features: features ? (Array.isArray(features) ? features : features.split(',').map(f => f.trim())) : [],
          catalog_url: catalogPath
        });
        
        // Transform database result to match frontend format
        const vehicleResponse = {
          id: newVehicle.id,
          name: newVehicle.name,
          category: newVehicle.category,
          subcategory: newVehicle.subcategory,
          description: newVehicle.description,
          size: newVehicle.size,
          popular: newVehicle.popular,
          specs: typeof newVehicle.specs === 'string' ? JSON.parse(newVehicle.specs) : newVehicle.specs,
          images: Array.isArray(newVehicle.images) ? newVehicle.images : [],
          features: Array.isArray(newVehicle.features) ? newVehicle.features : [],
          catalog: newVehicle.catalog_url || ''
        };
        
        return res.status(201).json(vehicleResponse);
      } catch (dbError) {
        console.error('[Vehicles] Database error:', dbError.message);
        if (isVercel) {
          return res.status(500).json({ detail: 'Database operation failed on Vercel. Please check database connection.' });
        }
        // Fall through to JSON file write for local development
      }
    }

    // Fallback to JSON files (local development only)
    if (isVercel) {
      return res.status(500).json({ detail: 'Database write for vehicles should be handled in route handlers. Database operation failed.' });
    }

    const data = await readData('vehicles');
    const vehicles = data.vehicles || [];
    const newId = vehicles.length > 0 ? Math.max(...vehicles.map(v => v.id)) + 1 : 1;

    const newVehicle = {
      id: newId,
      name,
      category,
      subcategory: subcategory || '',
      description: description || '',
      size: size || '',
      popular: popular === 'true' || popular === true,
      specs: specs ? (typeof specs === 'string' ? JSON.parse(specs) : specs) : {},
      images,
      features: features ? (Array.isArray(features) ? features : features.split(',').map(f => f.trim())) : [],
      catalog: catalogPath
    };

    vehicles.push(newVehicle);
    await writeData('vehicles', { vehicles });

    res.status(201).json(newVehicle);
  } catch (error) {
    console.error('[Vehicles] Unexpected error:', error.message);
    res.status(500).json({ detail: error.message });
  }
});

// PUT /api/vehicles/:id - Update vehicle (Protected)
router.put('/:id', authenticateToken, upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'catalog', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, category, subcategory, description, size, popular, specs, features } = req.body;
    const vehicleId = parseInt(req.params.id);

    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_URL;
    const pool = getPool();
    const shouldUseDatabase = isVercel || (pool !== null && isDatabaseConnected());

    // Get existing vehicle to merge images
    let existingVehicle = null;
    if (shouldUseDatabase) {
      try {
        existingVehicle = await vehiclesDB.getById(vehicleId);
        if (!existingVehicle) {
          return res.status(404).json({ detail: 'Vehicle not found' });
        }
      } catch (dbError) {
        console.error('[Vehicles] Database error getting vehicle:', dbError.message);
        if (isVercel) {
          return res.status(500).json({ detail: 'Database operation failed on Vercel.' });
        }
      }
    }

    // Handle new images - upload to S3
    let newImages = [];
    if (req.files && req.files.images && req.files.images.length > 0) {
      for (const file of req.files.images) {
        try {
          const folder = (category === 'massey' || category.includes('massey')) 
            ? 'images/sahni_vehicles/messy_ferguson' 
            : 'images/sahni_vehicles/tata';
          const imageUrl = await uploadFileToS3(file, folder);
          if (imageUrl) {
            const imagePath = imageUrl.replace(/^https?:\/\/[^\/]+/, '');
            newImages.push(imagePath);
          }
        } catch (s3Error) {
          console.error('[Vehicles] S3 upload error for image:', s3Error.message);
          return res.status(500).json({ 
            detail: `Failed to upload image to S3: ${s3Error.message}. Please configure AWS credentials.` 
          });
        }
      }
    }

    // Handle catalog PDF update - upload to S3
    let catalogPath = undefined;
    if (req.files && req.files.catalog && req.files.catalog[0]) {
      try {
        const file = req.files.catalog[0];
        const folder = (category === 'massey' || category.includes('massey')) 
          ? 'catalouges/tractor' 
          : 'catalouges/tata_catalouges';
        const catalogUrl = await uploadFileToS3(file, folder);
        if (catalogUrl) {
          catalogPath = catalogUrl.replace(/^https?:\/\/[^\/]+/, '');
        }
      } catch (s3Error) {
        console.error('[Vehicles] S3 upload error for catalog:', s3Error.message);
        return res.status(500).json({ 
          detail: `Failed to upload catalog to S3: ${s3Error.message}. Please configure AWS credentials.` 
        });
      }
    }

    if (shouldUseDatabase && existingVehicle) {
      try {
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (category !== undefined) updateData.category = category;
        if (subcategory !== undefined) updateData.subcategory = subcategory || '';
        if (description !== undefined) updateData.description = description || '';
        if (size !== undefined) updateData.size = size || '';
        if (popular !== undefined) updateData.popular = popular === 'true' || popular === true;
        if (specs !== undefined) {
          updateData.specs = specs ? (typeof specs === 'string' ? JSON.parse(specs) : specs) : {};
        }
        if (features !== undefined) {
          updateData.features = Array.isArray(features) ? features : features.split(',').map(f => f.trim());
        }
        // Merge new images with existing
        if (newImages.length > 0) {
          const existingImages = Array.isArray(existingVehicle.images) ? existingVehicle.images : [];
          updateData.images = [...existingImages, ...newImages];
        }
        if (catalogPath !== undefined) updateData.catalog_url = catalogPath;

        const updatedVehicle = await vehiclesDB.update(vehicleId, updateData);
        
        // Transform database result to match frontend format
        const vehicleResponse = {
          id: updatedVehicle.id,
          name: updatedVehicle.name,
          category: updatedVehicle.category,
          subcategory: updatedVehicle.subcategory,
          description: updatedVehicle.description,
          size: updatedVehicle.size,
          popular: updatedVehicle.popular,
          specs: typeof updatedVehicle.specs === 'string' ? JSON.parse(updatedVehicle.specs) : updatedVehicle.specs,
          images: Array.isArray(updatedVehicle.images) ? updatedVehicle.images : [],
          features: Array.isArray(updatedVehicle.features) ? updatedVehicle.features : [],
          catalog: updatedVehicle.catalog_url || ''
        };
        
        return res.json(vehicleResponse);
      } catch (dbError) {
        console.error('[Vehicles] Database error:', dbError.message);
        if (isVercel) {
          return res.status(500).json({ detail: 'Database operation failed on Vercel.' });
        }
        // Fall through to JSON file write for local development
      }
    }

    // Fallback to JSON files (local development only)
    if (isVercel) {
      return res.status(500).json({ detail: 'Database write for vehicles should be handled in route handlers. Database operation failed.' });
    }

    const data = await readData('vehicles');
    const vehicles = data.vehicles || [];
    const vehicleIndex = vehicles.findIndex(v => v.id === vehicleId);

    if (vehicleIndex === -1) {
      return res.status(404).json({ detail: 'Vehicle not found' });
    }

    if (name) vehicles[vehicleIndex].name = name;
    if (category) vehicles[vehicleIndex].category = category;
    if (subcategory !== undefined) vehicles[vehicleIndex].subcategory = subcategory || '';
    if (description !== undefined) vehicles[vehicleIndex].description = description || '';
    if (size !== undefined) vehicles[vehicleIndex].size = size || '';
    if (popular !== undefined) vehicles[vehicleIndex].popular = popular === 'true' || popular === true;
    if (specs !== undefined) {
      vehicles[vehicleIndex].specs = specs ? (typeof specs === 'string' ? JSON.parse(specs) : specs) : {};
    }
    if (newImages.length > 0) {
      vehicles[vehicleIndex].images = [...(vehicles[vehicleIndex].images || []), ...newImages];
    }
    if (catalogPath !== undefined) vehicles[vehicleIndex].catalog = catalogPath;
    if (features !== undefined) {
      vehicles[vehicleIndex].features = Array.isArray(features) ? features : features.split(',').map(f => f.trim());
    }

    await writeData('vehicles', { vehicles });

    res.json(vehicles[vehicleIndex]);
  } catch (error) {
    console.error('[Vehicles] Unexpected error:', error.message);
    res.status(500).json({ detail: error.message });
  }
});

// DELETE /api/vehicles/:id - Delete vehicle (Protected)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const vehicleId = parseInt(req.params.id);

    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_URL;
    const pool = getPool();
    const shouldUseDatabase = isVercel || (pool !== null && isDatabaseConnected());

    if (shouldUseDatabase) {
      try {
        await vehiclesDB.delete(vehicleId);
        return res.status(204).send();
      } catch (dbError) {
        console.error('[Vehicles] Database error:', dbError.message);
        if (isVercel) {
          return res.status(500).json({ detail: 'Database operation failed on Vercel.' });
        }
        // Fall through to JSON file write for local development
      }
    }

    // Fallback to JSON files (local development only)
    if (isVercel) {
      return res.status(500).json({ detail: 'Database write for vehicles should be handled in route handlers. Database operation failed.' });
    }

    const data = await readData('vehicles');
    const vehicles = data.vehicles || [];
    const filteredVehicles = vehicles.filter(v => v.id !== vehicleId);

    if (vehicles.length === filteredVehicles.length) {
      return res.status(404).json({ detail: 'Vehicle not found' });
    }

    await writeData('vehicles', { vehicles: filteredVehicles });
    res.status(204).send();
  } catch (error) {
    console.error('[Vehicles] Unexpected error:', error.message);
    res.status(500).json({ detail: error.message });
  }
});

export default router;

