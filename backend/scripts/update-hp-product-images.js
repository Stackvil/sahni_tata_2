import { productsDB } from '../utils/dbManager.js';
import { initDatabase } from '../config/database.js';

// Import the product data from upload script
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the upload script to extract product data
let hpLubricantsProducts = [];
try {
  const uploadScriptPath = join(__dirname, 'upload-hp-lubricants-products.js');
  const scriptContent = readFileSync(uploadScriptPath, 'utf-8');
  
  // Extract the hpLubricantsProducts array using regex
  const arrayMatch = scriptContent.match(/const hpLubricantsProducts = \[([\s\S]*?)\];/);
  if (arrayMatch) {
    // Parse the array content - this is a simplified approach
    // We'll use eval in a safe way or parse manually
    const arrayContent = arrayMatch[1];
    // For now, let's manually create the mapping from the upload script
  }
} catch (error) {
  console.warn('Could not read upload script, using manual mapping');
}

// HP Products with their correct image URLs - extracted from upload script
const hpProductsWithImages = [
  { name: 'HP KISAN SHAKTI', image_url: '/images/AG_OIL[1]/AG OIL/Kissan Shakati 3.5 Ltr.jpg' },
  { name: 'HP KISAN SHAKTI UTTO', image_url: '/images/AG_OIL[1]/AG OIL/Kissan Shakti Utto 5 Ltr.jpg' },
  { name: 'HP KISAN TRACTOR OIL 20W-40', image_url: '/images/AG_OIL[1]/AG OIL/HP KISAN TRACTOR OIL 20W-40.png' },
  { name: 'HP PUMPSET OIL', image_url: '/images/AG_OIL[1]/AG OIL/Pumpset-Oil-3_5-Ltr.jpg' },
  { name: 'HP SUPERTRAN HVI', image_url: '/images/AG_OIL[1]/AG OIL/HP SUPERTRAN HVI.png' },
  { name: 'HP SUPER DUTY BRAKE FLUID DOT 3', image_url: '/images/AG_OIL[1]/Brake Fluids/Brake Oil Dot 3 - 1 ltr.jpg' },
  { name: 'HP SUPER DUTY BRAKE FLUID DOT 4', image_url: '/images/AG_OIL[1]/Brake Fluids/Super Duty Break Fluid 1 Ltr.jpg' },
  { name: 'HP MILCY TURBO ULTRA', image_url: '/images/AG_OIL[1]/BS VI Grades/product-img_1_4.png' },
  { name: 'HP NEOSYNTH GEN6', image_url: '/images/AG_OIL[1]/BS VI Grades/Neosynth-GEN6-0W20-3_5-Ltr.png' },
  { name: 'HP RACER SKUTEX', image_url: '/images/AG_OIL[1]/BS VI Grades/Racer-Skutex-10W30-800ml.jpg' },
  { name: 'HP RACER SPLENDID', image_url: '/images/AG_OIL[1]/BS VI Grades/Racer-Spendid-20W50-900-ml.png' },
  { name: 'HP RACER SYNTH', image_url: '/images/AG_OIL[1]/BS VI Grades/Racer-Synth-10W-30-800-ml_2020.png' },
  { name: 'HP ATF DEX II', image_url: '/images/AG_OIL[1]/Gear AND tran/HP ATF DEX II.png' },
  { name: 'HP GEAR OIL XP 80W 90', image_url: '/images/AG_OIL[1]/Gear AND tran/Gear Oil XP 80W 90 5 Ltr-01_367x301.png' },
  { name: 'HP GEAR OIL XP 85W 140', image_url: '/images/AG_OIL[1]/Gear AND tran/Gear Drive XP 85W-140_0.jpg' },
  { name: 'HP Gear Drive EP 90', image_url: '/images/AG_OIL[1]/Gear AND tran/Gear-Drive-EP-90-5-LTR.jpg' },
  { name: 'HP POWERSYNTRAN', image_url: '/images/AG_OIL[1]/Gear AND tran/HP POWERSYNTRAN.png' },
  { name: 'HP MILCY TURBO 15W-40', image_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/Milcy Turbo 5 LTr.jpg' },
  { name: 'HP MILCY FORCE 15W-40', image_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP MILCY FORCE 15W 40.png' },
  { name: 'HP MILCY PICKUP ULTRA', image_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/270 X 240- MILCY PICKUP ULTRA.png' },
  { name: 'HP LAAL GHODA 20W-40', image_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/laal-ghoda-5-ltr.jpg' },
  { name: 'HP MILCY TURBOSTAR 15W-40', image_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/Milcy Turbo Star 7.5 Ltr.jpg' },
  { name: 'HP MILCY CNG 15W-40', image_url: '/images/AG_OIL[1]/Natural Gas And CNG Engine Oils/HP-MILCY-CNG-15W-40.png' },
  { name: 'HP GASENOL 20W-50', image_url: '/images/AG_OIL[1]/Natural Gas And CNG Engine Oils/Gasenol-3-Ltr.jpg' },
  { name: 'HP LONG DRAIN CNG ENGINE OIL 15W-40', image_url: '/images/AG_OIL[1]/Natural Gas And CNG Engine Oils/HP LONG DRAIN CNG ENGINE OIL 15W-40.png' },
  { name: 'HP GREEN ENGINE OIL 15W-40 & 20W-50', image_url: '/images/AG_OIL[1]/Natural Gas And CNG Engine Oils/HP GREEN ENGINE OIL 15W 40 and 20W 50.png' },
  { name: 'HP MILCY MARINA', image_url: '/images/AG_OIL[1]/Outboatd Marine Oils/Milcy-Marina-20-Ltr.jpg' },
  { name: 'HP MATSYA BOAT OIL 2T', image_url: '/images/AG_OIL[1]/Outboatd Marine Oils/Matsya-Boat-Oil-5-Ltr.jpg' },
  { name: 'HP MATSYAFED 2T PREMIUM', image_url: '/images/AG_OIL[1]/Outboatd Marine Oils/Matsyafed-2T-5-Ltr.png' },
  { name: 'HP MARIGEN 4015 & 3015', image_url: '/images/AG_OIL[1]/Outboatd Marine Oils/HP MARIGEN 4015 & 3015.png' },
  { name: 'HP NEOSYNTH GEN6 5W-30', image_url: '/images/AG_OIL[1]/PASSENGER CAR ENGINE OILS/HP NEOSYNTH GEN6 5W-30.png' },
  { name: 'HP NEOSYNTH 10W-40', image_url: '/images/AG_OIL[1]/PASSENGER CAR ENGINE OILS/Neosynth-10W40-466x382.jpg' },
  { name: 'HP Neo Super 5W30', image_url: '/images/AG_OIL[1]/PASSENGER CAR ENGINE OILS/HP-Neo-Super-5W30-packshot.jpg' },
  { name: 'HP CRUISE 15W-40', image_url: '/images/AG_OIL[1]/PASSENGER CAR ENGINE OILS/HP CRUISE 15W 40.png' },
  { name: 'HP NEOSYNTH CNG 20W-50', image_url: '/images/AG_OIL[1]/PASSENGER CAR ENGINE OILS/HP NEOSYNTH CNG 20W-50.png' },
  { name: 'HP KOOLGARD ADVANCE 1:1', image_url: '/images/AG_OIL[1]/RADIATOR COOLANTS/Koolgard-Advanced-1-Ltr.jpg' },
  { name: 'HP KOOLGARD CLASSIC 1:7', image_url: '/images/AG_OIL[1]/RADIATOR COOLANTS/Koolgard-Classic-New.jpg' },
  { name: 'HP POWERKOOL RR', image_url: '/images/AG_OIL[1]/RADIATOR COOLANTS/HP POWERKOOL RR.png' },
  { name: 'HP THANDA RAJA', image_url: '/images/AG_OIL[1]/RADIATOR COOLANTS/Thanda Raja 1 Ltr.jpg' },
  { name: 'HP KOOLGARD P', image_url: '/images/AG_OIL[1]/RADIATOR COOLANTS/HP KOOLGARD P.png' },
  { name: 'HP RACER SPLENDID 10W-30', image_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/Racer-Splendid-10W30--900-mL.png' },
  { name: 'HP RACER SYNTH 10W-30', image_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/Racer-Synth-1-lr.png' },
  { name: 'HP RACER GEN6', image_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/Racer-Gen6-20w-40.jpg' },
  { name: 'HP Racer Skutex Pro 5W-30', image_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/Racer-Skutex-Pro-5W30.jpg' },
  { name: 'HP RACER 15W-50', image_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/Racer 15W-50 2.5 Ltr.jpg' },
  // Products that may not have images - will be skipped
  { name: 'THREE WHEELER ENGINE OILS RUNNING ON DIESEL', image_url: null },
  { name: 'HP CNG BOOSTER 20W-50', image_url: null },
  { name: 'HP AUTO SHAKTI 20W-50', image_url: null },
  { name: 'SHOCK ABSORBER OILS', image_url: null },
  { name: 'HP RAIL ROAD OIL 813M', image_url: null },
  { name: 'HP RAIL ROAD OIL 810M', image_url: null },
  { name: 'HP RAIL ROAD OIL 713', image_url: null },
  { name: 'HP RAIL ROAD OIL 613', image_url: null },
  { name: 'HP EV TRANSMISSION FLUID', image_url: null },
  { name: 'HP EV HUBGREASE', image_url: null },
  { name: 'HP EV KOOLGARD', image_url: null },
  { name: 'HP EV BRAKE FLUID', image_url: null },
];

async function updateHpProductImages() {
  try {
    console.log('🚀 Initializing database connection...');
    const initResult = await initDatabase();
    
    if (!initResult.success) {
      console.error('❌ Database initialization failed:', initResult.message);
      process.exit(1);
    }
    
    console.log('✅ Database connection established\n');

    // Get all HP products
    const allProducts = await productsDB.getAll(1, 10000);
    const hpProducts = allProducts.products.filter(p => p.company_key === 'hp');
    
    console.log(`📦 Found ${hpProducts.length} HP products in database\n`);

    let successCount = 0;
    let errorCount = 0;
    let updatedCount = 0;
    let nullImageCount = 0;

    // Create a map of product names to image URLs for quick lookup
    const imageMap = new Map();
    hpProductsWithImages.forEach(item => {
      imageMap.set(item.name.toUpperCase().trim(), item.image_url);
    });

    for (let i = 0; i < hpProducts.length; i++) {
      const product = hpProducts[i];
      const progress = `[${i + 1}/${hpProducts.length}]`;
      
      try {
        // Check if product has null or empty image_url
        const hasNullImage = !product.image_url || product.image_url.trim() === '';
        
        if (hasNullImage) {
          nullImageCount++;
        }
        
        // Try to find matching image URL
        const productNameUpper = product.name.toUpperCase().trim();
        const imageUrl = imageMap.get(productNameUpper);
        
        if (imageUrl && imageUrl !== null) {
          // Update product with image URL
          await productsDB.update(product.id, {
            name: product.name,
            company_key: product.company_key,
            category_name: product.category_name,
            description: product.description,
            specs: product.specs,
            image_url: imageUrl
          });

          console.log(`  ${progress} ✅ Updated: ${product.name} - ${imageUrl}`);
          updatedCount++;
        } else if (hasNullImage) {
          console.log(`  ${progress} ⚠️  No image found for: ${product.name}`);
        } else {
          // Product already has an image, skip
          console.log(`  ${progress} ✓ Already has image: ${product.name}`);
        }
        
        successCount++;
      } catch (error) {
        console.error(`  ${progress} ❌ Failed to update "${product.name}":`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Update Summary:');
    console.log(`   ✅ Total products processed: ${successCount}`);
    console.log(`   🖼️  Products with images updated: ${updatedCount}`);
    console.log(`   ⚠️  Products with null images: ${nullImageCount}`);
    console.log(`   ❌ Errors: ${errorCount} products`);
    console.log('='.repeat(60));

    console.log('\n✨ HP product images update completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the update
updateHpProductImages();

