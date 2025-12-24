import { fuelStationsDB } from '../utils/dbManager.js';

async function updateFuelStationPhone() {
  try {
    console.log('📞 Updating fuel station phone numbers...');
    
    // Get all fuel stations
    const stations = await fuelStationsDB.getAll(1, 100);
    
    if (!stations.fuel_stations || stations.fuel_stations.length === 0) {
      console.log('⚠️  No fuel stations found in database');
      return;
    }
    
    console.log(`Found ${stations.fuel_stations.length} fuel station(s)`);
    
    let updated = 0;
    for (const station of stations.fuel_stations) {
      // Update phone number to the new one
      const updatedStation = await fuelStationsDB.update(station.id, {
        name: station.name,
        location: station.location,
        address: station.address,
        phone: '+91 93918 20529', // New phone number
        image: station.image,
        mapLink: station.map_link,
        features: station.features,
        latitude: station.latitude,
        longitude: station.longitude
      });
      
      console.log(`✅ Updated ${station.name}: ${station.phone} → +91 93918 20529`);
      updated++;
    }
    
    console.log(`\n✅ Successfully updated ${updated} fuel station(s)`);
  } catch (error) {
    console.error('❌ Error updating fuel station phone numbers:', error);
    process.exit(1);
  }
}

// Run the update
updateFuelStationPhone()
  .then(() => {
    console.log('\n✨ Update complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

