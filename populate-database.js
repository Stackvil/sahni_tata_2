#!/usr/bin/env node
/**
 * Simple script to populate the database from JSON files
 * Run: node populate-database.js
 * 
 * Make sure you have:
 * 1. Set up your .env file in backend/ with DATABASE_URL
 * 2. JSON files in backend/data/ folder
 */

import { migrateAllData } from './backend/routes/migrate.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: resolve(__dirname, 'backend/.env') });

async function main() {
  console.log('🚀 Starting database population...\n');
  console.log('📝 Make sure your DATABASE_URL is set in backend/.env\n');
  
  try {
    // Run migration (includes database initialization)
    const result = await migrateAllData();
    
    if (result.success) {
      console.log('\n✨ Migration completed successfully!');
      if (result.results) {
        console.log('\n📊 Results:');
        console.log(JSON.stringify(result.results, null, 2));
      }
      console.log('\n✅ Your database is now populated!');
      console.log('   You can now view the data in Prisma Studio or via your API endpoints.');
      process.exit(0);
    } else {
      console.error('\n❌ Migration failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check that DATABASE_URL is set in backend/.env');
    console.error('   2. Verify that JSON files exist in backend/data/');
    console.error('   3. Ensure database connection is working');
    process.exit(1);
  }
}

main();

