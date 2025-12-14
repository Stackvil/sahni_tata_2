// Tata Vehicles Data - Organized by Category and Subcategory
// Specs and catalogue details can be added later
import { API_BASE_URL, normalizeImageUrl } from '../services/api';

export interface Vehicle {
  id: number;
  name: string;
  category: string;
  subcategory: string;
  images: string[];
  description: string;
  price?: string;
  specs: {
    engine?: string;
    power?: string;
    ptoPower?: string;
    torque?: string;
    transmission?: string;
    fuelType?: string;
    mileage?: string;
    seating?: string;
    payload?: string;
    length?: string;
    width?: string;
    height?: string;
    wheelbase?: string;
    fuelTank?: string;
    cargoVolume?: string;
    gvw?: string;
    maxSpeed?: string;
    groundClearance?: string;
    loadBody?: string;
    minTcr?: string;
    steering?: string;
    brakes?: string;
    suspensionFront?: string;
    suspensionRear?: string;
    tyres?: string;
    warranty?: string;
    gradeability?: string;
    frontTrack?: string;
    rearTrack?: string;
    hydraulics?: string;
    liftCapacity?: string;
    pto?: string;
    weight?: string;
    tyresFront?: string;
    tyresRear?: string;
    clutch?: string;
    rearDrive?: string;
    turningCircleRadius?: string;
    rearTransmission?: string;
    frontAxle?: string;
    airCleaner?: string;
  };
  features: string[];
  variants?: string[];
  size?: 'small' | 'large' | 'medium';
  popular?: boolean;
  catalog?: string; // PDF catalogue path
}

// Helper function to generate image paths based on folder structure
const getImagePaths = (category: string, subcategory: string, count: number): string[] => {
  const basePath = '/images/sahni_vehicles/tata';
  const images: string[] = [];
  
  // Map subcategory names to actual folder names (handle mismatches)
  const folderNameMap: { [key: string]: string } = {
    'Ace EV 1000': 'Ace _EV_1000', // Actual folder: "Ace _EV_1000" (space + underscore + EV + underscore + 1000)
    'Yodha 1200': 'Yodha_1200', // Actual folder uses underscore instead of space
    'Yodha 1700': 'Yodha_1700', // Actual folder uses underscore instead of space
    'Yodha 2.0': 'Yodha_2.0', // Actual folder uses underscore instead of space
  };
  
  // Get the actual folder name (use mapped name if exists, otherwise use subcategory as-is)
  // Note: Ace HT+ folder name matches subcategory, so no mapping needed
  const actualFolderName = folderNameMap[subcategory] || subcategory;
  
  // Handle special case for ace_pro_petrol which has custom image names
  if (subcategory === 'ace_pro_petrol') {
    return [
      `${basePath}/tata_ace/ace_pro_petrol/ace_patrol1.png`,
      `${basePath}/tata_ace/ace_pro_petrol/Group 51_0.png`,
      `${basePath}/tata_ace/ace_pro_petrol/Group 52.png`,
      `${basePath}/tata_ace/ace_pro_petrol/Group 53.png`,
      `${basePath}/tata_ace/ace_pro_petrol/tata-ace-pro-small-img_0.png`,
    ];
  }
  
  // Handle special case for Yodha Single Cab which has a .jpeg file
  if (subcategory === 'Yodha Single Cab') {
    return [
      `${basePath}/tata_yodha/Yodha Single Cab/1.png`,
      `${basePath}/tata_yodha/Yodha Single Cab/2.jpeg`,
    ];
  }
  
  // Handle special case for Winger cargo (different folder name)
  if (subcategory === 'Winger cargo') {
    return [
      `${basePath}/tata_yodha/Winger cargo/1.png`,
    ];
  }
  
  // Standard numbering: 1.png, 2.png, etc.
  // Use actualFolderName which handles folder name mismatches
  for (let i = 1; i <= count; i++) {
    images.push(`${basePath}/${category}/${actualFolderName}/${i}.png`);
  }
  
  return images;
};

// All Tata Vehicles - loaded from backend API or JSON fallback
let vehiclesCache: Vehicle[] | null = null;
let vehiclesLoading: Promise<Vehicle[]> | null = null;

// Transform backend vehicle format to frontend format
function transformBackendVehicle(backendVehicle: any, index: number): Vehicle {
  // Transform images: Backend returns array of image URL strings
  // Ensure all images are strings, not objects
  const images: string[] = [];
  
  if (Array.isArray(backendVehicle.images)) {
    for (const img of backendVehicle.images) {
      if (typeof img === 'string') {
        // Already a string URL - use as-is
        images.push(img);
      } else if (img && typeof img === 'object') {
        // Extract string from object - check multiple possible properties
        const imgStr = img.image || img.url || img.path || img.src || img.link || '';
        if (typeof imgStr === 'string' && imgStr.trim() !== '') {
          images.push(imgStr);
        } else {
          console.warn(`[Transform Vehicle] Could not extract image string from object for ${backendVehicle.name}:`, img);
        }
      } else {
        console.warn(`[Transform Vehicle] Invalid image type for ${backendVehicle.name}:`, typeof img, img);
      }
    }
  } else if (backendVehicle.image && typeof backendVehicle.image === 'string') {
    // Fallback: if there's a single image property
    images.push(backendVehicle.image);
  } else if (backendVehicle.image && typeof backendVehicle.image === 'object') {
    // Fallback: if image is an object
    const imgStr = backendVehicle.image.image || backendVehicle.image.url || backendVehicle.image.path || backendVehicle.image.src || '';
    if (typeof imgStr === 'string' && imgStr.trim() !== '') {
      images.push(imgStr);
    }
  }
  
  // Normalize all image URLs - ensure they're all strings
  const normalizedImages = images
    .map(img => {
      // Ensure img is a string
      if (typeof img !== 'string') {
        console.warn(`[Transform Vehicle] Image is not a string before normalization:`, typeof img, img);
        return '';
      }
      
      // If already a full URL, return as-is
      if (img.startsWith('http://') || img.startsWith('https://')) {
        return img;
      }
      // Otherwise normalize using normalizeImageUrl
      return normalizeImageUrl(img);
    })
    .filter((img): img is string => typeof img === 'string' && img !== '');
  
  if (normalizedImages.length === 0 && images.length > 0) {
    console.warn(`[Transform Vehicle] No valid images after normalization for ${backendVehicle.name}. Original images:`, backendVehicle.images);
  }
  
  console.log(`[Transform Vehicle] ${backendVehicle.name}:`, {
    originalImages: backendVehicle.images,
    extractedImages: images,
    normalizedImages: normalizedImages,
    imageCount: normalizedImages.length
  });

  // Transform features: [{ "feature": "name" }] -> ["name1", "name2"]
  const features = (backendVehicle.features || []).map((feat: any) =>
    typeof feat === 'string' ? feat : (feat.feature || feat)
  );

  // Transform specs: [{ "key": "key", "value": "value" }] -> { "key": "value" }
  const specs: Vehicle['specs'] = {};
  if (backendVehicle.specs && Array.isArray(backendVehicle.specs)) {
    backendVehicle.specs.forEach((spec: any) => {
      if (spec.key && spec.value) {
        specs[spec.key as keyof Vehicle['specs']] = spec.value;
      }
    });
  } else if (backendVehicle.specs && typeof backendVehicle.specs === 'object') {
    // Already in object format
    Object.assign(specs, backendVehicle.specs);
  }

  // Generate a stable numeric ID from UUID for frontend compatibility
  // Use a hash of the UUID to create consistent numeric IDs
  let id: number;
  if (backendVehicle.id && typeof backendVehicle.id === 'number') {
    id = backendVehicle.id;
  } else if (backendVehicle.id && typeof backendVehicle.id === 'string') {
    // Create a stable numeric ID from UUID
    // Use first 8 characters of UUID (without dashes) as hex, convert to number
    const uuidWithoutDashes = backendVehicle.id.replace(/-/g, '');
    const hash = parseInt(uuidWithoutDashes.substring(0, 8), 16);
    // Use modulo to keep IDs reasonable, but add index to ensure uniqueness
    id = (hash % 9000) + 1000 + index; // IDs between 1000-10000
  } else {
    id = index + 1;
  }

  return {
    id,
    name: backendVehicle.name || '',
    category: backendVehicle.category || '',
    subcategory: backendVehicle.subcategory || backendVehicle.category || '',
    images: normalizedImages,
    description: backendVehicle.description || '',
    price: backendVehicle.price,
    specs,
    features,
    size: backendVehicle.size || 'medium',
    popular: backendVehicle.popular || false,
    variants: backendVehicle.variants,
    catalog: backendVehicle.catalog,
    // Store original UUID for reference
    _uuid: typeof backendVehicle.id === 'string' ? backendVehicle.id : undefined,
  } as Vehicle & { _uuid?: string };
}

export const loadVehicles = async (): Promise<Vehicle[]> => {
  if (vehiclesCache) {
    return vehiclesCache;
  }
  
  // If already loading, return the same promise
  if (vehiclesLoading) {
    return vehiclesLoading;
  }
  
  // Start loading
  vehiclesLoading = (async () => {
    try {
      // Try backend API - use API_BASE_URL to avoid double slashes
      const endpoint = `${API_BASE_URL}/vehicles`;
      
      // Optimize: Fetch first page with large limit to get totalPages, then fetch all pages in parallel
      const limit = 500; // Increased limit to fetch more at once
      let allVehicles: any[] = [];
      
      // Fetch first page to get totalPages
      const firstPageUrl = `${endpoint}?page=1&limit=${limit}`;
      console.log(`[Vehicles API] Fetching first page: ${firstPageUrl}`);
      
      const firstResponse = await Promise.race([
        fetch(firstPageUrl, {
          headers: {
            'Accept': 'application/json',
          },
        }),
        new Promise<Response>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 30000) // Increased timeout for Vercel
        )
      ]) as Response;
      
      if (!firstResponse.ok) {
        const errorText = await firstResponse.text().catch(() => 'Unknown error');
        console.error(`[Vehicles API] Error ${firstResponse.status}:`, errorText);
        throw new Error(`API returned ${firstResponse.status}: ${errorText}`);
      }
      
      const firstData = await firstResponse.json();
      const firstVehicles = Array.isArray(firstData) ? firstData : (firstData.vehicles || firstData.data || []);
      allVehicles = [...firstVehicles];
      
      const totalPages = firstData.totalPages || Math.ceil((firstData.total || firstVehicles.length) / limit);
      console.log(`[Vehicles API] Total pages: ${totalPages}, First page vehicles: ${firstVehicles.length}`);
      
      // If there are more pages, fetch them in parallel for speed
      if (totalPages > 1) {
        const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
        
        console.log(`[Vehicles API] Fetching ${remainingPages.length} remaining pages in parallel...`);
        
        // Fetch all remaining pages in parallel
        const pagePromises = remainingPages.map(async (page) => {
          const pageUrl = `${endpoint}/?page=${page}&limit=${limit}`;
          try {
            const response = await Promise.race([
              fetch(pageUrl, {
                headers: {
                  'Accept': 'application/json',
                },
              }),
              new Promise<Response>((_, reject) => 
                setTimeout(() => reject(new Error(`Page ${page} timeout`)), 30000) // Increased timeout for Vercel
              )
            ]) as Response;
            
            if (response.ok) {
              const data = await response.json();
              const vehicles = Array.isArray(data) ? data : (data.vehicles || data.data || []);
              console.log(`[Vehicles API] Page ${page} loaded: ${vehicles.length} vehicles`);
              return vehicles;
            } else {
              console.warn(`[Vehicles API] Page ${page} failed: ${response.status}`);
              return [];
            }
          } catch (error) {
            console.warn(`[Vehicles API] Page ${page} error:`, error);
            return [];
          }
        });
        
        // Wait for all pages to load
        const remainingVehiclesArrays = await Promise.all(pagePromises);
        remainingVehiclesArrays.forEach(vehicles => {
          allVehicles = [...allVehicles, ...vehicles];
        });
      }

      // Transform backend format to frontend format
      const transformedBackendVehicles = allVehicles.map((vehicle, index) => {
        const transformed = transformBackendVehicle(vehicle, index);
        
        // Store mapping: backend UUID -> frontend numeric ID (both directions)
        if (vehicle.id && typeof vehicle.id === 'string') {
          const uuid = vehicle.id;
          // Store UUID in the transformed vehicle for easy lookup
          (transformed as any)._uuid = uuid;
          
          // Store bidirectional mappings
          vehicleIdMapping.set(transformed.id, uuid);
          vehicleUuidMapping.set(uuid, transformed.id);
          // Also store by name for fallback lookup
          vehicleIdMapping.set(vehicle.name.toLowerCase(), uuid);
          // Store by numeric ID string as well
          vehicleIdMapping.set(String(transformed.id), uuid);
          
          console.log(`[loadVehicles] Mapped vehicle: ${transformed.name} (numeric ID: ${transformed.id}, UUID: ${uuid})`);
        } else if (vehicle.id && typeof vehicle.id === 'number') {
          // If backend returns numeric ID, store it directly
          (transformed as any)._uuid = null;
          console.log(`[loadVehicles] Vehicle with numeric ID: ${transformed.name} (ID: ${transformed.id})`);
        }
        return transformed;
      });
      
      console.log(`[loadVehicles] Created ${vehicleUuidMapping.size} UUID mappings`);
      console.log(`[loadVehicles] Loaded ${transformedBackendVehicles.length} vehicles from backend (total fetched: ${allVehicles.length})`);
      
      vehiclesCache = transformedBackendVehicles;
      return vehiclesCache;
    } catch (error) {
      // Backend API failed - no fallback to static JSON
      console.error('Backend API failed:', error);
      vehiclesCache = [];
      return [];
    } finally {
      vehiclesLoading = null;
    }
  })();
  
  return vehiclesLoading;
};

// For backward compatibility, export a function that returns vehicles
export const getTataVehicles = async (): Promise<Vehicle[]> => {
  return await loadVehicles();
};

// Synchronous access - will be empty until loaded
export let tataVehicles: Vehicle[] = [];

// Store UUID to numeric ID mapping when loading vehicles
let vehicleIdMapping: Map<number | string, string> = new Map();
let vehicleUuidMapping: Map<string, number> = new Map();

// Helper function to get vehicle by ID (supports both numeric ID and UUID)
export const getVehicleById = async (id: number | string): Promise<Vehicle | null> => {
  const idStr = String(id);
  console.log(`[getVehicleById] Looking for vehicle with ID: ${idStr} (type: ${typeof id})`);
  
  // Load all vehicles from backend first
  let vehicles = await loadVehicles();
  console.log(`[getVehicleById] Loaded ${vehicles.length} vehicles, UUID mappings: ${vehicleUuidMapping.size}`);
  
  // If id is a UUID string (contains dashes and is long enough)
  if (typeof id === 'string' && id.includes('-') && id.length > 30) {
    console.log(`[getVehicleById] ID is UUID: ${id}`);
    
    // First, check if we have a mapping for this UUID
    const mappedNumericId = vehicleUuidMapping.get(id);
    if (mappedNumericId !== undefined) {
      console.log(`[getVehicleById] Found mapped numeric ID: ${mappedNumericId} for UUID: ${id}`);
      const vehicle = vehicles.find(v => v.id === mappedNumericId);
      if (vehicle) {
        console.log(`[getVehicleById] ✓ Found vehicle: ${vehicle.name}`);
        return vehicle;
      }
    }
    
    // Try to find by stored UUID property
    const vehicleWithUuid = vehicles.find((v: any) => (v as any)._uuid === id);
    if (vehicleWithUuid) {
      console.log(`[getVehicleById] ✓ Found vehicle by stored UUID: ${vehicleWithUuid.name}`);
      return vehicleWithUuid;
    }
    
    // Don't fetch from backend if UUID is not found in cache - it likely doesn't exist
    // or the mapping wasn't created properly. Instead, try to find by name or other means.
    console.warn(`[getVehicleById] UUID ${id} not found in cache. Skipping backend fetch to avoid 400 error.`);
    
    // Try to find by partial UUID match (last few characters) as fallback
    const uuidSuffix = id.split('-').pop();
    if (uuidSuffix) {
      const vehicleByUuidSuffix = vehicles.find((v: any) => {
        const storedUuid = (v as any)._uuid;
        return storedUuid && typeof storedUuid === 'string' && storedUuid.endsWith(uuidSuffix);
      });
      if (vehicleByUuidSuffix) {
        console.log(`[getVehicleById] ✓ Found vehicle by UUID suffix: ${vehicleByUuidSuffix.name}`);
        return vehicleByUuidSuffix;
      }
    }
  } else {
    // Numeric ID lookup
    const numericId = typeof id === 'number' ? id : parseInt(idStr, 10);
    
    if (!isNaN(numericId)) {
      // Try direct numeric ID match first (most common case)
      let vehicle = vehicles.find(v => v.id === numericId);
      if (vehicle) {
        console.log(`[getVehicleById] ✓ Found by numeric ID: ${vehicle.name} (ID: ${vehicle.id})`);
        return vehicle;
      }
      
      // If not found, try to find UUID from mapping
      // But don't recursively call getVehicleById with UUID to avoid backend 400 errors
      const uuid = vehicleIdMapping.get(numericId) || vehicleIdMapping.get(idStr);
      if (uuid && typeof uuid === 'string') {
        console.log(`[getVehicleById] Found UUID ${uuid} for numeric ID ${numericId}, searching in cache...`);
        
        // Try to find in cache using UUID mapping
        const mappedId = vehicleUuidMapping.get(uuid);
        if (mappedId !== undefined) {
          const vehicleByMappedId = vehicles.find(v => v.id === mappedId);
          if (vehicleByMappedId) {
            console.log(`[getVehicleById] ✓ Found vehicle via UUID mapping: ${vehicleByMappedId.name}`);
            return vehicleByMappedId;
          }
        }
        
        // Try to find by stored UUID property
        const vehicleWithUuid = vehicles.find((v: any) => (v as any)._uuid === uuid);
        if (vehicleWithUuid) {
          console.log(`[getVehicleById] ✓ Found vehicle by stored UUID: ${vehicleWithUuid.name}`);
          return vehicleWithUuid;
        }
        
        // Don't fetch from backend - UUID might not exist or backend might reject it
        console.warn(`[getVehicleById] UUID ${uuid} found in mapping but vehicle not in cache. Skipping backend fetch.`);
      }
    }
  }
  
  // Not found - log debug info
  console.error(`[getVehicleById] ✗ Vehicle not found with ID: ${idStr}`);
  console.error(`[getVehicleById] Available IDs (first 10):`, vehicles.slice(0, 10).map(v => ({ 
    id: v.id, 
    name: v.name,
    uuid: (v as any)._uuid 
  })));
  console.error(`[getVehicleById] UUID mappings (first 5):`, Array.from(vehicleUuidMapping.entries()).slice(0, 5));
  
  return null;
};

// Helper function to get vehicles by category
export const getVehiclesByCategory = async (category: string): Promise<Vehicle[]> => {
  try {
    // Try backend API - use API_BASE_URL to avoid double slashes
    const fullUrl = `${API_BASE_URL}/vehicles?page=1&limit=100`;
    console.log(`[Vehicles API] Fetching vehicles by category: ${fullUrl}`);
    
    const response = await fetch(fullUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    console.log(`[Vehicles API] Response status: ${response.status} for category ${category}`);
    
    if (response.ok) {
      const data = await response.json();
      const vehicles = Array.isArray(data) ? data : (data.vehicles || data.data || []);
      // Filter by category on client side since API doesn't support category filter
      return vehicles.filter((v: any) => v.category === category);
    }
  } catch (error) {
    console.warn('Backend API failed for category filter, falling back:', error);
  }
  
  // Fallback to loading all vehicles and filtering
  const vehicles = await loadVehicles();
  return vehicles.filter(v => v.category === category);
};

// Helper function to get vehicles by subcategory
export const getVehiclesBySubcategory = async (subcategory: string): Promise<Vehicle[]> => {
  const vehicles = await loadVehicles();
  return vehicles.filter(v => v.subcategory === subcategory);
};

// Get all unique categories
export const getCategories = async (): Promise<string[]> => {
  const vehicles = await loadVehicles();
  // Filter out empty/null categories and only return valid categories
  const categories = new Set(
    vehicles
      .map(v => v.category)
      .filter(cat => cat && typeof cat === 'string' && cat.trim() !== '')
  );
  const categoryArray = Array.from(categories);
  console.log('[getCategories] All categories from vehicles:', categoryArray);
  return categoryArray;
};

// Get all unique subcategories for a category
export const getSubcategories = async (category: string): Promise<string[]> => {
  const vehicles = await loadVehicles();
  const subcategories = new Set(
    vehicles
      .filter(v => v.category === category)
      .map(v => v.subcategory)
  );
  return Array.from(subcategories);
};

