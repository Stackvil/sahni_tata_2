import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, isDatabaseConnected, getPool } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use backend/data folder for JSON files (accessible on Vercel)
// Fallback to public folder for local development
const DATA_DIR = path.join(__dirname, '../data');

// Check if we're on Vercel (read-only filesystem)
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_URL;

// Map filename to database table names
const getTableName = (filename) => {
  const tableMap = {
    'products': 'products',
    'vehicles': 'vehicles',
    'masseyProducts': 'massey_products',
    'showrooms': 'showrooms',
    'fuelStations': 'fuel_stations',
    'about': 'about',
    'home': 'home_video',
    'users': 'users',
    'careers': 'careers',
    'applications': 'applications'
  };
  return tableMap[filename] || filename;
};

// Helper function to return proper empty structure based on filename
const getEmptyStructure = (filename) => {
  const emptyStructures = {
    'products': { products: [] },
    'vehicles': { vehicles: [] },
    'masseyProducts': { products: [] },
    'showrooms': { showrooms: [] },
    'fuelStations': { fuelStations: [] },
    'about': { about: [] },
    'home': { video: '', advertisementVideo: '' },
    'users': { users: [] },
    'careers': { jobs: [] },
    'applications': { applications: [] }
  };
  return emptyStructures[filename] || {};
};

export async function readData(filename) {
  // On Vercel or if database is available, try database first
  if (isVercel || (getPool() && isDatabaseConnected())) {
    try {
      const tableName = getTableName(filename);
      
      // Special handling for different data types
      if (filename === 'products') {
        const result = await query('SELECT * FROM products ORDER BY id');
        // If database has data, return it; otherwise fall through to JSON files
        if (result.rows && result.rows.length > 0) {
          return { products: result.rows };
        }
        // Database is empty, fall through to JSON files
        console.log(`[dataManager] Database empty for ${filename}, reading from JSON files`);
      } else if (filename === 'vehicles') {
        const result = await query('SELECT * FROM vehicles ORDER BY id');
        if (result.rows && result.rows.length > 0) {
          return { vehicles: result.rows };
        }
        console.log(`[dataManager] Database empty for ${filename}, reading from JSON files`);
      } else if (filename === 'masseyProducts') {
        const result = await query('SELECT * FROM massey_products ORDER BY id');
        if (result.rows && result.rows.length > 0) {
          return { products: result.rows };
        }
        console.log(`[dataManager] Database empty for ${filename}, reading from JSON files`);
      } else if (filename === 'showrooms') {
        const result = await query('SELECT * FROM showrooms ORDER BY id');
        if (result.rows && result.rows.length > 0) {
          return { showrooms: result.rows };
        }
        console.log(`[dataManager] Database empty for ${filename}, reading from JSON files`);
      } else if (filename === 'fuelStations') {
        const result = await query('SELECT * FROM fuel_stations ORDER BY id');
        if (result.rows && result.rows.length > 0) {
          return { fuelStations: result.rows };
        }
        console.log(`[dataManager] Database empty for ${filename}, reading from JSON files`);
      } else if (filename === 'about') {
        const result = await query('SELECT * FROM about ORDER BY id');
        if (result.rows && result.rows.length > 0) {
          return { about: result.rows };
        }
        console.log(`[dataManager] Database empty for ${filename}, reading from JSON files`);
      } else if (filename === 'home') {
        const result = await query('SELECT * FROM home_video ORDER BY id DESC LIMIT 1');
        if (result.rows.length > 0) {
          return { video: result.rows[0].video_url || '', advertisementVideo: result.rows[0].advertisement_video_url || '' };
        }
        console.log(`[dataManager] Database empty for ${filename}, reading from JSON files`);
      } else if (filename === 'users') {
        const result = await query('SELECT * FROM users ORDER BY id');
        if (result.rows && result.rows.length > 0) {
          return { users: result.rows };
        }
        console.log(`[dataManager] Database empty for ${filename}, reading from JSON files`);
      } else if (filename === 'careers') {
        const result = await query('SELECT * FROM careers ORDER BY id');
        if (result.rows && result.rows.length > 0) {
          return { jobs: result.rows };
        }
        console.log(`[dataManager] Database empty for ${filename}, reading from JSON files`);
      } else if (filename === 'applications') {
        const result = await query('SELECT * FROM applications ORDER BY id');
        if (result.rows && result.rows.length > 0) {
          return { applications: result.rows };
        }
        console.log(`[dataManager] Database empty for ${filename}, reading from JSON files`);
      }
      
      // If we get here, database query succeeded but returned no data
      // Fall through to JSON file reading below
    } catch (error) {
      console.error(`[dataManager] Database read error for ${filename}:`, error.message);
      // Database error - fall through to JSON file reading below
    }
  }
  
  // Read from JSON files (fallback when database is empty/unavailable, or primary for local)
  try {
    const filePath = path.join(DATA_DIR, `${filename}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(data);
    console.log(`[dataManager] Read ${filename} from JSON file: ${Object.keys(parsed).length} keys`);
    return parsed;
  } catch (error) {
    // If file doesn't exist, return empty structure with proper keys
    if (error.code === 'ENOENT') {
      console.warn(`[dataManager] JSON file not found for ${filename} at ${path.join(DATA_DIR, `${filename}.json`)}, returning empty structure`);
      return getEmptyStructure(filename);
    }
    console.error(`[dataManager] Error reading JSON file for ${filename}:`, error.message);
    return getEmptyStructure(filename);
  }
}

export async function writeData(filename, data) {
  // On Vercel, always use database (filesystem is read-only)
  if (isVercel) {
    try {
      const tableName = getTableName(filename);
      
      // Special handling for different data types
      if (filename === 'products' && data.products) {
        // This is a bulk write - we'd need to handle updates/inserts
        // For now, we'll handle individual product operations in routes
        throw new Error('Bulk product writes should use individual product routes');
      } else if (filename === 'vehicles' && data.vehicles) {
        throw new Error('Bulk vehicle writes should use individual vehicle routes');
      } else if (filename === 'home' && data.video !== undefined) {
        // Update home video
        await query(
          'INSERT INTO home_video (video_url, updated_at) VALUES ($1, NOW()) ON CONFLICT (id) DO UPDATE SET video_url = $1, updated_at = NOW()',
          [data.video]
        );
        return;
      } else if (filename === 'home' && data.advertisementVideo !== undefined) {
        // Update advertisement video
        await query(
          'INSERT INTO home_video (advertisement_video_url, updated_at) VALUES ($1, NOW()) ON CONFLICT (id) DO UPDATE SET advertisement_video_url = $1, updated_at = NOW()',
          [data.advertisementVideo]
        );
        return;
      }
      
      // For other types, routes should handle database writes directly
      throw new Error(`Database write for ${filename} should be handled in route handlers`);
    } catch (error) {
      console.error(`[dataManager] Database write error for ${filename}:`, error.message);
      throw error;
    }
  }
  
  // If database is available and connected, prefer database
  if (getPool() && isDatabaseConnected()) {
    // Try database first, but fall back to filesystem for compatibility
    try {
      // Database writes should be handled in routes for better control
      // This is a fallback for simple cases
      console.warn(`[dataManager] writeData called for ${filename} - consider using database directly in route`);
    } catch (error) {
      // Fall through to filesystem
    }
  }
  
  // Local development: use filesystem
  try {
    const filePath = path.join(DATA_DIR, `${filename}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    throw error;
  }
}

