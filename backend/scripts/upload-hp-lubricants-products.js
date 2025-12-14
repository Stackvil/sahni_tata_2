import { productsDB } from '../utils/dbManager.js';
import { initDatabase, query } from '../config/database.js';
import { uploadToS3 } from '../config/s3.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get project root (2 levels up from backend/scripts)
const PROJECT_ROOT = path.join(__dirname, '../../');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');

// HP Lubricants Products organized by category - Top 4-5 products per category with images and full specs
const hpLubricantsProducts = [
  // Agriculture Oils - Top 5
  { 
    name: 'HP KISAN SHAKTI', 
    category: 'Agriculture Oils', 
    description: 'High-performance agricultural engine oil specially formulated for tractors and farm equipment. Provides excellent engine protection, reduces wear, and ensures smooth operation in all weather conditions.', 
    specs: 'Viscosity Grade: Multi-grade | API Classification: CF-4/SG | Suitable for: All tractors and agricultural machinery | Benefits: Enhanced engine protection, reduced wear, improved fuel economy, excellent cold start performance | Pack Sizes: 3.5L, 5L, 20L',
    image_url: '/images/AG_OIL[1]/AG OIL/Kissan Shakati 3.5 Ltr.jpg',
    catalog_url: '/images/AG_OIL[1]/AG OIL/HP KISAN SHAKTI_0.pdf'
  },
  { 
    name: 'HP KISAN SHAKTI UTTO', 
    category: 'Agriculture Oils', 
    description: 'Universal Tractor Transmission Oil (UTTO) designed for agricultural applications. Provides protection for transmission, hydraulic systems, and wet brakes in a single fluid.', 
    specs: 'Grade: UTTO (Universal Tractor Transmission Oil) | Viscosity: SAE 20W-40 | Applications: Transmission, hydraulics, wet brakes | Benefits: Single fluid for multiple systems, excellent thermal stability, superior protection | Pack Sizes: 5L, 20L',
    image_url: '/images/AG_OIL[1]/AG OIL/Kissan Shakti Utto 5 Ltr.jpg',
    catalog_url: '/images/AG_OIL[1]/AG OIL/HP KISAN SHAKTI UTTO-14-5-2019.pdf'
  },
  { 
    name: 'HP KISAN TRACTOR OIL 20W-40', 
    category: 'Agriculture Oils', 
    description: 'Multi-grade tractor engine oil providing year-round performance. Formulated to protect engines in varying temperature conditions from extreme heat to cold starts.', 
    specs: 'Viscosity Grade: 20W-40 | API Classification: CF-4/SG | Temperature Range: All weather conditions | Benefits: Year-round protection, excellent cold start, reduced engine wear, improved fuel efficiency | Pack Sizes: 3.5L, 5L, 20L',
    image_url: '/images/AG_OIL[1]/AG OIL/HP KISAN TRACTOR OIL 20W-40.png',
    catalog_url: '/images/AG_OIL[1]/AG OIL/HP-KISAN-TRACTOR-OIL.pdf'
  },
  { 
    name: 'HP PUMPSET OIL', 
    category: 'Agriculture Oils', 
    description: 'Specialized engine oil designed specifically for agricultural pump sets. Provides excellent protection against rust, corrosion, and wear in pump set engines.', 
    specs: 'Grade: Specialized pump set oil | Applications: Agricultural pump sets, water pumps | Benefits: Excellent rust protection, reduced wear, extended engine life, cost-effective | Pack Sizes: 3.5L, 5L',
    image_url: '/images/AG_OIL[1]/AG OIL/Pumpset-Oil-3_5-Ltr.jpg',
    catalog_url: '/images/AG_OIL[1]/AG OIL/HP-PUMPSET-OIL.pdf'
  },
  { 
    name: 'HP SUPERTRAN HVI', 
    category: 'Agriculture Oils', 
    description: 'High Viscosity Index transmission oil for agricultural equipment. Provides superior protection for transmissions, differentials, and final drives under extreme conditions.', 
    specs: 'Grade: HVI (High Viscosity Index) | Viscosity: Multi-grade | Applications: Transmissions, differentials, final drives | Benefits: High viscosity index, excellent thermal stability, superior protection, extended drain intervals | Pack Sizes: 5L, 20L',
    image_url: '/images/AG_OIL[1]/AG OIL/HP SUPERTRAN HVI.png',
    catalog_url: '/images/AG_OIL[1]/AG OIL/HP SUPERTRAN HVI-14-5-2019.pdf'
  },

  // Brake Fluids - Top 2
  { 
    name: 'HP SUPER DUTY BRAKE FLUID DOT 3', 
    category: 'Brake Fluids', 
    description: 'High-performance brake fluid meeting DOT 3 specifications. Provides reliable braking performance with excellent thermal stability and moisture resistance.', 
    specs: 'Specification: DOT 3 | Boiling Point: 205°C (dry), 140°C (wet) | Color: Clear to amber | Applications: All vehicles requiring DOT 3 brake fluid | Benefits: Reliable braking, excellent thermal stability, moisture resistance | Pack Size: 1L',
    image_url: '/images/AG_OIL[1]/Brake Fluids/Brake Oil Dot 3 - 1 ltr.jpg',
    catalog_url: '/images/AG_OIL[1]/Brake Fluids/HP SUPER DUTY BRAKE FLUID DOT 3-14-05-2019.pdf'
  },
  { 
    name: 'HP SUPER DUTY BRAKE FLUID DOT 4', 
    category: 'Brake Fluids', 
    description: 'Premium brake fluid meeting DOT 4 specifications. Offers superior performance with higher boiling point for demanding braking applications.', 
    specs: 'Specification: DOT 4 | Boiling Point: 230°C (dry), 155°C (wet) | Color: Clear to amber | Applications: High-performance vehicles, ABS systems | Benefits: Higher boiling point, superior performance, excellent for ABS systems | Pack Size: 1L',
    image_url: '/images/AG_OIL[1]/Brake Fluids/Super Duty Break Fluid 1 Ltr.jpg',
    catalog_url: '/images/AG_OIL[1]/Brake Fluids/HP SUPER DUTY BRAKE FLUID DOT 4-14-05-2019.pdf'
  },

  // BS VI Grades - Top 5
  { 
    name: 'HP MILCY TURBO ULTRA', 
    category: 'BS VI Grades', 
    description: 'Ultra-premium turbo engine oil specifically formulated for BS VI compliant commercial vehicles. Provides exceptional protection for turbocharged engines with advanced additive technology.', 
    specs: 'Viscosity: 15W-40 | API: CI-4/SL | BS VI Compliant: Yes | Applications: BS VI turbocharged commercial vehicles | Benefits: Turbo protection, reduced emissions, extended drain intervals, fuel economy | Pack Sizes: 5L, 7.5L, 20L',
    image_url: '/images/AG_OIL[1]/BS VI Grades/product-img_1_4.png',
    catalog_url: '/images/AG_OIL[1]/BS VI Grades/HP-MILCY-TURBO-ULTRA.pdf'
  },
  { 
    name: 'HP NEOSYNTH GEN6', 
    category: 'BS VI Grades', 
    description: 'Next-generation fully synthetic engine oil for BS VI compliant passenger cars. Advanced formulation provides superior engine protection and performance.', 
    specs: 'Viscosity: 0W-20, 5W-30 | API: SP/SN Plus | BS VI Compliant: Yes | Applications: BS VI passenger cars, modern engines | Benefits: Fully synthetic, superior protection, fuel economy, extended drain | Pack Sizes: 3.5L, 5L',
    image_url: '/images/AG_OIL[1]/BS VI Grades/Neosynth-GEN6-0W20-3_5-Ltr.png',
    catalog_url: '/images/AG_OIL[1]/BS VI Grades/HP-NEOSYNTH-GEN6.pdf'
  },
  { 
    name: 'HP RACER SKUTEX', 
    category: 'BS VI Grades', 
    description: 'Specialized engine oil designed for BS VI compliant scooters. Formulated to meet the specific requirements of modern scooter engines with advanced emission control systems.', 
    specs: 'Viscosity: 10W-30 | JASO: MB | BS VI Compliant: Yes | Applications: BS VI scooters | Benefits: Optimized for scooters, emission control, smooth operation, fuel efficiency | Pack Sizes: 800ml, 1L',
    image_url: '/images/AG_OIL[1]/BS VI Grades/Racer-Skutex-10W30-800ml.jpg',
    catalog_url: '/images/AG_OIL[1]/BS VI Grades/HP-RACER-SKUTEX.pdf'
  },
  { 
    name: 'HP RACER SPLENDID', 
    category: 'BS VI Grades', 
    description: 'Premium engine oil for BS VI compliant two-wheelers. Provides excellent protection and performance for modern motorcycle engines meeting stringent emission norms.', 
    specs: 'Viscosity: 20W-50 | JASO: MA2 | BS VI Compliant: Yes | Applications: BS VI motorcycles | Benefits: Premium protection, smooth shifting, reduced friction, fuel economy | Pack Sizes: 900ml, 1L',
    image_url: '/images/AG_OIL[1]/BS VI Grades/Racer-Spendid-20W50-900-ml.png',
    catalog_url: '/images/AG_OIL[1]/BS VI Grades/HP-RACER-SPLENDID.pdf'
  },
  { 
    name: 'HP RACER SYNTH', 
    category: 'BS VI Grades', 
    description: 'Synthetic engine oil for BS VI compliant motorcycles. Advanced synthetic formulation delivers superior protection and performance for high-performance motorcycles.', 
    specs: 'Viscosity: 10W-30 | JASO: MA2 | BS VI Compliant: Yes | Type: Fully Synthetic | Applications: BS VI motorcycles, high-performance bikes | Benefits: Synthetic protection, superior performance, extended drain, fuel efficiency | Pack Sizes: 800ml, 1L',
    image_url: '/images/AG_OIL[1]/BS VI Grades/Racer-Synth-10W-30-800-ml_2020.png',
    catalog_url: '/images/AG_OIL[1]/BS VI Grades/HP-RACER-SYNTH_0.pdf'
  },

  // EV and Hybrid Range - Top 4
  { 
    name: 'HP EV BRAKE FLUID', 
    category: 'EV and Hybrid Range', 
    description: 'Specialized brake fluid formulated for electric and hybrid vehicles. Provides reliable braking performance compatible with regenerative braking systems.', 
    specs: 'Specification: DOT 4+ | Applications: Electric and hybrid vehicles | Benefits: EV-compatible, regenerative braking support, high boiling point, excellent performance | Pack Size: 1L',
    image_url: null,
    catalog_url: null
  },
  { 
    name: 'HP EV KOOLGARD', 
    category: 'EV and Hybrid Range', 
    description: 'Advanced coolant specifically designed for electric vehicle thermal management systems. Ensures optimal battery and motor temperature control.', 
    specs: 'Type: EV Thermal Management Coolant | Applications: EV battery cooling, motor cooling | Benefits: Optimal thermal management, battery protection, extended range, efficient cooling | Pack Sizes: 1L, 5L',
    image_url: null,
    catalog_url: null
  },
  { 
    name: 'HP EV HUBGREASE', 
    category: 'EV and Hybrid Range', 
    description: 'Specialized hub grease for electric vehicle wheel bearings. Formulated to handle the unique requirements of EV drivetrain systems.', 
    specs: 'Type: EV Hub Grease | NLGI Grade: 2 | Applications: EV wheel bearings, hub assemblies | Benefits: EV-optimized, high load capacity, temperature stability, extended service life | Pack Sizes: 400g, 1kg',
    image_url: null,
    catalog_url: null
  },
  { 
    name: 'HP EV TRANSMISSION FLUID', 
    category: 'EV and Hybrid Range', 
    description: 'Advanced transmission fluid for electric vehicle drivetrains. Designed to protect and optimize performance of EV transmission systems.', 
    specs: 'Type: EV Transmission Fluid | Applications: EV single-speed and multi-speed transmissions | Benefits: EV-optimized, smooth operation, protection, efficiency | Pack Sizes: 1L, 5L',
    image_url: null,
    catalog_url: null
  },

  // Gear and Transmission Oils - Top 5
  { 
    name: 'HP ATF DEX II', 
    category: 'Gear and Transmission Oils', 
    description: 'Automatic Transmission Fluid compatible with Dexron II specifications. Provides smooth shifting and excellent protection for automatic transmissions.', 
    specs: 'Specification: Dexron II | Applications: Automatic transmissions requiring Dexron II | Benefits: Smooth shifting, transmission protection, extended fluid life, compatibility | Pack Sizes: 1L, 5L',
    image_url: '/images/AG_OIL[1]/Gear AND tran/HP ATF DEX II.png',
    catalog_url: '/images/AG_OIL[1]/Gear AND tran/HP ATF DEX II-15-05-2019.pdf'
  },
  { 
    name: 'HP GEAR OIL XP 80W 90', 
    category: 'Gear and Transmission Oils', 
    description: 'Multi-grade extreme pressure gear oil providing superior protection for manual transmissions, differentials, and gearboxes under all operating conditions.', 
    specs: 'Viscosity: 80W-90 | Type: Extreme Pressure (EP) | Applications: Manual transmissions, differentials, gearboxes | Benefits: EP protection, all-weather performance, reduced wear, smooth operation | Pack Sizes: 1L, 5L',
    image_url: '/images/AG_OIL[1]/Gear AND tran/Gear Oil XP 80W 90 5 Ltr-01_367x301.png',
    catalog_url: '/images/AG_OIL[1]/Gear AND tran/HP GEAR OIL XP 80W 90-15-05-2019.pdf'
  },
  { 
    name: 'HP GEAR OIL XP 85W 140', 
    category: 'Gear and Transmission Oils', 
    description: 'Multi-grade extreme pressure gear oil for heavy-duty applications. Provides excellent protection for high-load gear systems and differentials.', 
    specs: 'Viscosity: 85W-140 | Type: Extreme Pressure (EP) | Applications: Heavy-duty transmissions, differentials | Benefits: Heavy-duty protection, high load capacity, thermal stability, extended drain | Pack Sizes: 1L, 5L',
    image_url: '/images/AG_OIL[1]/Gear AND tran/Gear Drive XP 85W-140_0.jpg',
    catalog_url: '/images/AG_OIL[1]/Gear AND tran/HP GEAR OIL XP 85W 140-15-05-2019.pdf'
  },
  { 
    name: 'HP Gear Drive EP 90', 
    category: 'Gear and Transmission Oils', 
    description: 'Extreme Pressure gear oil grade 90 for industrial and automotive gear applications. Provides reliable protection for gear systems.', 
    specs: 'Viscosity: SAE 90 | Type: Extreme Pressure (EP) | Applications: Industrial gears, automotive differentials | Benefits: EP protection, gear protection, rust prevention, cost-effective | Pack Sizes: 1L, 5L',
    image_url: '/images/AG_OIL[1]/Gear AND tran/Gear-Drive-EP-90-5-LTR.jpg',
    catalog_url: '/images/AG_OIL[1]/Gear AND tran/HP-GEAR-DRIVE-EP-90.pdf'
  },
  { 
    name: 'HP POWERSYNTRAN', 
    category: 'Gear and Transmission Oils', 
    description: 'Synthetic transmission oil delivering superior performance and protection. Advanced synthetic formulation ensures optimal transmission operation.', 
    specs: 'Type: Synthetic Transmission Oil | Applications: High-performance transmissions | Benefits: Synthetic protection, superior performance, extended drain, smooth operation | Pack Sizes: 1L, 5L',
    image_url: '/images/AG_OIL[1]/Gear AND tran/HP POWERSYNTRAN.png',
    catalog_url: '/images/AG_OIL[1]/Gear AND tran/HP POWERSYNTRAN-15-05-2019.pdf'
  },

  // Heavy Duty Diesel Engine Oils - Top 5
  { 
    name: 'HP MILCY TURBO 15W-40', 
    category: 'Heavy Duty Diesel Engine Oils', 
    description: 'Premium turbo-grade heavy-duty diesel engine oil for commercial vehicles. Provides exceptional protection for turbocharged diesel engines in trucks and buses.', 
    specs: 'Viscosity: 15W-40 | API: CI-4/SL | Applications: Turbocharged commercial vehicles, trucks, buses | Benefits: Turbo protection, extended drain, reduced wear, fuel economy | Pack Sizes: 5L, 7.5L, 20L',
    image_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/Milcy Turbo 5 LTr.jpg',
    catalog_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP MILCY TURBO 15W 40-15-05-2019.pdf'
  },
  { 
    name: 'HP MILCY FORCE 15W-40', 
    category: 'Heavy Duty Diesel Engine Oils', 
    description: 'High-performance heavy-duty diesel engine oil designed for demanding commercial vehicle applications. Delivers superior engine protection and performance.', 
    specs: 'Viscosity: 15W-40 | API: CI-4/SL | Applications: Commercial vehicles, heavy-duty trucks | Benefits: High performance, engine protection, extended drain, cost-effective | Pack Sizes: 5L, 7.5L, 20L',
    image_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP MILCY FORCE 15W 40.png',
    catalog_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP MILCY FORCE 15W 40-15-05-2019.pdf'
  },
  { 
    name: 'HP MILCY PICKUP ULTRA', 
    category: 'Heavy Duty Diesel Engine Oils', 
    description: 'Ultra-premium heavy-duty diesel engine oil specifically formulated for pickup trucks. Provides maximum protection and performance for pickup truck engines.', 
    specs: 'Viscosity: 15W-40 | API: CI-4/SL | Applications: Pickup trucks, light commercial vehicles | Benefits: Ultra-premium protection, pickup optimized, extended drain, fuel efficiency | Pack Sizes: 5L, 7.5L',
    image_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/270 X 240- MILCY PICKUP ULTRA.png',
    catalog_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP-MILCY-PICKUP-ULTRA.pdf'
  },
  { 
    name: 'HP LAAL GHODA 20W-40', 
    category: 'Heavy Duty Diesel Engine Oils', 
    description: 'Popular and trusted heavy-duty diesel engine oil for commercial vehicles. Known for reliability and excellent performance in Indian conditions.', 
    specs: 'Viscosity: 20W-40 | API: CF-4/SG | Applications: Commercial vehicles, trucks | Benefits: Popular choice, reliable performance, cost-effective, proven quality | Pack Sizes: 5L, 20L',
    image_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/laal-ghoda-5-ltr.jpg',
    catalog_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP-LAAL-GHODA-20W-40.pdf'
  },
  { 
    name: 'HP MILCY TURBOSTAR 15W-40', 
    category: 'Heavy Duty Diesel Engine Oils', 
    description: 'Star-grade turbo heavy-duty diesel engine oil for premium commercial vehicles. Delivers exceptional protection and performance for turbocharged engines.', 
    specs: 'Viscosity: 15W-40 | API: CI-4/SL | Applications: Premium commercial vehicles, turbocharged engines | Benefits: Star-grade protection, turbo optimized, extended drain, superior performance | Pack Sizes: 5L, 7.5L, 20L',
    image_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/Milcy Turbo Star 7.5 Ltr.jpg',
    catalog_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP MILCY TURBOSTAR 15W 40.pdf'
  },

  // Natural Gas And CNG Engine Oils - Top 4
  { 
    name: 'HP MILCY CNG 15W-40', 
    category: 'Natural Gas And CNG Engine Oils', 
    description: 'CNG-specific heavy-duty engine oil formulated for compressed natural gas vehicles. Provides optimal protection for CNG engines with extended drain capabilities.', 
    specs: 'Viscosity: 15W-40 | API: CI-4/SL | Applications: CNG commercial vehicles, CNG buses | Benefits: CNG optimized, extended drain, engine protection, fuel efficiency | Pack Sizes: 5L, 7.5L, 20L',
    image_url: '/images/AG_OIL[1]/Natural Gas And CNG Engine Oils/HP-MILCY-CNG-15W-40.png',
    catalog_url: '/images/AG_OIL[1]/Natural Gas And CNG Engine Oils/HP-MILCY-CNG-15W-40.pdf'
  },
  { 
    name: 'HP GASENOL 20W-50', 
    category: 'Natural Gas And CNG Engine Oils', 
    description: 'Specialized natural gas and CNG engine oil providing excellent protection for gas-powered vehicles. Formulated to handle the unique requirements of CNG engines.', 
    specs: 'Viscosity: 20W-50 | Applications: CNG vehicles, natural gas engines | Benefits: CNG protection, engine longevity, reduced deposits, reliable performance | Pack Sizes: 3L, 5L',
    image_url: '/images/AG_OIL[1]/Natural Gas And CNG Engine Oils/Gasenol-3-Ltr.jpg',
    catalog_url: '/images/AG_OIL[1]/Natural Gas And CNG Engine Oils/HP GASENOL 20W 50-15-05-2019_0.pdf'
  },
  { 
    name: 'HP LONG DRAIN CNG ENGINE OIL 15W-40', 
    category: 'Natural Gas And CNG Engine Oils', 
    description: 'Extended drain interval CNG engine oil designed for longer service intervals. Reduces maintenance frequency while maintaining engine protection.', 
    specs: 'Viscosity: 15W-40 | Applications: CNG vehicles with extended drain requirements | Benefits: Extended drain intervals, reduced maintenance, cost savings, engine protection | Pack Sizes: 5L, 7.5L, 20L',
    image_url: '/images/AG_OIL[1]/Natural Gas And CNG Engine Oils/HP LONG DRAIN CNG ENGINE OIL 15W-40.png',
    catalog_url: '/images/AG_OIL[1]/Natural Gas And CNG Engine Oils/HP-LONG-DRAIN-CNG-ENGINE-OIL-15W-40.pdf'
  },
  { 
    name: 'HP GREEN ENGINE OIL 15W-40 & 20W-50', 
    category: 'Natural Gas And CNG Engine Oils', 
    description: 'Environmentally friendly engine oil for CNG vehicles. Formulated to reduce emissions and provide excellent engine protection for green vehicles.', 
    specs: 'Viscosity: 15W-40, 20W-50 | Applications: CNG passenger cars, CNG commercial vehicles | Benefits: Environmentally friendly, emission reduction, engine protection, multiple grades | Pack Sizes: 3L, 5L',
    image_url: '/images/AG_OIL[1]/Natural Gas And CNG Engine Oils/HP GREEN ENGINE OIL 15W 40 and 20W 50.png',
    catalog_url: '/images/AG_OIL[1]/Natural Gas And CNG Engine Oils/HP GREEN ENGINE OIL 15W 40 & 20W 50-15-05-2019.pdf'
  },

  // Outboard Marine Oils - Top 4
  { 
    name: 'HP MILCY MARINA', 
    category: 'Outboard Marine Oils', 
    description: 'Marine-grade engine oil specifically designed for boat engines. Provides excellent protection against corrosion and wear in marine environments.', 
    specs: 'Type: Marine Engine Oil | Applications: Boat engines, marine applications | Benefits: Marine protection, corrosion resistance, engine longevity, marine optimized | Pack Sizes: 5L, 20L',
    image_url: '/images/AG_OIL[1]/Outboatd Marine Oils/Milcy-Marina-20-Ltr.jpg',
    catalog_url: '/images/AG_OIL[1]/Outboatd Marine Oils/HP-MILCY-MARINA.pdf'
  },
  { 
    name: 'HP MATSYA BOAT OIL 2T', 
    category: 'Outboard Marine Oils', 
    description: 'Two-stroke boat engine oil for outboard motors. Formulated to provide excellent lubrication and protection for two-stroke marine engines.', 
    specs: 'Type: 2T Marine Oil | Applications: Two-stroke outboard motors, boat engines | Benefits: Two-stroke protection, marine optimized, engine protection, smooth operation | Pack Sizes: 5L',
    image_url: '/images/AG_OIL[1]/Outboatd Marine Oils/Matsya-Boat-Oil-5-Ltr.jpg',
    catalog_url: '/images/AG_OIL[1]/Outboatd Marine Oils/HP MATSYA BOAT OIL 2T-14-05-2019.pdf'
  },
  { 
    name: 'HP MATSYAFED 2T PREMIUM', 
    category: 'Outboard Marine Oils', 
    description: 'Premium two-stroke marine engine oil for high-performance outboard motors. Delivers superior protection and performance for demanding marine applications.', 
    specs: 'Type: Premium 2T Marine Oil | Applications: Premium two-stroke outboard motors | Benefits: Premium protection, high performance, engine longevity, superior quality | Pack Sizes: 5L',
    image_url: '/images/AG_OIL[1]/Outboatd Marine Oils/Matsyafed-2T-5-Ltr.png',
    catalog_url: '/images/AG_OIL[1]/Outboatd Marine Oils/HP MATSYAFED 2T PREMIUM-14-05-2019.pdf'
  },
  { 
    name: 'HP MARIGEN 4015 & 3015', 
    category: 'Outboard Marine Oils', 
    description: 'Marine engine oil available in 4015 and 3015 grades for outboard motors. Provides reliable protection for various marine engine applications.', 
    specs: 'Grades: 4015, 3015 | Applications: Outboard motors, marine engines | Benefits: Multiple grades, marine protection, reliable performance, engine longevity | Pack Sizes: 5L, 20L',
    image_url: '/images/AG_OIL[1]/Outboatd Marine Oils/HP MARIGEN 4015 & 3015.png',
    catalog_url: '/images/AG_OIL[1]/Outboatd Marine Oils/HP-MARIGEN-4015-&-3015.pdf'
  },

  // Passenger Car Engine Oils - Top 5
  { 
    name: 'HP NEOSYNTH GEN6 5W-30', 
    category: 'Passenger Car Engine Oils', 
    description: 'Next-generation fully synthetic engine oil for modern passenger cars. Advanced GEN6 formulation provides superior engine protection and fuel economy.', 
    specs: 'Viscosity: 5W-30 | API: SP/SN Plus | Type: Fully Synthetic | Applications: Modern passenger cars, latest engines | Benefits: GEN6 technology, superior protection, fuel economy, extended drain | Pack Sizes: 3.5L, 5L',
    image_url: '/images/AG_OIL[1]/PASSENGER CAR ENGINE OILS/HP NEOSYNTH GEN6 5W-30.png',
    catalog_url: '/images/AG_OIL[1]/PASSENGER CAR ENGINE OILS/HP-NEOSYNTH-GEN6-5W-30.pdf'
  },
  { 
    name: 'HP NEOSYNTH 10W-40', 
    category: 'Passenger Car Engine Oils', 
    description: 'Premium synthetic engine oil for passenger cars. Provides excellent engine protection and performance for a wide range of vehicles.', 
    specs: 'Viscosity: 10W-40 | API: SN/CF | Type: Synthetic | Applications: Passenger cars, SUVs | Benefits: Synthetic protection, all-weather performance, engine protection, fuel efficiency | Pack Sizes: 3L, 5L',
    image_url: '/images/AG_OIL[1]/PASSENGER CAR ENGINE OILS/Neosynth-10W40-466x382.jpg',
    catalog_url: '/images/AG_OIL[1]/PASSENGER CAR ENGINE OILS/HP NEOSYNTH 10W 40-15-05-2019.pdf'
  },
  { 
    name: 'HP Neo Super 5W30', 
    category: 'Passenger Car Engine Oils', 
    description: 'Modern synthetic blend engine oil for passenger cars. Combines synthetic and conventional base oils for optimal performance and value.', 
    specs: 'Viscosity: 5W-30 | API: SN Plus | Type: Synthetic Blend | Applications: Modern passenger cars | Benefits: Synthetic blend, modern formulation, fuel economy, cost-effective | Pack Sizes: 3.5L, 5L',
    image_url: '/images/AG_OIL[1]/PASSENGER CAR ENGINE OILS/HP-Neo-Super-5W30-packshot.jpg',
    catalog_url: '/images/AG_OIL[1]/PASSENGER CAR ENGINE OILS/HP-NEO-SUPER-5W-30.pdf'
  },
  { 
    name: 'HP CRUISE 15W-40', 
    category: 'Passenger Car Engine Oils', 
    description: 'Multi-grade engine oil for passenger cars. Provides reliable protection and performance for a wide range of passenger vehicles.', 
    specs: 'Viscosity: 15W-40 | API: CF-4/SG | Applications: Passenger cars, older vehicles | Benefits: Reliable protection, all-weather performance, cost-effective, proven quality | Pack Sizes: 3L, 5L',
    image_url: '/images/AG_OIL[1]/PASSENGER CAR ENGINE OILS/HP CRUISE 15W 40.png',
    catalog_url: '/images/AG_OIL[1]/PASSENGER CAR ENGINE OILS/HP CRUISE 15W 40-15-05-2019.pdf'
  },
  { 
    name: 'HP NEOSYNTH CNG 20W-50', 
    category: 'Passenger Car Engine Oils', 
    description: 'Synthetic engine oil specifically formulated for CNG passenger cars. Provides optimal protection for CNG engines with extended drain capabilities.', 
    specs: 'Viscosity: 20W-50 | Type: Synthetic | Applications: CNG passenger cars | Benefits: CNG optimized, synthetic protection, extended drain, engine longevity | Pack Sizes: 3L, 5L',
    image_url: '/images/AG_OIL[1]/PASSENGER CAR ENGINE OILS/HP NEOSYNTH CNG 20W-50.png',
    catalog_url: '/images/AG_OIL[1]/PASSENGER CAR ENGINE OILS/HP-NEOSYNTH-CNG-20W-50.pdf'
  },

  // Radiator Coolants - Top 5
  { 
    name: 'HP KOOLGARD ADVANCE 1:1', 
    category: 'Radiator Coolants', 
    description: 'Advanced ready-to-use radiator coolant and antifreeze. Pre-mixed formula eliminates the need for dilution, providing convenience and optimal protection.', 
    specs: 'Type: Ready-to-use (1:1) | Applications: All vehicles | Benefits: Ready-to-use, no dilution needed, long-life protection, corrosion prevention | Pack Sizes: 1L, 5L',
    image_url: '/images/AG_OIL[1]/RADIATOR COOLANTS/Koolgard-Advanced-1-Ltr.jpg',
    catalog_url: '/images/AG_OIL[1]/RADIATOR COOLANTS/PDS-HP-KOOLGARD-ADVANCE.pdf'
  },
  { 
    name: 'HP KOOLGARD CLASSIC 1:7', 
    category: 'Radiator Coolants', 
    description: 'Classic concentrated radiator coolant requiring 1:7 dilution with water. Provides excellent cooling and corrosion protection for vehicle radiators.', 
    specs: 'Type: Concentrated (1:7 dilution) | Applications: All vehicles | Benefits: Concentrated formula, cost-effective, excellent protection, proven quality | Pack Sizes: 1L, 5L',
    image_url: '/images/AG_OIL[1]/RADIATOR COOLANTS/Koolgard-Classic-New.jpg',
    catalog_url: '/images/AG_OIL[1]/RADIATOR COOLANTS/PDS-HP-KOOLGARD-CLASSIC-1-7.pdf'
  },
  { 
    name: 'HP POWERKOOL RR', 
    category: 'Radiator Coolants', 
    description: 'Racing radiator coolant designed for high-performance vehicles. Provides superior cooling and protection for demanding racing and performance applications.', 
    specs: 'Type: Racing Coolant | Applications: High-performance vehicles, racing | Benefits: Racing grade, superior cooling, high-temperature protection, performance optimized | Pack Sizes: 1L, 5L',
    image_url: '/images/AG_OIL[1]/RADIATOR COOLANTS/HP POWERKOOL RR.png',
    catalog_url: '/images/AG_OIL[1]/RADIATOR COOLANTS/HP POWERKOOL RR-15-05-2019.pdf'
  },
  { 
    name: 'HP THANDA RAJA', 
    category: 'Radiator Coolants', 
    description: 'Popular and trusted radiator coolant brand. Provides reliable cooling and protection for vehicle radiators in all weather conditions.', 
    specs: 'Type: Standard Coolant | Applications: All vehicles | Benefits: Popular choice, reliable performance, cost-effective, proven quality | Pack Sizes: 1L',
    image_url: '/images/AG_OIL[1]/RADIATOR COOLANTS/Thanda Raja 1 Ltr.jpg',
    catalog_url: '/images/AG_OIL[1]/RADIATOR COOLANTS/HP THANDA RAJA-15-05-2019.pdf'
  },
  { 
    name: 'HP KOOLGARD P', 
    category: 'Radiator Coolants', 
    description: 'Premium radiator coolant providing superior protection and cooling performance. Formulated for vehicles requiring premium-grade coolant protection.', 
    specs: 'Type: Premium Coolant | Applications: Premium vehicles | Benefits: Premium grade, superior protection, long-life, corrosion prevention | Pack Sizes: 1L, 5L',
    image_url: '/images/AG_OIL[1]/RADIATOR COOLANTS/HP KOOLGARD P.png',
    catalog_url: '/images/AG_OIL[1]/RADIATOR COOLANTS/HP KOOLGARD P-15-05-2019.pdf'
  },

  // Railroad Engine Oils - Top 4
  { 
    name: 'HP RAIL ROAD OIL 613', 
    category: 'Railroad Engine Oils', 
    description: 'Railroad locomotive engine oil meeting 613 specification. Designed for specific locomotive engine requirements with excellent protection.', 
    specs: 'Specification: 613 | Applications: Locomotive engines (613 spec) | Benefits: Specification compliant, engine protection, reliable performance | Pack Sizes: Bulk',
    image_url: null,
    catalog_url: '/images/AG_OIL[1]/Railroad ENGINE OILS/HP RAIL ROAD OIL 613-14-05-2019.pdf'
  },
  { 
    name: 'HP RAIL ROAD OIL 713', 
    category: 'Railroad Engine Oils', 
    description: 'Railroad locomotive engine oil meeting 713 specification. Provides optimal protection for locomotive engines requiring 713 grade oil.', 
    specs: 'Specification: 713 | Applications: Locomotive engines (713 spec) | Benefits: Specification compliant, engine protection, reliable performance | Pack Sizes: Bulk',
    image_url: null,
    catalog_url: '/images/AG_OIL[1]/Railroad ENGINE OILS/HP RAIL ROAD OIL 713-14-05-2019.pdf'
  },
  { 
    name: 'HP RAIL ROAD OIL 810M', 
    category: 'Railroad Engine Oils', 
    description: 'Railroad locomotive engine oil meeting 810M specification. Formulated for specific locomotive engine applications requiring 810M grade.', 
    specs: 'Specification: 810M | Applications: Locomotive engines (810M spec) | Benefits: Specification compliant, engine protection, reliable performance | Pack Sizes: Bulk',
    image_url: null,
    catalog_url: '/images/AG_OIL[1]/Railroad ENGINE OILS/HP-RAIL-ROAD-OIL-810M.pdf'
  },
  { 
    name: 'HP RAIL ROAD OIL 813M', 
    category: 'Railroad Engine Oils', 
    description: 'Railroad locomotive engine oil meeting 813M specification. Designed for locomotive engines requiring 813M grade oil with excellent protection.', 
    specs: 'Specification: 813M | Applications: Locomotive engines (813M spec) | Benefits: Specification compliant, engine protection, reliable performance | Pack Sizes: Bulk',
    image_url: null,
    catalog_url: '/images/AG_OIL[1]/Railroad ENGINE OILS/HP RAIL ROAD OIL 813M-14-05-2019.pdf'
  },

  // Shock Absorber and Front Fork Oils - Top 1
  { 
    name: 'SHOCK ABSORBER OILS', 
    category: 'Shock Absorber and Front Fork Oils', 
    description: 'Specialized oil for shock absorbers and front forks. Provides optimal damping performance and protection for suspension systems in motorcycles and vehicles.', 
    specs: 'Type: Shock Absorber Oil | Applications: Shock absorbers, front forks, suspension systems | Benefits: Optimal damping, suspension protection, smooth operation, temperature stability | Pack Sizes: 1L',
    image_url: null,
    catalog_url: '/images/AG_OIL[1]/SHOCK ABSORBER and FRONT FORK OILS/GENERAL PURPOSE SHOCK OILS-14-05-2019.pdf'
  },

  // Three Wheeler Engine Oils - Top 3
  { 
    name: 'HP AUTO SHAKTI 20W-50', 
    category: 'Three Wheeler Engine Oils', 
    description: 'Engine oil specifically designed for three-wheeler auto rickshaws. Provides excellent protection and performance for three-wheeler engines.', 
    specs: 'Viscosity: 20W-50 | Applications: Three-wheeler auto rickshaws | Benefits: Three-wheeler optimized, engine protection, reliable performance, cost-effective | Pack Sizes: 1L, 3L',
    image_url: null,
    catalog_url: '/images/AG_OIL[1]/THREE WHEELER ENGINE OILS/HP AUTO SHAKTI 20W 50-14-05-2019.pdf'
  },
  { 
    name: 'HP CNG BOOSTER 20W-50', 
    category: 'Three Wheeler Engine Oils', 
    description: 'CNG-specific engine oil for three-wheelers running on compressed natural gas. Formulated to provide optimal protection for CNG three-wheeler engines.', 
    specs: 'Viscosity: 20W-50 | Applications: CNG three-wheelers | Benefits: CNG optimized, engine protection, extended drain, fuel efficiency | Pack Sizes: 1L, 3L',
    image_url: null,
    catalog_url: '/images/AG_OIL[1]/THREE WHEELER ENGINE OILS/HP-CNG-BOOSTER-20W-50.pdf'
  },
  { 
    name: 'THREE WHEELER ENGINE OILS RUNNING ON DIESEL', 
    category: 'Three Wheeler Engine Oils', 
    description: 'Diesel engine oil specifically formulated for three-wheelers running on diesel. Provides excellent protection for diesel three-wheeler engines.', 
    specs: 'Type: Diesel Engine Oil | Applications: Diesel three-wheelers | Benefits: Diesel optimized, engine protection, reliable performance, cost-effective | Pack Sizes: 1L, 3L',
    image_url: null,
    catalog_url: '/images/AG_OIL[1]/THREE WHEELER ENGINE OILS/THREE WHEELER ENGINE OILS RUNNING ON DIESEL-14-05-2019.pdf'
  },

  // Two Wheeler Engine Oils - Top 5
  { 
    name: 'HP RACER SPLENDID 10W-30', 
    category: 'Two Wheeler Engine Oils', 
    description: 'Premium engine oil for motorcycles providing excellent protection and smooth shifting. Formulated for modern motorcycle engines requiring premium-grade protection.', 
    specs: 'Viscosity: 10W-30 | JASO: MA2 | Applications: Motorcycles, premium bikes | Benefits: Premium protection, smooth shifting, reduced friction, fuel economy | Pack Sizes: 900ml, 1L',
    image_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/Racer-Splendid-10W30--900-mL.png',
    catalog_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/HP Racer Splendid 10W30-14-05-2019.pdf'
  },
  { 
    name: 'HP RACER SYNTH 10W-30', 
    category: 'Two Wheeler Engine Oils', 
    description: 'Synthetic engine oil for motorcycles delivering superior protection and performance. Advanced synthetic formulation ensures optimal engine operation.', 
    specs: 'Viscosity: 10W-30 | JASO: MA2 | Type: Fully Synthetic | Applications: Motorcycles, high-performance bikes | Benefits: Synthetic protection, superior performance, extended drain, fuel efficiency | Pack Sizes: 800ml, 1L',
    image_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/Racer-Synth-1-lr.png',
    catalog_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/HP Racer Synth 10W30-14-5-2019.pdf'
  },
  { 
    name: 'HP RACER GEN6', 
    category: 'Two Wheeler Engine Oils', 
    description: 'Next-generation engine oil for motorcycles with advanced GEN6 technology. Provides superior protection and performance for modern motorcycle engines.', 
    specs: 'Viscosity: 10W-50 | JASO: MA2 | Applications: Modern motorcycles, GEN6 technology | Benefits: GEN6 technology, superior protection, fuel economy, extended drain | Pack Sizes: 1L, 2.5L',
    image_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/Racer-Gen6-20w-40.jpg',
    catalog_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/HP-RACER-GEN6.pdf'
  },
  { 
    name: 'HP Racer Skutex Pro 5W-30', 
    category: 'Two Wheeler Engine Oils', 
    description: 'Professional scooter engine oil with advanced formulation. Specifically designed for modern scooters requiring premium-grade protection and performance.', 
    specs: 'Viscosity: 5W-30 | JASO: MB | Applications: Scooters, premium scooters | Benefits: Scooter optimized, professional grade, superior protection, fuel economy | Pack Sizes: 800ml, 1L',
    image_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/Racer-Skutex-Pro-5W30.jpg',
    catalog_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/RACER SKUTEX PRO 5W-30.pdf'
  },
  { 
    name: 'HP RACER 15W-50', 
    category: 'Two Wheeler Engine Oils', 
    description: 'Multi-grade engine oil for motorcycles providing year-round protection. Suitable for various motorcycle engines requiring reliable performance.', 
    specs: 'Viscosity: 15W-50 | JASO: MA2 | Applications: Motorcycles, all-weather use | Benefits: All-weather protection, reliable performance, engine protection, cost-effective | Pack Sizes: 1L, 2.5L',
    image_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/Racer 15W-50 2.5 Ltr.jpg',
    catalog_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/HP Racer 15W50-14-05-2019.pdf'
  },
  { 
    name: 'HP RACER PLUS 15W-50', 
    category: 'Two Wheeler Engine Oils', 
    description: 'Enhanced multi-grade engine oil for motorcycles with superior protection. Formulated for motorcycles requiring premium performance and extended drain intervals.', 
    specs: 'Viscosity: 15W-50 | JASO: MA2 | Applications: Motorcycles, premium bikes | Benefits: Enhanced protection, extended drain, superior performance, fuel efficiency | Pack Sizes: 1L, 2.5L',
    image_url: null,
    catalog_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/HP Racer Plus 15W50-14-05-2019.pdf'
  },
  { 
    name: 'HP RACER SUPREME 20W-50', 
    category: 'Two Wheeler Engine Oils', 
    description: 'Supreme-grade engine oil for high-performance motorcycles. Provides maximum protection and performance for demanding motorcycle applications.', 
    specs: 'Viscosity: 20W-50 | JASO: MA2 | Applications: High-performance motorcycles | Benefits: Supreme protection, maximum performance, extended drain, superior quality | Pack Sizes: 1L, 2.5L',
    image_url: null,
    catalog_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/HP Racer Supreme 20W50-14-05-2019.pdf'
  },
  { 
    name: 'HP RACER SYNTHEC 20W-50', 
    category: 'Two Wheeler Engine Oils', 
    description: 'Synthetic blend engine oil for motorcycles. Combines synthetic and conventional base oils for optimal performance and value.', 
    specs: 'Viscosity: 20W-50 | JASO: MA2 | Type: Synthetic Blend | Applications: Motorcycles, all-weather use | Benefits: Synthetic blend, superior protection, cost-effective, all-weather performance | Pack Sizes: 1L',
    image_url: null,
    catalog_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/HP Racer Syntec 20W50-14-05-2019.pdf'
  },
  { 
    name: 'HP RACER SYNTHRO 20W-50', 
    category: 'Two Wheeler Engine Oils', 
    description: 'Advanced synthetic engine oil for motorcycles. Provides superior protection and performance for modern motorcycle engines.', 
    specs: 'Viscosity: 20W-50 | JASO: MA2 | Type: Synthetic | Applications: Modern motorcycles | Benefits: Synthetic protection, advanced formulation, extended drain, fuel efficiency | Pack Sizes: 1L',
    image_url: null,
    catalog_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/HP Racer Syntro 20W50-14-05-2019.pdf'
  },
  { 
    name: 'HP RACER SYNTH 15W-50', 
    category: 'Two Wheeler Engine Oils', 
    description: 'Synthetic engine oil for motorcycles with extended drain capabilities. Provides superior protection for high-performance motorcycle engines.', 
    specs: 'Viscosity: 15W-50 | JASO: MA2 | Type: Fully Synthetic | Applications: High-performance motorcycles | Benefits: Synthetic protection, extended drain, superior performance, fuel economy | Pack Sizes: 1L',
    image_url: null,
    catalog_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/HP Racer Synth 15W50-14-05-2019.pdf'
  },
  { 
    name: 'HP RACER GREEN 10W-30', 
    category: 'Two Wheeler Engine Oils', 
    description: 'Environmentally friendly engine oil for motorcycles. Formulated to reduce emissions while providing excellent engine protection.', 
    specs: 'Viscosity: 10W-30 | JASO: MA2 | Applications: Modern motorcycles, eco-friendly | Benefits: Environmentally friendly, emission reduction, engine protection, fuel efficiency | Pack Sizes: 900ml, 1L',
    image_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/HP-RACER-GREEN-10W-30.png',
    catalog_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/HP-RACER-GREEN-10W-30.pdf'
  },
  { 
    name: 'HP RACER GREEN 20W-40', 
    category: 'Two Wheeler Engine Oils', 
    description: 'Environmentally friendly multi-grade engine oil for motorcycles. Provides excellent protection while reducing environmental impact.', 
    specs: 'Viscosity: 20W-40 | JASO: MA2 | Applications: Motorcycles, all-weather use | Benefits: Environmentally friendly, all-weather protection, emission reduction, reliable performance | Pack Sizes: 1L',
    image_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/HP-RACER-GREEN-20W40.png',
    catalog_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/HP-RACER-GREEN-20W-40-Copy.pdf'
  },
  { 
    name: 'HP RACER PRO 10W-30', 
    category: 'Two Wheeler Engine Oils', 
    description: 'Professional-grade engine oil for motorcycles. Designed for riders who demand superior performance and protection.', 
    specs: 'Viscosity: 10W-30 | JASO: MA2 | Applications: Professional motorcycles, premium bikes | Benefits: Professional grade, superior protection, extended drain, maximum performance | Pack Sizes: 1L',
    image_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/Black-Racer-Pro-10W30.jpg',
    catalog_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/HP-RACER-PRO-10W-30.pdf'
  },
  { 
    name: 'HP RACER PRO 20W-40', 
    category: 'Two Wheeler Engine Oils', 
    description: 'Professional-grade multi-grade engine oil for motorcycles. Provides maximum protection for demanding motorcycle applications.', 
    specs: 'Viscosity: 20W-40 | JASO: MA2 | Applications: Professional motorcycles, all-weather use | Benefits: Professional grade, maximum protection, all-weather performance, extended drain | Pack Sizes: 1L',
    image_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/Black-Racer-Pro-20W40.jpg',
    catalog_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/HP-RACER-PRO-20W-40.pdf'
  },
  { 
    name: 'HP RACER SPLENDID PLUS 10W-30', 
    category: 'Two Wheeler Engine Oils', 
    description: 'Enhanced premium engine oil for motorcycles. Advanced formulation provides superior protection and performance.', 
    specs: 'Viscosity: 10W-30 | JASO: MA2 | Applications: Premium motorcycles | Benefits: Enhanced protection, superior performance, smooth shifting, fuel economy | Pack Sizes: 900ml, 1L',
    image_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/Racer-Splendidplus-10W-30.jpg',
    catalog_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/HP-RACER-SPLENDID-plus-10W-30.pdf'
  },
  { 
    name: 'HP RACER SPLENDID PLUS 20W-40', 
    category: 'Two Wheeler Engine Oils', 
    description: 'Enhanced premium multi-grade engine oil for motorcycles. Provides excellent protection for all-weather motorcycle use.', 
    specs: 'Viscosity: 20W-40 | JASO: MA2 | Applications: Premium motorcycles, all-weather use | Benefits: Enhanced protection, all-weather performance, superior quality, extended drain | Pack Sizes: 1L',
    image_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/Racer-Splendid-plus-20W-40.jpg',
    catalog_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/HP-RACER-SPLENDID-plus-20W-40.pdf'
  },
  { 
    name: 'HP RACER SYNTH 10W-40', 
    category: 'Two Wheeler Engine Oils', 
    description: 'Synthetic engine oil for motorcycles with advanced formulation. Provides superior protection and performance for modern motorcycle engines.', 
    specs: 'Viscosity: 10W-40 | JASO: MA2 | Type: Fully Synthetic | Applications: Modern motorcycles, high-performance bikes | Benefits: Synthetic protection, advanced formulation, extended drain, fuel efficiency | Pack Sizes: 1L',
    image_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/HP RACER SYNTH 10W-40.png',
    catalog_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/HP-RACER-SYNTH-10W-40.pdf'
  },
  { 
    name: 'HP RACER 2 LOW SMOKE', 
    category: 'Two Wheeler Engine Oils', 
    description: 'Low smoke two-stroke engine oil for motorcycles. Reduces smoke emissions while providing excellent engine protection.', 
    specs: 'Type: 2T Low Smoke | Applications: Two-stroke motorcycles | Benefits: Low smoke emission, engine protection, environmental compliance, smooth operation | Pack Sizes: 800ml, 1L',
    image_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/HP Racer2 Low Smoke.png',
    catalog_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/HP-RACER2-LOW-SMOKE.pdf'
  },
  { 
    name: 'HP AIR FILTER OIL 20W-40', 
    category: 'Two Wheeler Engine Oils', 
    description: 'Specialized air filter oil for motorcycles. Provides excellent filtration and protection for motorcycle air filters.', 
    specs: 'Viscosity: 20W-40 | Applications: Motorcycle air filters | Benefits: Excellent filtration, filter protection, extended filter life, reliable performance | Pack Sizes: 1L',
    image_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/HP AIR FILTER OIL 20W-40.png',
    catalog_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/HP-AIR-FILTER-OIL-20W-40.pdf'
  },
  { 
    name: 'HP PROLUBE 20W-50', 
    category: 'Two Wheeler Engine Oils', 
    description: 'Professional lubricant for motorcycles. Provides superior protection and performance for motorcycle engines.', 
    specs: 'Viscosity: 20W-50 | JASO: MA2 | Applications: Motorcycles, professional use | Benefits: Professional grade, superior protection, extended drain, maximum performance | Pack Sizes: 1L',
    image_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/PROLUBE 20W-50.png',
    catalog_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/PROLUBE-20W-50.pdf'
  },
  { 
    name: 'HP RACER', 
    category: 'Two Wheeler Engine Oils', 
    description: 'Premium engine oil for motorcycles. Provides excellent protection and performance for motorcycle engines.', 
    specs: 'Applications: Motorcycles | Benefits: Premium protection, reliable performance, engine longevity, cost-effective | Pack Sizes: 1L',
    image_url: null,
    catalog_url: '/images/AG_OIL[1]/TWO WHEELER ENGINE OILS/HP Racer-14-05-2019_0.pdf'
  },

  // Additional Gear and Transmission Oils
  { 
    name: 'HP ATF DEX IID', 
    category: 'Gear and Transmission Oils', 
    description: 'Automatic Transmission Fluid compatible with Dexron IID specifications. Provides smooth shifting for automatic transmissions requiring Dexron IID.', 
    specs: 'Specification: Dexron IID | Applications: Automatic transmissions requiring Dexron IID | Benefits: Smooth shifting, transmission protection, compatibility, extended fluid life | Pack Sizes: 1L, 5L',
    image_url: '/images/AG_OIL[1]/Gear AND tran/HP ATF DEX IID.png',
    catalog_url: '/images/AG_OIL[1]/Gear AND tran/HP ATF DEX IID-15-05-2019.pdf'
  },
  { 
    name: 'HP AUTO TRANSMISSION FLUID A', 
    category: 'Gear and Transmission Oils', 
    description: 'Automatic Transmission Fluid type A for automatic transmissions. Provides smooth shifting and excellent transmission protection.', 
    specs: 'Type: ATF Type A | Applications: Automatic transmissions requiring ATF Type A | Benefits: Smooth shifting, transmission protection, extended fluid life, compatibility | Pack Sizes: 1L, 5L',
    image_url: null,
    catalog_url: '/images/AG_OIL[1]/Gear AND tran/HP Auto Transmission Fluid A-15-05-2019.pdf'
  },
  { 
    name: 'HP GEAR OIL EP 75W 90', 
    category: 'Gear and Transmission Oils', 
    description: 'Extreme Pressure gear oil with viscosity grade 75W-90. Provides superior protection for manual transmissions and differentials.', 
    specs: 'Viscosity: 75W-90 | Type: Extreme Pressure (EP) | Applications: Manual transmissions, differentials | Benefits: EP protection, all-weather performance, superior protection, extended drain | Pack Sizes: 1L, 5L',
    image_url: null,
    catalog_url: '/images/AG_OIL[1]/Gear AND tran/HP GEAR OIL EP 75W 90 F-15-05-2019.pdf'
  },
  { 
    name: 'HP GEAR OIL EP 80, 90, 140', 
    category: 'Gear and Transmission Oils', 
    description: 'Extreme Pressure gear oil available in multiple viscosity grades. Provides reliable protection for various gear applications.', 
    specs: 'Viscosity: SAE 80, 90, 140 | Type: Extreme Pressure (EP) | Applications: Industrial gears, automotive differentials | Benefits: Multiple grades, EP protection, gear protection, cost-effective | Pack Sizes: 1L, 5L',
    image_url: null,
    catalog_url: '/images/AG_OIL[1]/Gear AND tran/HP GEAR OIL EP 80, 90, 140-15-05-2019.pdf'
  },
  { 
    name: 'HP GEAR OIL XP 80W 140 LL T', 
    category: 'Gear and Transmission Oils', 
    description: 'Long-life extreme pressure gear oil with viscosity 80W-140. Designed for extended drain intervals in heavy-duty applications.', 
    specs: 'Viscosity: 80W-140 LL T | Type: Extreme Pressure Long Life | Applications: Heavy-duty transmissions, differentials | Benefits: Extended drain, heavy-duty protection, high load capacity, thermal stability | Pack Sizes: 1L, 5L',
    image_url: '/images/AG_OIL[1]/Gear AND tran/HP GEAR OIL XP 80W 140 LL T.png',
    catalog_url: '/images/AG_OIL[1]/Gear AND tran/HP GEAR OIL XP 80W 140 LL (T)-15-05-2019.pdf'
  },
  { 
    name: 'HP GEAR OIL XP 80W 90 LL T', 
    category: 'Gear and Transmission Oils', 
    description: 'Long-life extreme pressure gear oil with viscosity 80W-90. Designed for extended drain intervals in transmission applications.', 
    specs: 'Viscosity: 80W-90 LL T | Type: Extreme Pressure Long Life | Applications: Manual transmissions, differentials | Benefits: Extended drain, superior protection, all-weather performance, cost-effective | Pack Sizes: 1L, 5L',
    image_url: '/images/AG_OIL[1]/Gear AND tran/HP GEAR OIL XP 80W 90 LL T.png',
    catalog_url: '/images/AG_OIL[1]/Gear AND tran/HP GEAR OIL XP 80W 90 LL (T)-15-05-2019.pdf'
  },
  { 
    name: 'HP GEAR OIL XP 85W 90', 
    category: 'Gear and Transmission Oils', 
    description: 'Multi-grade extreme pressure gear oil with viscosity 85W-90. Provides superior protection for transmissions and differentials.', 
    specs: 'Viscosity: 85W-90 | Type: Extreme Pressure (EP) | Applications: Manual transmissions, differentials | Benefits: EP protection, all-weather performance, superior protection, smooth operation | Pack Sizes: 1L, 5L',
    image_url: '/images/AG_OIL[1]/Gear AND tran/HP GEAR OIL XP 85W 90.png',
    catalog_url: '/images/AG_OIL[1]/Gear AND tran/HP GEAR OIL XP 85W 90-15-05-2019.pdf'
  },
  { 
    name: 'HP GEAR OIL ZFL 80W 90', 
    category: 'Gear and Transmission Oils', 
    description: 'Zero Friction Loss gear oil with viscosity 80W-90. Designed to reduce friction and improve fuel efficiency.', 
    specs: 'Viscosity: 80W-90 | Type: ZFL (Zero Friction Loss) | Applications: Manual transmissions, differentials | Benefits: Reduced friction, improved fuel economy, transmission protection, extended drain | Pack Sizes: 1L, 5L',
    image_url: '/images/AG_OIL[1]/Gear AND tran/HP GEAR OIL ZFL 80W 90.png',
    catalog_url: '/images/AG_OIL[1]/Gear AND tran/HP GEAR OIL ZFL 80W 90-15-05-2019.pdf'
  },
  { 
    name: 'HP GEAR OIL ZFL 80W 90 LS', 
    category: 'Gear and Transmission Oils', 
    description: 'Zero Friction Loss limited slip gear oil with viscosity 80W-90. Designed for limited slip differentials with reduced friction.', 
    specs: 'Viscosity: 80W-90 LS | Type: ZFL Limited Slip | Applications: Limited slip differentials | Benefits: Limited slip compatible, reduced friction, improved fuel economy, superior protection | Pack Sizes: 1L, 5L',
    image_url: '/images/AG_OIL[1]/Gear AND tran/HP GEAR OIL ZFL 80W 90 LS.png',
    catalog_url: '/images/AG_OIL[1]/Gear AND tran/HP GEAR OIL ZFL 80W 90 LS-15-05-2019.pdf'
  },
  { 
    name: 'HP GEAR OIL ZFL 80W', 
    category: 'Gear and Transmission Oils', 
    description: 'Zero Friction Loss gear oil with viscosity 80W. Designed to reduce friction and improve transmission efficiency.', 
    specs: 'Viscosity: SAE 80W | Type: ZFL (Zero Friction Loss) | Applications: Manual transmissions | Benefits: Reduced friction, improved efficiency, transmission protection, fuel economy | Pack Sizes: 1L, 5L',
    image_url: '/images/AG_OIL[1]/Gear AND tran/HP GEAR OIL ZFL 80W.png',
    catalog_url: '/images/AG_OIL[1]/Gear AND tran/HP GEAR OIL ZFL 80W-15-05-2019.pdf'
  },
  { 
    name: 'HP GEAR DRIVE EP 140', 
    category: 'Gear and Transmission Oils', 
    description: 'Extreme Pressure gear oil grade 140 for heavy-duty applications. Provides excellent protection for high-load gear systems.', 
    specs: 'Viscosity: SAE 140 | Type: Extreme Pressure (EP) | Applications: Heavy-duty gears, industrial applications | Benefits: Heavy-duty protection, high load capacity, EP protection, thermal stability | Pack Sizes: 1L, 5L',
    image_url: '/images/AG_OIL[1]/Gear AND tran/Gear-Drive-EP-140.jpg',
    catalog_url: '/images/AG_OIL[1]/Gear AND tran/HP-GEAR-DRIVE-EP-140.pdf'
  },
  { 
    name: 'HP POWERGLIDE C3 10-30', 
    category: 'Gear and Transmission Oils', 
    description: 'Powerglide automatic transmission fluid C3 with viscosity 10-30. Designed for specific automatic transmission applications.', 
    specs: 'Type: Powerglide C3 10-30 | Applications: Automatic transmissions requiring Powerglide C3 | Benefits: Transmission protection, smooth shifting, compatibility, extended fluid life | Pack Sizes: 1L, 5L',
    image_url: '/images/AG_OIL[1]/Gear AND tran/HP POWERGLIDE C3 10 30.png',
    catalog_url: '/images/AG_OIL[1]/Gear AND tran/HP POWERGLIDE C-3 10 30-15-05-2019.pdf'
  },
  { 
    name: 'HP POWERGLIDE C4 10-30', 
    category: 'Gear and Transmission Oils', 
    description: 'Powerglide automatic transmission fluid C4 with viscosity 10-30. Designed for specific automatic transmission applications.', 
    specs: 'Type: Powerglide C4 10-30 | Applications: Automatic transmissions requiring Powerglide C4 | Benefits: Transmission protection, smooth shifting, compatibility, extended fluid life | Pack Sizes: 1L, 5L',
    image_url: '/images/AG_OIL[1]/Gear AND tran/HP POWERGLIDE C4 10 30.png',
    catalog_url: '/images/AG_OIL[1]/Gear AND tran/HP POWERGLIDE C-4 10 30-15-05-2019.pdf'
  },
  { 
    name: 'HP POWERFLO FD1-60', 
    category: 'Gear and Transmission Oils', 
    description: 'Powerflo transmission fluid FD1-60. Designed for specific transmission applications requiring FD1-60 specification.', 
    specs: 'Type: Powerflo FD1-60 | Applications: Specific transmission applications | Benefits: Transmission protection, smooth operation, specification compliant, extended fluid life | Pack Sizes: 1L, 5L',
    image_url: null,
    catalog_url: '/images/AG_OIL[1]/Gear AND tran/HP POWERFLO FD1-60-15-05-2019.pdf'
  },
  { 
    name: 'HP POWERFLO TO-4', 
    category: 'Gear and Transmission Oils', 
    description: 'Powerflo transmission fluid TO-4. Designed for specific transmission applications requiring TO-4 specification.', 
    specs: 'Type: Powerflo TO-4 | Applications: Specific transmission applications | Benefits: Transmission protection, smooth operation, specification compliant, extended fluid life | Pack Sizes: 1L, 5L',
    image_url: null,
    catalog_url: '/images/AG_OIL[1]/Gear AND tran/HP POWERFLO TO-4-15-05-2019.pdf'
  },
  { 
    name: 'HP SUPERTRAN', 
    category: 'Gear and Transmission Oils', 
    description: 'Premium transmission oil for agricultural and industrial applications. Provides superior protection for transmission systems.', 
    specs: 'Type: Premium Transmission Oil | Applications: Agricultural transmissions, industrial transmissions | Benefits: Superior protection, extended drain, thermal stability, cost-effective | Pack Sizes: 5L, 20L',
    image_url: '/images/AG_OIL[1]/Gear AND tran/hp supertran.png',
    catalog_url: '/images/AG_OIL[1]/Gear AND tran/HP SUPERTRAN-14-05-2019.pdf'
  },

  // Additional Heavy Duty Diesel Engine Oils
  { 
    name: 'HP MILCY SUPER', 
    category: 'Heavy Duty Diesel Engine Oils', 
    description: 'Super-grade heavy-duty diesel engine oil for commercial vehicles. Provides excellent protection and performance for diesel engines.', 
    specs: 'Applications: Commercial vehicles, trucks | Benefits: Super-grade protection, reliable performance, engine longevity, cost-effective | Pack Sizes: 5L, 20L',
    image_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/milck-super-5-ltr.jpg',
    catalog_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP MILCY SUPER.pdf'
  },
  { 
    name: 'HP MILCY FORCE PLUS 15W-40', 
    category: 'Heavy Duty Diesel Engine Oils', 
    description: 'Enhanced force-grade heavy-duty diesel engine oil. Provides superior protection for demanding commercial vehicle applications.', 
    specs: 'Viscosity: 15W-40 | API: CI-4/SL | Applications: Commercial vehicles, heavy-duty trucks | Benefits: Enhanced protection, superior performance, extended drain, fuel efficiency | Pack Sizes: 5L, 7.5L, 20L',
    image_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP MILCY FORCE PLUS 15W 40.png',
    catalog_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP MILCY FORCE PLUS 15W 40-15-05-2019.pdf'
  },
  { 
    name: 'HP MILCY SYNTHETIC 15W-40', 
    category: 'Heavy Duty Diesel Engine Oils', 
    description: 'Synthetic heavy-duty diesel engine oil for commercial vehicles. Provides superior protection and extended drain intervals.', 
    specs: 'Viscosity: 15W-40 | API: CI-4/SL | Type: Synthetic | Applications: Commercial vehicles, premium trucks | Benefits: Synthetic protection, extended drain, superior performance, fuel economy | Pack Sizes: 5L, 7.5L, 20L',
    image_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP MILCY SYNTHETIC 15W 40.png',
    catalog_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP MILCY SYNTHETIC 15W 40-15-05-2019.pdf'
  },
  { 
    name: 'HP MILCY TURBO GEN6', 
    category: 'Heavy Duty Diesel Engine Oils', 
    description: 'Next-generation turbo diesel engine oil with GEN6 technology. Provides exceptional protection for BS VI compliant turbocharged engines.', 
    specs: 'Viscosity: 15W-40 | API: CI-4/SL | Type: GEN6 Technology | Applications: BS VI turbocharged commercial vehicles | Benefits: GEN6 technology, turbo protection, reduced emissions, extended drain | Pack Sizes: 5L, 7.5L, 20L',
    image_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP MILCY TURBO GEN6.png',
    catalog_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP-MILCY-TURBO-GEN6_2.pdf'
  },
  { 
    name: 'HP MILCY TURBO TECH 15W-40', 
    category: 'Heavy Duty Diesel Engine Oils', 
    description: 'Advanced turbo technology diesel engine oil. Provides superior protection for turbocharged diesel engines with advanced additives.', 
    specs: 'Viscosity: 15W-40 | API: CI-4/SL | Applications: Turbocharged commercial vehicles | Benefits: Turbo technology, superior protection, extended drain, fuel efficiency | Pack Sizes: 5L, 7.5L, 20L',
    image_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/Milcy Turbo Tech 7.5 Ltr.jpg',
    catalog_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP MILCY TURBO TECH 15W 40.pdf'
  },
  { 
    name: 'HP MILCY TURBO TECH 10W-30', 
    category: 'Heavy Duty Diesel Engine Oils', 
    description: 'Advanced turbo technology diesel engine oil with viscosity 10W-30. Provides superior protection for modern turbocharged diesel engines.', 
    specs: 'Viscosity: 10W-30 | API: CI-4/SL | Applications: Modern turbocharged commercial vehicles | Benefits: Turbo technology, superior protection, fuel efficiency, extended drain | Pack Sizes: 5L, 7.5L',
    image_url: null,
    catalog_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP MILCY TURBO TECH 10W 30.pdf'
  },
  { 
    name: 'HP MILCY TURBOSTAR 20W-50', 
    category: 'Heavy Duty Diesel Engine Oils', 
    description: 'Star-grade turbo diesel engine oil with viscosity 20W-50. Provides exceptional protection for premium commercial vehicles.', 
    specs: 'Viscosity: 20W-50 | API: CI-4/SL | Applications: Premium commercial vehicles | Benefits: Star-grade protection, turbo optimized, extended drain, superior performance | Pack Sizes: 5L, 20L',
    image_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP MILCY TURBOSTAR 20W-50.png',
    catalog_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP-MILCY-TURBOSTAR-20W-50.pdf'
  },
  { 
    name: 'HP MILCY TURBO ULTRA PLUS 10W-40', 
    category: 'Heavy Duty Diesel Engine Oils', 
    description: 'Ultra-premium turbo diesel engine oil with enhanced formulation. Provides maximum protection for high-performance turbocharged engines.', 
    specs: 'Viscosity: 10W-40 | API: CI-4/SL | Applications: High-performance turbocharged commercial vehicles | Benefits: Ultra-premium protection, enhanced formulation, extended drain, fuel efficiency | Pack Sizes: 5L, 7.5L',
    image_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP MILCY TURBO ULTRA Plus 10W-40.png',
    catalog_url: null
  },
  { 
    name: 'HP MILCY PICKUP', 
    category: 'Heavy Duty Diesel Engine Oils', 
    description: 'Pickup truck diesel engine oil. Specifically formulated for pickup trucks and light commercial vehicles.', 
    specs: 'Applications: Pickup trucks, light commercial vehicles | Benefits: Pickup optimized, engine protection, reliable performance, cost-effective | Pack Sizes: 5L',
    image_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/466 X 328- MILCY PICKUP.png',
    catalog_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP MILCY PICKUP-15-05-2019.pdf'
  },
  { 
    name: 'HP MILCY FLEET', 
    category: 'Heavy Duty Diesel Engine Oils', 
    description: 'Fleet-grade diesel engine oil for commercial vehicle fleets. Designed for extended drain intervals and fleet management.', 
    specs: 'Applications: Commercial vehicle fleets | Benefits: Fleet optimized, extended drain, cost-effective, reliable performance | Pack Sizes: 5L, 20L',
    image_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/milcy-fleet-466 X 328-3.png',
    catalog_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP MILCY FLEET-15-05-2019.pdf'
  },
  { 
    name: 'HP MILCY EUROL 15W-40', 
    category: 'Heavy Duty Diesel Engine Oils', 
    description: 'Euro-grade diesel engine oil for European specification commercial vehicles. Meets European performance standards.', 
    specs: 'Viscosity: 15W-40 | API: CI-4/SL | Applications: European specification commercial vehicles | Benefits: Euro-grade quality, superior protection, extended drain, fuel efficiency | Pack Sizes: 5L, 20L',
    image_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP MILCY EUROL 15W 40.png',
    catalog_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP MILCY EUROL 15W 40-15-05-2019.pdf'
  },
  { 
    name: 'HP MILCY SL3 10W-40', 
    category: 'Heavy Duty Diesel Engine Oils', 
    description: 'SL3-grade diesel engine oil with viscosity 10W-40. Provides superior protection for modern diesel engines.', 
    specs: 'Viscosity: 10W-40 | API: SL3 | Applications: Modern diesel engines | Benefits: SL3 grade, superior protection, fuel efficiency, extended drain | Pack Sizes: 5L, 7.5L',
    image_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP MILCY SL3 10W-40.png',
    catalog_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP-MILCY-SL3-10W-40.pdf'
  },
  { 
    name: 'HP MILCY POWER', 
    category: 'Heavy Duty Diesel Engine Oils', 
    description: 'Power-grade diesel engine oil for commercial vehicles. Provides excellent protection and performance for diesel engines.', 
    specs: 'Applications: Commercial vehicles | Benefits: Power-grade protection, reliable performance, engine longevity, cost-effective | Pack Sizes: 5L, 20L',
    image_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP MILCY POWER.png',
    catalog_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP MILCY POWER_0.pdf'
  },
  { 
    name: 'HP MILCY TOP UP', 
    category: 'Heavy Duty Diesel Engine Oils', 
    description: 'Top-up diesel engine oil for commercial vehicles. Designed for topping up engine oil between service intervals.', 
    specs: 'Applications: Commercial vehicles, top-up use | Benefits: Top-up convenience, engine protection, cost-effective, reliable performance | Pack Sizes: 1L, 3L',
    image_url: null,
    catalog_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP-MILCY-TOP-UP.pdf'
  },
  { 
    name: 'HP NO.1 10W-30', 
    category: 'Heavy Duty Diesel Engine Oils', 
    description: 'Number one grade diesel engine oil with viscosity 10W-30. Premium quality engine oil for commercial vehicles.', 
    specs: 'Viscosity: 10W-30 | Applications: Premium commercial vehicles | Benefits: Premium quality, superior protection, extended drain, fuel efficiency | Pack Sizes: 5L, 7.5L',
    image_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP No 1 10W 30.png',
    catalog_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP No.1 10W 30.pdf'
  },
  { 
    name: 'HP NO.1 10W-40', 
    category: 'Heavy Duty Diesel Engine Oils', 
    description: 'Number one grade diesel engine oil with viscosity 10W-40. Premium quality engine oil for commercial vehicles.', 
    specs: 'Viscosity: 10W-40 | Applications: Premium commercial vehicles | Benefits: Premium quality, superior protection, extended drain, fuel efficiency | Pack Sizes: 5L, 7.5L',
    image_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP No1 10W 40.png',
    catalog_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP No.1 10W 40.pdf'
  },
  { 
    name: 'HP NO.1', 
    category: 'Heavy Duty Diesel Engine Oils', 
    description: 'Number one grade diesel engine oil. Premium quality engine oil for commercial vehicles with superior protection.', 
    specs: 'Applications: Premium commercial vehicles | Benefits: Premium quality, superior protection, extended drain, fuel efficiency | Pack Sizes: 5L, 20L',
    image_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP No 1.png',
    catalog_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP No.1_0.pdf'
  },
  { 
    name: 'HP HYLUBE LL 15W-40', 
    category: 'Heavy Duty Diesel Engine Oils', 
    description: 'Long-life diesel engine oil with viscosity 15W-40. Designed for extended drain intervals in commercial vehicles.', 
    specs: 'Viscosity: 15W-40 | Applications: Commercial vehicles with extended drain | Benefits: Long-life, extended drain, cost savings, engine protection | Pack Sizes: 5L, 20L',
    image_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP HYLUBE LL 15W 40.png',
    catalog_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP HYLUBE LL 15W 40.pdf'
  },
  { 
    name: 'HP HYLUBE X-3 10W (KB), 30 (KB)', 
    category: 'Heavy Duty Diesel Engine Oils', 
    description: 'HyLube X-3 diesel engine oil in multiple viscosities. Provides excellent protection for commercial vehicle engines.', 
    specs: 'Viscosity: 10W (KB), 30 (KB) | Applications: Commercial vehicles | Benefits: Multiple viscosities, excellent protection, reliable performance, cost-effective | Pack Sizes: 5L, 20L',
    image_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP HYLUBE X3 10W KB 30 KB.png',
    catalog_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP HYLUBE X-3 10W (KB), 30 (KB)-15-05-2019.pdf'
  },
  { 
    name: 'HP HYLUBE X3 10W, 30, 40, 50', 
    category: 'Heavy Duty Diesel Engine Oils', 
    description: 'HyLube X3 diesel engine oil in multiple viscosities. Provides excellent protection for various commercial vehicle applications.', 
    specs: 'Viscosity: 10W, 30, 40, 50 | Applications: Commercial vehicles | Benefits: Multiple viscosities, excellent protection, reliable performance, versatility | Pack Sizes: 5L, 20L',
    image_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HYLUBE X3 10W 30 40 50.png',
    catalog_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HYLUBE X3 10W, 30, 40, 50-1.pdf'
  },
  { 
    name: 'HP HYLUBE MILCY 30, 40, 50', 
    category: 'Heavy Duty Diesel Engine Oils', 
    description: 'HyLube Milcy diesel engine oil in multiple viscosities. Provides excellent protection for commercial vehicle engines.', 
    specs: 'Viscosity: 30, 40, 50 | Applications: Commercial vehicles | Benefits: Multiple viscosities, excellent protection, reliable performance, cost-effective | Pack Sizes: 5L, 20L',
    image_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HYLUBE MILCY 30 40 50.png',
    catalog_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HYLUBE MILCY 30, 40, 50_0.pdf'
  },
  { 
    name: 'HP HYLUBE EXTRA 20W-40', 
    category: 'Heavy Duty Diesel Engine Oils', 
    description: 'Extra-grade diesel engine oil with viscosity 20W-40. Provides superior protection for commercial vehicle engines.', 
    specs: 'Viscosity: 20W-40 | Applications: Commercial vehicles | Benefits: Extra-grade quality, superior protection, reliable performance, cost-effective | Pack Sizes: 5L, 20L',
    image_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HYLUBE EXTRA 20W 40.png',
    catalog_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HYLUBE EXTRA 20W 40_0.pdf'
  },
  { 
    name: 'HP HYLUBE CDKC 20W-40', 
    category: 'Heavy Duty Diesel Engine Oils', 
    description: 'CDKC-grade diesel engine oil with viscosity 20W-40. Provides excellent protection for commercial vehicle engines.', 
    specs: 'Viscosity: 20W-40 | API: CDKC | Applications: Commercial vehicles | Benefits: CDKC grade, excellent protection, reliable performance, cost-effective | Pack Sizes: 5L, 20L',
    image_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HYLUBE CDKC 20W 40.png',
    catalog_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HYLUBE CDKC 20W 40_0.pdf'
  },
  { 
    name: 'HP HYLUBE HDX MG', 
    category: 'Heavy Duty Diesel Engine Oils', 
    description: 'HDX MG-grade diesel engine oil. Provides excellent protection for commercial vehicle engines with extended drain capabilities.', 
    specs: 'Applications: Commercial vehicles | Benefits: HDX MG grade, excellent protection, extended drain, cost-effective | Pack Sizes: 5L, 20L',
    image_url: null,
    catalog_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HYLUBE HDX MG.pdf'
  },
  { 
    name: 'HP DIESELINO 15W-40T', 
    category: 'Heavy Duty Diesel Engine Oils', 
    description: 'Dieselino turbo diesel engine oil with viscosity 15W-40T. Provides excellent protection for turbocharged diesel engines.', 
    specs: 'Viscosity: 15W-40T | Applications: Turbocharged commercial vehicles | Benefits: Turbo protection, excellent performance, engine longevity, cost-effective | Pack Sizes: 5L, 20L',
    image_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/hp-dieselino-15w-40t (1).png',
    catalog_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP DIESELINO 15W 40T-15-05-2019.pdf'
  },
  { 
    name: 'HP KLT 15W-40', 
    category: 'Heavy Duty Diesel Engine Oils', 
    description: 'KLT-grade diesel engine oil with viscosity 15W-40. Provides excellent protection for commercial vehicle engines.', 
    specs: 'Viscosity: 15W-40 | Applications: Commercial vehicles | Benefits: KLT grade, excellent protection, reliable performance, cost-effective | Pack Sizes: 5L, 20L',
    image_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP KLT 15W 40.png',
    catalog_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP KLT 15W 40-15-05-2019.pdf'
  },
  { 
    name: 'HP X-3 30 KLT', 
    category: 'Heavy Duty Diesel Engine Oils', 
    description: 'X-3 KLT-grade diesel engine oil with viscosity 30. Provides excellent protection for commercial vehicle engines.', 
    specs: 'Viscosity: SAE 30 | Applications: Commercial vehicles | Benefits: X-3 KLT grade, excellent protection, reliable performance, cost-effective | Pack Sizes: 5L, 20L',
    image_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP X-3 30 KLT.png',
    catalog_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP X-3 30 KLT.pdf'
  },
  { 
    name: 'HP HDX PLUS 15W-40 CF-4', 
    category: 'Heavy Duty Diesel Engine Oils', 
    description: 'HDX Plus diesel engine oil with viscosity 15W-40 meeting CF-4 specification. Provides excellent protection for commercial vehicles.', 
    specs: 'Viscosity: 15W-40 | API: CF-4 | Applications: Commercial vehicles | Benefits: CF-4 specification, excellent protection, reliable performance, cost-effective | Pack Sizes: 5L, 20L',
    image_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP-HDX-Plus-15W-40-CF-4.png',
    catalog_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP-HDX-Plus-15W-40-CF-4.pdf'
  },
  { 
    name: 'HP MILCY 15W-40 CF-4', 
    category: 'Heavy Duty Diesel Engine Oils', 
    description: 'Milcy diesel engine oil with viscosity 15W-40 meeting CF-4 specification. Provides excellent protection for commercial vehicles.', 
    specs: 'Viscosity: 15W-40 | API: CF-4 | Applications: Commercial vehicles | Benefits: CF-4 specification, excellent protection, reliable performance, cost-effective | Pack Sizes: 5L, 20L',
    image_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/Milcy CF4.png',
    catalog_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP-MILCY-15W-40-CF-4.pdf'
  },
  { 
    name: 'HP MILCY 15W-40 CI-4', 
    category: 'Heavy Duty Diesel Engine Oils', 
    description: 'Milcy diesel engine oil with viscosity 15W-40 meeting CI-4 specification. Provides superior protection for commercial vehicles.', 
    specs: 'Viscosity: 15W-40 | API: CI-4 | Applications: Commercial vehicles | Benefits: CI-4 specification, superior protection, extended drain, fuel efficiency | Pack Sizes: 5L, 20L',
    image_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP-MILCY-15W40-CI-4.png',
    catalog_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP-MILCY-15W-40-CI-4.pdf'
  },
  { 
    name: 'HP MILCY TURBO SUPREME', 
    category: 'Heavy Duty Diesel Engine Oils', 
    description: 'Supreme-grade turbo diesel engine oil. Provides maximum protection for premium turbocharged commercial vehicles.', 
    specs: 'Applications: Premium turbocharged commercial vehicles | Benefits: Supreme-grade protection, maximum performance, extended drain, superior quality | Pack Sizes: 5L, 7.5L, 20L',
    image_url: null,
    catalog_url: '/images/AG_OIL[1]/HEAVY DUTY DIESEL ENGINE OILS/HP MILCY TURBO SUPREME.pdf'
  },

  // Additional Passenger Car Engine Oils
  { 
    name: 'HP NEOSYNTH GEN6 0W-20', 
    category: 'Passenger Car Engine Oils', 
    description: 'Next-generation fully synthetic engine oil with viscosity 0W-20. Advanced GEN6 formulation for modern passenger cars.', 
    specs: 'Viscosity: 0W-20 | API: SP/SN Plus | Type: Fully Synthetic | Applications: Modern passenger cars, latest engines | Benefits: GEN6 technology, superior protection, fuel economy, extended drain | Pack Sizes: 3.5L, 5L',
    image_url: null,
    catalog_url: '/images/AG_OIL[1]/PASSENGER CAR ENGINE OILS/HP-NEOSYNTH-GEN6-0W-20.pdf'
  },
  { 
    name: 'HP NEOSYNTH PLUS 0W-20', 
    category: 'Passenger Car Engine Oils', 
    description: 'Enhanced synthetic engine oil with viscosity 0W-20. Provides superior protection for modern passenger cars.', 
    specs: 'Viscosity: 0W-20 | API: SP/SN Plus | Type: Synthetic | Applications: Modern passenger cars | Benefits: Enhanced protection, superior performance, fuel economy, extended drain | Pack Sizes: 3.5L, 5L',
    image_url: null,
    catalog_url: '/images/AG_OIL[1]/PASSENGER CAR ENGINE OILS/HP NEOSYNTH PLUS 0W-20-15-05-2019.pdf'
  },
  { 
    name: 'HP NEOSYNTH PLUS 5W-40', 
    category: 'Passenger Car Engine Oils', 
    description: 'Enhanced synthetic engine oil with viscosity 5W-40. Provides superior protection for passenger cars and SUVs.', 
    specs: 'Viscosity: 5W-40 | API: SN/CF | Type: Synthetic | Applications: Passenger cars, SUVs | Benefits: Enhanced protection, superior performance, all-weather performance, extended drain | Pack Sizes: 3L, 5L',
    image_url: null,
    catalog_url: '/images/AG_OIL[1]/PASSENGER CAR ENGINE OILS/HP-NEOSYNTH-PLUS-5W-40.pdf'
  },
  { 
    name: 'HP NEOSYNTH 5W-40', 
    category: 'Passenger Car Engine Oils', 
    description: 'Premium synthetic engine oil with viscosity 5W-40. Provides excellent protection for modern passenger cars.', 
    specs: 'Viscosity: 5W-40 | API: SN/CF | Type: Synthetic | Applications: Modern passenger cars | Benefits: Synthetic protection, excellent performance, all-weather performance, fuel efficiency | Pack Sizes: 3L, 5L',
    image_url: null,
    catalog_url: '/images/AG_OIL[1]/PASSENGER CAR ENGINE OILS/HP NEOSYNTH 5W 40-15-05-2019.pdf'
  },
  { 
    name: 'HP NEOSYNTH 10W-30', 
    category: 'Passenger Car Engine Oils', 
    description: 'Premium synthetic engine oil with viscosity 10W-30. Provides excellent protection for passenger cars.', 
    specs: 'Viscosity: 10W-30 | API: SN/CF | Type: Synthetic | Applications: Passenger cars | Benefits: Synthetic protection, excellent performance, fuel efficiency, extended drain | Pack Sizes: 3L, 5L',
    image_url: '/images/AG_OIL[1]/PASSENGER CAR ENGINE OILS/Neosynth-10W30-466x382.jpg',
    catalog_url: '/images/AG_OIL[1]/PASSENGER CAR ENGINE OILS/HP NEOSYNTH 10W 30-15-05-2019.pdf'
  },
  { 
    name: 'HP NEOSYNTH 1 5W-40', 
    category: 'Passenger Car Engine Oils', 
    description: 'Number one synthetic engine oil with viscosity 5W-40. Premium quality engine oil for passenger cars.', 
    specs: 'Viscosity: 5W-40 | API: SN/CF | Type: Synthetic | Applications: Premium passenger cars | Benefits: Premium quality, superior protection, extended drain, fuel efficiency | Pack Sizes: 3L, 5L',
    image_url: null,
    catalog_url: '/images/AG_OIL[1]/PASSENGER CAR ENGINE OILS/HP NEOSYNTH 1 5W 40-15-05-2019_0.pdf'
  },
  { 
    name: 'HP NEO CRUISE 20W-40', 
    category: 'Passenger Car Engine Oils', 
    description: 'Neo Cruise engine oil with viscosity 20W-40. Provides reliable protection for passenger cars.', 
    specs: 'Viscosity: 20W-40 | API: CF-4/SG | Applications: Passenger cars | Benefits: Reliable protection, all-weather performance, cost-effective, proven quality | Pack Sizes: 3L, 5L',
    image_url: '/images/AG_OIL[1]/PASSENGER CAR ENGINE OILS/HP-Neo-Cruise_0.jpg',
    catalog_url: '/images/AG_OIL[1]/PASSENGER CAR ENGINE OILS/HP-NEO-CRUISE-20W-40.pdf'
  },
  { 
    name: 'HP CRUISE CLASSIC 20W-40 & 20W-50', 
    category: 'Passenger Car Engine Oils', 
    description: 'Classic Cruise engine oil available in multiple viscosities. Provides reliable protection for passenger cars.', 
    specs: 'Viscosity: 20W-40, 20W-50 | API: CF-4/SG | Applications: Passenger cars, older vehicles | Benefits: Multiple viscosities, reliable protection, all-weather performance, cost-effective | Pack Sizes: 3L, 5L',
    image_url: '/images/AG_OIL[1]/PASSENGER CAR ENGINE OILS/Cruise-Classic-3-Ltr.jpg',
    catalog_url: '/images/AG_OIL[1]/PASSENGER CAR ENGINE OILS/Cruise-Classic-20W-40-and-20W-50.pdf'
  },
  { 
    name: 'HP EXTRA SUPER MOTOR OIL', 
    category: 'Passenger Car Engine Oils', 
    description: 'Extra super motor oil for passenger cars. Provides superior protection and performance for passenger vehicles.', 
    specs: 'Applications: Passenger cars | Benefits: Extra super quality, superior protection, reliable performance, cost-effective | Pack Sizes: 3L, 5L',
    image_url: '/images/AG_OIL[1]/PASSENGER CAR ENGINE OILS/HP EXTRA SUPER MOTOR OIL.png',
    catalog_url: '/images/AG_OIL[1]/PASSENGER CAR ENGINE OILS/HP-EXTRA-SUPER-MOTOR-OIL.pdf'
  },

  // Additional Radiator Coolants
  { 
    name: 'HP KOOLGARD', 
    category: 'Radiator Coolants', 
    description: 'Standard radiator coolant and antifreeze. Provides reliable cooling and protection for vehicle radiators.', 
    specs: 'Type: Standard Coolant | Applications: All vehicles | Benefits: Reliable cooling, corrosion prevention, cost-effective, proven quality | Pack Sizes: 1L, 5L',
    image_url: null,
    catalog_url: '/images/AG_OIL[1]/RADIATOR COOLANTS/HP KOOLGARD-15-05-2019.pdf'
  },
  { 
    name: 'HP KOOLGARD LL', 
    category: 'Radiator Coolants', 
    description: 'Long-life radiator coolant and antifreeze. Designed for extended service intervals with excellent protection.', 
    specs: 'Type: Long-Life Coolant | Applications: All vehicles | Benefits: Long-life, extended service intervals, excellent protection, cost savings | Pack Sizes: 1L, 5L',
    image_url: null,
    catalog_url: '/images/AG_OIL[1]/RADIATOR COOLANTS/HP KOOLGARD LL-15-05-2019.pdf'
  },
  { 
    name: 'HP POWERKOOL', 
    category: 'Radiator Coolants', 
    description: 'Performance radiator coolant for vehicles. Provides superior cooling and protection for vehicle radiators.', 
    specs: 'Type: Performance Coolant | Applications: All vehicles | Benefits: Superior cooling, excellent protection, temperature stability, reliable performance | Pack Sizes: 1L, 5L',
    image_url: null,
    catalog_url: '/images/AG_OIL[1]/RADIATOR COOLANTS/HP POWERKOOL-15-05-2019.pdf'
  },
  { 
    name: 'HP RADIATOR PROTECTOR', 
    category: 'Radiator Coolants', 
    description: 'Radiator protector coolant and antifreeze. Provides excellent protection and cooling for vehicle radiators.', 
    specs: 'Type: Radiator Protector Coolant | Applications: All vehicles | Benefits: Radiator protection, excellent cooling, corrosion prevention, reliable performance | Pack Sizes: 1L, 5L',
    image_url: null,
    catalog_url: '/images/AG_OIL[1]/RADIATOR COOLANTS/HP RADIATOR PROTECTOR-15-05-2019.pdf'
  },

  // Additional Natural Gas And CNG Engine Oils
  { 
    name: 'HP NATURAL GAS ENGINE OIL A 40', 
    category: 'Natural Gas And CNG Engine Oils', 
    description: 'Natural gas engine oil type A with viscosity 40. Provides excellent protection for natural gas and CNG engines.', 
    specs: 'Viscosity: SAE 40 | Applications: Natural gas engines, CNG vehicles | Benefits: Natural gas optimized, excellent protection, engine longevity, reliable performance | Pack Sizes: 5L, 20L',
    image_url: '/images/AG_OIL[1]/Natural Gas And CNG Engine Oils/HP NATURAL GAS ENGINE OIL A 40.png',
    catalog_url: '/images/AG_OIL[1]/Natural Gas And CNG Engine Oils/HP NATURAL GAS ENGINE OIL A 40-15-05-2019.pdf'
  },
  { 
    name: 'HP NATURAL GAS ENGINE OIL M 40', 
    category: 'Natural Gas And CNG Engine Oils', 
    description: 'Natural gas engine oil type M with viscosity 40. Provides excellent protection for natural gas and CNG engines.', 
    specs: 'Viscosity: SAE 40 | Applications: Natural gas engines, CNG vehicles | Benefits: Natural gas optimized, excellent protection, engine longevity, reliable performance | Pack Sizes: 5L, 20L',
    image_url: '/images/AG_OIL[1]/Natural Gas And CNG Engine Oils/HP NATURAL GAS ENGINE OIL M 40.png',
    catalog_url: '/images/AG_OIL[1]/Natural Gas And CNG Engine Oils/HP NATURAL GAS ENGINE OIL M 40-15-05-2019.pdf'
  },
  { 
    name: 'HP NATURAL GAS ENGINE OIL L 40 & L 15W-40', 
    category: 'Natural Gas And CNG Engine Oils', 
    description: 'Natural gas engine oil type L in multiple viscosities. Provides excellent protection for natural gas and CNG engines.', 
    specs: 'Viscosity: SAE 40, 15W-40 | Applications: Natural gas engines, CNG vehicles | Benefits: Natural gas optimized, multiple viscosities, excellent protection, engine longevity | Pack Sizes: 5L, 20L',
    image_url: null,
    catalog_url: '/images/AG_OIL[1]/Natural Gas And CNG Engine Oils/HP Natural Gas Engine oil L 40 & L 15W 40-15-05-2019.pdf'
  },

  // Additional Railroad Engine Oils
  { 
    name: 'HP RAIL ROAD OIL 713', 
    category: 'Railroad Engine Oils', 
    description: 'Railroad locomotive engine oil meeting 713 specification. Provides optimal protection for locomotive engines requiring 713 grade oil.', 
    specs: 'Specification: 713 | Applications: Locomotive engines (713 spec) | Benefits: Specification compliant, engine protection, reliable performance | Pack Sizes: Bulk',
    image_url: null,
    catalog_url: '/images/AG_OIL[1]/Railroad ENGINE OILS/HP RAIL ROAD OIL 713-14-05-2019.pdf'
  },
];

// Helper function to check if file exists
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Helper function to get MIME type from file extension
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// Helper function to find files by extension in a directory
async function findFilesInDirectory(dirPath, extensions, recursive = true) {
  const files = [];
  try {
    const items = await fs.readdir(dirPath);
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = await fs.stat(fullPath);
      
      if (stat.isFile()) {
        const ext = path.extname(item).toLowerCase();
        if (extensions.includes(ext)) {
          files.push({
            name: item,
            path: fullPath,
            relativePath: fullPath.replace(PUBLIC_DIR.replace(/\\/g, '/'), '').replace(/\\/g, '/')
          });
        }
      } else if (stat.isDirectory() && recursive && !item.includes('Downloads')) {
        // Recursively search subdirectories
        const subFiles = await findFilesInDirectory(fullPath, extensions, recursive);
        files.push(...subFiles);
      }
    }
  } catch (error) {
    // Directory doesn't exist or can't be read
    return [];
  }
  return files;
}

// Helper function to match product name with image filename
function matchImageToProduct(productName, imageName) {
  // Normalize names for matching
  const normalize = (str) => str.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/hp/gi, '')
    .replace(/oil/gi, '')
    .replace(/engine/gi, '');
  
  const productNorm = normalize(productName);
  const imageNorm = normalize(imageName);
  
  // Extract key words from product name
  const productWords = productName.toLowerCase().split(/[\s\-_]+/).filter(w => w.length > 2);
  
  // Check if image name contains product keywords
  let matchScore = 0;
  for (const word of productWords) {
    if (imageNorm.includes(normalize(word))) {
      matchScore++;
    }
  }
  
  // Also check for direct substring match
  if (imageNorm.includes(productNorm) || productNorm.includes(imageNorm)) {
    matchScore += 3;
  }
  
  return matchScore;
}

// Helper function to discover and match images for a product
async function discoverImageForProduct(product, categoryDirPath) {
  try {
    // First check if the specified image_url exists
    if (product.image_url) {
      const specifiedPath = product.image_url.startsWith('/') 
        ? path.join(PUBLIC_DIR, product.image_url)
        : path.join(PUBLIC_DIR, product.image_url.startsWith('images/') ? '' : '/images/', product.image_url);
      
      if (await fileExists(specifiedPath)) {
        return product.image_url;
      }
    }
    
    // If no image_url or file doesn't exist, search in category directory
    const categoryImages = await findFilesInDirectory(
      categoryDirPath, 
      ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      true
    );
    
    if (categoryImages.length === 0) {
      return null;
    }
    
    // Find best matching image
    let bestMatch = null;
    let bestScore = 0;
    
    for (const img of categoryImages) {
      const score = matchImageToProduct(product.name, img.name);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = img;
      }
    }
    
    // Return the best match if score is reasonable (at least 1 match)
    if (bestMatch && bestScore > 0) {
      return bestMatch.relativePath;
    }
    
    // If we have images but no match, use the first image as fallback
    if (categoryImages.length > 0 && !product.image_url) {
      return categoryImages[0].relativePath;
    }
    
    return null;
  } catch (error) {
    console.error(`  ⚠️  Error discovering image for ${product.name}:`, error.message);
    return null;
  }
}

// Helper function to get category directory path
function getCategoryDirectoryPath(categoryName) {
  // Map category names to directory names
  const categoryMap = {
    'Agriculture Oils': 'AG OIL',
    'Brake Fluids': 'Brake Fluids',
    'BS VI Grades': 'BS VI Grades',
    'EV and Hybrid Range': null, // No directory for EV products
    'Gear and Transmission Oils': 'Gear AND tran',
    'Heavy Duty Diesel Engine Oils': 'HEAVY DUTY DIESEL ENGINE OILS',
    'Natural Gas And CNG Engine Oils': 'Natural Gas And CNG Engine Oils',
    'Outboard Marine Oils': 'Outboatd Marine Oils',
    'Passenger Car Engine Oils': 'PASSENGER CAR ENGINE OILS',
    'Radiator Coolants': 'RADIATOR COOLANTS',
    'Railroad Engine Oils': 'Railroad ENGINE OILS',
    'Shock Absorber and Front Fork Oils': 'SHOCK ABSORBER and FRONT FORK OILS',
    'Three Wheeler Engine Oils': 'THREE WHEELER ENGINE OILS',
    'Two Wheeler Engine Oils': 'TWO WHEELER ENGINE OILS',
  };
  
  const dirName = categoryMap[categoryName];
  if (!dirName) return null;
  
  return path.join(PUBLIC_DIR, 'images', 'AG_OIL[1]', dirName);
}

// Helper function to upload file from filesystem to S3
async function uploadFileToS3FromPath(filePath, folder) {
  try {
    if (!filePath) return null;
    
    // Convert relative path to absolute path
    const absolutePath = filePath.startsWith('/') 
      ? path.join(PUBLIC_DIR, filePath)
      : path.join(PUBLIC_DIR, filePath.startsWith('images/') ? '' : '/images/', filePath);

    // Check if file exists
    if (!(await fileExists(absolutePath))) {
      return null;
    }

    // Read file from filesystem
    const fileBuffer = await fs.readFile(absolutePath);
    const fileName = path.basename(absolutePath);
    const mimeType = getMimeType(absolutePath);

    // Create file object for S3 upload
    const fileObj = {
      buffer: fileBuffer,
      originalname: fileName,
      mimetype: mimeType,
    };

    // Upload to S3
    const s3Url = await uploadToS3(fileObj, folder);
    
    // Return path part (without domain) for database storage
    const urlObj = new URL(s3Url);
    return urlObj.pathname.substring(1); // Remove leading slash
  } catch (error) {
    return null;
  }
}

// Ensure catalog_url column exists in products table
async function ensureCatalogUrlColumn() {
  try {
    // Check if column exists
    const checkResult = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='products' AND column_name='catalog_url'
    `);

    if (checkResult.rows.length === 0) {
      // Add catalog_url column
      console.log('📝 Adding catalog_url column to products table...');
      await query(`
        ALTER TABLE products 
        ADD COLUMN catalog_url TEXT
      `);
      console.log('✅ catalog_url column added successfully');
    } else {
      console.log('✅ catalog_url column already exists');
    }
  } catch (error) {
    console.error('❌ Error checking/adding catalog_url column:', error.message);
    throw error;
  }
}

// Update productsDB to support catalog_url
const productsDBWithCatalog = {
  ...productsDB,
  create: async (product) => {
    const result = await query(
      `INSERT INTO products (name, company_key, category_name, description, specs, image_url, catalog_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        product.name, 
        product.company_key, 
        product.category_name, 
        product.description, 
        product.specs, 
        product.image_url,
        product.catalog_url || null
      ]
    );
    return result.rows[0];
  },
  update: async (id, product) => {
    const result = await query(
      `UPDATE products SET name = $1, company_key = $2, category_name = $3, 
       description = $4, specs = $5, image_url = COALESCE($6, image_url), 
       catalog_url = COALESCE($7, catalog_url), updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 RETURNING *`,
      [
        product.name, 
        product.company_key, 
        product.category_name, 
        product.description, 
        product.specs, 
        product.image_url,
        product.catalog_url,
        id
      ]
    );
    return result.rows[0];
  },
};

// Main function to upload all HP Lubricants products category by category
async function uploadHPLubricantsProducts() {
  try {
    console.log('🚀 Initializing Prisma PostgreSQL database connection...');
    console.log('   Connecting to PostgreSQL database (Prisma)...\n');
    
    const initResult = await initDatabase();
    
    if (!initResult.success) {
      console.error('❌ Database initialization failed:', initResult.message);
      console.error('   Please check your database configuration and ensure PostgreSQL is running.');
      console.error('   Verify DATABASE_URL or POSTGRES_URL environment variables are set correctly.');
      process.exit(1);
    }
    
    console.log('✅ Connected to Prisma PostgreSQL database successfully!');
    console.log('   Database tables initialized and ready for migration.\n');

    // Ensure catalog_url column exists
    await ensureCatalogUrlColumn();

    // Group products by category
    const productsByCategory = {};
    for (const product of hpLubricantsProducts) {
      if (!productsByCategory[product.category]) {
        productsByCategory[product.category] = [];
      }
      productsByCategory[product.category].push(product);
    }

    const categories = Object.keys(productsByCategory);
    const totalProducts = hpLubricantsProducts.length;

    console.log(`📦 Starting upload of ${totalProducts} HP Lubricants products across ${categories.length} categories...\n`);

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    const errors = [];

    // Get all existing products once to check for duplicates
    let existingProducts = [];
    try {
      const allProducts = await productsDB.getAll(1, 10000); // Get up to 10k products
      existingProducts = allProducts.products;
      console.log(`📋 Found ${existingProducts.length} existing products in database\n`);
    } catch (error) {
      console.warn('⚠️  Could not fetch existing products, will check individually:', error.message);
    }

    // Process each category one by one
    for (let catIndex = 0; catIndex < categories.length; catIndex++) {
      const category = categories[catIndex];
      const categoryProducts = productsByCategory[category];
      
      console.log('\n' + '='.repeat(70));
      console.log(`📁 Category ${catIndex + 1}/${categories.length}: ${category}`);
      console.log(`   Products in this category: ${categoryProducts.length}`);
      console.log('='.repeat(70));

      // Upload all products in this category
      for (let i = 0; i < categoryProducts.length; i++) {
        const product = categoryProducts[i];
        const globalIndex = successCount + skippedCount + errorCount + 1;
        const progress = `[${i + 1}/${categoryProducts.length}] (Global: ${globalIndex}/${totalProducts})`;
        
        try {
          // Check if product already exists (by name and category)
          const exists = existingProducts.length > 0 
            ? existingProducts.some(
                p => p.name.toLowerCase() === product.name.toLowerCase() && 
                     p.category_name === product.category
              )
            : false;

          if (exists) {
            console.log(`  ${progress} ⏭️  Skipping "${product.name}" - already exists`);
            skippedCount++;
            continue;
          }

          // Discover and upload image to S3
          let uploadedImageUrl = null;
          const categoryDirPath = getCategoryDirectoryPath(product.category);
          
          // Discover image (will check existing image_url first, then search directory)
          const discoveredImagePath = await discoverImageForProduct(product, categoryDirPath);
          
          if (discoveredImagePath) {
            console.log(`  ${progress} 📷 Uploading image for "${product.name}"...`);
            if (discoveredImagePath !== product.image_url) {
              console.log(`     🔍 Discovered image: ${path.basename(discoveredImagePath)}`);
            }
            uploadedImageUrl = await uploadFileToS3FromPath(discoveredImagePath, 'images/sahni_products');
            if (uploadedImageUrl) {
              console.log(`     ✅ Image uploaded: ${uploadedImageUrl}`);
            } else {
              console.log(`     ⚠️  Image upload failed`);
            }
          } else {
            console.log(`  ${progress} ⚠️  No image found for "${product.name}"`);
          }

          // Discover and upload catalog to S3
          let uploadedCatalogUrl = null;
          let catalogPath = product.catalog_url;
          
          // Check if catalog exists, otherwise discover
          if (!catalogPath && categoryDirPath) {
            // First check if the specified catalog_url exists
            if (product.catalog_url) {
              const specifiedPath = product.catalog_url.startsWith('/') 
                ? path.join(PUBLIC_DIR, product.catalog_url)
                : path.join(PUBLIC_DIR, product.catalog_url.startsWith('images/') ? '' : '/images/', product.catalog_url);
              
              if (await fileExists(specifiedPath)) {
                catalogPath = product.catalog_url;
              }
            }
            
            // If still no catalog, try to discover it
            if (!catalogPath) {
              const catalogs = await findFilesInDirectory(categoryDirPath, ['.pdf'], false);
              if (catalogs.length > 0) {
                // Find best matching catalog
                let bestMatch = null;
                let bestScore = 0;
                
                for (const cat of catalogs) {
                  const score = matchImageToProduct(product.name, cat.name);
                  if (score > bestScore) {
                    bestScore = score;
                    bestMatch = cat;
                  }
                }
                
                if (bestMatch && bestScore > 0) {
                  catalogPath = bestMatch.relativePath;
                  console.log(`     🔍 Discovered catalog: ${path.basename(catalogPath)}`);
                }
              }
            }
          }
          
          if (catalogPath) {
            console.log(`  ${progress} 📄 Uploading catalog for "${product.name}"...`);
            uploadedCatalogUrl = await uploadFileToS3FromPath(catalogPath, 'catalouges');
            if (uploadedCatalogUrl) {
              console.log(`     ✅ Catalog uploaded: ${uploadedCatalogUrl}`);
            } else {
              console.log(`     ⚠️  Catalog upload failed`);
            }
          }

          // Create product in database with uploaded URLs
          const createdProduct = await productsDBWithCatalog.create({
            name: product.name,
            company_key: 'hp',
            category_name: product.category,
            description: product.description || '',
            specs: product.specs || '',
            image_url: uploadedImageUrl,
            catalog_url: uploadedCatalogUrl
          });

          console.log(`  ${progress} ✅ Created: ${product.name} (ID: ${createdProduct.id})`);
          successCount++;
        } catch (error) {
          console.error(`  ${progress} ❌ Failed to create "${product.name}":`, error.message);
          errors.push({ category, product: product.name, error: error.message });
          errorCount++;
        }
      }

      console.log(`\n  ✅ Category "${category}" completed`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('📊 Final Migration Summary - PostgreSQL Database:');
    console.log(`   ✅ Successfully migrated: ${successCount} products`);
    console.log(`   ⏭️  Skipped (already exist): ${skippedCount} products`);
    console.log(`   ❌ Errors: ${errorCount} products`);
    console.log(`   📁 Categories processed: ${categories.length}`);
    console.log('='.repeat(70));

    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach(({ category, product, error }) => {
        console.log(`   - [${category}] ${product}: ${error}`);
      });
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ MIGRATION TO PRISMA POSTGRESQL COMPLETED!');
    console.log('='.repeat(70));
    console.log('\n📦 All HP Lubricants products have been migrated to:');
    console.log('   • PostgreSQL Database (Prisma)');
    console.log('   • Images uploaded to S3/CloudFront');
    console.log('   • Catalogs uploaded to S3/CloudFront');
    console.log('   • Products stored with S3 URLs in database');
    console.log('\n✨ Migration completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Verify products in your database/Prisma Studio');
    console.log('   2. Check that images are displaying correctly');
    console.log('   3. Test the products API endpoints');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the upload
uploadHPLubricantsProducts();
