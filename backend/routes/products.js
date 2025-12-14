import express from 'express';
import { readData, writeData } from '../utils/dataManager.js';
import { authenticateToken } from '../middleware/auth.js';
import { toCloudFrontUrl } from '../utils/imageHelper.js';
import { upload, uploadFileToS3 } from '../middleware/multer-s3.js';
import { productsDB } from '../utils/dbManager.js';
import { getPool, isDatabaseConnected } from '../config/database.js';

const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_URL;

// Check if database should be used (runtime check)
const shouldUseDatabase = () => {
  if (isVercel) {
    // On Vercel, try to use database, but fall back to JSON if not available
    const pool = getPool();
    return pool !== null;
  }
  // Local: use database if available, otherwise JSON
  const pool = getPool();
  return pool !== null && isDatabaseConnected();
};

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - company
 *         - category
 *         - description
 *         - specs
 *       properties:
 *         id:
 *           type: integer
 *           description: Product ID
 *         name:
 *           type: string
 *           description: Product name
 *         company:
 *           type: string
 *           description: Company key
 *         category:
 *           type: string
 *           description: Category name
 *         description:
 *           type: string
 *           description: Product description
 *         specs:
 *           type: string
 *           description: Product specifications
 *         image:
 *           type: string
 *           description: Image URL path
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products with pagination
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *     responses:
 *       200:
 *         description: List of products
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
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const search = req.query.search || '';

    // Try database first, fall back to JSON files
    if (shouldUseDatabase()) {
      try {
        // Use database
        const result = await productsDB.getAll(page, limit);
        let products = result.products || [];

        // If database is empty, fall back to JSON files
        if (products.length === 0 && result.total === 0) {
          console.warn('[Products] Database is empty, falling back to JSON files');
          // Continue to JSON file reading below
        } else if (products.length > 0) {
          // Apply search filter
          if (search) {
            products = products.filter(p => 
              p.name?.toLowerCase().includes(search.toLowerCase()) ||
              p.description?.toLowerCase().includes(search.toLowerCase()) ||
              p.category_name?.toLowerCase().includes(search.toLowerCase())
            );
          }

          // Convert image paths to CloudFront URLs
          const productsWithCloudFront = products.map(product => ({
            id: product.id,
            name: product.name,
            company: product.company_key,
            category: product.category_name,
            description: product.description,
            specs: product.specs,
            image: product.image_url ? toCloudFrontUrl(product.image_url) : product.image_url,
            catalog_url: product.catalog_url ? toCloudFrontUrl(product.catalog_url) : product.catalog_url
          }));

          return res.json({
            page: result.page,
            limit: result.limit,
            total: result.total,
            total_pages: result.total_pages,
            products: productsWithCloudFront
          });
        }
      } catch (dbError) {
        // Database error - fall back to JSON files
        console.warn('[Products] Database error, falling back to JSON:', dbError.message);
        // Continue to JSON file reading below
      }
    }
    
    // Read from local JSON files (fallback or primary for local)
    try {
      const data = await readData('products');
      let products = data.products || [];

    // Apply search filter
    if (search) {
      products = products.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase()) ||
        p.category?.toLowerCase().includes(search.toLowerCase())
      );
    }

    const total = products.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = products.slice(startIndex, endIndex);

    // Convert image paths to CloudFront URLs
    const productsWithCloudFront = paginatedProducts.map(product => ({
      ...product,
      image: product.image ? toCloudFrontUrl(product.image) : product.image
    }));

      res.json({
        page,
        limit,
        total,
        total_pages: totalPages,
        products: productsWithCloudFront
      });
    } catch (readError) {
      console.error('[Products] Error reading from JSON:', readError.message);
      // Return empty result instead of error
      res.json({
        page,
        limit,
        total: 0,
        total_pages: 0,
        products: []
      });
    }
  } catch (error) {
    console.error('[Products] Unexpected error:', error.message);
    // Return empty result instead of error
    res.json({
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 100,
      total: 0,
      total_pages: 0,
      products: []
    });
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */
router.get('/:id', async (req, res) => {
  try {
    // Try database first, fall back to JSON files
    if (shouldUseDatabase()) {
      try {
        // Use database
        const product = await productsDB.getById(parseInt(req.params.id));
        
        if (product) {
          // Convert image path to CloudFront URL
          const productWithCloudFront = {
            id: product.id,
            name: product.name,
            company: product.company_key,
            category: product.category_name,
            description: product.description,
            specs: product.specs,
            image: product.image_url ? toCloudFrontUrl(product.image_url) : product.image_url,
            catalog_url: product.catalog_url ? toCloudFrontUrl(product.catalog_url) : product.catalog_url
          };
          
          return res.json(productWithCloudFront);
        }
      } catch (dbError) {
        // Database error - fall back to JSON files
        console.warn('[Products] Database error, falling back to JSON:', dbError.message);
        // Continue to JSON file reading below
      }
    }
    
    // Read from local JSON files (fallback or primary for local)
    const data = await readData('products');
    const product = data.products?.find(p => p.id === parseInt(req.params.id));
    
    if (!product) {
      return res.status(404).json({ detail: 'Product not found' });
    }
    
    // Convert image path to CloudFront URL
    const productWithCloudFront = {
      ...product,
      image: product.image ? toCloudFrontUrl(product.image) : product.image
    };
    
    res.json(productWithCloudFront);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - company_key
 *               - category_name
 *               - description
 *               - specs
 *               - image
 *             properties:
 *               name:
 *                 type: string
 *               company_key:
 *                 type: string
 *               category_name:
 *                 type: string
 *               description:
 *                 type: string
 *               specs:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error
 */
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { name, company_key, category_name, description, specs } = req.body;
    
    if (!name || !company_key || !category_name || !description || !specs) {
      return res.status(400).json({ detail: 'All fields are required' });
    }

    let imageUrl = '';
    if (req.file) {
      try {
        // Upload to S3 and get CloudFront URL
        imageUrl = await uploadFileToS3(req.file, 'images/sahni_products');
        if (!imageUrl) {
          return res.status(500).json({ 
            detail: 'Failed to upload image to S3. Please check AWS credentials and S3 configuration.' 
          });
        }
        console.log(`[Products] Image uploaded to S3: ${imageUrl}`);
      } catch (s3Error) {
        console.error('[Products] S3 upload error:', s3Error.message);
        return res.status(500).json({ 
          detail: `S3 upload failed: ${s3Error.message}. Please check AWS credentials and S3 bucket configuration.` 
        });
      }
    } else {
      return res.status(400).json({ detail: 'Image is required' });
    }

    if (shouldUseDatabase()) {
      try {
        // Use database
        const product = await productsDB.create({
          name,
          company_key,
          category_name,
          description,
          specs,
          image_url: imageUrl
        });

        return res.status(201).json({
          id: product.id,
          name: product.name,
          company: product.company_key,
          category: product.category_name,
          description: product.description,
          specs: product.specs,
          image: product.image_url ? toCloudFrontUrl(product.image_url) : product.image_url
        });
      } catch (dbError) {
        // If database fails on Vercel, this is an error (can't write to filesystem)
        if (isVercel) {
          return res.status(500).json({ detail: `Database error: ${dbError.message}. Please check database configuration.` });
        }
        // Local: fall back to filesystem
        console.warn('[Products] Database error, falling back to filesystem:', dbError.message);
      }
    }
    
    if (!isVercel) {
      // Use filesystem (local only)
      // Use filesystem
      const data = await readData('products');
      const products = data.products || [];
      
      const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
      
      // Extract the path from CloudFront URL for storage
      const imagePath = imageUrl.replace(/^https?:\/\/[^\/]+/, '');

      const newProduct = {
        id: newId,
        name,
        company: company_key,
        category: category_name,
        description,
        specs,
        image: imagePath
      };

      products.push(newProduct);
      await writeData('products', { products });

      res.status(201).json(newProduct);
    }
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               specs:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 */
router.put('/:id', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    // Read from req.body (FormData fields processed by multer) or req.query (query params)
    // When FormData is sent, multer puts all fields in req.body as strings
    // When no FormData, fields come in req.query
    const name = req.body?.name || req.query?.name;
    const company_key = req.body?.company_key || req.query?.company_key;
    const category_name = req.body?.category_name || req.query?.category_name;
    const description = req.body?.description !== undefined ? req.body.description : (req.query?.description !== undefined ? req.query.description : undefined);
    const specs = req.body?.specs !== undefined ? req.body.specs : (req.query?.specs !== undefined ? req.query.specs : undefined);
    
    // Parse ID - handle both string and number
    const productId = parseInt(req.params.id, 10);
    
    if (isNaN(productId)) {
      return res.status(400).json({ detail: 'Invalid product ID' });
    }
    
    console.log(`[Products] Updating product ID: ${productId}`, {
      name,
      company_key,
      category_name,
      description: description !== undefined ? 'provided' : 'not provided',
      specs: specs !== undefined ? 'provided' : 'not provided',
      hasImage: !!req.file,
      bodyKeys: Object.keys(req.body || {}),
      queryKeys: Object.keys(req.query || {})
    });

    if (shouldUseDatabase()) {
      try {
        // Use database
        const existingProduct = await productsDB.getById(productId);
        
        if (!existingProduct) {
          return res.status(404).json({ detail: `Product with ID ${productId} not found` });
        }

        let imageUrl = existingProduct.image_url; // Keep existing image by default
        
        if (req.file) {
          try {
            // Upload to S3 and get CloudFront URL
            imageUrl = await uploadFileToS3(req.file, 'images/sahni_products');
            if (!imageUrl) {
              return res.status(500).json({ 
                detail: 'Failed to upload image to S3. Please check AWS credentials and S3 configuration.' 
              });
            }
            console.log(`[Products] Image uploaded to S3: ${imageUrl}`);
          } catch (s3Error) {
            console.error('[Products] S3 upload error:', s3Error.message);
            return res.status(500).json({ 
              detail: `S3 upload failed: ${s3Error.message}. Please check AWS credentials and S3 bucket configuration.` 
            });
          }
        }

        // Update product - use provided values or keep existing ones
        const product = await productsDB.update(productId, {
          name: name !== undefined && name !== null && name.trim() !== '' ? name.trim() : existingProduct.name,
          company_key: company_key !== undefined && company_key !== null && company_key.trim() !== '' ? company_key.trim() : existingProduct.company_key,
          category_name: category_name !== undefined && category_name !== null && category_name.trim() !== '' ? category_name.trim() : existingProduct.category_name,
          description: description !== undefined ? (description || '') : existingProduct.description,
          specs: specs !== undefined ? (specs || '') : existingProduct.specs,
          image_url: imageUrl
        });

        return res.json({
          id: product.id,
          name: product.name,
          company: product.company_key,
          category: product.category_name,
          description: product.description,
          specs: product.specs,
          image: product.image_url ? toCloudFrontUrl(product.image_url) : product.image_url
        });
      } catch (dbError) {
        // If database fails on Vercel, this is an error (can't write to filesystem)
        if (isVercel) {
          return res.status(500).json({ detail: `Database error: ${dbError.message}. Please check database configuration.` });
        }
        // Local: fall back to filesystem
        console.warn('[Products] Database error, falling back to filesystem:', dbError.message);
      }
    }
    
    if (!isVercel) {
      // Use filesystem (local only)
      // Use filesystem
      const data = await readData('products');
      const products = data.products || [];
      const productIndex = products.findIndex(p => p.id === productId);

      if (productIndex === -1) {
        return res.status(404).json({ detail: 'Product not found' });
      }

      if (name) products[productIndex].name = name;
      if (company_key) products[productIndex].company = company_key;
      if (category_name) products[productIndex].category = category_name;
      if (description !== undefined) products[productIndex].description = description;
      if (specs !== undefined) products[productIndex].specs = specs;
      
      if (req.file) {
        // Upload to S3 and get CloudFront URL
        const imageUrl = await uploadFileToS3(req.file, 'images/sahni_products');
        if (!imageUrl) {
          return res.status(500).json({ detail: 'Failed to upload image to S3' });
        }
        // Extract the path from CloudFront URL for storage
        const imagePath = imageUrl.replace(/^https?:\/\/[^\/]+/, '');
        products[productIndex].image = imagePath;
      }

      await writeData('products', { products });

      res.json(products[productIndex]);
    }
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    
    if (shouldUseDatabase()) {
      try {
        // Use database
        const existingProduct = await productsDB.getById(productId);
        
        if (!existingProduct) {
          return res.status(404).json({ detail: 'Product not found' });
        }

        await productsDB.delete(productId);
        return res.json({ success: true });
      } catch (dbError) {
        // If database fails on Vercel, this is an error (can't write to filesystem)
        if (isVercel) {
          return res.status(500).json({ detail: `Database error: ${dbError.message}. Please check database configuration.` });
        }
        // Local: fall back to filesystem
        console.warn('[Products] Database error, falling back to filesystem:', dbError.message);
      }
    }
    
    if (!isVercel) {
      // Use filesystem (local only)
      // Use filesystem
      const data = await readData('products');
      const products = data.products || [];
      const filteredProducts = products.filter(p => p.id !== productId);

      if (products.length === filteredProducts.length) {
        return res.status(404).json({ detail: 'Product not found' });
      }

      await writeData('products', { products: filteredProducts });
      res.json({ success: true });
    }
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

export default router;

