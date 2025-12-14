/**
 * Script to update vehicle specifications from PDF brochures
 * 
 * This script reads vehicle data and allows updating specifications
 * based on PDF brochures. Since PDF parsing requires additional libraries,
 * you can manually add specifications or use a PDF parsing library.
 * 
 * To use with PDF parsing, install: npm install pdf-parse
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Vehicle specifications to be extracted from PDFs
// This should be populated by reading PDF files or manual entry
const vehicleSpecsFromPDFs = {
  // Example - Add specifications for each vehicle based on PDFs
  // Format: Vehicle name as key, specs object as value
};

/**
 * Read and parse vehicles.json
 */
function readVehiclesFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Write updated vehicles data
 */
function writeVehiclesFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Update vehicle specifications
 */
function updateVehicleSpecs() {
  const backendVehiclesPath = path.join(__dirname, '../data/vehicles.json');
  const publicVehiclesPath = path.join(__dirname, '../../public/vehicles.json');
  
  console.log('🚀 Starting vehicle specifications update...\n');
  
  // Read vehicle files
  const backendData = readVehiclesFile(backendVehiclesPath);
  const publicData = readVehiclesFile(publicVehiclesPath);
  
  if (!backendData || !publicData) {
    console.error('❌ Failed to read vehicle files');
    return;
  }
  
  console.log(`Found ${backendData.vehicles.length} vehicles\n`);
  
  let updatedCount = 0;
  let missingSpecsCount = 0;
  
  // Update each vehicle
  backendData.vehicles.forEach((vehicle, index) => {
    const vehicleName = vehicle.name;
    const hasExistingSpecs = vehicle.specs && Object.keys(vehicle.specs).length > 0;
    
    // Check if we have new specs from PDFs
    if (vehicleSpecsFromPDFs[vehicleName]) {
      vehicle.specs = { ...vehicle.specs, ...vehicleSpecsFromPDFs[vehicleName] };
      console.log(`✅ Updated specs for: ${vehicleName}`);
      updatedCount++;
    } else if (!hasExistingSpecs) {
      console.log(`⚠️  Missing specs for: ${vehicleName}`);
      console.log(`   Catalog: ${vehicle.catalog || 'N/A'}`);
      missingSpecsCount++;
    }
    
    // Update corresponding vehicle in public file
    if (publicData.vehicles[index]) {
      publicData.vehicles[index].specs = vehicle.specs;
    }
  });
  
  // Write updated data
  if (writeVehiclesFile(backendVehiclesPath, backendData) && 
      writeVehiclesFile(publicVehiclesPath, publicData)) {
    console.log('\n✅ Vehicle files updated successfully!');
    console.log(`\nSummary:`);
    console.log(`- Updated: ${updatedCount} vehicles`);
    console.log(`- Missing specs: ${missingSpecsCount} vehicles`);
    console.log(`\n📝 Next steps:`);
    console.log(`1. Extract specifications from PDF brochures`);
    console.log(`2. Add them to vehicleSpecsFromPDFs object in this script`);
    console.log(`3. Run this script again to update the JSON files`);
  } else {
    console.error('\n❌ Failed to write updated files');
  }
}

/**
 * List all vehicles with their catalog PDFs for reference
 */
function listVehiclesWithCatalogs() {
  const backendVehiclesPath = path.join(__dirname, '../data/vehicles.json');
  const data = readVehiclesFile(backendVehiclesPath);
  
  if (!data) return;
  
  console.log('\n📋 Vehicles with catalog PDFs:\n');
  data.vehicles.forEach((vehicle, index) => {
    const hasSpecs = vehicle.specs && Object.keys(vehicle.specs).length > 0;
    const status = hasSpecs ? '✅' : '⚠️';
    console.log(`${status} ${index + 1}. ${vehicle.name}`);
    if (vehicle.catalog) {
      console.log(`   PDF: ${vehicle.catalog}`);
    }
    if (!hasSpecs) {
      console.log(`   Status: Missing specifications`);
    }
    console.log('');
  });
}

// Run the update
const isMainModule = import.meta.url === `file://${path.resolve(process.argv[1])}` || 
                     process.argv[1] && import.meta.url.includes(process.argv[1].replace(/\\/g, '/'));

if (isMainModule || process.argv[1]?.includes('update-vehicle-specs.js')) {
  const command = process.argv[2];
  
  if (command === 'list') {
    listVehiclesWithCatalogs();
  } else {
    updateVehicleSpecs();
    listVehiclesWithCatalogs();
  }
}

export { updateVehicleSpecs, listVehiclesWithCatalogs };

