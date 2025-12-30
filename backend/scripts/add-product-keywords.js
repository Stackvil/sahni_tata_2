import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Company name mappings
const companyNames = {
  hp: 'HP Lubricants',
  mahindra: 'Mahindra',
  jiobp: 'Jio-bp',
  superline: 'SUPERLINE',
  reliance: 'Reliance Lubricants',
  balmerol: 'Balmerol Lubricants'
};

// HP Lubricants specific categories mapping
const hpCategories = {
  'Agriculture Oils': ['agriculture oils', 'agriculture oil', 'agricultural oils', 'agricultural oil', 'tractor oil', 'tractor oils', 'farm equipment oil', 'kisan', 'agriculture'],
  'Two Wheeler Engine Oils': ['two wheeler engine oils', 'two wheeler engine oil', 'two wheeler', 'motorcycle oil', 'motorcycle oils', 'bike oil', 'scooter oil', '2 wheeler'],
  'Three Wheeler Engine Oils': ['three wheeler engine oils', 'three wheeler engine oil', 'three wheeler', '3 wheeler', 'auto rickshaw oil'],
  'Passenger Car Engine Oils': ['passenger car engine oils', 'passenger car engine oil', 'passenger car', 'car engine oil', 'car oils', 'pcm oil'],
  'Heavy Duty Diesel Engine Oils': ['heavy duty diesel engine oils', 'heavy duty diesel', 'hd diesel', 'commercial vehicle oil', 'truck oil', 'bus oil', 'cv engine oil'],
  'BS VI Grades': ['bs vi grades', 'bs vi', 'bs6', 'bs-vi', 'bs6 grade', 'bs vi grade'],
  'Gear and Transmission Oils': ['gear and transmission oils', 'gear oil', 'transmission oil', 'gear oils', 'transmission oils', 'gear lubricant'],
  'Brake Fluids': ['brake fluids', 'brake fluid', 'brake oil'],
  'Radiator Coolants': ['radiator coolants', 'radiator coolant', 'coolant', 'engine coolant', 'antifreeze'],
  'Outboard Marine Oils': ['outboard marine oils', 'outboard marine oil', 'marine oil', 'marine engine oil', 'boat oil'],
  'Railroad Engine Oils': ['railroad engine oils', 'railroad engine oil', 'railway oil', 'railway engine oil', 'locomotive oil'],
  'Natural Gas And CNG Engine Oils': ['natural gas and cng engine oils', 'cng engine oil', 'natural gas engine oil', 'cng oil', 'ng engine oil'],
  'Shock Absorber and Front Fork Oils': ['shock absorber and front fork oils', 'shock absorber oil', 'fork oil', 'front fork oil', 'suspension oil'],
  'EV and Hybrid Range': ['ev and hybrid range', 'ev oil', 'hybrid oil', 'electric vehicle oil'],
};

// Generate keywords for a product
function generateKeywords(product) {
  const keywords = new Set();
  const productNameLower = product.name?.toLowerCase() || '';
  const descriptionLower = product.description?.toLowerCase() || '';
  const categoryLower = product.category?.toLowerCase() || '';
  const specsLower = product.specs?.toLowerCase() || '';
  const combinedText = `${productNameLower} ${descriptionLower} ${specsLower}`.toLowerCase();
  
  // Add company/brand names
  if (product.company) {
    const companyLower = product.company.toLowerCase();
    const companyName = companyNames[companyLower] || product.company;
    
    // Add brand variations
    keywords.add(companyName.toLowerCase());
    keywords.add(companyName);
    keywords.add(product.company);
    keywords.add(product.company.toLowerCase());
    
    // Add brand + lubricants
    if (companyName.includes('Lubricant')) {
      keywords.add(companyName.toLowerCase());
    } else {
      keywords.add(`${companyName.toLowerCase()} lubricants`);
      keywords.add(`${companyName.toLowerCase()} lubricant`);
    }
    
    // For HP products, add specific HP category keywords based on product details
    if (companyLower === 'hp') {
      // Specific HP product type detection (priority order matters - most specific first)
      if (combinedText.includes('tractor') || combinedText.includes('kisan') || combinedText.includes('agriculture') || combinedText.includes('farm')) {
        keywords.add('Agriculture Oils');
        keywords.add('agriculture oils');
        keywords.add('agriculture oil');
        keywords.add('agricultural oils');
        keywords.add('tractor oil');
        keywords.add('tractor oils');
        keywords.add('kisan oil');
        keywords.add('farm equipment oil');
      }
      else if (combinedText.includes('railway') || combinedText.includes('railroad') || combinedText.includes('locomotive') || combinedText.includes('powerkool')) {
        keywords.add('Railroad Engine Oils');
        keywords.add('railroad engine oils');
        keywords.add('railroad engine oil');
        keywords.add('railway oil');
        keywords.add('railway engine oil');
        keywords.add('locomotive oil');
      }
      else if (combinedText.includes('marine') || combinedText.includes('boat')) {
        keywords.add('Outboard Marine Oils');
        keywords.add('outboard marine oils');
        keywords.add('outboard marine oil');
        keywords.add('marine oil');
        keywords.add('marine engine oil');
        keywords.add('boat oil');
        keywords.add('boat lubricant');
      }
      else if ((combinedText.includes('gear') || combinedText.includes('transmission')) && !combinedText.includes('marine')) {
        keywords.add('Gear and Transmission Oils');
        keywords.add('gear and transmission oils');
        keywords.add('gear oil');
        keywords.add('gear oils');
        keywords.add('transmission oil');
        keywords.add('transmission oils');
        keywords.add('gear lubricant');
      }
      else if (combinedText.includes('motorcycle') || combinedText.includes('bike') || combinedText.includes('scooter') || combinedText.includes('two wheeler') || combinedText.includes('2 wheeler') || combinedText.includes('racer') || combinedText.includes('4t')) {
        keywords.add('Two Wheeler Engine Oils');
        keywords.add('two wheeler engine oils');
        keywords.add('two wheeler engine oil');
        keywords.add('two wheeler');
        keywords.add('motorcycle oil');
        keywords.add('motorcycle oils');
        keywords.add('bike oil');
        keywords.add('scooter oil');
        keywords.add('2 wheeler');
      }
      else if (combinedText.includes('three wheeler') || combinedText.includes('3 wheeler') || combinedText.includes('auto rickshaw')) {
        keywords.add('Three Wheeler Engine Oils');
        keywords.add('three wheeler engine oils');
        keywords.add('three wheeler engine oil');
        keywords.add('three wheeler');
        keywords.add('3 wheeler');
        keywords.add('auto rickshaw oil');
      }
      else if (combinedText.includes('passenger car') || (combinedText.includes('car') && combinedText.includes('petrol')) || (combinedText.includes('car engine') && !combinedText.includes('truck'))) {
        keywords.add('Passenger Car Engine Oils');
        keywords.add('passenger car engine oils');
        keywords.add('passenger car engine oil');
        keywords.add('passenger car');
        keywords.add('car engine oil');
        keywords.add('car oils');
        keywords.add('pcm oil');
      }
      else if (combinedText.includes('diesel') && (combinedText.includes('heavy') || combinedText.includes('commercial') || combinedText.includes('truck') || combinedText.includes('bus') || combinedText.includes('milcy'))) {
        keywords.add('Heavy Duty Diesel Engine Oils');
        keywords.add('heavy duty diesel engine oils');
        keywords.add('heavy duty diesel engine oil');
        keywords.add('heavy duty diesel');
        keywords.add('hd diesel');
        keywords.add('commercial vehicle oil');
        keywords.add('truck oil');
        keywords.add('bus oil');
        keywords.add('cv engine oil');
      }
      else if (combinedText.includes('brake')) {
        keywords.add('Brake Fluids');
        keywords.add('brake fluids');
        keywords.add('brake fluid');
        keywords.add('brake oil');
      }
      else if (combinedText.includes('coolant') || combinedText.includes('radiator')) {
        keywords.add('Radiator Coolants');
        keywords.add('radiator coolants');
        keywords.add('radiator coolant');
        keywords.add('coolant');
        keywords.add('engine coolant');
        keywords.add('antifreeze');
      }
      else if (combinedText.includes('cng') || combinedText.includes('natural gas')) {
        keywords.add('Natural Gas And CNG Engine Oils');
        keywords.add('natural gas and cng engine oils');
        keywords.add('cng engine oil');
        keywords.add('natural gas engine oil');
        keywords.add('cng oil');
        keywords.add('ng engine oil');
      }
      else if (combinedText.includes('fork') || combinedText.includes('shock absorber')) {
        keywords.add('Shock Absorber and Front Fork Oils');
        keywords.add('shock absorber and front fork oils');
        keywords.add('shock absorber oil');
        keywords.add('fork oil');
        keywords.add('front fork oil');
        keywords.add('suspension oil');
      }
      else if (combinedText.includes('bs vi') || combinedText.includes('bs6') || combinedText.includes('bs-vi')) {
        keywords.add('BS VI Grades');
        keywords.add('bs vi grades');
        keywords.add('bs vi');
        keywords.add('bs6');
        keywords.add('bs-vi');
        keywords.add('bs6 grade');
        keywords.add('bs vi grade');
      }
      else if (combinedText.includes('ev') || combinedText.includes('electric vehicle') || combinedText.includes('hybrid')) {
        keywords.add('EV and Hybrid Range');
        keywords.add('ev and hybrid range');
        keywords.add('ev oil');
        keywords.add('hybrid oil');
        keywords.add('electric vehicle oil');
      }
    }
    
    // Add generic brand terms for SEO (Tata, TAFE mentioned by user)
    if (!companyLower.includes('tata') && !companyLower.includes('tafe')) {
      keywords.add('tata lubricants');
      keywords.add('tafe lubricants');
      keywords.add('tata lubricant');
      keywords.add('tafe lubricant');
    }
  }
  
  // Add product name and variations
  if (product.name) {
    keywords.add(product.name.toLowerCase());
    keywords.add(product.name);
    
    // Extract key terms from product name
    const nameWords = product.name.toLowerCase().split(/\s+/);
    nameWords.forEach(word => {
      if (word.length > 2) { // Skip short words
        keywords.add(word);
      }
    });
  }
  
  // Add category-based keywords (generic categories)
  if (product.category) {
    keywords.add(categoryLower);
    keywords.add(product.category);
    
    // Generic category-specific terms (for non-HP products or fallback)
    if (categoryLower.includes('automotive')) {
      keywords.add('automotive lubricants');
      keywords.add('automotive oil');
      keywords.add('engine oil');
      keywords.add('motor oil');
      keywords.add('car lubricant');
      keywords.add('vehicle lubricant');
    }
    if (categoryLower.includes('industrial')) {
      keywords.add('industrial lubricants');
      keywords.add('industrial oil');
      keywords.add('machinery lubricant');
    }
    if (categoryLower.includes('marine')) {
      keywords.add('marine lubricants');
      keywords.add('marine oil');
      keywords.add('boat lubricant');
    }
    if (categoryLower.includes('grease')) {
      keywords.add('grease');
      keywords.add('industrial grease');
      keywords.add('bearing grease');
    }
    if (categoryLower.includes('specialties')) {
      keywords.add('specialty lubricants');
      keywords.add('specialty oil');
    }
  }
  
  // Add description-based keywords
  if (product.description) {
    const descLower = product.description.toLowerCase();
    
    // Extract common lubricant terms
    const commonTerms = [
      'engine oil', 'gear oil', 'hydraulic oil', 'transmission oil',
      'diesel oil', 'petrol oil', 'motorcycle oil', 'tractor oil',
      'synthetic oil', 'premium oil', 'motor oil', 'brake fluid',
      'coolant', 'cutting oil', 'turbine oil', 'compressor oil',
      'bearing oil', 'quenching oil', 'rolling oil'
    ];
    
    commonTerms.forEach(term => {
      if (descLower.includes(term) || descLower.includes(term.replace(' oil', ''))) {
        keywords.add(term);
        keywords.add(term.replace(' oil', ''));
      }
    });
  }
  
  // Add specs-based keywords
  if (product.specs) {
    const specsLower = product.specs.toLowerCase();
    
    // API ratings, viscosity grades
    const specTerms = specsLower.match(/(api\s+\w+|\d+w-\d+|iso\s+vg\s+\d+)/gi);
    if (specTerms) {
      specTerms.forEach(term => keywords.add(term.toLowerCase()));
    }
  }
  
  // Add generic search terms that users might use
  keywords.add('lubricants');
  keywords.add('lubricant');
  keywords.add('oil');
  keywords.add('engine oil india');
  keywords.add('best lubricants');
  keywords.add('premium lubricants');
  keywords.add('automotive products');
  
  // Convert Set to Array and sort
  return Array.from(keywords).sort().join(', ');
}

// Main function
function addKeywordsToProducts() {
  const productsPath = join(__dirname, '../data/products.json');
  const publicProductsPath = join(__dirname, '../../../public/products.json');
  
  try {
    // Read products.json
    console.log('Reading products.json...');
    const productsData = JSON.parse(readFileSync(productsPath, 'utf8'));
    
    if (!productsData.products || !Array.isArray(productsData.products)) {
      throw new Error('Invalid products.json structure');
    }
    
    // Add/regenerate keywords to each product (force regeneration)
    console.log(`Processing ${productsData.products.length} products...`);
    productsData.products.forEach((product, index) => {
      product.keywords = generateKeywords(product);
      console.log(`[${index + 1}/${productsData.products.length}] Updated keywords for: ${product.name}`);
    });
    
    // Write back to backend/data/products.json
    console.log('Writing to backend/data/products.json...');
    writeFileSync(productsPath, JSON.stringify(productsData, null, 2), 'utf8');
    console.log('✓ Updated backend/data/products.json');
    
    // Also update public/products.json
    try {
      console.log('Writing to public/products.json...');
      writeFileSync(publicProductsPath, JSON.stringify(productsData, null, 2), 'utf8');
      console.log('✓ Updated public/products.json');
    } catch (publicError) {
      console.warn('Warning: Could not update public/products.json:', publicError.message);
    }
    
    console.log('\n✅ Successfully added keywords to all products!');
    console.log(`Total products processed: ${productsData.products.length}`);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the script
addKeywordsToProducts();

