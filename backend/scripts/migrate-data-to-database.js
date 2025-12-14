import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, query } from '../config/database.js';
import { productsDB, vehiclesDB, masseyProductsDB, showroomsDB, aboutDB, fuelStationsDB } from '../utils/dbManager.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');

// Get CloudFront domain from environment or use default
const CLOUDFRONT_DOMAIN = process.env.AWS_CLOUDFRONT_DOMAIN || '';

/**
 * Convert local image path to CloudFront URL
 * @param {string} imagePath - Local image path (e.g., "/images/sahni_products/hp racer-4.jpeg")
 * @returns {string} - CloudFront URL or original path if CloudFront domain not set
 */
function convertToCloudFrontUrl(imagePath) {
  if (!imagePath || typeof imagePath !== 'string') {
    return '';
  }

  // If already a full URL (http/https), return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // If CloudFront domain is not set, return original path
  if (!CLOUDFRONT_DOMAIN) {
    console.warn('⚠️  AWS_CLOUDFRONT_DOMAIN not set, using original paths');
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
 * @param {string[]} imagePaths - Array of image paths
 * @returns {string[]} - Array of CloudFront URLs
 */
function convertImageArrayToCloudFront(imagePaths) {
  if (!Array.isArray(imagePaths)) {
    return [];
  }
  return imagePaths.map(path => convertToCloudFrontUrl(path));
}

/**
 * Convert catalog path to CloudFront URL
 * @param {string} catalogPath - Catalog PDF path
 * @returns {string} - CloudFront URL
 */
function convertCatalogToCloudFront(catalogPath) {
  return convertToCloudFrontUrl(catalogPath);
}

async function migrateProducts() {
  try {
    const filePath = path.join(DATA_DIR, 'products.json');
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    const products = data.products || [];

    console.log(`\n📦 Migrating ${products.length} products...`);
    let migrated = 0;
    for (const product of products) {
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
    console.log(`✅ Migrated ${migrated} products`);
  } catch (error) {
    console.error('❌ Error migrating products:', error.message);
    throw error;
  }
}

async function migrateVehicles() {
  try {
    const filePath = path.join(DATA_DIR, 'vehicles.json');
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    const vehicles = data.vehicles || [];

    console.log(`\n🚗 Migrating ${vehicles.length} vehicles...`);
    let migrated = 0;
    for (const vehicle of vehicles) {
      // Convert image array to CloudFront URLs
      const images = convertImageArrayToCloudFront(vehicle.images || []);
      
      // Convert catalog path to CloudFront URL
      const catalogUrl = vehicle.catalog ? convertCatalogToCloudFront(vehicle.catalog) : '';
      
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
    console.log(`✅ Migrated ${migrated} vehicles`);
  } catch (error) {
    console.error('❌ Error migrating vehicles:', error.message);
    throw error;
  }
}

async function migrateMasseyProducts() {
  try {
    const filePath = path.join(DATA_DIR, 'masseyProducts.json');
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    const products = data.products || [];

    console.log(`\n🚜 Migrating ${products.length} Massey products...`);
    let migrated = 0;
    for (const product of products) {
      // Convert image path to CloudFront URL
      const imageUrl = convertToCloudFrontUrl(product.image || '');
      
      // Convert catalog path if present
      const catalogUrl = product.catalog ? convertCatalogToCloudFront(product.catalog) : '';
      
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
  } catch (error) {
    console.error('❌ Error migrating Massey products:', error.message);
    throw error;
  }
}

async function migrateFuelStations() {
  try {
    const filePath = path.join(DATA_DIR, 'fuelStations.json');
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    const stations = data.fuelStations || [];

    console.log(`\n⛽ Migrating ${stations.length} fuel stations...`);
    let migrated = 0;
    for (const station of stations) {
      await fuelStationsDB.create({
        name: station.name || station.location || 'Unknown Station',
        location: station.location || null,
        address: station.address || '',
        phone: station.phone || '',
        image: station.image || null,
        mapLink: station.mapLink || null,
        features: Array.isArray(station.features) ? station.features : null,
        latitude: station.latitude || null,
        longitude: station.longitude || null,
      });
      migrated++;
    }
    console.log(`✅ Migrated ${migrated} fuel stations`);
  } catch (error) {
    console.error('❌ Error migrating fuel stations:', error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting database migration from backend/data/...\n');
  console.log(`📁 Data directory: ${DATA_DIR}`);
  console.log(`🌐 CloudFront domain: ${CLOUDFRONT_DOMAIN || 'NOT SET (using original paths)'}\n`);

  try {
    // Initialize database (create tables)
    console.log('📊 Initializing database tables...');
    await initDatabase();
    console.log('✅ Database tables initialized\n');

    // Check if data files exist
    const requiredFiles = ['products.json', 'vehicles.json', 'masseyProducts.json', 'fuelStations.json'];
    for (const file of requiredFiles) {
      const filePath = path.join(DATA_DIR, file);
      try {
        await fs.access(filePath);
        console.log(`✅ Found ${file}`);
      } catch {
        console.warn(`⚠️  Warning: ${file} not found at ${filePath}`);
      }
    }
    console.log('');

    // Migrate all data
    await migrateProducts();
    await migrateVehicles();
    await migrateMasseyProducts();
    await migrateFuelStations();

    console.log('\n✨ Migration complete!');
    console.log('\n📝 Note: Companies data is stored in companies.json but may not need a separate table.');
    console.log('   It can be served directly from the JSON file or integrated into products if needed.');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

main();

