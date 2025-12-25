import { initDatabase, query } from '../config/database.js';
import { awardsDB } from '../utils/dbManager.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '../../');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');

async function migrateAwardsFromJSON() {
  try {
    console.log('🏆 Migrating awards from JSON file...\n');
    
    // Initialize database
    console.log('📊 Initializing database...');
    const initResult = await initDatabase();
    if (!initResult.success) {
      console.error('❌ Database initialization failed:', initResult.message);
      process.exit(1);
    }
    console.log('✅ Database initialized\n');
    
    // Read awards from JSON file
    const jsonPath = path.join(PUBLIC_DIR, 'awards.json');
    console.log(`📖 Reading awards from: ${jsonPath}`);
    const jsonData = await fs.readFile(jsonPath, 'utf-8');
    const data = JSON.parse(jsonData);
    const awards = data.awards || [];
    
    console.log(`✅ Found ${awards.length} awards in JSON file\n`);
    
    let migrated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const award of awards) {
      try {
        // Check if award already exists
        const existing = await query(
          'SELECT id FROM awards WHERE brand = $1 AND award_text = $2 LIMIT 1',
          [award.brand, award.award_text]
        );
        
        if (existing.rows.length > 0) {
          console.log(`⏭️  Skipping existing award: ${award.award_text}`);
          skipped++;
          continue;
        }
        
        // Create new award
        await awardsDB.create({
          brand: award.brand,
          logo_url: award.logo_url || null,
          award_text: award.award_text,
          year: award.year || null,
          display_order: award.display_order || 0
        });
        
        console.log(`✅ Migrated: ${award.award_text} (${award.brand})`);
        migrated++;
      } catch (error) {
        console.error(`❌ Error migrating award "${award.award_text}":`, error.message);
        errors++;
      }
    }
    
    console.log('\n✨ Migration complete!');
    console.log(`   ✅ Migrated: ${migrated} awards`);
    console.log(`   ⏭️  Skipped: ${skipped} existing awards`);
    if (errors > 0) {
      console.log(`   ❌ Errors: ${errors} awards`);
    }
    
    return { migrated, skipped, errors };
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run migration
migrateAwardsFromJSON()
  .then(() => {
    console.log('\n📝 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

