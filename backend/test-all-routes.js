// Quick test script to verify all routes
import fetch from 'node-fetch';

const BASE = 'http://localhost:3001';

const routes = [
  { method: 'GET', path: '/api/health', name: 'Health Check' },
  { method: 'GET', path: '/api/products?page=1&limit=5', name: 'Products' },
  { method: 'GET', path: '/api/products/1', name: 'Product by ID' },
  { method: 'GET', path: '/api/vehicles?page=1&limit=5', name: 'Vehicles' },
  { method: 'GET', path: '/api/vehicles/1', name: 'Vehicle by ID' },
  { method: 'GET', path: '/api/massey/products', name: 'Massey Products' },
  { method: 'GET', path: '/api/massey/categories', name: 'Massey Categories' },
  { method: 'GET', path: '/api/showrooms', name: 'Showrooms' },
  { method: 'GET', path: '/api/fuelStations?page=1&limit=5', name: 'Fuel Stations' },
  { method: 'GET', path: '/api/home/video', name: 'Home Video' },
  { method: 'GET', path: '/api/about', name: 'About' },
];

async function testRoute(method, path, name) {
  try {
    const url = `${BASE}${path}`;
    const response = await fetch(url, { method });
    const status = response.status;
    
    if (status === 200 || status === 201) {
      console.log(`✅ ${name}: ${status} OK`);
      return true;
    } else if (status === 404) {
      console.log(`❌ ${name}: ${status} NOT FOUND - ${path}`);
      return false;
    } else {
      console.log(`⚠️  ${name}: ${status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name}: ERROR - ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔍 Testing All Backend Routes...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const route of routes) {
    const result = await testRoute(route.method, route.path, route.name);
    if (result) passed++;
    else failed++;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('\n✅ All routes are working!');
  } else {
    console.log('\n⚠️  Some routes failed. Check the errors above.');
  }
}

main().catch(console.error);

