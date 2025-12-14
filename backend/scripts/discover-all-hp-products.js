import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, '../../public');

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
  
  // Clean up HP prefix variations
  if (!name.toUpperCase().startsWith('HP ')) {
    name = 'HP ' + name;
  }
  
  // Clean up spacing
  name = name.replace(/\s+/g, ' ').trim();
  
  // Remove common suffixes
  name = name.replace(/\s+-\s*$/g, '');
  
  return name;
}

// Scan directory for products
async function scanDirectory(dirPath, categoryName, products = new Map()) {
  try {
    const items = await fs.readdir(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      
      // Skip Downloads folder
      if (item.includes('Downloads')) continue;
      
      try {
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory()) {
          // Recursively scan subdirectories
          const subCategory = categoryMap[item] || item;
          await scanDirectory(fullPath, subCategory, products);
        } else if (stat.isFile()) {
          const ext = path.extname(item).toLowerCase();
          
          // Process PDFs (catalogs)
          if (ext === '.pdf') {
            const productName = extractProductName(item);
            const relativePath = fullPath.replace(/\\/g, '/').replace(/.*\/public\//, '/images/');
            
            if (!products.has(productName)) {
              products.set(productName, {
                name: productName,
                category: categoryName,
                image_url: null,
                catalog_url: relativePath,
              });
            } else {
              // Update catalog URL if not set
              const existing = products.get(productName);
              if (!existing.catalog_url) {
                existing.catalog_url = relativePath;
              }
            }
          }
          
          // Process images
          if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
            const productName = extractProductName(item);
            const relativePath = fullPath.replace(/\\/g, '/').replace(/.*\/public\//, '/images/');
            
            if (!products.has(productName)) {
              products.set(productName, {
                name: productName,
                category: categoryName,
                image_url: relativePath,
                catalog_url: null,
              });
            } else {
              // Update image URL if not set
              const existing = products.get(productName);
              if (!existing.image_url) {
                existing.image_url = relativePath;
              }
            }
          }
        }
      } catch (error) {
        // Skip files that can't be accessed
        continue;
      }
    }
  } catch (error) {
    console.error(`Error scanning ${dirPath}:`, error.message);
  }
  
  return products;
}

// Main discovery function
async function discoverAllHPProducts() {
  const agOilDir = path.join(PUBLIC_DIR, 'images/AG_OIL[1]');
  
  console.log('🔍 Discovering all HP products from filesystem...\n');
  
  if (!await fs.access(agOilDir).then(() => true).catch(() => false)) {
    console.error(`❌ Directory not found: ${agOilDir}`);
    return;
  }
  
  const products = new Map();
  
  // Scan all subdirectories
  try {
    const categories = await fs.readdir(agOilDir);
    
    for (const category of categories) {
      const categoryPath = path.join(agOilDir, category);
      const categoryStat = await fs.stat(categoryPath);
      
      if (categoryStat.isDirectory() && !category.includes('Downloads')) {
        const categoryName = categoryMap[category] || category;
        console.log(`📁 Scanning category: ${categoryName}`);
        await scanDirectory(categoryPath, categoryName, products);
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  // Convert map to array and sort by category
  const productsArray = Array.from(products.values());
  
  // Group by category
  const productsByCategory = {};
  for (const product of productsArray) {
    if (!productsByCategory[product.category]) {
      productsByCategory[product.category] = [];
    }
    productsByCategory[product.category].push(product);
  }
  
  // Sort products within each category by name
  for (const category in productsByCategory) {
    productsByCategory[category].sort((a, b) => a.name.localeCompare(b.name));
  }
  
  console.log(`\n✅ Discovered ${productsArray.length} unique products across ${Object.keys(productsByCategory).length} categories\n`);
  
  // Generate product array format
  let output = 'const hpLubricantsProducts = [\n';
  
  const sortedCategories = Object.keys(productsByCategory).sort();
  
  for (let catIdx = 0; catIdx < sortedCategories.length; catIdx++) {
    const category = sortedCategories[catIdx];
    const categoryProducts = productsByCategory[category];
    
    output += `\n  // ${category} - ${categoryProducts.length} products\n`;
    
    for (let prodIdx = 0; prodIdx < categoryProducts.length; prodIdx++) {
      const product = categoryProducts[prodIdx];
      
      output += `  { \n`;
      output += `    name: '${product.name}', \n`;
      output += `    category: '${product.category}', \n`;
      output += `    description: '', \n`;
      output += `    specs: '', \n`;
      output += `    image_url: ${product.image_url ? `'${product.image_url}'` : 'null'}, \n`;
      output += `    catalog_url: ${product.catalog_url ? `'${product.catalog_url}'` : 'null'} \n`;
      output += `  }`;
      
      if (catIdx < sortedCategories.length - 1 || prodIdx < categoryProducts.length - 1) {
        output += ',';
      }
      
      output += '\n';
    }
  }
  
  output += '];\n';
  
  // Write to file
  const outputPath = path.join(__dirname, 'discovered-hp-products.json');
  await fs.writeFile(outputPath, JSON.stringify({ products: productsArray, productsByCategory }, null, 2));
  
  console.log(`📝 Full product list saved to: ${outputPath}`);
  console.log(`\n📋 Summary by category:`);
  for (const category of sortedCategories) {
    console.log(`   ${category}: ${productsByCategory[category].length} products`);
  }
  
  console.log(`\n💡 Product array format:\n`);
  console.log(output);
}

// Run discovery
discoverAllHPProducts().catch(console.error);

