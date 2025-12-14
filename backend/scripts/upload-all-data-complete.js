import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import FormData from 'form-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE_URL = 'http://localhost:3001/api';
const PUBLIC_DIR = path.join(__dirname, '../../public');

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

// Check if file exists
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Upload products
async function uploadProducts() {
  console.log('\n📦 Uploading Products...');
  try {
    const productsPath = path.join(PUBLIC_DIR, 'products.json');
    if (!await fileExists(productsPath)) {
      console.log('  ⚠️  products.json not found, skipping...');
      return;
    }

    const productsData = JSON.parse(await fs.readFile(productsPath, 'utf-8'));
    const products = productsData.products || [];

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const product of products) {
      try {
        // Check if product already exists
        try {
          await apiRequest(`/products/${product.id}`);
          console.log(`  ⏭️  Product "${product.name}" (ID: ${product.id}) already exists, skipping...`);
          skipCount++;
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
          const imagePath = path.join(PUBLIC_DIR, product.image);
          if (await fileExists(imagePath)) {
            try {
              const imageBuffer = await fs.readFile(imagePath);
              const fileName = path.basename(product.image);
              formData.append('image', imageBuffer, fileName);
              console.log(`  📷 Loading image: ${product.image}`);
            } catch (e) {
              console.log(`    ⚠️  Could not load image: ${product.image}`);
            }
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

    console.log(`\n✅ Products: ${successCount} uploaded, ${skipCount} skipped, ${errorCount} errors`);
  } catch (error) {
    console.error('❌ Error uploading products:', error.message);
  }
}

// Upload vehicles
async function uploadVehicles() {
  console.log('\n🚗 Uploading Vehicles...');
  try {
    const vehiclesPath = path.join(PUBLIC_DIR, 'vehicles.json');
    if (!await fileExists(vehiclesPath)) {
      console.log('  ⚠️  vehicles.json not found, skipping...');
      return;
    }

    const vehiclesData = JSON.parse(await fs.readFile(vehiclesPath, 'utf-8'));
    const vehicles = vehiclesData.vehicles || [];

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const vehicle of vehicles) {
      try {
        // Check if vehicle already exists
        try {
          await apiRequest(`/vehicles/${vehicle.id}`);
          console.log(`  ⏭️  Vehicle "${vehicle.name}" (ID: ${vehicle.id}) already exists, skipping...`);
          skipCount++;
          continue;
        } catch (e) {
          // Vehicle doesn't exist, create it
        }

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

        // Handle images
        if (vehicle.images && Array.isArray(vehicle.images)) {
          for (const imgPath of vehicle.images) {
            if (typeof imgPath === 'string' && imgPath.startsWith('/images/')) {
              const imagePath = path.join(PUBLIC_DIR, imgPath);
              if (await fileExists(imagePath)) {
                try {
                  const imageBuffer = await fs.readFile(imagePath);
                  const fileName = path.basename(imgPath);
                  formData.append('images', imageBuffer, fileName);
                  console.log(`    📷 Loading image: ${imgPath}`);
                } catch (e) {
                  console.log(`    ⚠️  Could not load image: ${imgPath}`);
                }
              }
            }
          }
        }

        // Handle catalog PDF
        if (vehicle.catalog && vehicle.catalog.startsWith('/catalouges/')) {
          const catalogPath = path.join(PUBLIC_DIR, vehicle.catalog);
          if (await fileExists(catalogPath)) {
            try {
              const catalogBuffer = await fs.readFile(catalogPath);
              const fileName = path.basename(vehicle.catalog);
              formData.append('catalog', catalogBuffer, fileName);
              console.log(`    📄 Loading catalog: ${vehicle.catalog}`);
            } catch (e) {
              console.log(`    ⚠️  Could not load catalog: ${vehicle.catalog}`);
            }
          }
        }

        await apiRequest('/vehicles', 'POST', formData, true);
        console.log(`  ✅ Created vehicle: ${vehicle.name}`);
        successCount++;
      } catch (error) {
        console.error(`  ❌ Failed to upload vehicle "${vehicle.name}":`, error.message);
        errorCount++;
      }
    }

    console.log(`\n✅ Vehicles: ${successCount} uploaded, ${skipCount} skipped, ${errorCount} errors`);
  } catch (error) {
    console.error('❌ Error uploading vehicles:', error.message);
  }
}

// Upload massey products
async function uploadMasseyProducts() {
  console.log('\n🚜 Uploading Massey Ferguson Products...');
  try {
    const masseyPath = path.join(PUBLIC_DIR, 'masseyProducts.json');
    if (!await fileExists(masseyPath)) {
      console.log('  ⚠️  masseyProducts.json not found, skipping...');
      return;
    }

    const masseyData = JSON.parse(await fs.readFile(masseyPath, 'utf-8'));
    const products = masseyData.products || [];

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const product of products) {
      try {
        // Check if product already exists (by checking all products)
        try {
          const allProducts = await apiRequest('/massey/products');
          const existing = allProducts.data?.find((p) => p.id === product.id || p.name === product.name);
          if (existing) {
            console.log(`  ⏭️  Massey product "${product.name}" already exists, skipping...`);
            skipCount++;
            continue;
          }
        } catch (e) {
          // Continue
        }

        const formData = new FormData();
        formData.append('name', product.name);
        formData.append('category', product.category || 'tractors');
        if (product.description) formData.append('description', product.description);
        if (product.specs) formData.append('specs', product.specs);

        // Handle image
        if (product.image && product.image.startsWith('/images/')) {
          const imagePath = path.join(PUBLIC_DIR, product.image);
          if (await fileExists(imagePath)) {
            try {
              const imageBuffer = await fs.readFile(imagePath);
              const fileName = path.basename(product.image);
              formData.append('image', imageBuffer, fileName);
              console.log(`    📷 Loading image: ${product.image}`);
            } catch (e) {
              console.log(`    ⚠️  Could not load image: ${product.image}`);
            }
          }
        }

        // Handle catalog
        if (product.catalog && product.catalog.startsWith('/catalouges/')) {
          const catalogPath = path.join(PUBLIC_DIR, product.catalog);
          if (await fileExists(catalogPath)) {
            try {
              const catalogBuffer = await fs.readFile(catalogPath);
              const fileName = path.basename(product.catalog);
              formData.append('catalog', catalogBuffer, fileName);
              console.log(`    📄 Loading catalog: ${product.catalog}`);
            } catch (e) {
              console.log(`    ⚠️  Could not load catalog: ${product.catalog}`);
            }
          }
        }

        await apiRequest('/massey/products', 'POST', formData, true);
        console.log(`  ✅ Created Massey product: ${product.name}`);
        successCount++;
      } catch (error) {
        console.error(`  ❌ Failed to upload Massey product "${product.name}":`, error.message);
        errorCount++;
      }
    }

    console.log(`\n✅ Massey Products: ${successCount} uploaded, ${skipCount} skipped, ${errorCount} errors`);
  } catch (error) {
    console.error('❌ Error uploading Massey products:', error.message);
  }
}

// Upload showrooms
async function uploadShowrooms() {
  console.log('\n🏢 Uploading Showrooms...');
  try {
    const showroomsPath = path.join(PUBLIC_DIR, 'showrooms.json');
    if (!await fileExists(showroomsPath)) {
      console.log('  ⚠️  showrooms.json not found, skipping...');
      return;
    }

    const showroomsData = JSON.parse(await fs.readFile(showroomsPath, 'utf-8'));
    const showrooms = showroomsData.showrooms || [];

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const showroom of showrooms) {
      try {
        // Check if showroom already exists
        try {
          const allShowrooms = await apiRequest('/showrooms');
          if (Array.isArray(allShowrooms) && allShowrooms.find((s) => s.id === showroom.id)) {
            console.log(`  ⏭️  Showroom "${showroom.city}" (ID: ${showroom.id}) already exists, skipping...`);
            skipCount++;
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

        // Handle image
        if (showroom.image && showroom.image.startsWith('/images/')) {
          const imagePath = path.join(PUBLIC_DIR, showroom.image);
          if (await fileExists(imagePath)) {
            try {
              const imageBuffer = await fs.readFile(imagePath);
              const fileName = path.basename(showroom.image);
              formData.append('image', imageBuffer, fileName);
              console.log(`    📷 Loading image: ${showroom.image}`);
            } catch (e) {
              console.log(`    ⚠️  Could not load image: ${showroom.image}`);
            }
          }
        }

        await apiRequest('/showrooms', 'POST', formData, true);
        console.log(`  ✅ Created showroom: ${showroom.city}`);
        successCount++;
      } catch (error) {
        console.error(`  ❌ Failed to upload showroom "${showroom.city}":`, error.message);
        errorCount++;
      }
    }

    console.log(`\n✅ Showrooms: ${successCount} uploaded, ${skipCount} skipped, ${errorCount} errors`);
  } catch (error) {
    console.error('❌ Error uploading showrooms:', error.message);
  }
}

// Verify backend is running
async function checkBackend() {
  try {
    const response = await fetch('http://localhost:3001/api/health');
    if (!response.ok) {
      throw new Error('Backend health check failed');
    }
    const data = await response.json();
    console.log('✅ Backend is running:', data.message);
    return true;
  } catch (error) {
    console.error('❌ Backend is not running!');
    console.error('   Please start the backend server first:');
    console.error('   cd backend && npm start');
    return false;
  }
}

// Main function
async function main() {
  console.log('🚀 Starting Complete Data Upload to Backend...');
  console.log(`📍 Backend URL: ${API_BASE_URL}`);
  console.log(`📁 Public Directory: ${PUBLIC_DIR}`);
  console.log('');

  // Check if backend is running
  const backendRunning = await checkBackend();
  if (!backendRunning) {
    process.exit(1);
  }

  console.log('');

  // Upload all data
  await uploadProducts();
  await uploadVehicles();
  await uploadMasseyProducts();
  await uploadShowrooms();

  console.log('\n✨ Complete data upload finished!');
  console.log('\n📚 View API documentation at: http://localhost:3001/api-docs');
  console.log('🏥 Health check: http://localhost:3001/api/health');
  console.log('\n✅ All data has been uploaded to the backend!');
}

main().catch(console.error);

