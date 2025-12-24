import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { initDatabase, query } from '../config/database.js';
import { productsDB, vehiclesDB, masseyProductsDB, showroomsDB, aboutDB, homeVideoDB, fuelStationsDB, awardsDB } from '../utils/dbManager.js';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Prefer latest JSONs from root /public, fall back to legacy backend/data copies
let PUBLIC_DIR = process.env.VERCEL
  ? path.join(__dirname, '../../../public')  // Vercel: api/backend/routes -> ../../../public
  : path.join(__dirname, '../../public');    // Local: backend/routes -> ../../public

const DATA_DIR = path.join(__dirname, '../data');

if (!fsSync.existsSync(PUBLIC_DIR)) {
  // If /public doesn't exist (older deployments), use backend/data as source
  PUBLIC_DIR = DATA_DIR;
}

// Get CloudFront domain from environment or use default
const CLOUDFRONT_DOMAIN = process.env.AWS_CLOUDFRONT_DOMAIN || 'https://dh0blbvvlqdiy.cloudfront.net';

/**
 * Convert local image path to CloudFront URL
 */
function convertToCloudFrontUrl(imagePath) {
  if (!imagePath || typeof imagePath !== 'string') {
    return '';
  }

  // If already a full URL (http/https), return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Remove leading slash if present
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  
  // Handle CloudFront domain with or without https://
  let cloudFrontBase = CLOUDFRONT_DOMAIN;
  if (!cloudFrontBase.startsWith('http://') && !cloudFrontBase.startsWith('https://')) {
    cloudFrontBase = `https://${cloudFrontBase}`;
  }
  
  // Construct CloudFront URL
  const cloudFrontUrl = `${cloudFrontBase}/${cleanPath}`;
  return cloudFrontUrl;
}

/**
 * Convert array of image paths to CloudFront URLs
 */
function convertImageArrayToCloudFront(imagePaths) {
  if (!Array.isArray(imagePaths)) {
    return [];
  }
  return imagePaths.map(path => convertToCloudFrontUrl(path));
}

async function migrateProducts() {
  try {
    const filePath = path.join(PUBLIC_DIR, 'products.json');
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    const products = data.products || [];

    console.log(`\n📦 Migrating ${products.length} products...`);
    let migrated = 0;
    let skipped = 0;
    
    for (const product of products) {
      try {
        // Check if product already exists
        const existing = await productsDB.getById(product.id);
        if (existing) {
          skipped++;
          continue;
        }
      } catch {
        // Product doesn't exist, continue with creation
      }
      
      // Convert image path to CloudFront URL
      const imageUrl = convertToCloudFrontUrl(product.image || '');
      
      await productsDB.create({
        name: product.name,
        company_key: product.company || 'unknown',
        category_name: product.category || 'uncategorized',
        description: product.description || '',
        specs: product.specs || '',
        image_url: imageUrl,
      });
      migrated++;
    }
    console.log(`✅ Migrated ${migrated} products${skipped > 0 ? `, skipped ${skipped} existing` : ''}`);
    return { migrated, skipped };
  } catch (error) {
    console.error('❌ Error migrating products:', error.message);
    throw error;
  }
}

async function migrateVehicles() {
  try {
    const filePath = path.join(PUBLIC_DIR, 'vehicles.json');
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    const vehicles = data.vehicles || [];

    console.log(`\n🚗 Migrating ${vehicles.length} vehicles...`);
    let migrated = 0;
    let skipped = 0;
    
    for (const vehicle of vehicles) {
      try {
        // Check if vehicle already exists
        const existing = await vehiclesDB.getById(vehicle.id);
        if (existing) {
          skipped++;
          continue;
        }
      } catch {
        // Vehicle doesn't exist, continue with creation
      }
      
      // Convert image array to CloudFront URLs
      const images = convertImageArrayToCloudFront(vehicle.images || []);
      
      // Convert catalog path to CloudFront URL
      const catalogUrl = vehicle.catalog ? convertToCloudFrontUrl(vehicle.catalog) : 
                        (vehicle.catalog_url ? convertToCloudFrontUrl(vehicle.catalog_url) : '');
      
      await vehiclesDB.create({
        name: vehicle.name,
        category: vehicle.category || 'uncategorized',
        subcategory: vehicle.subcategory || '',
        description: vehicle.description || '',
        size: vehicle.size || '',
        popular: vehicle.popular || false,
        specs: vehicle.specs || {},
        features: vehicle.features || [],
        images: images,
        catalog_url: catalogUrl,
      });
      migrated++;
    }
    console.log(`✅ Migrated ${migrated} vehicles${skipped > 0 ? `, skipped ${skipped} existing` : ''}`);
    return { migrated, skipped };
  } catch (error) {
    console.error('❌ Error migrating vehicles:', error.message);
    throw error;
  }
}

async function migrateMasseyProducts() {
  try {
    const filePath = path.join(PUBLIC_DIR, 'masseyProducts.json');
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    const products = data.products || [];

    console.log(`\n🚜 Migrating ${products.length} Massey products...`);
    let migrated = 0;
    
    for (const product of products) {
      // Convert image path to CloudFront URL
      const imageUrl = convertToCloudFrontUrl(product.image || '');
      
      // Convert catalog path if present
      const catalogUrl = product.catalog ? convertToCloudFrontUrl(product.catalog) : '';
      
      await masseyProductsDB.create({
        name: product.name,
        category: product.category || 'tractors',
        description: product.description || '',
        specs: product.specs || '',
        image_url: imageUrl,
        catalog_url: catalogUrl,
      });
      migrated++;
    }
    console.log(`✅ Migrated ${migrated} Massey products`);
    return { migrated };
  } catch (error) {
    console.error('❌ Error migrating Massey products:', error.message);
    throw error;
  }
}

async function migrateShowrooms() {
  try {
    const filePath = path.join(PUBLIC_DIR, 'showrooms.json');
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    const showrooms = data.showrooms || [];

    console.log(`\n🏢 Migrating ${showrooms.length} showrooms...`);
    let migrated = 0;
    let skipped = 0;
    
    for (const showroom of showrooms) {
      try {
        // Check if showroom already exists
        const existing = await query(
          'SELECT id FROM showrooms WHERE city = $1 AND address = $2 LIMIT 1',
          [showroom.city, showroom.address]
        );
        if (existing.rows.length > 0) {
          skipped++;
          continue;
        }
      } catch {
        // Continue with creation
      }

      // Convert image path to CloudFront URL
      const imageUrl = convertToCloudFrontUrl(showroom.image || '');
      
      // Convert images array to CloudFront URLs
      const images = showroom.images ? convertImageArrayToCloudFront(showroom.images) : [];
      
      await showroomsDB.create({
        city: showroom.city || '',
        address: showroom.address || '',
        phone: showroom.phone || '',
        sales_phone: showroom.sales_phone || showroom.phone || null,
        service_phone: showroom.service_phone || showroom.phone || null,
        email: showroom.email || '',
        is_main: showroom.is_main || showroom.isMain || false,
        image_url: imageUrl,
        category: showroom.category || 'tata',
        images: images,
      });
      migrated++;
    }
    console.log(`✅ Migrated ${migrated} showrooms${skipped > 0 ? `, skipped ${skipped} existing` : ''}`);
    return { migrated, skipped };
  } catch (error) {
    console.error('❌ Error migrating showrooms:', error.message);
    throw error;
  }
}

async function migrateAbout() {
  try {
    const filePath = path.join(PUBLIC_DIR, 'about.json');
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    const aboutEntries = Array.isArray(data) ? data : (data.about || []);

    console.log(`\n📖 Migrating ${aboutEntries.length} about entries...`);
    let migrated = 0;
    
    for (const entry of aboutEntries) {
      // Convert file/image path to CloudFront URL
      const fileUrl = convertToCloudFrontUrl(entry.file || entry.image || '');
      
      await aboutDB.create({
        title: entry.title || '',
        description: entry.description || '',
        file_url: fileUrl,
      });
      migrated++;
    }
    console.log(`✅ Migrated ${migrated} about entries`);
    return { migrated };
  } catch (error) {
    console.error('❌ Error migrating about entries:', error.message);
    throw error;
  }
}

async function migrateHomeVideo() {
  try {
    const filePath = path.join(PUBLIC_DIR, 'home.json');
    let data;
    
    try {
      data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    } catch {
      console.log('\n📹 No home.json found, skipping home video migration');
      return { migrated: 0 };
    }
    
    const videoUrl = data.video || '';
    const advertisementVideo = data.advertisementVideo || '';
    
    if (videoUrl || advertisementVideo) {
      console.log('\n📹 Migrating home video...');
      
      // Convert video paths to CloudFront URLs
      const cloudFrontVideoUrl = videoUrl ? convertToCloudFrontUrl(videoUrl) : '';
      const cloudFrontAdVideoUrl = advertisementVideo ? convertToCloudFrontUrl(advertisementVideo) : '';
      
      // Update or insert home video
      if (cloudFrontVideoUrl) {
        await homeVideoDB.set(cloudFrontVideoUrl);
        console.log(`✅ Migrated home video: ${cloudFrontVideoUrl}`);
      }
      
      if (cloudFrontAdVideoUrl) {
        // Update advertisement video
        await query(
          'UPDATE home_video SET advertisement_video_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT id FROM home_video ORDER BY id DESC LIMIT 1)',
          [cloudFrontAdVideoUrl]
        );
        console.log(`✅ Migrated advertisement video: ${cloudFrontAdVideoUrl}`);
      }
      return { migrated: 1 };
    } else {
      console.log('\n📹 No home video data found, skipping...');
      return { migrated: 0 };
    }
  } catch (error) {
    console.error('❌ Error migrating home video:', error.message);
    throw error;
  }
}

async function migrateCareers() {
  try {
    const filePath = path.join(PUBLIC_DIR, 'careers.json');
    let data;
    
    try {
      data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    } catch {
      console.log('\n💼 No careers.json found, skipping careers migration');
      return { migrated: 0 };
    }
    
    const jobs = data.jobs || [];
    
    if (jobs.length === 0) {
      console.log('\n💼 No jobs found in careers.json, skipping...');
      return { migrated: 0 };
    }
    
    console.log(`\n💼 Migrating ${jobs.length} job postings...`);
    let migrated = 0;
    
    for (const job of jobs) {
      await query(
        `INSERT INTO careers (title, department, location, description, requirements, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING`,
        [
          job.title || '',
          job.department || '',
          job.location || '',
          job.description || '',
          job.requirements || '',
          job.status || 'active'
        ]
      );
      migrated++;
    }
    console.log(`✅ Migrated ${migrated} job postings`);
    return { migrated };
  } catch (error) {
    console.error('❌ Error migrating careers:', error.message);
    // Don't throw - careers might not have table yet
    console.warn('⚠️  Continuing with other migrations...');
    return { migrated: 0 };
  }
}

async function migrateFuelStations() {
  try {
    const filePath = path.join(PUBLIC_DIR, 'fuelStations.json');
    let data;
    
    try {
      data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    } catch {
      console.log('\n⛽ No fuelStations.json found, skipping fuel stations migration');
      return { migrated: 0 };
    }
    
    const stations = data.fuelStations || data.stations || [];
    
    if (stations.length === 0) {
      console.log('\n⛽ No fuel stations found, skipping...');
      return { migrated: 0 };
    }
    
    console.log(`\n⛽ Migrating ${stations.length} fuel stations...`);
    let migrated = 0;
    let skipped = 0;
    
    for (const station of stations) {
      try {
        // Check if station already exists by name
        const existing = await query(
          'SELECT id FROM fuel_stations WHERE name = $1 LIMIT 1',
          [station.name]
        );
        if (existing.rows.length > 0) {
          skipped++;
          continue;
        }
      } catch {
        // Continue with creation
      }
      
      const imageUrl = convertToCloudFrontUrl(station.image || '');
      
      await fuelStationsDB.create({
        name: station.name || '',
        location: station.location || '',
        address: station.address || '',
        phone: station.phone || '',
        image: imageUrl,
        mapLink: station.mapLink || station.map_link || '',
        features: station.features || [],
        latitude: station.latitude || null,
        longitude: station.longitude || null
      });
      migrated++;
    }
    console.log(`✅ Migrated ${migrated} fuel stations${skipped > 0 ? `, skipped ${skipped} existing` : ''}`);
    return { migrated, skipped };
  } catch (error) {
    console.error('❌ Error migrating fuel stations:', error.message);
    console.warn('⚠️  Continuing with other migrations...');
    return { migrated: 0, skipped: 0 };
  }
}

async function migrateAwards() {
  try {
    // Awards from actual award images in public/images/awards
    console.log('\n🏆 Migrating awards from award images...');
    
    const awardImages = [
      {
        id: 1,
        image: '/images/awards/IMG_20251209_124404 - Edited.webp',
        title: 'Excellence in Commercial Vehicle Sales',
        description: 'Recognized for outstanding performance in commercial vehicle dealership and exceptional customer service delivery across Andhra Pradesh and Telangana regions.',
        year: '2024',
        brand: 'Tata Motors'
      },
      {
        id: 2,
        image: '/images/awards/IMG_20251209_124421 - Edited.webp',
        title: 'Best Dealer Performance Award',
        description: 'Awarded for achieving the highest sales targets and maintaining superior customer satisfaction standards in the automotive industry.',
        year: '2024',
        brand: 'Tata Motors'
      },
      {
        id: 3,
        image: '/images/awards/IMG_20251209_124431 - Edited.webp',
        title: 'Outstanding Service Excellence',
        description: 'Recognized for exceptional after-sales service, customer support, and commitment to maintaining the highest quality standards.',
        year: '2024',
        brand: 'Tata Motors'
      },
      {
        id: 4,
        image: '/images/awards/IMG_20251209_124556 - Edited.webp',
        title: 'Top Distributor Achievement',
        description: 'Awarded for being the leading distributor in lubricants and automotive products, demonstrating excellence in market penetration and customer reach.',
        year: '2024',
        brand: 'HP Lubricants'
      },
      {
        id: 5,
        image: '/images/awards/IMG_20251209_124810 - Edited.webp',
        title: 'Customer Satisfaction Excellence',
        description: 'Recognized for maintaining the highest levels of customer satisfaction and building long-term relationships with clients.',
        year: '2024',
        brand: 'HP Lubricants'
      },
      {
        id: 6,
        image: '/images/awards/IMG_20251209_125043 - Edited.webp',
        title: 'Sales Performance Champion',
        description: 'Awarded for achieving exceptional sales growth and market leadership in the commercial vehicle and automotive products sector.',
        year: '2024',
        brand: 'Tata Motors'
      },
      {
        id: 7,
        image: '/images/awards/IMG_20251209_125136 - Edited.webp',
        title: 'Innovation in Distribution',
        description: 'Recognized for innovative approaches in product distribution, supply chain management, and market development strategies.',
        year: '2024',
        brand: 'HP Lubricants'
      },
      {
        id: 8,
        image: '/images/awards/IMG_20251209_125334 - Edited.webp',
        title: 'Regional Market Leader',
        description: 'Awarded for establishing market leadership and expanding business presence across multiple regions with consistent growth.',
        year: '2024',
        brand: 'Tata Motors'
      },
      {
        id: 9,
        image: '/images/awards/IMG_20251209_125354 - Edited.webp',
        title: 'Quality Excellence Award',
        description: 'Recognized for maintaining the highest quality standards in products and services, ensuring customer trust and satisfaction.',
        year: '2024',
        brand: 'Tata Motors'
      },
      {
        id: 10,
        image: '/images/awards/IMG_20251209_125358 - Edited.webp',
        title: 'Business Growth Achievement',
        description: 'Awarded for exceptional business growth, strategic expansion, and significant contribution to the automotive industry.',
        year: '2024',
        brand: 'HP Lubricants'
      },
    ];
    
    let migrated = 0;
    let skipped = 0;
    
    for (const award of awardImages) {
      try {
        // Check if award already exists
        const existing = await query(
          'SELECT id FROM awards WHERE brand = $1 AND award_text = $2 LIMIT 1',
          [award.brand, award.title]
        );
        if (existing.rows.length > 0) {
          skipped++;
          continue;
        }
      } catch {
        // Continue with creation
      }
      
      // Convert image path to CloudFront URL
      const imageUrl = convertToCloudFrontUrl(award.image);
      
      await awardsDB.create({
        brand: award.brand,
        logo_url: imageUrl, // Use award image as logo
        award_text: award.title,
        year: award.year,
        display_order: award.id - 1
      });
      migrated++;
    }
    
    console.log(`✅ Migrated ${migrated} awards${skipped > 0 ? `, skipped ${skipped} existing` : ''}`);
    return { migrated, skipped };
  } catch (error) {
    console.error('❌ Error migrating awards:', error.message);
    console.warn('⚠️  Continuing with other migrations...');
    return { migrated: 0, skipped: 0 };
  }
}

export async function migrateAllData() {
  console.log('🚀 Starting complete database migration from public/ folder...\n');
  console.log(`📁 Public directory: ${PUBLIC_DIR}`);
  console.log(`🌐 CloudFront domain: ${CLOUDFRONT_DOMAIN}\n`);

  try {
    // Initialize database (create tables)
    console.log('📊 Initializing database tables...');
    const initResult = await initDatabase();
    if (!initResult.success) {
      console.warn('⚠️  Database initialization warning:', initResult.message);
      console.log('   Continuing anyway...\n');
    } else {
      console.log('✅ Database tables initialized\n');
    }

    // Check if data files exist
    const requiredFiles = ['products.json', 'vehicles.json', 'masseyProducts.json', 'showrooms.json', 'about.json'];
    for (const file of requiredFiles) {
      const filePath = path.join(PUBLIC_DIR, file);
      try {
        await fs.access(filePath);
        console.log(`✅ Found ${file}`);
      } catch {
        console.warn(`⚠️  Warning: ${file} not found at ${filePath}`);
      }
    }
    console.log('');

    // Migrate all data
    const results = {
      products: await migrateProducts(),
      vehicles: await migrateVehicles(),
      masseyProducts: await migrateMasseyProducts(),
      showrooms: await migrateShowrooms(),
      about: await migrateAbout(),
      homeVideo: await migrateHomeVideo(),
      careers: await migrateCareers(),
      fuelStations: await migrateFuelStations(),
      awards: await migrateAwards(),
    };

    console.log('\n✨ Migration complete!');
    return { 
      success: true, 
      message: 'Migration completed successfully',
      results 
    };
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

// GET endpoint to show migration instructions
router.get('/', (req, res) => {
  res.json({
    message: 'Migration endpoint - Use POST method',
    instructions: {
      method: 'POST',
      url: '/api/migrate',
      headers: {
        'Authorization': 'Bearer YOUR_JWT_TOKEN',
        'Content-Type': 'application/json'
      },
      note: 'This endpoint requires admin authentication. Login at /admin first to get your JWT token.'
    },
    example: {
      curl: 'curl -X POST https://sahni-tata.vercel.app/api/migrate -H "Authorization: Bearer YOUR_TOKEN"',
      postman: 'POST /api/migrate with Authorization header'
    }
  });
});

/**
 * @swagger
 * /api/migrate:
 *   post:
 *     summary: Run database migration (Admin only)
 *     tags: [Migration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Migration completed successfully
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Migration failed
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('[Migration] Starting migration via API...');
    
    // Run migration (includes database initialization)
    const result = await migrateAllData();
    
    res.json({
      success: true,
      message: 'Migration completed successfully',
      ...result
    });
  } catch (error) {
    console.error('[Migration] Error:', error);
    res.status(500).json({
      error: 'Migration failed',
      detail: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
});

export default router;
