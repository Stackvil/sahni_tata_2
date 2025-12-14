#!/usr/bin/env node
/**
 * Populate database from JSON files
 * Run from backend directory: node populate-db.js
 */

import { migrateAllData } from './scripts/migrate-all-to-postgres.js';

console.log('🚀 Starting database population...\n');

migrateAllData()
  .then(() => {
    console.log('\n✅ Database populated successfully!');
    console.log('   You can now view the data in Prisma Studio.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  });

