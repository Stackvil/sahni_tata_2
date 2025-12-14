import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import FormData from 'form-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE_URL = 'http://localhost:3001/api';

// Helper function to make API requests
async function apiRequest(endpoint, method = 'GET', body = null, isFormData = false) {
  const url = `${API_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {}
  };

  if (body) {
    if (isFormData) {
      options.body = body;
      // FormData will set Content-Type with boundary automatically
    } else {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }
  }

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return await response.text();
  } catch (error) {
    console.error(`Error ${method} ${endpoint}:`, error.message);
    throw error;
  }
}

// Upload products
async function uploadProducts() {
  console.log('\n📦 Uploading Products...');
  try {
    const productsPath = path.join(__dirname, '../../public/products.json');
    const productsData = JSON.parse(await fs.readFile(productsPath, 'utf-8'));
    const products = productsData.products || [];

    let successCount = 0;
    let errorCount = 0;

    for (const product of products) {
      try {
        // Check if product already exists
        try {
          await apiRequest(`/products/${product.id}`);
          console.log(`  ⏭️  Product "${product.name}" (ID: ${product.id}) already exists, skipping...`);
          continue;
        } catch (e) {
          // Product doesn't exist, create it
        }

        // Create product with FormData
        const formData = new FormData();
        formData.append('name', product.name);
        formData.append('company_key', product.company || 'unknown');
        formData.append('category_name', product.category || 'uncategorized');
        formData.append('description', product.description || '');
        formData.append('specs', product.specs || '');

        // Try to load image file if path exists
        if (product.image && product.image.startsWith('/images/')) {
          const imagePath = path.join(__dirname, '../../public', product.image);
          try {
            const imageBuffer = await fs.readFile(imagePath);
            const fileName = path.basename(product.image);
            formData.append('image', imageBuffer, fileName);
          } catch (e) {
            console.log(`    ⚠️  Could not load image: ${product.image}`);
          }
        }

        await apiRequest('/products', 'POST', formData, true);
        console.log(`  ✅ Created product: ${product.name}`);
        successCount++;
      } catch (error) {
        console.error(`  ❌ Failed to upload product "${product.name}":`, error.message);
        errorCount++;
      }
    }

    console.log(`\n✅ Products: ${successCount} uploaded, ${errorCount} errors`);
  } catch (error) {
    console.error('❌ Error uploading products:', error.message);
  }
}

// Upload vehicles
async function uploadVehicles() {
  console.log('\n🚗 Uploading Vehicles...');
  try {
    const vehiclesPath = path.join(__dirname, '../../public/vehicles.json');
    const vehiclesData = JSON.parse(await fs.readFile(vehiclesPath, 'utf-8'));
    const vehicles = vehiclesData.vehicles || [];

    let successCount = 0;
    let errorCount = 0;

    for (const vehicle of vehicles) {
      try {
        // Check if vehicle already exists
        try {
          await apiRequest(`/vehicles/${vehicle.id}`);
          console.log(`  ⏭️  Vehicle "${vehicle.name}" (ID: ${vehicle.id}) already exists, skipping...`);
          continue;
        } catch (e) {
          // Vehicle doesn't exist, create it
        }

        // Create vehicle
        const formData = new FormData();
        formData.append('name', vehicle.name);
        formData.append('category', vehicle.category || 'uncategorized');
        if (vehicle.description) formData.append('description', vehicle.description);
        if (vehicle.size) formData.append('size', vehicle.size);
        if (vehicle.popular !== undefined) formData.append('popular', String(vehicle.popular));
        if (vehicle.specs) formData.append('specs', JSON.stringify(vehicle.specs));
        if (vehicle.features && Array.isArray(vehicle.features)) {
          formData.append('features', vehicle.features.join(', '));
        }

        // Note: Image uploads would require actual file handling
        // For now, we'll create vehicles with image URLs as strings
        if (vehicle.images && Array.isArray(vehicle.images)) {
          vehicle.images.forEach(img => {
            if (typeof img === 'string') {
              formData.append('images', img);
            }
          });
        }

        await apiRequest('/vehicles', 'POST', formData, true);
        console.log(`  ✅ Created vehicle: ${vehicle.name}`);
        successCount++;
      } catch (error) {
        console.error(`  ❌ Failed to upload vehicle "${vehicle.name}":`, error.message);
        errorCount++;
      }
    }

    console.log(`\n✅ Vehicles: ${successCount} uploaded, ${errorCount} errors`);
  } catch (error) {
    console.error('❌ Error uploading vehicles:', error.message);
  }
}

// Upload showrooms
async function uploadShowrooms() {
  console.log('\n🏢 Uploading Showrooms...');
  try {
    const showroomsPath = path.join(__dirname, '../../public/showrooms.json');
    const showroomsData = JSON.parse(await fs.readFile(showroomsPath, 'utf-8'));
    const showrooms = showroomsData.showrooms || [];

    let successCount = 0;
    let errorCount = 0;

    for (const showroom of showrooms) {
      try {
        // Check if showroom already exists
        try {
          const existing = await apiRequest('/showrooms');
          if (existing.find(s => s.id === showroom.id)) {
            console.log(`  ⏭️  Showroom "${showroom.city}" (ID: ${showroom.id}) already exists, skipping...`);
            continue;
          }
        } catch (e) {
          // Continue
        }

        const formData = new FormData();
        formData.append('city', showroom.city);
        formData.append('address', showroom.address);
        formData.append('phone', showroom.phone);
        formData.append('email', showroom.email);
        if (showroom.is_main !== undefined) {
          formData.append('is_main', String(showroom.is_main));
        }

        await apiRequest('/showrooms', 'POST', formData, true);
        console.log(`  ✅ Created showroom: ${showroom.city}`);
        successCount++;
      } catch (error) {
        console.error(`  ❌ Failed to upload showroom "${showroom.city}":`, error.message);
        errorCount++;
      }
    }

    console.log(`\n✅ Showrooms: ${successCount} uploaded, ${errorCount} errors`);
  } catch (error) {
    console.error('❌ Error uploading showrooms:', error.message);
  }
}

// Upload fuel stations
async function uploadFuelStations() {
  console.log('\n⛽ Fuel Stations are read-only, skipping upload...');
  console.log('   (Fuel stations are managed directly in fuelStations.json)');
}

// Upload home video
async function uploadHomeVideo() {
  console.log('\n🎥 Checking Home Video...');
  try {
    const homePath = path.join(__dirname, '../../public/home.json');
    const homeData = JSON.parse(await fs.readFile(homePath, 'utf-8'));
    
    if (homeData.video) {
      console.log(`  ✅ Home video configured: ${homeData.video}`);
      console.log('   (Video file should be uploaded via API endpoint)');
    } else {
      console.log('  ℹ️  No home video configured');
    }
  } catch (error) {
    console.error('❌ Error checking home video:', error.message);
  }
}

// Main function
async function main() {
  console.log('🚀 Starting Data Upload to Backend...');
  console.log(`📍 Backend URL: ${API_BASE_URL}`);
  
  // Check if backend is running
  try {
    const healthCheck = await fetch('http://localhost:3001/api/health');
    if (!healthCheck.ok) {
      throw new Error('Backend health check failed');
    }
    console.log('✅ Backend is running\n');
  } catch (error) {
    console.error('❌ Backend is not running!');
    console.error('   Please start the backend server first:');
    console.error('   cd backend && npm start');
    process.exit(1);
  }

  await uploadProducts();
  await uploadVehicles();
  await uploadShowrooms();
  await uploadFuelStations();
  await uploadHomeVideo();

  console.log('\n✨ Data upload completed!');
  console.log('\n📚 View API documentation at: http://localhost:3001/api-docs');
}

main().catch(console.error);

