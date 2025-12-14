import express from 'express';
import { readData, writeData } from '../utils/dataManager.js';
import { fuelStationsDB } from '../utils/dbManager.js';
import { getPool, isDatabaseConnected } from '../config/database.js';
import { toCloudFrontUrl } from '../utils/imageHelper.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     FuelStation:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         location:
 *           type: string
 *         address:
 *           type: string
 *         phone:
 *           type: string
 *         image:
 *           type: string
 *         mapLink:
 *           type: string
 *         features:
 *           type: array
 *           items:
 *             type: string
 */

/**
 * @swagger
 * /api/fuelStations:
 *   get:
 *     summary: Get all fuel stations with pagination
 *     tags: [Fuel Stations]
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
 *         description: List of fuel stations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 total_pages:
 *                   type: integer
 *                 fuel_stations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FuelStation'
 */
// GET /api/fuelStations - Get all fuel stations with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;

    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_URL;
    const pool = getPool();
    const shouldUseDatabase = isVercel || (pool !== null && isDatabaseConnected());

    if (shouldUseDatabase) {
      try {
        const stations = await fuelStationsDB.getAll();
        
        // If database is empty, fall back to JSON files
        if (stations.length === 0) {
          console.warn('[FuelStations] Database is empty, falling back to JSON files');
          // Continue to JSON file reading below
        } else {
          // Convert image paths to CloudFront URLs
          const stationsWithCloudFront = stations.map(station => ({
            id: station.id.toString(),
            name: station.name,
            location: station.location,
            address: station.address,
            phone: station.phone,
            image: station.image ? toCloudFrontUrl(station.image) : station.image,
            mapLink: station.map_link || station.mapLink || '',
            features: typeof station.features === 'string' ? JSON.parse(station.features || '[]') : (Array.isArray(station.features) ? station.features : []),
            latitude: station.latitude,
            longitude: station.longitude
          }));

          // Apply pagination
          const total = stationsWithCloudFront.length;
          const totalPages = Math.ceil(total / limit);
          const startIndex = (page - 1) * limit;
          const endIndex = startIndex + limit;
          const paginatedStations = stationsWithCloudFront.slice(startIndex, endIndex);

          return res.json({
            page,
            limit,
            total,
            total_pages: totalPages,
            fuel_stations: paginatedStations
          });
        }
      } catch (dbError) {
        console.warn('[FuelStations] Database error, falling back to JSON:', dbError.message);
        // Continue to JSON file reading below
      }
    }

    // Read from JSON files (fallback or primary for local)
    const data = await readData('fuelStations');
    const fuelStations = data.fuelStations || [];

    const total = fuelStations.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedStations = fuelStations.slice(startIndex, endIndex);

    res.json({
      page,
      limit,
      total,
      total_pages: totalPages,
      fuel_stations: paginatedStations
    });
  } catch (error) {
    console.error('[fuelStations] Error:', error);
    res.status(500).json({ detail: error.message });
  }
});

// GET /api/fuelStations/:id - Get fuel station by ID
router.get('/:id', async (req, res) => {
  try {
    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_URL;
    const pool = getPool();
    const shouldUseDatabase = isVercel || (pool !== null && isDatabaseConnected());

    if (shouldUseDatabase) {
      try {
        const station = await fuelStationsDB.getById(parseInt(req.params.id));
        
        if (station) {
          return res.json({
            id: station.id.toString(),
            name: station.name,
            location: station.location,
            address: station.address,
            phone: station.phone,
            image: station.image ? toCloudFrontUrl(station.image) : station.image,
            mapLink: station.map_link || station.mapLink || '',
            features: typeof station.features === 'string' ? JSON.parse(station.features || '[]') : (Array.isArray(station.features) ? station.features : []),
            latitude: station.latitude,
            longitude: station.longitude
          });
        }
      } catch (dbError) {
        console.warn('[FuelStations] Database error, falling back to JSON:', dbError.message);
        // Continue to JSON file reading below
      }
    }

    // Read from JSON files (fallback)
    const data = await readData('fuelStations');
    const station = data.fuelStations?.find(s => s.id === req.params.id);
    
    if (!station) {
      return res.status(404).json({ detail: 'Fuel station not found' });
    }
    
    res.json(station);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

export default router;

