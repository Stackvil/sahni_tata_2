// Script to migrate data via API endpoint
// Use native fetch (Node 18+)
const API_URL = process.env.VITE_API_URL || 'https://sahni-tata-2.vercel.app';
const ADMIN_EMAIL = 'admin@sahni.com';
const ADMIN_PASSWORD = 'admin123';

async function migrateViaAPI() {
  try {
    console.log('🔐 Step 1: Logging in to get JWT token...');
    
    // Login to get token (auth route uses query params)
    const loginUrl = `${API_URL}/api/auth/login?email=${encodeURIComponent(ADMIN_EMAIL)}&password=${encodeURIComponent(ADMIN_PASSWORD)}`;
    console.log(`📡 Calling: ${loginUrl.replace(ADMIN_PASSWORD, '***')}`);
    
    const loginResponse = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      throw new Error(`Login failed: ${loginResponse.status} - ${errorText}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.access_token;

    if (!token) {
      throw new Error('No token received from login');
    }

    console.log('✅ Login successful!');
    console.log(`📝 Token: ${token.substring(0, 20)}...`);
    console.log('\n🚀 Step 2: Starting migration...\n');

    // Call migrate endpoint
    const migrateResponse = await fetch(`${API_URL}/api/migrate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!migrateResponse.ok) {
      const errorText = await migrateResponse.text();
      throw new Error(`Migration failed: ${migrateResponse.status} - ${errorText}`);
    }

    const migrateData = await migrateResponse.json();
    
    console.log('\n✨ Migration completed successfully!');
    console.log('\n📊 Results:');
    console.log(JSON.stringify(migrateData, null, 2));
    
    if (migrateData.results) {
      console.log('\n📈 Summary:');
      Object.entries(migrateData.results).forEach(([key, value]) => {
        if (value && typeof value === 'object' && 'migrated' in value) {
          console.log(`  ${key}: ${value.migrated} migrated${value.skipped ? `, ${value.skipped} skipped` : ''}`);
        }
      });
    }

    console.log('\n✅ All done!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

migrateViaAPI();

