import pg from 'pg';
const { Pool } = pg;

let pool = null;
let isDatabaseAvailable = false;

// Parse PostgreSQL connection string (postgres://user:password@host:port/database)
const parseConnectionString = (connectionString) => {
  if (!connectionString) return null;
  
  try {
    // Remove prisma+ prefix if present (for PRISMA_DATABASE_URL)
    const cleanUrl = connectionString.replace(/^prisma\+/, '');
    
    const url = new URL(cleanUrl);
    return {
      host: url.hostname,
      port: parseInt(url.port || '5432'),
      database: url.pathname.slice(1), // Remove leading '/'
      user: url.username,
      password: url.password,
      ssl: url.searchParams.get('sslmode') === 'require' ? { rejectUnauthorized: false } : false,
    };
  } catch (error) {
    console.error('Failed to parse connection string:', error.message);
    return null;
  }
};

// Get database configuration from environment variables
const getDatabaseConfig = () => {
  // Priority: DATABASE_URL > POSTGRES_URL > PRISMA_DATABASE_URL > AWS_RDS_* > defaults
  let config = null;
  
  if (process.env.DATABASE_URL) {
    config = parseConnectionString(process.env.DATABASE_URL);
  } else if (process.env.POSTGRES_URL) {
    config = parseConnectionString(process.env.POSTGRES_URL);
  } else if (process.env.PRISMA_DATABASE_URL && !process.env.PRISMA_DATABASE_URL.startsWith('prisma+')) {
    // If PRISMA_DATABASE_URL is a direct postgres:// URL (not prisma+), use it
    // Some setups use PRISMA_DATABASE_URL for direct connections
    config = parseConnectionString(process.env.PRISMA_DATABASE_URL);
  }
  
  // Fall back to AWS_RDS_* variables if connection string not available
  if (!config) {
    if (process.env.AWS_RDS_HOST || process.env.NODE_ENV !== 'production') {
      config = {
        host: process.env.AWS_RDS_HOST || 'localhost',
        port: parseInt(process.env.AWS_RDS_PORT || '5432'),
        database: process.env.AWS_RDS_DBNAME || 'postgres',
        user: process.env.AWS_RDS_USERNAME || 'postgres',
        password: process.env.AWS_RDS_PASSWORD || '',
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      };
    }
  }
  
  return config;
};

// Check if database configuration is available
const hasDatabaseConfig = () => {
  const config = getDatabaseConfig();
  return config !== null;
};

export const getPool = () => {
  if (!hasDatabaseConfig()) {
    return null;
  }

  if (!pool) {
    try {
      const config = getDatabaseConfig();
      if (!config) {
        return null;
      }
      
      pool = new Pool({
        ...config,
        max: 5, // Reduced for serverless (Vercel)
        idleTimeoutMillis: 30000, // 30 seconds
        connectionTimeoutMillis: 30000, // 30 seconds for migrations
        keepAlive: true,
        keepAliveInitialDelayMillis: 1000,
        statement_timeout: 30000, // 30 seconds for migrations
      });

      pool.on('error', (err) => {
        // Log error but don't mark database as unavailable
        // Connection pool will handle reconnections automatically
        console.warn('Database pool error (connection will be retried):', err.message);
        // Don't set isDatabaseAvailable = false here - let the pool handle reconnection
      });
    } catch (error) {
      console.error('Failed to create database pool:', error.message);
      return null;
    }
  }

  return pool;
};

export const isDatabaseConnected = () => {
  // Don't trust the flag if pool doesn't exist
  if (!pool) {
    return false;
  }
  // If pool exists, assume it's available (pool handles reconnection)
  // Only check the flag if we explicitly set it to false during initialization
  return isDatabaseAvailable !== false;
};

// Track if initialization has been attempted
let initAttempted = false;
let initInProgress = false;

export const query = async (text, params) => {
  const pool = getPool();
  if (!pool) {
    throw new Error('Database pool is not available. Please check your database configuration.');
  }
  
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development' && process.env.DEBUG_DB === 'true') {
      console.log('Executed query', { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    // If error is "relation does not exist" (table doesn't exist), try to initialize database
    // This handles the case where tables haven't been created yet on Vercel/serverless
    if (error.code === '42P01' && !initAttempted && !initInProgress) {
      initAttempted = true;
      initInProgress = true;
      try {
        console.log('[Database] Table not found (code: 42P01), attempting to initialize database...');
        const initResult = await initDatabase();
        if (initResult.success) {
          console.log('[Database] Database initialized successfully, retrying query...');
          // Retry the original query after initialization
          const retryRes = await pool.query(text, params);
          initInProgress = false;
          return retryRes;
        } else {
          console.error('[Database] Initialization failed:', initResult.message);
          initInProgress = false;
          throw error; // Throw original error
        }
      } catch (initError) {
        initInProgress = false;
        console.error('[Database] Initialization error:', initError.message);
        throw error; // Throw original error (table still doesn't exist)
      }
    }
    
    // Only log full error in debug mode, otherwise just the message
    if (process.env.DEBUG_DB === 'true') {
      console.error('Database query error', { text, error: error.message });
    }
    throw error;
  }
};

export const initDatabase = async () => {
  // Check if database config is available
  if (!hasDatabaseConfig()) {
    console.log('⚠️  Database configuration not found. Server will run without database features.');
    console.log('   To enable database, set DATABASE_URL, POSTGRES_URL, or AWS_RDS_* environment variables.');
    return { success: false, message: 'Database configuration not available' };
  }

  const pool = getPool();
  if (!pool) {
    console.log('⚠️  Could not create database connection pool. Server will run without database features.');
    return { success: false, message: 'Database pool creation failed' };
  }

  try {
    // Test connection first
    await pool.query('SELECT NOW()');
    isDatabaseAvailable = true;
    
    // Create tables
    await createTables();
    console.log('✅ Database initialized successfully');
    return { success: true, message: 'Database initialized successfully' };
  } catch (error) {
    isDatabaseAvailable = false;
    
    // Check if it's a connection error
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.log('⚠️  Database connection refused. PostgreSQL may not be running.');
      console.log('   Server will continue without database features.');
      console.log('   To enable database:');
      console.log('   1. Install and start PostgreSQL');
      console.log('   2. Set database credentials in .env file');
      console.log('   3. Restart the server');
      return { success: false, message: 'Database connection refused', error: error.code };
    }
    
    // Other database errors
    console.error('⚠️  Database initialization error:', error.message);
    console.log('   Server will continue without database features.');
    return { success: false, message: error.message, error: error.code };
  }
};

const createTables = async () => {
  const tables = [
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'user',
      reset_token VARCHAR(255),
      reset_token_expiry TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Products table
    `CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      company_key VARCHAR(100),
      category_name VARCHAR(100),
      description TEXT,
      specs TEXT,
      keywords TEXT,
      image_url TEXT,
      catalog_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Vehicles table
    `CREATE TABLE IF NOT EXISTS vehicles (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      subcategory VARCHAR(100),
      description TEXT,
      size VARCHAR(50),
      popular BOOLEAN DEFAULT false,
      specs JSONB,
      features TEXT[],
      images TEXT[],
      catalog_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Massey Products table
    `CREATE TABLE IF NOT EXISTS massey_products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      description TEXT,
      specs TEXT,
      image_url TEXT,
      catalog_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Showrooms table
    `CREATE TABLE IF NOT EXISTS showrooms (
      id SERIAL PRIMARY KEY,
      city VARCHAR(255) NOT NULL,
      address TEXT NOT NULL,
      phone VARCHAR(50),
      sales_phone VARCHAR(50),
      service_phone VARCHAR(50),
      email VARCHAR(255),
      is_main BOOLEAN DEFAULT false,
      image_url TEXT,
      category VARCHAR(50) DEFAULT 'tata',
      images TEXT[],
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Fuel Stations table
    `CREATE TABLE IF NOT EXISTS fuel_stations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      location VARCHAR(255),
      address TEXT,
      phone VARCHAR(50),
      image TEXT,
      map_link TEXT,
      features JSONB,
      latitude DECIMAL(10, 8),
      longitude DECIMAL(11, 8),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // About table
    `CREATE TABLE IF NOT EXISTS about (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      file_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Home Video table
    `CREATE TABLE IF NOT EXISTS home_video (
      id SERIAL PRIMARY KEY,
      video_url TEXT,
      advertisement_video_url TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Careers table
    `CREATE TABLE IF NOT EXISTS careers (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      department VARCHAR(100),
      location VARCHAR(255),
      description TEXT,
      requirements TEXT,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Applications table
    `CREATE TABLE IF NOT EXISTS applications (
      id SERIAL PRIMARY KEY,
      job_id INTEGER REFERENCES careers(id),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      resume_url TEXT,
      cover_letter TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Awards table
    `CREATE TABLE IF NOT EXISTS awards (
      id SERIAL PRIMARY KEY,
      brand VARCHAR(255) NOT NULL,
      logo_url TEXT,
      award_text TEXT NOT NULL,
      year VARCHAR(10),
      display_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
  ];

  for (const tableSQL of tables) {
    await query(tableSQL);
  }
  
  // Add catalog_url column to products table if it doesn't exist (migration)
  try {
    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'products' AND column_name = 'catalog_url'
        ) THEN
          ALTER TABLE products ADD COLUMN catalog_url TEXT;
        END IF;
      END $$;
    `);
  } catch (error) {
    // Column might already exist, ignore error
    console.log('Note: catalog_url column migration:', error.message);
  }

  // Add keywords column to products table if it doesn't exist (migration)
  try {
    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'products' AND column_name = 'keywords'
        ) THEN
          ALTER TABLE products ADD COLUMN keywords TEXT;
        END IF;
      END $$;
    `);
  } catch (error) {
    // Column might already exist, ignore error
    console.log('Note: keywords column migration:', error.message);
  }

  // Add category and images columns to showrooms table if they don't exist (migration)
  try {
    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'showrooms' AND column_name = 'category'
        ) THEN
          ALTER TABLE showrooms ADD COLUMN category VARCHAR(50) DEFAULT 'tata';
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'showrooms' AND column_name = 'images'
        ) THEN
          ALTER TABLE showrooms ADD COLUMN images TEXT[];
        END IF;
      END $$;
    `);
  } catch (error) {
    // Columns might already exist, ignore error
    console.log('Note: showrooms category/images columns migration:', error.message);
  }
};

export default { getPool, query, initDatabase, isDatabaseConnected, hasDatabaseConfig };

