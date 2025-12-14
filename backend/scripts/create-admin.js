import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_FILE = path.join(__dirname, '../../public/users.json');

async function createAdmin() {
  try {
    // Read existing users
    let users = [];
    try {
      const data = await fs.readFile(USERS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      users = parsed.users || [];
    } catch (e) {
      // File doesn't exist or is empty, start fresh
      users = [];
    }

    // Default admin credentials
    const adminEmail = 'admin@sahni.com';
    const adminPassword = 'admin123';
    const adminUsername = 'admin';

    // Check if admin already exists
    const existingAdmin = users.find(u => u.email === adminEmail);
    if (existingAdmin) {
      console.log('✅ Admin user already exists!');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   ID: ${existingAdmin.id}`);
      console.log('\n📝 To reset password, delete the user from users.json and run this script again.');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    const adminUser = {
      id: users.length + 1,
      username: adminUsername,
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date().toISOString()
    };

    users.push(adminUser);
    await fs.writeFile(USERS_FILE, JSON.stringify({ users }, null, 2), 'utf-8');

    console.log('✅ Admin user created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('\n🔗 Login URL: http://localhost:5173/#admin-login');
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
}

createAdmin();

