/**
 * Script to extract vehicle specifications from PDF brochures
 * and update vehicles.json with complete specifications
 * 
 * This script reads PDF files from the catalouges directory and extracts
 * specifications to update the vehicles.json file
 */

const fs = require('fs');
const path = require('path');

// Vehicle specifications mapping based on PDF structure
// This will be populated by reading PDFs or manual entry
const vehicleSpecsMap = {
  // Example structure - to be filled from PDFs
  "Ace EV 1000": {
    engine: "",
    power: "",
    torque: "",
    transmission: "",
    fuelType: "Electric",
    mileage: "",
    seating: "",
    payload: "",
    length: "",
    width: "",
    height: "",
    wheelbase: "",
    fuelTank: "",
    cargoVolume: "",
    gvw: "",
    maxSpeed: "",
    groundClearance: "",
    loadBody: "",
    minTcr: "",
    steering: "",
    brakes: "",
    suspensionFront: "",
    suspensionRear: "",
    tyres: "",
    warranty: "",
    gradeability: "",
    frontTrack: "",
    rearTrack: ""
  }
};

/**
 * Read vehicles.json and update with specifications
 */
function updateVehicleSpecs() {
  const vehiclesPath = path.join(__dirname, '../data/vehicles.json');
  const publicVehiclesPath = path.join(__dirname, '../../public/vehicles.json');
  
  // Read current vehicles data
  const vehiclesData = JSON.parse(fs.readFileSync(vehiclesPath, 'utf8'));
  const publicVehiclesData = JSON.parse(fs.readFileSync(publicVehiclesPath, 'utf8'));
  
  console.log('Updating vehicle specifications...');
  console.log(`Found ${vehiclesData.vehicles.length} vehicles`);
  
  // Update each vehicle with specifications
  vehiclesData.vehicles.forEach((vehicle, index) => {
    const vehicleName = vehicle.name;
    
    // Check if we have specs for this vehicle
    if (vehicleSpecsMap[vehicleName]) {
      vehicle.specs = vehicleSpecsMap[vehicleName];
      console.log(`Updated specs for: ${vehicleName}`);
    } else if (Object.keys(vehicle.specs || {}).length === 0) {
      console.log(`⚠️  No specs found for: ${vehicleName} (catalog: ${vehicle.catalog || 'N/A'})`);
    }
    
    // Update corresponding vehicle in public file
    if (publicVehiclesData.vehicles[index]) {
      publicVehiclesData.vehicles[index].specs = vehicle.specs;
    }
  });
  
  // Write updated data back
  fs.writeFileSync(vehiclesPath, JSON.stringify(vehiclesData, null, 2), 'utf8');
  fs.writeFileSync(publicVehiclesPath, JSON.stringify(publicVehiclesData, null, 2), 'utf8');
  
  console.log('\n✅ Vehicle specifications updated successfully!');
  console.log(`Updated ${vehiclesPath}`);
  console.log(`Updated ${publicVehiclesPath}`);
}

/**
 * Extract specifications from PDF (requires pdf-parse or similar library)
 * This is a placeholder - you'll need to install pdf-parse: npm install pdf-parse
 */
async function extractSpecsFromPDF(pdfPath) {
  try {
    // Uncomment when pdf-parse is installed
    // const pdfParse = require('pdf-parse');
    // const dataBuffer = fs.readFileSync(pdfPath);
    // const data = await pdfParse(dataBuffer);
    // return parseSpecsFromText(data.text);
    
    console.log(`⚠️  PDF parsing not implemented. Please install pdf-parse: npm install pdf-parse`);
    return null;
  } catch (error) {
    console.error(`Error reading PDF ${pdfPath}:`, error.message);
    return null;
  }
}

/**
 * Parse specifications from extracted PDF text
 */
function parseSpecsFromText(text) {
  const specs = {};
  
  // Common patterns to extract from PDF text
  const patterns = {
    engine: /engine[:\s]+([^\n]+)/i,
    power: /power[:\s]+([^\n]+)/i,
    torque: /torque[:\s]+([^\n]+)/i,
    transmission: /transmission[:\s]+([^\n]+)/i,
    fuelType: /fuel[:\s]+([^\n]+)/i,
    mileage: /mileage[:\s]+([^\n]+)/i,
    payload: /payload[:\s]+([^\n]+)/i,
    length: /length[:\s]+([^\n]+)/i,
    width: /width[:\s]+([^\n]+)/i,
    height: /height[:\s]+([^\n]+)/i,
    wheelbase: /wheelbase[:\s]+([^\n]+)/i,
    maxSpeed: /max[.\s]*speed[:\s]+([^\n]+)/i,
    groundClearance: /ground[.\s]*clearance[:\s]+([^\n]+)/i,
  };
  
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern);
    if (match) {
      specs[key] = match[1].trim();
    }
  }
  
  return specs;
}

// Run the update
if (require.main === module) {
  console.log('🚀 Starting vehicle specifications update...\n');
  updateVehicleSpecs();
}

module.exports = { updateVehicleSpecs, extractSpecsFromPDF, parseSpecsFromText };


