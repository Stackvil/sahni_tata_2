import { query } from '../config/database.js';

// Products
export const productsDB = {
  getAll: async (page = 1, limit = 100) => {
    const offset = (page - 1) * limit;
    const result = await query(
      'SELECT * FROM products ORDER BY id DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    const countResult = await query('SELECT COUNT(*) FROM products');
    return {
      products: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
      total_pages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
    };
  },

  getById: async (id) => {
    const result = await query('SELECT * FROM products WHERE id = $1', [id]);
    return result.rows[0];
  },

  create: async (product) => {
    const result = await query(
      `INSERT INTO products (name, company_key, category_name, description, specs, image_url, catalog_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [product.name, product.company_key, product.category_name, product.description, product.specs, product.image_url, product.catalog_url || null]
    );
    return result.rows[0];
  },

  update: async (id, product) => {
    const result = await query(
      `UPDATE products SET name = $1, company_key = $2, category_name = $3, 
       description = $4, specs = $5, image_url = COALESCE($6, image_url), 
       catalog_url = COALESCE($7, catalog_url), updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 RETURNING *`,
      [product.name, product.company_key, product.category_name, product.description, product.specs, product.image_url, product.catalog_url, id]
    );
    return result.rows[0];
  },

  delete: async (id) => {
    await query('DELETE FROM products WHERE id = $1', [id]);
    return { success: true };
  },
};

// Vehicles
export const vehiclesDB = {
  getAll: async (page = 1, limit = 100) => {
    const offset = (page - 1) * limit;
    const result = await query(
      'SELECT * FROM vehicles ORDER BY id DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    const countResult = await query('SELECT COUNT(*) FROM vehicles');
    return {
      vehicles: result.rows.map(v => ({
        ...v,
        specs: typeof v.specs === 'string' ? JSON.parse(v.specs) : v.specs,
        features: Array.isArray(v.features) ? v.features : [],
        images: Array.isArray(v.images) ? v.images : [],
      })),
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
      total_pages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
    };
  },

  getById: async (id) => {
    const result = await query('SELECT * FROM vehicles WHERE id = $1', [id]);
    if (result.rows[0]) {
      const v = result.rows[0];
      return {
        ...v,
        specs: typeof v.specs === 'string' ? JSON.parse(v.specs) : v.specs,
        features: Array.isArray(v.features) ? v.features : [],
        images: Array.isArray(v.images) ? v.images : [],
      };
    }
    return null;
  },

  create: async (vehicle) => {
    const result = await query(
      `INSERT INTO vehicles (name, category, subcategory, description, size, popular, specs, features, images, catalog_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        vehicle.name, vehicle.category, vehicle.subcategory, vehicle.description,
        vehicle.size, vehicle.popular, JSON.stringify(vehicle.specs || {}),
        vehicle.features || [], vehicle.images || [], vehicle.catalog_url
      ]
    );
    return result.rows[0];
  },

  update: async (id, vehicle) => {
    const result = await query(
      `UPDATE vehicles SET name = $1, category = $2, subcategory = $3, description = $4,
       size = $5, popular = $6, specs = $7, features = $8, images = $9, 
       catalog_url = COALESCE($10, catalog_url), updated_at = CURRENT_TIMESTAMP
       WHERE id = $11 RETURNING *`,
      [
        vehicle.name, vehicle.category, vehicle.subcategory, vehicle.description,
        vehicle.size, vehicle.popular, JSON.stringify(vehicle.specs || {}),
        vehicle.features || [], vehicle.images || [], vehicle.catalog_url, id
      ]
    );
    return result.rows[0];
  },

  delete: async (id) => {
    await query('DELETE FROM vehicles WHERE id = $1', [id]);
    return { success: true };
  },
};

// Massey Products
export const masseyProductsDB = {
  getAll: async () => {
    const result = await query('SELECT * FROM massey_products ORDER BY id DESC');
    return {
      data: result.rows,
      total_count: result.rows.length,
      total_pages: 1,
      current_page: 1,
      per_page: result.rows.length,
    };
  },

  create: async (product) => {
    const result = await query(
      `INSERT INTO massey_products (name, category, description, specs, image_url, catalog_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [product.name, product.category, product.description, product.specs, product.image_url, product.catalog_url]
    );
    return result.rows[0];
  },
};

// Showrooms
export const showroomsDB = {
  getAll: async () => {
    const result = await query('SELECT * FROM showrooms ORDER BY is_main DESC, id');
    return result.rows;
  },

  create: async (showroom) => {
    const result = await query(
      `INSERT INTO showrooms (city, address, phone, email, is_main, image_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [showroom.city, showroom.address, showroom.phone, showroom.email, showroom.is_main, showroom.image_url]
    );
    return result.rows[0];
  },

  update: async (id, showroom) => {
    const result = await query(
      `UPDATE showrooms SET city = $1, address = $2, phone = $3, email = $4, 
       is_main = $5, image_url = COALESCE($6, image_url), updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 RETURNING *`,
      [showroom.city, showroom.address, showroom.phone, showroom.email, showroom.is_main, showroom.image_url, id]
    );
    return result.rows[0];
  },

  delete: async (id) => {
    await query('DELETE FROM showrooms WHERE id = $1', [id]);
    return { success: true };
  },
};

// About
export const aboutDB = {
  getAll: async () => {
    const result = await query('SELECT * FROM about ORDER BY id DESC');
    return result.rows.map(row => ({
      id: row.id.toString(),
      title: row.title,
      description: row.description,
      file: row.file_url,
    }));
  },

  create: async (entry) => {
    const result = await query(
      `INSERT INTO about (title, description, file_url) VALUES ($1, $2, $3) RETURNING *`,
      [entry.title, entry.description, entry.file_url]
    );
    return {
      id: result.rows[0].id.toString(),
      title: result.rows[0].title,
      description: result.rows[0].description,
      file: result.rows[0].file_url,
    };
  },

  update: async (id, entry) => {
    const result = await query(
      `UPDATE about SET title = $1, description = $2, file_url = COALESCE($3, file_url), updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING *`,
      [entry.title, entry.description, entry.file_url, id]
    );
    return {
      id: result.rows[0].id.toString(),
      title: result.rows[0].title,
      description: result.rows[0].description,
      file: result.rows[0].file_url,
    };
  },

  delete: async (id) => {
    await query('DELETE FROM about WHERE id = $1', [id]);
    return { success: true };
  },
};

// Users
export const usersDB = {
  findByEmail: async (email) => {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  },

  create: async (user) => {
    const result = await query(
      `INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *`,
      [user.username, user.email, user.password, user.role || 'user']
    );
    return result.rows[0];
  },

  updateResetToken: async (email, token, expiry) => {
    await query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3',
      [token, expiry, email]
    );
  },

  findByResetToken: async (token) => {
    const result = await query(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()',
      [token]
    );
    return result.rows[0];
  },

  updatePassword: async (userId, password) => {
    await query(
      'UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2',
      [password, userId]
    );
  },
};

// Home Video
export const homeVideoDB = {
  get: async () => {
    const result = await query('SELECT video_url FROM home_video ORDER BY updated_at DESC LIMIT 1');
    return result.rows[0]?.video_url || '';
  },

  set: async (videoUrl) => {
    await query('DELETE FROM home_video');
    await query('INSERT INTO home_video (video_url) VALUES ($1)', [videoUrl]);
    return videoUrl;
  },
};

// Fuel Stations
export const fuelStationsDB = {
  getAll: async () => {
    const result = await query('SELECT * FROM fuel_stations ORDER BY id DESC');
    return result.rows;
  },

  getById: async (id) => {
    const result = await query('SELECT * FROM fuel_stations WHERE id = $1', [id]);
    return result.rows[0];
  },

  create: async (station) => {
    const result = await query(
      `INSERT INTO fuel_stations (name, location, address, phone, image, map_link, features, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        station.name,
        station.location || null,
        station.address || null,
        station.phone || null,
        station.image || null,
        station.mapLink || station.map_link || null,
        station.features ? JSON.stringify(station.features) : null,
        station.latitude || null,
        station.longitude || null
      ]
    );
    return result.rows[0];
  },

  update: async (id, station) => {
    const result = await query(
      `UPDATE fuel_stations SET name = $1, location = $2, address = $3, phone = $4, 
       image = $5, map_link = $6, features = $7, latitude = $8, longitude = $9 WHERE id = $10 RETURNING *`,
      [
        station.name,
        station.location || null,
        station.address || null,
        station.phone || null,
        station.image || null,
        station.mapLink || station.map_link || null,
        station.features ? JSON.stringify(station.features) : null,
        station.latitude || null,
        station.longitude || null,
        id
      ]
    );
    return result.rows[0];
  },

  delete: async (id) => {
    await query('DELETE FROM fuel_stations WHERE id = $1', [id]);
    return { success: true };
  },
};

// Careers
export const careersDB = {
  getAll: async () => {
    const result = await query('SELECT * FROM careers ORDER BY created_at DESC');
    return result.rows.map(row => ({
      id: row.id.toString(),
      title: row.title,
      department: row.department,
      location: row.location,
      description: row.description,
      requirements: typeof row.requirements === 'string' ? JSON.parse(row.requirements || '[]') : (Array.isArray(row.requirements) ? row.requirements : []),
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  },

  getById: async (id) => {
    const result = await query('SELECT * FROM careers WHERE id = $1', [id]);
    if (result.rows[0]) {
      const row = result.rows[0];
      return {
        id: row.id.toString(),
        title: row.title,
        department: row.department,
        location: row.location,
        description: row.description,
        requirements: typeof row.requirements === 'string' ? JSON.parse(row.requirements || '[]') : (Array.isArray(row.requirements) ? row.requirements : []),
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    }
    return null;
  },

  create: async (job) => {
    const result = await query(
      `INSERT INTO careers (title, department, location, description, requirements, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        job.title,
        job.department,
        job.location,
        job.description,
        Array.isArray(job.requirements) ? JSON.stringify(job.requirements) : (job.requirements || '[]'),
        job.status || 'active'
      ]
    );
    const row = result.rows[0];
    return {
      id: row.id.toString(),
      title: row.title,
      department: row.department,
      location: row.location,
      description: row.description,
      requirements: typeof row.requirements === 'string' ? JSON.parse(row.requirements || '[]') : (Array.isArray(row.requirements) ? row.requirements : []),
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  },

  update: async (id, job) => {
    const result = await query(
      `UPDATE careers SET title = $1, department = $2, location = $3, 
       description = $4, requirements = $5, status = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 RETURNING *`,
      [
        job.title,
        job.department,
        job.location,
        job.description,
        Array.isArray(job.requirements) ? JSON.stringify(job.requirements) : (job.requirements || '[]'),
        job.status,
        id
      ]
    );
    if (result.rows[0]) {
      const row = result.rows[0];
      return {
        id: row.id.toString(),
        title: row.title,
        department: row.department,
        location: row.location,
        description: row.description,
        requirements: typeof row.requirements === 'string' ? JSON.parse(row.requirements || '[]') : (Array.isArray(row.requirements) ? row.requirements : []),
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    }
    return null;
  },

  delete: async (id) => {
    await query('DELETE FROM careers WHERE id = $1', [id]);
    return { success: true };
  },
};

// Awards
export const awardsDB = {
  getAll: async () => {
    const result = await query('SELECT * FROM awards ORDER BY brand, display_order, year DESC, id DESC');
    return result.rows.map(row => ({
      id: row.id.toString(),
      brand: row.brand,
      logo: row.logo_url,
      award: row.award_text,
      year: row.year,
      display_order: row.display_order,
    }));
  },

  getByBrand: async (brand) => {
    const result = await query(
      'SELECT * FROM awards WHERE brand = $1 ORDER BY display_order, year DESC, id DESC',
      [brand]
    );
    return result.rows.map(row => ({
      id: row.id.toString(),
      brand: row.brand,
      logo: row.logo_url,
      award: row.award_text,
      year: row.year,
      display_order: row.display_order,
    }));
  },

  getById: async (id) => {
    const result = await query('SELECT * FROM awards WHERE id = $1', [id]);
    if (result.rows[0]) {
      const row = result.rows[0];
      return {
        id: row.id.toString(),
        brand: row.brand,
        logo: row.logo_url,
        award: row.award_text,
        year: row.year,
        display_order: row.display_order,
      };
    }
    return null;
  },

  create: async (award) => {
    const result = await query(
      `INSERT INTO awards (brand, logo_url, award_text, year, display_order)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        award.brand,
        award.logo_url || null,
        award.award_text || award.award,
        award.year || null,
        award.display_order || 0
      ]
    );
    const row = result.rows[0];
    return {
      id: row.id.toString(),
      brand: row.brand,
      logo: row.logo_url,
      award: row.award_text,
      year: row.year,
      display_order: row.display_order,
    };
  },

  update: async (id, award) => {
    const result = await query(
      `UPDATE awards SET brand = $1, logo_url = COALESCE($2, logo_url), 
       award_text = $3, year = $4, display_order = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING *`,
      [
        award.brand,
        award.logo_url,
        award.award_text || award.award,
        award.year || null,
        award.display_order || 0,
        id
      ]
    );
    if (result.rows[0]) {
      const row = result.rows[0];
      return {
        id: row.id.toString(),
        brand: row.brand,
        logo: row.logo_url,
        award: row.award_text,
        year: row.year,
        display_order: row.display_order,
      };
    }
    return null;
  },

  delete: async (id) => {
    await query('DELETE FROM awards WHERE id = $1', [id]);
    return { success: true };
  },
};

export default { productsDB, vehiclesDB, masseyProductsDB, showroomsDB, aboutDB, usersDB, homeVideoDB, fuelStationsDB, careersDB, awardsDB };

