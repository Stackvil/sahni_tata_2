import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Update Vehicle Catalogs Script
 * 
 * This script updates vehicle catalog paths in the backend API.
 * 
 * Usage:
 *   node update-vehicle-catalogs.js [--email=your@email.com] [--password=yourpassword] [--url=http://localhost:8000]
 * 
 * Environment Variables:
 *   VITE_API_URL - Backend API URL (default: http://localhost:8000)
 *   ADMIN_EMAIL - Admin email for authentication
 *   ADMIN_PASSWORD - Admin password for authentication
 */

// Configuration
const BACKEND_URL = process.argv.find(arg => arg.startsWith('--url='))?.split('=')[1] || 'http://localhost:8000';
const API_BASE_URL = process.env.API_BASE_PATH ? `${BACKEND_URL}${process.env.API_BASE_PATH}` : `${BACKEND_URL}/api`;
const PROD_API_BASE_URL = `${BACKEND_URL}/prod/api`;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.argv.find(arg => arg.startsWith('--email='))?.split('=')[1] || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.argv.find(arg => arg.startsWith('--password='))?.split('=')[1] || '';

let authToken = null;

// Authentication
async function authenticate() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.warn('⚠️  No credentials provided. Catalog updates require authentication.');
    console.warn('   Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables or use --email= and --password= flags');
    return null;
  }

  try {
    console.log('🔐 Authenticating...');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    
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
          const params = new URLSearchParams({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
          });
          response = await fetch(`${endpointConfig.url}?${params}`, {
            method: 'POST',
          });
        } else {
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
    
    console.error(`❌ Authentication failed on all endpoints. Last error: ${lastError}\n`);
    return null;
  } catch (error) {
    console.error('❌ Authentication error:', error.message);
    return null;
  }
}

// Get vehicle by name or ID from backend
async function findVehicleByNameOrCategory(vehicleName, category, subcategory, token) {
  const endpoints = [
    `${API_BASE_URL}/vehicles/`,
    `${PROD_API_BASE_URL}/vehicles/`,
  ];

  for (const endpoint of endpoints) {
    try {
      // Try to find by name
      const nameResponse = await fetch(`${endpoint}?name=${encodeURIComponent(vehicleName)}`, {
        headers: {
          'accept': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (nameResponse.ok) {
        const data = await nameResponse.json();
        const vehicles = Array.isArray(data) ? data : (data.vehicles || data.data || []);
        const vehicle = vehicles.find(v => 
          v.name === vehicleName || 
          (v.category === category && v.subcategory === subcategory)
        );
        if (vehicle) {
          return { vehicle, endpoint };
        }
      }

      // Try to find by category
      const categoryResponse = await fetch(`${endpoint}?category=${encodeURIComponent(category)}`, {
        headers: {
          'accept': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (categoryResponse.ok) {
        const data = await categoryResponse.json();
        const vehicles = Array.isArray(data) ? data : (data.vehicles || data.data || []);
        const vehicle = vehicles.find(v => 
          v.name === vehicleName || 
          v.subcategory === subcategory
        );
        if (vehicle) {
          return { vehicle, endpoint };
        }
      }

      // Try to get all vehicles and search
      const allResponse = await fetch(`${endpoint}?page=1&limit=1000`, {
        headers: {
          'accept': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (allResponse.ok) {
        const data = await allResponse.json();
        const vehicles = Array.isArray(data) ? data : (data.vehicles || data.data || []);
        const vehicle = vehicles.find(v => 
          v.name === vehicleName || 
          (v.category === category && v.subcategory === subcategory)
        );
        if (vehicle) {
          return { vehicle, endpoint };
        }
      }
    } catch (error) {
      console.warn(`   Error searching in ${endpoint}: ${error.message}`);
      continue;
    }
  }

  return null;
}

// Update vehicle catalog
async function updateVehicleCatalog(vehicleId, catalogPath, token, endpoint) {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    // Update vehicle with catalog path
    // Try PUT request with catalog in body or query params
    const updateData = {
      catalog: catalogPath,
    };

    // Try JSON body first
    let response = await fetch(`${endpoint}${vehicleId}`, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify(updateData),
    });

    // If that fails, try query parameters
    if (!response.ok && response.status !== 404) {
      const params = new URLSearchParams({
        catalog: catalogPath,
      });
      response = await fetch(`${endpoint}${vehicleId}?${params}`, {
        method: 'PUT',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
    }

    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      const errorText = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Update all vehicle catalogs
async function updateCatalogs(token) {
  console.log('📚 UPDATING VEHICLE CATALOGS');
  console.log('='.repeat(60));

  const catalogsPath = path.join(__dirname, 'tata-vehicle-catalogs.json');
  if (!fs.existsSync(catalogsPath)) {
    console.error('❌ tata-vehicle-catalogs.json not found');
    return { successful: 0, failed: 0, notFound: 0 };
  }

  const catalogsData = JSON.parse(fs.readFileSync(catalogsPath, 'utf8'));
  const catalogs = catalogsData.catalogs || [];

  console.log(`Found ${catalogs.length} catalog entries to update\n`);

  const results = {
    successful: [],
    failed: [],
    notFound: [],
  };

  for (let i = 0; i < catalogs.length; i++) {
    const catalogEntry = catalogs[i];
    const catalogNum = i + 1;
    
    console.log(`[${catalogNum}/${catalogs.length}] ${catalogEntry.vehicle_name}...`);
    console.log(`   Category: ${catalogEntry.category}, Subcategory: ${catalogEntry.subcategory}`);
    console.log(`   Catalog: ${catalogEntry.catalog}`);

    // Find vehicle in backend
    const vehicleResult = await findVehicleByNameOrCategory(
      catalogEntry.vehicle_name,
      catalogEntry.category,
      catalogEntry.subcategory,
      token
    );

    if (!vehicleResult) {
      console.log(`  ⚠️  Vehicle not found in backend`);
      results.notFound.push({
        vehicle_id: catalogEntry.vehicle_id,
        vehicle_name: catalogEntry.vehicle_name,
        catalog: catalogEntry.catalog,
      });
      continue;
    }

    const { vehicle, endpoint } = vehicleResult;
    const vehicleId = vehicle.id || vehicle._id || vehicle.uuid;
    
    console.log(`   Found vehicle with ID: ${vehicleId}`);

    // Update catalog
    const updateResult = await updateVehicleCatalog(vehicleId, catalogEntry.catalog, token, endpoint);

    if (updateResult.success) {
      console.log(`  ✅ Catalog updated successfully`);
      results.successful.push({
        vehicle_id: catalogEntry.vehicle_id,
        vehicle_name: catalogEntry.vehicle_name,
        backend_id: vehicleId,
        catalog: catalogEntry.catalog,
      });
    } else {
      console.error(`  ❌ Failed: ${updateResult.error}`);
      results.failed.push({
        vehicle_id: catalogEntry.vehicle_id,
        vehicle_name: catalogEntry.vehicle_name,
        backend_id: vehicleId,
        catalog: catalogEntry.catalog,
        error: updateResult.error,
      });
    }

    // Small delay between requests
    if (i < catalogs.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log('');
  }

  console.log('='.repeat(60));
  console.log('CATALOG UPDATE SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total: ${catalogs.length}`);
  console.log(`✅ Successful: ${results.successful.length}`);
  console.log(`⚠️  Not Found: ${results.notFound.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log('='.repeat(60) + '\n');

  return results;
}

// Main execution
async function main() {
  console.log('🚀 VEHICLE CATALOG UPDATE SCRIPT');
  console.log('='.repeat(60));
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Authentication: ${ADMIN_EMAIL ? 'Credentials provided' : 'No credentials'}`);
  console.log('='.repeat(60) + '\n');

  // Authenticate
  const token = await authenticate();
  if (!token) {
    console.error('❌ Authentication failed. Cannot update catalogs without authentication.');
    process.exit(1);
  }

  // Update catalogs
  const results = await updateCatalogs(token);

  // Save results
  const resultsPath = path.join(__dirname, 'catalog-update-results.json');
  const resultsData = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.successful.length + results.failed.length + results.notFound.length,
      successful: results.successful.length,
      notFound: results.notFound.length,
      failed: results.failed.length,
    },
    results: results,
  };
  
  fs.writeFileSync(resultsPath, JSON.stringify(resultsData, null, 2));
  console.log(`📄 Detailed results saved to: ${resultsPath}\n`);

  if (results.failed.length === 0 && results.notFound.length === 0) {
    console.log('🎉 All catalogs updated successfully!');
  } else {
    console.log(`⚠️  ${results.failed.length} catalog(s) failed to update, ${results.notFound.length} vehicle(s) not found.`);
    console.log('   Check catalog-update-results.json for details.');
  }
}

// Run the script
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});


