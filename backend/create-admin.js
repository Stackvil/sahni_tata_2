#!/usr/bin/env node
/**
 * Create admin user in database
 * Run: node create-admin.js
 */

import bcrypt from 'bcryptjs';
import { initDatabase, query } from './config/database.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env') });

const adminEmail = 'admin@sahni.com';
const adminPassword = 'admin123';
const adminUsername = 'admin';

async function createAdmin() {
  console.log('🔐 Creating admin user...\n');
  
  try {
    // Initialize database first
    console.log('📊 Initializing database...');
    const initResult = await initDatabase();
    
    if (!initResult.success) {
      console.error('❌ Database initialization failed:', initResult.message);
      process.exit(1);
    }
    
    console.log('✅ Database initialized\n');
    
    // Check if admin already exists
    const existingAdmin = await query(
      'SELECT * FROM users WHERE email = $1',
      [adminEmail]
    );
    
    let adminUser;
    
    if (existingAdmin.rows.length > 0) {
      console.log('ℹ️  Admin user already exists, updating with correct credentials...');
      
      // Update existing admin user with correct password and username
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const updateResult = await query(
        `UPDATE users 
         SET username = $1, password = $2, role = $3 
         WHERE email = $4
         RETURNING id, username, email, role`,
        [adminUsername, hashedPassword, 'admin', adminEmail]
      );
      
      adminUser = updateResult.rows[0];
      console.log('✅ Admin user updated successfully!');
    } else {
      // Create admin user
      console.log('👤 Creating admin user...');
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      const result = await query(
        `INSERT INTO users (username, email, password, role, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING id, username, email, role`,
        [adminUsername, adminEmail, hashedPassword, 'admin']
      );
      
      adminUser = result.rows[0];
      console.log('✅ Admin user created successfully!');
    }
    
    console.log('\n📋 Admin User Details:');
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Username: ${adminUser.username}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log('\n🔑 Login Credentials:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('\n✅ You can now log in to the admin panel!');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

createAdmin();

