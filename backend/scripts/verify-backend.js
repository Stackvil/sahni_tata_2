import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

const endpoints = [
  { method: 'GET', path: '/health', name: 'Health Check' },
  { method: 'GET', path: '/products?page=1&limit=5', name: 'Products' },
  { method: 'GET', path: '/vehicles?page=1&limit=5', name: 'Vehicles' },
  { method: 'GET', path: '/massey/products', name: 'Massey Products' },
  { method: 'GET', path: '/massey/categories', name: 'Massey Categories' },
  { method: 'GET', path: '/showrooms', name: 'Showrooms' },
  { method: 'GET', path: '/fuelStations?page=1&limit=5', name: 'Fuel Stations' },
  { method: 'GET', path: '/home/video', name: 'Home Video' },
  { method: 'GET', path: '/about', name: 'About' },
];

async function testEndpoint(method, path, name) {
  try {
    const url = `${API_BASE}${path}`;
    const response = await fetch(url, { method });
    const status = response.status;
    const ok = response.ok;
    
    let data = null;
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
    } catch (e) {
      // Ignore parse errors
    }

    if (ok) {
      console.log(`✅ ${name}: ${status} OK`);
      if (data && typeof data === 'object') {
        if (Array.isArray(data)) {
          console.log(`   Found ${data.length} items`);
        } else if (data.data && Array.isArray(data.data)) {
          console.log(`   Found ${data.data.length} items`);
        } else if (data.products && Array.isArray(data.products)) {
          console.log(`   Found ${data.products.length} products`);
        } else if (data.vehicles && Array.isArray(data.vehicles)) {
          console.log(`   Found ${data.vehicles.length} vehicles`);
        }
      }
      return true;
    } else {
      console.log(`❌ ${name}: ${status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name}: Error - ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔍 Verifying Backend Endpoints...\n');
  console.log(`📍 Backend URL: ${API_BASE}\n`);

  let passed = 0;
  let failed = 0;

  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint.method, endpoint.path, endpoint.name);
    if (result) {
      passed++;
    } else {
      failed++;
    }
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('\n✅ All endpoints are working!');
  } else {
    console.log('\n⚠️  Some endpoints failed. Please check the backend server.');
  }
}

main().catch(console.error);

