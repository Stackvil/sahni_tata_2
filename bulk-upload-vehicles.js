import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Bulk Upload Vehicles Script
 * 
 * This script uploads Massey Ferguson vehicles to the backend API.
 * It supports multiple backend API formats and provides detailed feedback.
 * 
 * Usage:
 *   node bulk-upload-vehicles.js
 * 
 * Environment Variables:
 *   VITE_API_URL - Backend API URL (default: http://localhost:8000)
 *   API_TOKEN - Authentication token (if required)
 */

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:8000';
const API_TOKEN = process.env.API_TOKEN || null;

// Read vehicles.json
const vehiclesJsonPath = path.join(__dirname, 'public', 'vehicles.json');
console.log(`Reading vehicles from: ${vehiclesJsonPath}`);

if (!fs.existsSync(vehiclesJsonPath)) {
  console.error(`Error: vehicles.json not found at ${vehiclesJsonPath}`);
  process.exit(1);
}

const vehiclesData = JSON.parse(fs.readFileSync(vehiclesJsonPath, 'utf8'));

// Filter only Massey Ferguson vehicles
const masseyVehicles = vehiclesData.vehicles.filter(v => 
  v.category === 'massey' || (v.id >= 100 && v.id <= 111)
);

console.log(`\nFound ${masseyVehicles.length} Massey Ferguson vehicles:\n`);
masseyVehicles.forEach(v => {
  console.log(`  - ${v.name} (ID: ${v.id}, Images: ${v.images?.length || 0})`);
});

// Function to upload vehicle using method 1: POST to /api/vehicles
async function uploadVehicleMethod1(vehicle) {
  const url = `${API_BASE_URL}/api/vehicles`;
  const headers = {
    'Content-Type': 'application/json',
  };

  if (API_TOKEN) {
    headers['Authorization'] = `Bearer ${API_TOKEN}`;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(vehicle),
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, method: 'POST /api/vehicles', data };
    } else {
      const errorText = await response.text();
      return { 
        success: false, 
        method: 'POST /api/vehicles', 
        error: `HTTP ${response.status}: ${errorText}` 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      method: 'POST /api/vehicles', 
      error: error.message 
    };
  }
}

// Function to upload vehicle using method 2: POST to /prod/api/vehicles (admin API)
async function uploadVehicleMethod2(vehicle) {
  const url = `${API_BASE_URL}/prod/api/vehicles`;
  const headers = {
    'Content-Type': 'application/json',
  };

  if (API_TOKEN) {
    headers['Authorization'] = `Bearer ${API_TOKEN}`;
  }

  // Transform vehicle to admin API format
  const adminVehicle = {
    name: vehicle.name,
    location: vehicle.category || 'massey',
    address: vehicle.description || '',
    images: vehicle.images || [],
    features: vehicle.features || [],
  };

  try {
    const response = await fetch(`${url}?${new URLSearchParams({
      name: adminVehicle.name,
      location: adminVehicle.location,
      address: adminVehicle.address,
      image: adminVehicle.images[0] || '',
    })}`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        features: adminVehicle.features,
        images: adminVehicle.images,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, method: 'POST /prod/api/vehicles', data };
    } else {
      const errorText = await response.text();
      return { 
        success: false, 
        method: 'POST /prod/api/vehicles', 
        error: `HTTP ${response.status}: ${errorText}` 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      method: 'POST /prod/api/vehicles', 
      error: error.message 
    };
  }
}

// Main upload function
async function uploadVehicles() {
  console.log('\n' + '='.repeat(60));
  console.log('UPLOADING VEHICLES TO BACKEND');
  console.log('='.repeat(60));
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Authentication: ${API_TOKEN ? 'Token provided' : 'No token (public endpoint)'}`);
  console.log('='.repeat(60) + '\n');

  // Test backend connectivity
  console.log('Testing backend connectivity...');
  try {
    const testResponse = await fetch(`${API_BASE_URL}/api/vehicles`);
    console.log(`✓ Backend is accessible (Status: ${testResponse.status})\n`);
  } catch (error) {
    console.error(`✗ Cannot connect to backend: ${error.message}\n`);
    console.error('Please ensure:');
    console.error('  1. Backend server is running');
    console.error('  2. API_BASE_URL is correct');
    console.error('  3. Network connectivity is available\n');
    
    // Ask user if they want to continue
    console.log('You can still proceed, but uploads will likely fail.\n');
  }

  const results = {
    successful: [],
    failed: [],
    method: null,
  };

  // Try method 1 first (standard API)
  console.log('Attempting upload using Method 1: POST /api/vehicles\n');
  
  for (let i = 0; i < Math.min(2, masseyVehicles.length); i++) {
    const vehicle = masseyVehicles[i];
    console.log(`Testing with vehicle: ${vehicle.name}...`);
    
    const result = await uploadVehicleMethod1(vehicle);
    
    if (result.success) {
      console.log(`  ✓ Method 1 works! Using this method for all vehicles.\n`);
      results.method = 'POST /api/vehicles';
      break;
    } else {
      console.log(`  ✗ Method 1 failed: ${result.error}\n`);
    }
  }

  // If method 1 doesn't work, try method 2
  if (!results.method) {
    console.log('Attempting upload using Method 2: POST /prod/api/vehicles\n');
    
    for (let i = 0; i < Math.min(2, masseyVehicles.length); i++) {
      const vehicle = masseyVehicles[i];
      console.log(`Testing with vehicle: ${vehicle.name}...`);
      
      const result = await uploadVehicleMethod2(vehicle);
      
      if (result.success) {
        console.log(`  ✓ Method 2 works! Using this method for all vehicles.\n`);
        results.method = 'POST /prod/api/vehicles';
        break;
      } else {
        console.log(`  ✗ Method 2 failed: ${result.error}\n`);
      }
    }
  }

  // If no method works, exit
  if (!results.method) {
    console.error('✗ None of the upload methods worked.');
    console.error('\nPlease check:');
    console.error('  1. Backend API endpoint structure');
    console.error('  2. Authentication requirements');
    console.error('  3. Backend server logs for errors');
    console.error('\nYou may need to:');
    console.error('  - Set API_TOKEN environment variable');
    console.error('  - Check backend API documentation');
    console.error('  - Manually upload via admin interface');
    process.exit(1);
  }

  // Upload all vehicles using the working method
  console.log(`Uploading all ${masseyVehicles.length} vehicles using ${results.method}...\n`);

  for (let i = 0; i < masseyVehicles.length; i++) {
    const vehicle = masseyVehicles[i];
    const vehicleNum = i + 1;
    
    console.log(`[${vehicleNum}/${masseyVehicles.length}] ${vehicle.name}...`);

    let result;
    if (results.method === 'POST /api/vehicles') {
      result = await uploadVehicleMethod1(vehicle);
    } else {
      result = await uploadVehicleMethod2(vehicle);
    }

    if (result.success) {
      console.log(`  ✓ Uploaded successfully`);
      results.successful.push({
        id: vehicle.id,
        name: vehicle.name,
        backendId: result.data.id || result.data._id || 'unknown'
      });
    } else {
      console.error(`  ✗ Failed: ${result.error}`);
      results.failed.push({
        id: vehicle.id,
        name: vehicle.name,
        error: result.error
      });
    }

    // Small delay between requests
    if (i < masseyVehicles.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('UPLOAD SUMMARY');
  console.log('='.repeat(60));
  console.log(`Method used: ${results.method}`);
  console.log(`Total vehicles: ${masseyVehicles.length}`);
  console.log(`Successful: ${results.successful.length}`);
  console.log(`Failed: ${results.failed.length}`);
  console.log('='.repeat(60));

  if (results.successful.length > 0) {
    console.log('\n✓ Successful uploads:');
    results.successful.forEach(v => {
      console.log(`  - ${v.name} (Local ID: ${v.id}, Backend ID: ${v.backendId})`);
    });
  }

  if (results.failed.length > 0) {
    console.log('\n✗ Failed uploads:');
    results.failed.forEach(v => {
      console.log(`  - ${v.name} (ID: ${v.id}): ${v.error}`);
    });
  }

  // Save results
  const resultsPath = path.join(__dirname, 'upload-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Detailed results saved to: ${resultsPath}`);

  if (results.successful.length === masseyVehicles.length) {
    console.log('\n🎉 All vehicles uploaded successfully!');
  } else if (results.successful.length > 0) {
    console.log('\n⚠️  Some vehicles failed to upload. Check the errors above.');
  } else {
    console.log('\n❌ No vehicles were uploaded. Please check the errors above.');
    process.exit(1);
  }
}

// Run the upload
uploadVehicles().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

