import dotenv from 'dotenv';
import { initDatabase } from '../config/database.js';

dotenv.config();

async function main() {
  try {
    console.log('🔧 Initializing database...');
    await initDatabase();
    console.log('✅ Database initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

main();

