import { productsDB } from '../utils/dbManager.js';
import { initDatabase } from '../config/database.js';

// Remove catalog paths from specs field
async function removeCatalogFromSpecs() {
  try {
    console.log('🚀 Initializing database connection...');
    const initResult = await initDatabase();
    
    if (!initResult.success) {
      console.error('❌ Database initialization failed:', initResult.message);
      process.exit(1);
    }
    
    console.log('✅ Database connection established\n');

    // Get all HP products
    const allProducts = await productsDB.getAll(1, 10000);
    const hpProducts = allProducts.products.filter(p => p.company_key === 'hp');
    
    console.log(`📦 Found ${hpProducts.length} HP products to update\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < hpProducts.length; i++) {
      const product = hpProducts[i];
      const progress = `[${i + 1}/${hpProducts.length}]`;
      
      try {
        // Remove catalog path from specs if present
        let cleanSpecs = product.specs || '';
        
        // Remove catalog line if it exists
        cleanSpecs = cleanSpecs.replace(/Catalog:.*$/i, '').trim();
        cleanSpecs = cleanSpecs.replace(/\n\nCatalog:.*$/i, '').trim();
        cleanSpecs = cleanSpecs.replace(/Catalog:.*\n/gi, '').trim();
        
        // Update product with cleaned specs
        await productsDB.update(product.id, {
          name: product.name,
          company_key: product.company_key,
          category_name: product.category_name,
          description: product.description,
          specs: cleanSpecs,
          image_url: product.image_url
        });

        console.log(`  ${progress} ✅ Updated: ${product.name}`);
        successCount++;
      } catch (error) {
        console.error(`  ${progress} ❌ Failed to update "${product.name}":`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Update Summary:');
    console.log(`   ✅ Successfully updated: ${successCount} products`);
    console.log(`   ❌ Errors: ${errorCount} products`);
    console.log('='.repeat(60));

    console.log('\n✨ Catalog removal from specs completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the fix
removeCatalogFromSpecs();

