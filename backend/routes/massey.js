import express from 'express';
import multer from 'multer';
import { readData, writeData } from '../utils/dataManager.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadFileToS3 } from '../middleware/multer-s3.js';

// Configure multer for file uploads (memory storage for S3)
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB for images
    fieldSize: 50 * 1024 * 1024  // 50MB for PDFs
  }
});

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     MasseyProduct:
 *       type: object
 *       required:
 *         - name
 *         - category
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         image:
 *           type: string
 *         description:
 *           type: string
 *         specs:
 *           type: string
 *         category:
 *           type: string
 *     MasseyCategory:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         label:
 *           type: string
 *         name:
 *           type: string
 */

/**
 * @swagger
 * /api/massey/products:
 *   get:
 *     summary: Get all Massey Ferguson products
 *     tags: [Massey Ferguson]
 *     responses:
 *       200:
 *         description: List of Massey Ferguson products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MasseyProduct'
 *                 total_count:
 *                   type: integer
 *                 total_pages:
 *                   type: integer
 *                 current_page:
 *                   type: integer
 *                 per_page:
 *                   type: integer
 */
router.get('/products', async (req, res) => {
  try {
    const data = await readData('masseyProducts');
    const products = data.products || [];

    // Return in the format expected by frontend
    res.json({
      data: products,
      total_count: products.length,
      total_pages: 1,
      current_page: 1,
      per_page: products.length
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

/**
 * @swagger
 * /api/massey/products:
 *   post:
 *     summary: Create a new Massey Ferguson product
 *     tags: [Massey Ferguson]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: description
 *         schema:
 *           type: string
 *       - in: query
 *         name: specs
 *         schema:
 *           type: string
 *       - in: query
 *         name: image
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Validation error
 */
router.post('/products', authenticateToken, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'catalog', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, category, description, specs } = req.body;

    if (!name || !category) {
      return res.status(400).json({ detail: 'Name and category are required' });
    }

    const data = await readData('masseyProducts');
    const products = data.products || [];

    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 100;

    // Handle image upload - upload to S3
    let imagePath = '';
    if (req.files && req.files.image && req.files.image[0]) {
      const imageUrl = await uploadFileToS3(req.files.image[0], 'images/sahni_vehicles/messy_ferguson');
      if (imageUrl) {
        imagePath = imageUrl.replace(/^https?:\/\/[^\/]+/, '');
      }
    }

    // Handle catalog PDF upload - upload to S3
    let catalogPath = '';
    if (req.files && req.files.catalog && req.files.catalog[0]) {
      const catalogUrl = await uploadFileToS3(req.files.catalog[0], 'catalouges/tractor');
      if (catalogUrl) {
        catalogPath = catalogUrl.replace(/^https?:\/\/[^\/]+/, '');
      }
    }

    const newProduct = {
      id: newId,
      name,
      category,
      description: description || '',
      specs: specs || '',
      image: imagePath || '',
      catalog: catalogPath || ''
    };

    products.push(newProduct);
    await writeData('masseyProducts', { products });

    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

/**
 * @swagger
 * /api/massey/categories:
 *   get:
 *     summary: Get all Massey Ferguson categories
 *     tags: [Massey Ferguson]
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MasseyCategory'
 */
router.get('/categories', async (req, res) => {
  try {
    const data = await readData('masseyProducts');
    const products = data.products || [];

    // Extract unique categories from products
    const categorySet = new Set();
    products.forEach(product => {
      if (product.category) {
        categorySet.add(product.category);
      }
    });

    // Convert to array of category objects
    const categories = Array.from(categorySet).map((cat, index) => ({
      id: `massey-${index + 1}`,
      label: cat,
      name: cat
    }));

    res.json(categories);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

/**
 * @swagger
 * /api/massey/categories:
 *   post:
 *     summary: Create a new Massey Ferguson category
 *     tags: [Massey Ferguson]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: label
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Validation error
 */
router.post('/categories', authenticateToken, async (req, res) => {
  try {
    const { label } = req.query;

    if (!label) {
      return res.status(400).json({ detail: 'Label is required' });
    }

    // Categories are derived from products, so we just return success
    // In a real implementation, you might want to store categories separately
    res.status(201).json({
      id: `massey-${Date.now()}`,
      label,
      name: label
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

export default router;

