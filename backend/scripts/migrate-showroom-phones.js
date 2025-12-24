import { query } from '../config/database.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateShowroomPhones() {
  try {
    console.log('🔄 Starting showroom phone numbers migration...\n');

    // Add columns if they don't exist
    console.log('1. Adding sales_phone and service_phone columns...');
    await query(`
      ALTER TABLE showrooms 
      ADD COLUMN IF NOT EXISTS sales_phone VARCHAR(50),
      ADD COLUMN IF NOT EXISTS service_phone VARCHAR(50)
    `);
    console.log('✅ Columns added successfully\n');

    // Read showrooms.json to get the latest data
    const jsonPath = path.join(__dirname, '../data/showrooms.json');
    const jsonData = JSON.parse(await fs.readFile(jsonPath, 'utf-8'));
    const showrooms = jsonData.showrooms || [];

    console.log(`2. Updating ${showrooms.length} showrooms...`);

    for (const showroom of showrooms) {
      if (showroom.sales_phone || showroom.service_phone) {
        const updateData = {
          phone: showroom.phone || null,
          sales_phone: showroom.sales_phone || showroom.phone || null,
          service_phone: showroom.service_phone || showroom.phone || null,
        };

        // Update by city (since IDs might not match exactly)
        await query(
          `UPDATE showrooms 
           SET phone = $1, 
               sales_phone = $2, 
               service_phone = $3,
               updated_at = CURRENT_TIMESTAMP
           WHERE city = $4`,
          [updateData.phone, updateData.sales_phone, updateData.service_phone, showroom.city]
        );

        console.log(`   ✅ Updated ${showroom.city}`);
      }
    }

    // For any remaining showrooms without sales_phone or service_phone, set them to phone
    console.log('\n3. Setting default values for remaining showrooms...');
    await query(`
      UPDATE showrooms 
      SET sales_phone = COALESCE(sales_phone, phone),
          service_phone = COALESCE(service_phone, phone)
      WHERE sales_phone IS NULL OR service_phone IS NULL
    `);
    console.log('✅ Default values set\n');

    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

migrateShowroomPhones();

