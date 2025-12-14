import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Comprehensive Data Upload Script
 * 
 * This script uploads all data (vehicles, products) to the backend API.
 * 
 * Usage:
 *   node upload-all-data.js [--email=your@email.com] [--password=yourpassword] [--url=http://localhost:8000]
 * 
 * Environment Variables:
 *   VITE_API_URL - Backend API URL (default: http://localhost:8000/prod/api)
 *   ADMIN_EMAIL - Admin email for authentication
 *   ADMIN_PASSWORD - Admin password for authentication
 */

// Configuration
const BACKEND_URL = process.argv.find(arg => arg.startsWith('--url='))?.split('=')[1] || 'http://localhost:8000';
// Try both /api and /prod/api - backend might be behind reverse proxy
const API_BASE_URL = process.env.API_BASE_PATH ? `${BACKEND_URL}${process.env.API_BASE_PATH}` : `${BACKEND_URL}/api`;
const PROD_API_BASE_URL = `${BACKEND_URL}/prod/api`;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.argv.find(arg => arg.startsWith('--email='))?.split('=')[1] || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.argv.find(arg => arg.startsWith('--password='))?.split('=')[1] || '';

let authToken = null;

// Authentication
async function authenticate() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.warn('⚠️  No credentials provided. Some endpoints may require authentication.');
    console.warn('   Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables or use --email= and --password= flags');
    return null;
  }

  try {
    console.log('🔐 Authenticating...');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Endpoint: ${API_BASE_URL}/auth/login`);
    
    // Try multiple authentication endpoint formats
    // Backend might be at /api or /prod/api
    const endpoints = [
      { url: `${API_BASE_URL}/auth/login`, method: 'query' },
      { url: `${API_BASE_URL}/auth/login`, method: 'body' },
      { url: `${PROD_API_BASE_URL}/auth/login`, method: 'query' },
      { url: `${PROD_API_BASE_URL}/auth/login`, method: 'body' },
    ];
    
    let lastError = null;
    
    for (const endpointConfig of endpoints) {
      try {
        let response;
        
        if (endpointConfig.method === 'query') {
          // Try query parameters (as used in api.ts)
          const params = new URLSearchParams({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
          });
          response = await fetch(`${endpointConfig.url}?${params}`, {
            method: 'POST',
          });
        } else {
          // Try form-urlencoded body
          response = await fetch(endpointConfig.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              email: ADMIN_EMAIL,
              password: ADMIN_PASSWORD,
            }),
          });
        }
        
        if (response.ok) {
          const data = await response.json();
          authToken = data.access_token || data.token;
          console.log(`✅ Authentication successful using: ${endpointConfig.url} (${endpointConfig.method})\n`);
          return authToken;
        } else {
          const errorText = await response.text().catch(() => 'Unknown error');
          lastError = `Status: ${response.status} - ${errorText}`;
        }
      } catch (error) {
        lastError = error.message;
        continue;
      }
    }
    
    console.error(`❌ Authentication failed on all endpoints. Last error: ${lastError}`);
    console.error('   Please check:');
    console.error('   1. Admin credentials are correct');
    console.error('   2. Backend authentication endpoint is correct');
    console.error('   3. Backend server is running and accessible');
    return null;
  } catch (error) {
    console.error('❌ Authentication error:', error.message);
    return null;
  }
}

// Transform vehicle to backend format
function transformVehicleToBackendFormat(vehicle) {
  // Transform images array: ["/path/image.jpg"] -> [{ "image": "/path/image.jpg" }]
  const transformedImages = (vehicle.images || []).map(img => ({
    image: img
  }));

  // Transform features array: ["Feature 1", "Feature 2"] -> [{ "feature": "Feature 1" }, { "feature": "Feature 2" }]
  const transformedFeatures = (vehicle.features || []).map(feature => ({
    feature: feature
  }));

  // Transform specs object: { "engine": "V8", "power": "200HP" } -> [{ "key": "engine", "value": "V8" }, { "key": "power", "value": "200HP" }]
  const transformedSpecs = [];
  if (vehicle.specs && typeof vehicle.specs === 'object') {
    for (const [key, value] of Object.entries(vehicle.specs)) {
      if (value !== null && value !== undefined && value !== '') {
        transformedSpecs.push({
          key: key,
          value: String(value)
        });
      }
    }
  }

  // Return transformed vehicle (remove id as backend will generate UUID)
  return {
    name: vehicle.name,
    category: vehicle.category,
    subcategory: vehicle.subcategory,
    description: vehicle.description || '',
    size: vehicle.size || 'medium',
    popular: vehicle.popular || false,
    specs: transformedSpecs,
    images: transformedImages,
    features: transformedFeatures,
    // Include price if available (backend might support it)
    ...(vehicle.price && { price: vehicle.price })
  };
}

// Upload vehicle
async function uploadVehicle(vehicle, token = null) {
  // Try both /api and /prod/api endpoints
  const endpoints = [`${API_BASE_URL}/vehicles/`, `${PROD_API_BASE_URL}/vehicles/`];
  
  for (const endpoint of endpoints) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Transform vehicle to backend format
      const transformedVehicle = transformVehicleToBackendFormat(vehicle);

      // Try POST to create vehicle
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(transformedVehicle),
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data, method: 'POST' };
      } else if (response.status === 409 || response.status === 422) {
        // Vehicle might already exist
        const errorText = await response.text();
        console.warn(`  ⚠️  Vehicle ${vehicle.id} might already exist, skipping...`);
        return { success: false, error: `Already exists: ${errorText}`, skip: true };
      } else if (response.status === 403) {
        // Authentication failed - if no token, try next endpoint
        if (!token && endpoint !== endpoints[endpoints.length - 1]) {
          continue;
        }
        const errorText = await response.text();
        return { success: false, error: `HTTP ${response.status}: Authentication required - ${errorText}` };
      } else {
        // Other error - if not last endpoint, try next
        if (endpoint !== endpoints[endpoints.length - 1]) {
          continue;
        }
        const errorText = await response.text();
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }
    } catch (error) {
      // If this is the last endpoint, return error
      if (endpoint === endpoints[endpoints.length - 1]) {
        return { success: false, error: error.message };
      }
      // Otherwise try next endpoint
      continue;
    }
  }
  
  // All endpoints failed
  return { success: false, error: 'All endpoints failed' };
}

// Upload product
async function uploadProduct(product, token = null) {
  // Try both /api and /prod/api endpoints
  const endpoints = [`${API_BASE_URL}/products/`, `${PROD_API_BASE_URL}/products/`];
  
  for (const endpoint of endpoints) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        // If no token, skip this endpoint and try next
        continue;
      }

      // Products API might expect query params OR JSON body - try JSON body first
      const productData = {
        name: product.name,
        company_key: product.company || 'hp',
        category_name: product.category || 'automotive',
        description: product.description || '',
        specs: product.specs || '',
        image: product.image || '',
      };

      // Try POST to create product with JSON body
      let response = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(productData),
      });

      // If that fails with 415 (Unsupported Media Type), try query params
      if (response.status === 415 || response.status === 400) {
        const queryParams = new URLSearchParams({
          name: productData.name,
          company_key: productData.company_key,
          category_name: productData.category_name,
        });
        if (productData.description) queryParams.append('description', productData.description);
        if (productData.specs) queryParams.append('specs', productData.specs);
        if (productData.image) queryParams.append('image', productData.image);
        
        response = await fetch(`${endpoint}?${queryParams}`, {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
      }

      if (response.ok) {
        const data = await response.json();
        return { success: true, data, method: 'POST' };
      } else if (response.status === 409 || response.status === 422) {
        const errorText = await response.text();
        console.warn(`  ⚠️  Product ${product.id} might already exist, skipping...`);
        return { success: false, error: `Already exists: ${errorText}`, skip: true };
      } else if (response.status === 403) {
        // Authentication failed - try next endpoint or return error
        const errorText = await response.text();
        if (endpoint === endpoints[endpoints.length - 1]) {
          // Last endpoint failed, return error
          return { success: false, error: `HTTP ${response.status}: Authentication failed - ${errorText}` };
        }
        // Try next endpoint
        continue;
      } else {
        // Other error - if not last endpoint, try next
        if (endpoint !== endpoints[endpoints.length - 1]) {
          continue;
        }
        const errorText = await response.text();
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }
    } catch (error) {
      // If this is the last endpoint, return error
      if (endpoint === endpoints[endpoints.length - 1]) {
        return { success: false, error: error.message };
      }
      // Otherwise try next endpoint
      continue;
    }
  }
  
  // All endpoints failed
  return { success: false, error: 'All endpoints failed' };
}

// Upload all vehicles
async function uploadVehicles(token) {
  console.log('🚗 UPLOADING VEHICLES');
  console.log('='.repeat(60));

  const vehiclesPath = path.join(__dirname, 'public', 'vehicles.json');
  if (!fs.existsSync(vehiclesPath)) {
    console.error('❌ vehicles.json not found');
    return { successful: 0, failed: 0, skipped: 0 };
  }

  const vehiclesData = JSON.parse(fs.readFileSync(vehiclesPath, 'utf8'));
  const vehicles = vehiclesData.vehicles || [];

  console.log(`Found ${vehicles.length} vehicles to upload\n`);

  const results = {
    successful: [],
    failed: [],
    skipped: [],
  };

  for (let i = 0; i < vehicles.length; i++) {
    const vehicle = vehicles[i];
    const vehicleNum = i + 1;
    
    console.log(`[${vehicleNum}/${vehicles.length}] ${vehicle.name} (ID: ${vehicle.id})...`);

    const result = await uploadVehicle(vehicle, token);

    if (result.success) {
      const backendId = result.data?.id || result.data?._id || 'unknown';
      console.log(`  ✅ Uploaded successfully (Backend ID: ${backendId})`);
      results.successful.push({ id: vehicle.id, name: vehicle.name, backendId });
    } else if (result.skip) {
      console.log(`  ⏭️  Skipped (already exists or duplicate)`);
      results.skipped.push({ id: vehicle.id, name: vehicle.name });
    } else {
      console.error(`  ❌ Failed: ${result.error}`);
      results.failed.push({ id: vehicle.id, name: vehicle.name, error: result.error });
    }

    // Small delay between requests to avoid overwhelming the server
    if (i < vehicles.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('VEHICLES UPLOAD SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total: ${vehicles.length}`);
  console.log(`✅ Successful: ${results.successful.length}`);
  console.log(`⏭️  Skipped: ${results.skipped.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log('='.repeat(60) + '\n');

  return results;
}

// Upload all products
async function uploadProducts(token) {
  console.log('📦 UPLOADING PRODUCTS');
  console.log('='.repeat(60));

  const productsPath = path.join(__dirname, 'public', 'products.json');
  if (!fs.existsSync(productsPath)) {
    console.error('❌ products.json not found');
    return { successful: 0, failed: 0, skipped: 0 };
  }

  const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
  const products = productsData.products || [];

  console.log(`Found ${products.length} products to upload\n`);

  const results = {
    successful: [],
    failed: [],
    skipped: [],
  };

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const productNum = i + 1;
    
    console.log(`[${productNum}/${products.length}] ${product.name} (ID: ${product.id})...`);

    const result = await uploadProduct(product, token);

    if (result.success) {
      const backendId = result.data?.id || result.data?._id || 'unknown';
      console.log(`  ✅ Uploaded successfully (Backend ID: ${backendId})`);
      results.successful.push({ id: product.id, name: product.name, backendId });
    } else if (result.skip) {
      console.log(`  ⏭️  Skipped (already exists or duplicate)`);
      results.skipped.push({ id: product.id, name: product.name });
    } else {
      console.error(`  ❌ Failed: ${result.error}`);
      results.failed.push({ id: product.id, name: product.name, error: result.error });
    }

    // Small delay between requests to avoid overwhelming the server
    if (i < products.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('PRODUCTS UPLOAD SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total: ${products.length}`);
  console.log(`✅ Successful: ${results.successful.length}`);
  console.log(`⏭️  Skipped: ${results.skipped.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log('='.repeat(60) + '\n');

  return results;
}

// Upload fuel stations
async function uploadFuelStations(token) {
  console.log('⛽ UPLOADING FUEL STATIONS');
  console.log('='.repeat(60));

  const fuelStationsPath = path.join(__dirname, 'public', 'fuelStations.json');
  if (!fs.existsSync(fuelStationsPath)) {
    console.error('❌ fuelStations.json not found');
    return { successful: 0, failed: 0, skipped: 0 };
  }

  const fuelStationsData = JSON.parse(fs.readFileSync(fuelStationsPath, 'utf8'));
  const fuelStations = fuelStationsData.fuelStations || [];

  console.log(`Found ${fuelStations.length} fuel stations to upload\n`);

  const results = {
    successful: [],
    failed: [],
    skipped: [],
  };

  for (let i = 0; i < fuelStations.length; i++) {
    const station = fuelStations[i];
    const stationNum = i + 1;
    
    console.log(`[${stationNum}/${fuelStations.length}] ${station.name || station.location}...`);

    try {
      const headers = {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/fuelStations/`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(station),
      });

      if (response.ok) {
        const data = await response.json();
        const backendId = data.id || data._id || 'unknown';
        console.log(`  ✅ Uploaded successfully (Backend ID: ${backendId})`);
        results.successful.push({ name: station.name || station.location, backendId });
      } else if (response.status === 409 || response.status === 422) {
        console.log(`  ⏭️  Skipped (already exists or duplicate)`);
        results.skipped.push({ name: station.name || station.location });
      } else {
        const errorText = await response.text();
        console.error(`  ❌ Failed: HTTP ${response.status}: ${errorText}`);
        results.failed.push({ name: station.name || station.location, error: `HTTP ${response.status}: ${errorText}` });
      }
    } catch (error) {
      console.error(`  ❌ Failed: ${error.message}`);
      results.failed.push({ name: station.name || station.location, error: error.message });
    }

    if (i < fuelStations.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('FUEL STATIONS UPLOAD SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total: ${fuelStations.length}`);
  console.log(`✅ Successful: ${results.successful.length}`);
  console.log(`⏭️  Skipped: ${results.skipped.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log('='.repeat(60) + '\n');

  return results;
}

// Upload showrooms
async function uploadShowrooms(token) {
  console.log('🏢 UPLOADING SHOWROOMS');
  console.log('='.repeat(60));

  const showroomsPath = path.join(__dirname, 'public', 'showrooms.json');
  if (!fs.existsSync(showroomsPath)) {
    console.error('❌ showrooms.json not found');
    return { successful: 0, failed: 0, skipped: 0 };
  }

  const showroomsData = JSON.parse(fs.readFileSync(showroomsPath, 'utf8'));
  const showrooms = showroomsData.showrooms || [];

  console.log(`Found ${showrooms.length} showrooms to upload\n`);

  const results = {
    successful: [],
    failed: [],
    skipped: [],
  };

  for (let i = 0; i < showrooms.length; i++) {
    const showroom = showrooms[i];
    const showroomNum = i + 1;
    
    console.log(`[${showroomNum}/${showrooms.length}] ${showroom.name || showroom.location}...`);

    try {
      const headers = {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/showrooms/`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(showroom),
      });

      if (response.ok) {
        const data = await response.json();
        const backendId = data.id || data._id || 'unknown';
        console.log(`  ✅ Uploaded successfully (Backend ID: ${backendId})`);
        results.successful.push({ name: showroom.name || showroom.location, backendId });
      } else if (response.status === 409 || response.status === 422) {
        console.log(`  ⏭️  Skipped (already exists or duplicate)`);
        results.skipped.push({ name: showroom.name || showroom.location });
      } else {
        const errorText = await response.text();
        console.error(`  ❌ Failed: HTTP ${response.status}: ${errorText}`);
        results.failed.push({ name: showroom.name || showroom.location, error: `HTTP ${response.status}: ${errorText}` });
      }
    } catch (error) {
      console.error(`  ❌ Failed: ${error.message}`);
      results.failed.push({ name: showroom.name || showroom.location, error: error.message });
    }

    if (i < showrooms.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('SHOWROOMS UPLOAD SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total: ${showrooms.length}`);
  console.log(`✅ Successful: ${results.successful.length}`);
  console.log(`⏭️  Skipped: ${results.skipped.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log('='.repeat(60) + '\n');

  return results;
}

// Test backend connectivity
async function testBackend() {
  console.log('🔍 Testing backend connectivity...');
  console.log(`   Backend URL: ${BACKEND_URL}`);
  console.log(`   API Base URL: ${API_BASE_URL}`);
  console.log(`   Prod API Base URL: ${PROD_API_BASE_URL}\n`);

  // Try both /api and /prod/api endpoints
  const endpoints = [
    `${API_BASE_URL}/vehicles/?page=1&limit=1`,
    `${PROD_API_BASE_URL}/vehicles/?page=1&limit=1`,
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        },
      });
      console.log(`   Testing ${endpoint}: ${response.status} ${response.statusText}`);
      
      if (response.ok || response.status === 401 || response.status === 403) {
        console.log(`✅ Backend is accessible at ${endpoint}\n`);
        // Update API_BASE_URL to the working endpoint's base
        if (endpoint.includes('/prod/api/')) {
          // We'll use PROD_API_BASE_URL for subsequent requests
          console.log(`   Using /prod/api/ for API requests\n`);
        }
        return true;
      }
    } catch (error) {
      console.log(`   ${endpoint}: ${error.message}`);
    }
  }
  
  console.error(`❌ Cannot connect to backend at any endpoint\n`);
  console.error('Please ensure:');
  console.error('  1. Backend server is running');
  console.error('  2. Backend URL is correct');
  console.error('  3. Network connectivity is available\n');
  return false;
}

// Main execution
async function main() {
  console.log('🚀 COMPREHENSIVE DATA UPLOAD SCRIPT');
  console.log('='.repeat(60));
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Authentication: ${ADMIN_EMAIL ? 'Credentials provided' : 'No credentials'}`);
  console.log('='.repeat(60) + '\n');

  // Test backend
  const backendAccessible = await testBackend();
  if (!backendAccessible) {
    console.error('❌ Backend is not accessible. Please start the backend server first.');
    process.exit(1);
  }

  // Authenticate
  const token = await authenticate();

  const allResults = {
    timestamp: new Date().toISOString(),
    vehicles: null,
    products: null,
    fuelStations: null,
    showrooms: null,
  };

  // Upload vehicles
  allResults.vehicles = await uploadVehicles(token);

  // Upload products
  allResults.products = await uploadProducts(token);

  // Upload fuel stations
  allResults.fuelStations = await uploadFuelStations(token);

  // Upload showrooms
  allResults.showrooms = await uploadShowrooms(token);

  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(60));
  console.log('VEHICLES:');
  console.log(`  ✅ Successful: ${allResults.vehicles?.successful?.length || 0}`);
  console.log(`  ⏭️  Skipped: ${allResults.vehicles?.skipped?.length || 0}`);
  console.log(`  ❌ Failed: ${allResults.vehicles?.failed?.length || 0}`);
  console.log('');
  console.log('PRODUCTS:');
  console.log(`  ✅ Successful: ${allResults.products?.successful?.length || 0}`);
  console.log(`  ⏭️  Skipped: ${allResults.products?.skipped?.length || 0}`);
  console.log(`  ❌ Failed: ${allResults.products?.failed?.length || 0}`);
  console.log('');
  console.log('FUEL STATIONS:');
  console.log(`  ✅ Successful: ${allResults.fuelStations?.successful?.length || 0}`);
  console.log(`  ⏭️  Skipped: ${allResults.fuelStations?.skipped?.length || 0}`);
  console.log(`  ❌ Failed: ${allResults.fuelStations?.failed?.length || 0}`);
  console.log('');
  console.log('SHOWROOMS:');
  console.log(`  ✅ Successful: ${allResults.showrooms?.successful?.length || 0}`);
  console.log(`  ⏭️  Skipped: ${allResults.showrooms?.skipped?.length || 0}`);
  console.log(`  ❌ Failed: ${allResults.showrooms?.failed?.length || 0}`);
  console.log('='.repeat(60) + '\n');

  // Save results
  const resultsPath = path.join(__dirname, 'upload-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(allResults, null, 2));
  console.log(`📄 Detailed results saved to: ${resultsPath}\n`);

  // Calculate total failures
  const totalFailures = 
    (allResults.vehicles?.failed?.length || 0) +
    (allResults.products?.failed?.length || 0) +
    (allResults.fuelStations?.failed?.length || 0) +
    (allResults.showrooms?.failed?.length || 0);

  if (totalFailures === 0) {
    console.log('🎉 All data uploaded successfully!');
  } else {
    console.log(`⚠️  ${totalFailures} item(s) failed to upload. Check the errors above and upload-results.json for details.`);
  }
}

// Run the upload
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

