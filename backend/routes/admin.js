import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { readData } from '../utils/dataManager.js';
import { query } from '../config/database.js';
import { getPool, isDatabaseConnected } from '../config/database.js';

const router = express.Router();

/**
 * @swagger
 * /api/admin/me:
 *   get:
 *     summary: Get current admin user info
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current admin user information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *       401:
 *         description: Not authenticated
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      id: req.user.id,
      username: req.user.username,
      email: req.user.email
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: integer
 *                 vehicles:
 *                   type: integer
 *                 showrooms:
 *                   type: integer
 *                 fuelStations:
 *                   type: integer
 *                 aboutEntries:
 *                   type: integer
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_URL;
    const pool = getPool();
    const shouldUseDatabase = isVercel || (pool !== null && isDatabaseConnected());

    if (shouldUseDatabase) {
      try {
        // Get counts from database
        const [productsResult, vehiclesResult, showroomsResult, fuelStationsResult, aboutResult, careersResult, awardsResult] = await Promise.all([
          query('SELECT COUNT(*) FROM products'),
          query('SELECT COUNT(*) FROM vehicles'),
          query('SELECT COUNT(*) FROM showrooms'),
          query('SELECT COUNT(*) FROM fuel_stations'),
          query('SELECT COUNT(*) FROM about'),
          query('SELECT COUNT(*) FROM careers'),
          query('SELECT COUNT(*) FROM awards')
        ]);

        res.json({
          products: parseInt(productsResult.rows[0].count),
          vehicles: parseInt(vehiclesResult.rows[0].count),
          showrooms: parseInt(showroomsResult.rows[0].count),
          fuelStations: parseInt(fuelStationsResult.rows[0].count),
          aboutEntries: parseInt(aboutResult.rows[0].count),
          careers: parseInt(careersResult.rows[0].count),
          awards: parseInt(awardsResult.rows[0].count)
        });
        return;
      } catch (dbError) {
        console.warn('[Admin Stats] Database error, falling back to JSON:', dbError.message);
        // Fall through to JSON file reading
      }
    }

    // Fallback to JSON files
    const [productsData, vehiclesData, showroomsData, fuelStationsData, aboutData] = await Promise.all([
      readData('products').catch(() => ({ products: [] })),
      readData('vehicles').catch(() => ({ vehicles: [] })),
      readData('showrooms').catch(() => ({ showrooms: [] })),
      readData('fuelStations').catch(() => ({ fuelStations: [] })),
      readData('about').catch(() => ({ about: [] }))
    ]);

    res.json({
      products: (productsData.products || []).length,
      vehicles: (vehiclesData.vehicles || []).length,
      showrooms: (showroomsData.showrooms || []).length,
      fuelStations: (fuelStationsData.fuelStations || []).length,
      aboutEntries: (aboutData.about || []).length,
      careers: 0,
      awards: 0
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

export default router;

