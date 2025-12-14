import { productsDB } from '../utils/dbManager.js';
import { initDatabase, query, getPool } from '../config/database.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '../../');
dotenv.config({ path: path.join(PROJECT_ROOT, '.env') });

// Get project root (2 levels up from backend/scripts)
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
const AG_OIL_DIR = path.join(PUBLIC_DIR, 'images/AG_OIL[1]');

// Category name mapping
const categoryMap = {
  'AG OIL': 'Agriculture Oils',
  'Brake Fluids': 'Brake Fluids',
  'BS VI Grades': 'BS VI Grades',
  'EV and Hybrid Range': 'EV and Hybrid Range',
  'Gear AND tran': 'Gear and Transmission Oils',
  'HEAVY DUTY DIESEL ENGINE OILS': 'Heavy Duty Diesel Engine Oils',
  'Natural Gas And CNG Engine Oils': 'Natural Gas And CNG Engine Oils',
  'Outboatd Marine Oils': 'Outboard Marine Oils',
  'PASSENGER CAR ENGINE OILS': 'Passenger Car Engine Oils',
  'RADIATOR COOLANTS': 'Radiator Coolants',
  'Railroad ENGINE OILS': 'Railroad Engine Oils',
  'SHOCK ABSORBER and FRONT FORK OILS': 'Shock Absorber and Front Fork Oils',
  'THREE WHEELER ENGINE OILS': 'Three Wheeler Engine Oils',
  'TWO WHEELER ENGINE OILS': 'Two Wheeler Engine Oils',
};

// Extract product name from filename
function extractProductName(filename) {
  // Remove extensions
  let name = filename.replace(/\.(pdf|jpg|jpeg|png|gif|webp)$/i, '');
  
  // Remove date patterns like "-14-05-2019", "-15-05-2019"
  name = name.replace(/-\d{2}-\d{2}-\d{4}/g, '');
  
  // Remove version patterns like "_0", "_1", "-0", "(1)"
  name = name.replace(/[_\s]*[0-9]+$/g, '');
  name = name.replace(/\([0-9]+\)/g, '');
  
  // Remove file type indicators
  name = name.replace(/[_\s]*-[_\s]*copy/gi, '');
  
  // Clean up spacing
  name = name.replace(/\s+/g, ' ').trim();
  
  // Remove common suffixes
  name = name.replace(/\s+-\s*$/g, '');
  
  return name;
}

// Convert file path to relative URL
function convertToImageUrl(filePath) {
  // Convert Windows path to Unix-style and extract relative path
  const relativePath = filePath
    .replace(/\\/g, '/')
    .replace(/.*\/public\//, '/images/');
  return relativePath;
}

// Scan directory for products
async function scanDirectory(dirPath, categoryName, products = new Map()) {
  try {
    const items = await fs.readdir(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      
      // Skip Downloads folder and hidden files
      if (item.includes('Downloads') || item.startsWith('.')) continue;
      
      try {
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory()) {
          // Recursively scan subdirectories
          const subCategory = categoryMap[item] || item;
          await scanDirectory(fullPath, subCategory, products);
        } else if (stat.isFile()) {
          const ext = path.extname(item).toLowerCase();
          const relativePath = convertToImageUrl(fullPath);
          
          // Process PDFs (catalogs)
          if (ext === '.pdf') {
            const productName = extractProductName(item);
            const key = `${productName}::${categoryName}`;
            
            if (!products.has(key)) {
              products.set(key, {
                name: productName,
                category: categoryName,
                company_key: 'hp',
                image_url: null,
                catalog_url: relativePath,
                description: '',
                specs: '',
              });
            } else {
              // Update catalog URL if not set
              const existing = products.get(key);
              if (!existing.catalog_url) {
                existing.catalog_url = relativePath;
              }
            }
          }
          
          // Process images
          if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
            const productName = extractProductName(item);
            const key = `${productName}::${categoryName}`;
            
            if (!products.has(key)) {
              products.set(key, {
                name: productName,
                category: categoryName,
                company_key: 'hp',
                image_url: relativePath,
                catalog_url: null,
                description: '',
                specs: '',
              });
            } else {
              // Update image URL if not set
              const existing = products.get(key);
              if (!existing.image_url) {
                existing.image_url = relativePath;
              }
            }
          }
        }
      } catch (error) {
        // Skip files that can't be accessed
        console.warn(`⚠️  Skipping ${fullPath}: ${error.message}`);
        continue;
      }
    }
  } catch (error) {
    console.error(`❌ Error scanning ${dirPath}:`, error.message);
  }
  
  return products;
}

// Main migration function
async function migrateAGOilProducts() {
  console.log('🚀 Starting AG_OIL products migration...\n');
  
  // Initialize database
  try {
    console.log('📊 Initializing database...');
    await initDatabase();
    console.log('✅ Database initialized\n');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
  
  // Check if AG_OIL directory exists
  try {
    await fs.access(AG_OIL_DIR);
  } catch (error) {
    console.error(`❌ Directory not found: ${AG_OIL_DIR}`);
    process.exit(1);
  }
  
  console.log(`📁 Scanning directory: ${AG_OIL_DIR}\n`);
  
  // Discover all products
  const products = new Map();
  
  try {
    const categories = await fs.readdir(AG_OIL_DIR);
    
    for (const category of categories) {
      const categoryPath = path.join(AG_OIL_DIR, category);
      
      try {
        const categoryStat = await fs.stat(categoryPath);
        
        if (categoryStat.isDirectory() && !category.includes('Downloads') && !category.startsWith('.')) {
          const categoryName = categoryMap[category] || category;
          console.log(`📂 Scanning category: ${categoryName}`);
          await scanDirectory(categoryPath, categoryName, products);
        } else if (categoryStat.isFile()) {
          // Handle files directly in AG_OIL[1] directory
          const ext = path.extname(category).toLowerCase();
          const relativePath = convertToImageUrl(categoryPath);
          
          if (ext === '.pdf') {
            const productName = extractProductName(category);
            const key = `${productName}::Uncategorized`;
            if (!products.has(key)) {
              products.set(key, {
                name: productName,
                category: 'Uncategorized',
                company_key: 'hp',
                image_url: null,
                catalog_url: relativePath,
                description: '',
                specs: '',
              });
            }
          } else if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
            const productName = extractProductName(category);
            const key = `${productName}::Uncategorized`;
            if (!products.has(key)) {
              products.set(key, {
                name: productName,
                category: 'Uncategorized',
                company_key: 'hp',
                image_url: relativePath,
                catalog_url: null,
                description: '',
                specs: '',
              });
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️  Error processing ${category}: ${error.message}`);
      }
    }
  } catch (error) {
    console.error('❌ Error reading directory:', error.message);
    process.exit(1);
  }
  
  const productsArray = Array.from(products.values());
  console.log(`\n✅ Discovered ${productsArray.length} products\n`);
  
  // Migrate products to database
  console.log('📦 Migrating products to PostgreSQL...\n');
  
  let migrated = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  
  // Check database connection before migrating
  const pool = getPool();
  if (!pool) {
    console.error('\n❌ Database connection not available!');
    console.error('   Please ensure:');
    console.error('   1. PostgreSQL is running');
    console.error('   2. DATABASE_URL or POSTGRES_URL environment variable is set');
    console.error('   3. Database credentials are correct');
    console.error('\n   You can set the environment variable in a .env file or export it:');
    console.error('   export DATABASE_URL="postgresql://user:password@host:port/database"');
    console.error('\n   Discovered products will be saved to a JSON file for later migration.\n');
    
    // Save discovered products to JSON file
    const outputPath = path.join(__dirname, 'discovered-ag-oil-products.json');
    await fs.writeFile(outputPath, JSON.stringify({ products: productsArray }, null, 2));
    console.log(`📝 Discovered products saved to: ${outputPath}`);
    console.log(`   You can migrate them later when the database is available.`);
    process.exit(1);
  }
  
  // Test database connection with a simple query
  try {
    await query('SELECT 1');
    console.log('✅ Database connection verified\n');
  } catch (error) {
    console.error('\n❌ Database connection test failed!');
    console.error(`   Error: ${error.message}`);
    console.error('\n   Discovered products will be saved to a JSON file for later migration.\n');
    
    // Save discovered products to JSON file
    const outputPath = path.join(__dirname, 'discovered-ag-oil-products.json');
    await fs.writeFile(outputPath, JSON.stringify({ products: productsArray }, null, 2));
    console.log(`📝 Discovered products saved to: ${outputPath}`);
    console.log(`   You can migrate them later when the database is available.`);
    process.exit(1);
  }

  for (const product of productsArray) {
    try {
      // Check if product already exists (by name and category)
      const existingResult = await query(
        'SELECT id FROM products WHERE name = $1 AND category_name = $2 AND company_key = $3',
        [product.name, product.category, product.company_key]
      );
      
      if (existingResult.rows.length > 0) {
        // Update existing product
        const productId = existingResult.rows[0].id;
        await productsDB.update(productId, {
          name: product.name,
          company_key: product.company_key,
          category_name: product.category,
          description: product.description,
          specs: product.specs,
          image_url: product.image_url,
          catalog_url: product.catalog_url,
        });
        updated++;
        console.log(`  ✏️  Updated: ${product.name} (${product.category})`);
      } else {
        // Create new product
        await productsDB.create(product);
        migrated++;
        console.log(`  ➕ Created: ${product.name} (${product.category})`);
      }
    } catch (error) {
      errors++;
      console.error(`  ❌ Error migrating ${product.name}: ${error.message}`);
      if (error.code) {
        console.error(`     Error code: ${error.code}`);
      }
    }
  }
  
  console.log(`\n📊 Migration Summary:`);
  console.log(`   ✅ Created: ${migrated}`);
  console.log(`   ✏️  Updated: ${updated}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`\n🎉 Migration completed!`);
}

// Run migration
migrateAGOilProducts().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});

