import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from '../config/database.js';
import { productsDB, vehiclesDB, masseyProductsDB, showroomsDB, aboutDB } from '../utils/dbManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, '../../public');

async function migrateProducts() {
  try {
    const filePath = path.join(PUBLIC_DIR, 'products.json');
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    const products = data.products || [];

    console.log(`\n📦 Migrating ${products.length} products...`);
    for (const product of products) {
      await productsDB.create({
        name: product.name,
        company_key: product.company || 'unknown',
        category_name: product.category || 'uncategorized',
        description: product.description || '',
        specs: product.specs || '',
        image_url: product.image || '',
      });
    }
    console.log(`✅ Migrated ${products.length} products`);
  } catch (error) {
    console.error('❌ Error migrating products:', error.message);
  }
}

async function migrateVehicles() {
  try {
    const filePath = path.join(PUBLIC_DIR, 'vehicles.json');
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    const vehicles = data.vehicles || [];

    console.log(`\n🚗 Migrating ${vehicles.length} vehicles...`);
    for (const vehicle of vehicles) {
      await vehiclesDB.create({
        name: vehicle.name,
        category: vehicle.category || 'uncategorized',
        subcategory: vehicle.subcategory || '',
        description: vehicle.description || '',
        size: vehicle.size || '',
        popular: vehicle.popular || false,
        specs: vehicle.specs || {},
        features: vehicle.features || [],
        images: vehicle.images || [],
        catalog_url: vehicle.catalog || '',
      });
    }
    console.log(`✅ Migrated ${vehicles.length} vehicles`);
  } catch (error) {
    console.error('❌ Error migrating vehicles:', error.message);
  }
}

async function migrateMasseyProducts() {
  try {
    const filePath = path.join(PUBLIC_DIR, 'masseyProducts.json');
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    const products = data.products || [];

    console.log(`\n🚜 Migrating ${products.length} Massey products...`);
    for (const product of products) {
      await masseyProductsDB.create({
        name: product.name,
        category: product.category || 'tractors',
        description: product.description || '',
        specs: product.specs || '',
        image_url: product.image || '',
        catalog_url: product.catalog || '',
      });
    }
    console.log(`✅ Migrated ${products.length} Massey products`);
  } catch (error) {
    console.error('❌ Error migrating Massey products:', error.message);
  }
}

async function migrateShowrooms() {
  try {
    const filePath = path.join(PUBLIC_DIR, 'showrooms.json');
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    const showrooms = data.showrooms || [];

    console.log(`\n🏢 Migrating ${showrooms.length} showrooms...`);
    for (const showroom of showrooms) {
      await showroomsDB.create({
        city: showroom.city,
        address: showroom.address,
        phone: showroom.phone,
        email: showroom.email,
        is_main: showroom.is_main || false,
        image_url: showroom.image || '',
      });
    }
    console.log(`✅ Migrated ${showrooms.length} showrooms`);
  } catch (error) {
    console.error('❌ Error migrating showrooms:', error.message);
  }
}

async function migrateAbout() {
  try {
    const filePath = path.join(PUBLIC_DIR, 'about.json');
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    const about = data.about || [];

    console.log(`\n📄 Migrating ${about.length} about entries...`);
    for (const entry of about) {
      await aboutDB.create({
        title: entry.title,
        description: entry.description,
        file_url: entry.file || '',
      });
    }
    console.log(`✅ Migrated ${about.length} about entries`);
  } catch (error) {
    console.error('❌ Error migrating about:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting database migration...\n');

  try {
    // Initialize database (create tables)
    await initDatabase();

    // Migrate all data
    await migrateProducts();
    await migrateVehicles();
    await migrateMasseyProducts();
    await migrateShowrooms();
    await migrateAbout();

    console.log('\n✨ Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main();

