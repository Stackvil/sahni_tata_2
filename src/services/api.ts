// API service for backend communication
// Default: Local development (http://localhost:3001)
// Override: Set VITE_API_URL environment variable (e.g., for production: https://sahni-tata-2.vercel.app)
const getApiBaseEndpoint = () => {
  // If VITE_API_URL is explicitly set, use it (allows production override)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Check if we're in production (Vercel deployment)
  // If running on Vercel or accessing from production domain, use Vercel backend
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If accessing from Vercel domain or production, use Vercel backend
    if (hostname.includes('vercel.app') || hostname.includes('sahni-tata')) {
      return 'https://sahni-tata-2.vercel.app';
    }
  }
  
  // Default: Use localhost for development
  return 'http://localhost:3001';
};

export const API_BASE_ENDPOINT = getApiBaseEndpoint();

// Log the API endpoint being used (for debugging)
console.log('[API Config] API Base Endpoint:', API_BASE_ENDPOINT);
console.log('[API Config] VITE_API_URL env:', import.meta.env.VITE_API_URL);

const getApiBaseUrl = () => {
  // Remove trailing slash if present
  const base = API_BASE_ENDPOINT.endsWith('/') ? API_BASE_ENDPOINT.slice(0, -1) : API_BASE_ENDPOINT;
  
  // API routes are under /api path
  // So /auth/login is at /api/auth/login
  // If your API doesn't use /api prefix, set environment variable: VITE_API_PATH=""
  const apiPath = import.meta.env.VITE_API_PATH;
  
  if (apiPath !== undefined) {
    // Use custom API path from environment variable (empty string = no prefix)
    if (apiPath === '') {
      return base;
    }
    return `${base}${apiPath}`;
  }
  
  // Default: Use /api prefix (e.g., /prod/api/auth/login, /prod/api/products/)
  return `${base}/api`;
};
export const API_BASE_URL = getApiBaseUrl();

// Log the full API base URL being used
console.log('[API Config] API Base URL:', API_BASE_URL);

// CloudFront domain for S3 files
const CLOUDFRONT_DOMAIN = 'https://dh0blbvvlqdiy.cloudfront.net';

// Helper function to normalize image URLs from backend
// Converts S3 URLs to CloudFront URLs and handles relative paths
export const normalizeImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) return '';
  
  // If already a full URL (http/https)
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    // Convert S3 URLs to CloudFront URLs
    if (imagePath.includes('s3.amazonaws.com') || 
        imagePath.includes('tata-storagebucket.s3') ||
        imagePath.includes('.s3.ap-south-1.amazonaws.com')) {
      // Extract the path/key from S3 URL
      let s3Key = '';
      if (imagePath.includes('tata-storagebucket.s3')) {
        // Format: https://tata-storagebucket.s3.ap-south-1.amazonaws.com/path/to/file
        const urlParts = imagePath.split('tata-storagebucket.s3.ap-south-1.amazonaws.com/');
        s3Key = urlParts.length > 1 ? urlParts[1] : '';
      } else if (imagePath.includes('s3.amazonaws.com')) {
        // Format: https://bucket-name.s3.amazonaws.com/path/to/file
        const urlParts = imagePath.split('.s3.amazonaws.com/');
        s3Key = urlParts.length > 1 ? urlParts[1] : '';
      } else {
        // Try to extract from any S3 URL pattern
        const match = imagePath.match(/\.s3[^/]*\/(.+)$/);
        s3Key = match ? match[1] : '';
      }
      
      // Convert to CloudFront URL
      if (s3Key) {
        return `${CLOUDFRONT_DOMAIN}/${s3Key}`;
      }
    }
    
    // If it's already a CloudFront URL, return as-is
    if (imagePath.includes('cloudfront.net')) {
      return imagePath;
    }
    
    // Other full URLs (non-S3), return as-is
    return imagePath;
  }
  
  // If path starts with /, check if it's an S3 path pattern
  if (imagePath.startsWith('/')) {
    // If it looks like an S3 key (starts with images/, videos/, catalouges/, vehicles/)
    if (imagePath.match(/^\/(images|videos|catalouges|vehicles|resumes)\//)) {
      // Remove leading slash and use CloudFront
      return `${CLOUDFRONT_DOMAIN}${imagePath}`;
    }
    // Otherwise, serve from backend root
    return `${API_BASE_ENDPOINT}${imagePath}`;
  }
  
  // For paths without leading slash, check if it's an S3 key pattern
  if (imagePath.match(/^(images|videos|catalouges|vehicles|resumes)\//)) {
    // It's an S3 key, use CloudFront
    return `${CLOUDFRONT_DOMAIN}/${imagePath}`;
  }
  
  // For other relative paths, prepend API endpoint
  return `${API_BASE_ENDPOINT}/${imagePath}`;
};

// Token management
export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('authToken', token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem('authToken');
};

// API request helper
const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAuthToken();
  const isFormData = options.body instanceof FormData;
  const hasBody = options.body !== undefined && options.body !== null;
  
  const headers: HeadersInit = {
    'Accept': 'application/json',
  };
  
  // For FormData, don't set Content-Type - browser will set it automatically with boundary
  // For other requests with body, set Content-Type to application/json
  // If no body, don't set Content-Type
  if (hasBody && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  
  // Merge any additional headers from options (but exclude Content-Type for FormData)
  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      if (isFormData && key.toLowerCase() === 'content-type') {
        // Don't override Content-Type for FormData - browser needs to set it
        return;
      }
      headers[key] = value;
    });
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fullUrl = `${API_BASE_URL}${endpoint}`;
  console.log(`[API Request] ${options.method || 'GET'} ${fullUrl}`, {
    hasToken: !!token,
    headers: Object.keys(headers),
    hasBody: hasBody,
    bodyType: isFormData ? 'FormData' : (hasBody ? 'JSON/Other' : 'None'),
    bodySize: isFormData && options.body instanceof FormData ? 'FormData (size unknown)' : 
              (hasBody && typeof options.body === 'string' ? `${options.body.length} chars` : 'N/A')
  });

  try {
    // Log request details for debugging
    console.log(`[API Request Details]`, {
      method: options.method || 'GET',
      url: fullUrl,
      hasBody: hasBody,
      isFormData: isFormData,
      headers: Object.keys(headers),
      hasAuth: !!token
    });

    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    console.log(`[API Response] ${response.status} ${response.statusText} for ${endpoint}`);

    // Log response status for debugging
    if (!response.ok) {
      // Clone response to avoid "body stream already read" error
      const clonedResponse = response.clone();
      try {
        const errorText = await clonedResponse.text();
        // Check if it's a database connection error
        const isDatabaseError = errorText.includes('could not translate host name') || 
            errorText.includes('OperationalError') ||
            errorText.includes('psycopg2') ||
            errorText.includes('database');
        
        // Check if it's an expected 404 (e.g., no video found)
        const isExpected404 = response.status === 404 && (
          endpoint.includes('/home/video/') && errorText.includes('No video found')
        );
        
        if (isDatabaseError) {
          // Log as warning instead of error for database issues (they're backend problems)
          console.warn(`[API Warning] Database connection issue for ${endpoint} - handled gracefully`);
        } else if (isExpected404) {
          // Don't log expected 404s as errors (e.g., no video found is normal)
          console.log(`[API Info] ${endpoint} - No video found (expected)`);
        } else {
          console.error(`[API Error] ${response.status} ${response.statusText}`, endpoint);
          console.error('[API Error Details]', errorText);
        }
      } catch (e) {
        console.error('[API Error] Could not read error response');
      }
      // Don't throw here - let the caller handle it based on response.ok
    }

    return response;
  } catch (error: any) {
    // Enhanced error logging for network errors
    console.error(`[API Network Error] Failed to fetch ${fullUrl}:`, {
      error: error,
      errorType: error?.constructor?.name,
      errorMessage: error?.message,
      errorStack: error?.stack,
      method: options.method || 'GET',
      hasBody: hasBody,
      isFormData: isFormData,
      endpoint: endpoint
    });
    
    // Provide more helpful error messages
    if (error?.message?.includes('Failed to fetch')) {
      // This could be CORS, network, or server issue
      const errorMsg = `Network error: Unable to connect to ${API_BASE_URL}. Please check:
1. Your internet connection
2. The API server is running
3. CORS is properly configured on the server
4. The endpoint exists: ${endpoint}`;
      throw new Error(errorMsg);
    }
    
    throw error;
  }
};

// Authentication APIs
export const authAPI = {
  signup: async (username: string, email: string, password: string) => {
    const params = new URLSearchParams({
      username,
      email,
      password,
    });
    const response = await apiRequest(`/auth/signup?${params.toString()}`, {
      method: 'POST',
      // No body for query parameter requests
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const detail = Array.isArray((errorData as any)?.detail)
        ? (errorData as any).detail.map((item: any) => item?.msg).filter(Boolean).join(', ')
        : (errorData as any)?.detail || 'Signup failed';
      throw new Error(detail);
    }

    return response.json();
  },

  login: async (email: string, password: string) => {
    const params = new URLSearchParams({
      email,
      password,
    });
    const response = await apiRequest(`/auth/login?${params.toString()}`, {
      method: 'POST',
      // No body for query parameter requests
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const detail = Array.isArray((errorData as any)?.detail)
        ? (errorData as any).detail.map((item: any) => item?.msg).filter(Boolean).join(', ')
        : (errorData as any)?.detail || 'Login failed';
      throw new Error(detail);
    }

    const data = await response.json();
    // Backend returns: { "access_token": "...", "token_type": "bearer" }
    if (data.access_token) {
      setAuthToken(data.access_token);
      console.log('[Auth] Token stored successfully');
    } else if (data.token) {
      // Fallback for different response format
      setAuthToken(data.token);
      console.log('[Auth] Token stored successfully (fallback)');
    } else {
      console.warn('[Auth] No token found in response:', data);
    }
    return data;
  },

  logout: () => {
    removeAuthToken();
    localStorage.removeItem('adminAuthenticated');
    localStorage.removeItem('adminLoginTime');
    localStorage.removeItem('adminSessionExpiry');
    console.log('[Auth] Logged out successfully');
  },

  forgotPassword: async (email: string) => {
    const params = new URLSearchParams({
      email,
    });
    const response = await apiRequest(`/auth/forgot-password?${params.toString()}`, {
      method: 'POST',
      // No body for query parameter requests
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const detail = Array.isArray((errorData as any)?.detail)
        ? (errorData as any).detail.map((item: any) => item?.msg).filter(Boolean).join(', ')
        : (errorData as any)?.detail || 'Failed to send reset email';
      throw new Error(detail);
    }

    return response.json();
  },

  resetPassword: async (token: string, newPassword: string) => {
    const params = new URLSearchParams({
      token,
      new_password: newPassword,
    });
    const response = await apiRequest(`/auth/reset-password?${params.toString()}`, {
      method: 'POST',
      // No body for query parameter requests
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const detail = Array.isArray((errorData as any)?.detail)
        ? (errorData as any).detail.map((item: any) => item?.msg).filter(Boolean).join(', ')
        : (errorData as any)?.detail || 'Failed to reset password';
      throw new Error(detail);
    }

    return response.json();
  },
};

// Products APIs
export const productsAPI = {
  getAll: async (page: number = 1, limit: number = 100, search: string = '') => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    // Only add search parameter if it's not empty
    if (search && search.trim() !== '') {
      params.append('search', search.trim());
    }
    
    try {
      const response = await apiRequest(`/products/?${params}`);
      
      if (!response.ok) {
        // If backend fails, throw an error that can be caught and handled by fallback
        let errorText = 'Backend error';
        try {
          errorText = await response.text();
        } catch (e) {
          // If we can't read the error text, use default message
        }
        
        // Provide more helpful error messages based on status code
        if (response.status === 500) {
          throw new Error(`Backend server error (500). Please check backend logs or contact administrator.`);
        } else if (response.status === 404) {
          throw new Error(`Products endpoint not found (404). Please check API configuration.`);
        } else if (response.status === 401 || response.status === 403) {
          throw new Error(`Authentication required (${response.status}).`);
        } else {
          throw new Error(`Backend API error: ${response.status} - ${errorText}`);
        }
      }
      
      // Backend returns: { page, limit, total, total_pages, products: [...] }
      const data = await response.json();
      
      // Return the data as-is (components can access data.products, data.page, etc.)
      return data;
    } catch (error: any) {
      // Re-throw with more context
      if (error.message.includes('Backend') || error.message.includes('Empty response') || error.message.includes('Invalid JSON')) {
        throw error;
      }
      // Network errors or other issues
      throw new Error(`Failed to fetch products: ${error.message}`);
    }
  },

  getById: async (productId: string) => {
    const response = await apiRequest(`/products/${productId}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Product not found');
      }
      const errorData = await response.json().catch(() => ({ detail: `Failed to fetch product: ${response.status}` }));
      throw new Error(errorData.detail || `Failed to fetch product: ${response.status}`);
    }
    return response.json();
  },

  create: async (productData: {
    name: string;
    company_key: string;
    category_name: string;
    description: string; // Required by backend
    specs: string; // Required by backend
    image: string | File; // Required by backend
  }) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }

    // Validate required fields
    if (!productData.name || !productData.company_key || !productData.category_name || 
        !productData.description || !productData.specs || !productData.image) {
      throw new Error('All fields are required: name, company_key, category_name, description, specs, image');
    }

    // Use FormData for multipart/form-data - ALL fields go in FormData
    const formData = new FormData();
    formData.append('name', productData.name);
    formData.append('company_key', productData.company_key);
    formData.append('category_name', productData.category_name);
    formData.append('description', productData.description);
    formData.append('specs', productData.specs);
    
    // Handle image upload - required field
    if (productData.image instanceof File) {
      // File object - append directly with proper filename
      console.log('[ProductsAPI] Appending image file to FormData:', {
        name: productData.image.name,
        size: productData.image.size,
        type: productData.image.type,
        isFile: productData.image instanceof File,
        lastModified: new Date(productData.image.lastModified).toISOString()
      });
      
      // Verify file has content
      if (productData.image.size === 0) {
        throw new Error('Selected image file is empty. Please select a valid image file.');
      }
      
      // File size validation - prevent timeout errors
      // Large files can cause issues, recommended size is under 2 MB
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
      const RECOMMENDED_FILE_SIZE = 2 * 1024 * 1024; // 2MB recommended
      
      if (productData.image.size > MAX_FILE_SIZE) {
        const fileSizeMB = (productData.image.size / (1024 * 1024)).toFixed(2);
        throw new Error(
          `Image file is too large (${fileSizeMB} MB). Maximum size is 5 MB. ` +
          `Please compress or resize the image before uploading. ` +
          `Recommended size is under 2 MB for faster uploads.`
        );
      }
      
      if (productData.image.size > RECOMMENDED_FILE_SIZE) {
        const fileSizeMB = (productData.image.size / (1024 * 1024)).toFixed(2);
        console.warn(`[ProductsAPI] Large file detected (${fileSizeMB} MB). Upload may take longer. Consider compressing the image.`);
      }
      
      // Append file to FormData with explicit filename
      formData.append('image', productData.image, productData.image.name);
      
      // Verify it was appended (FormData doesn't have a direct way to check, but we can log)
      console.log('[ProductsAPI] Image file appended to FormData successfully');
    } else if (typeof productData.image === 'string') {
      // String URL - try to fetch and convert to blob
      console.log('[ProductsAPI] Image is a string URL, attempting to fetch:', productData.image);
      try {
        const imageResponse = await fetch(productData.image);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image: ${imageResponse.status}`);
        }
        const blob = await imageResponse.blob();
        const fileName = productData.image.split('/').pop() || 'image.jpg';
        console.log('[ProductsAPI] Converted URL to blob, appending:', fileName);
        formData.append('image', blob, fileName);
      } catch (e) {
        console.error('[ProductsAPI] Could not convert image URL to blob:', e);
        // Don't append if conversion fails - backend expects a file
        throw new Error('Failed to process image URL. Please upload a file directly.');
      }
    } else {
      throw new Error('Image is required and must be a File object or valid image URL');
    }
    
    // Debug: Log FormData contents
    // Note: FormData.entries() is not available in all browsers, so we log what we know
    console.log('[ProductsAPI] FormData prepared with all required fields:', {
      name: productData.name,
      company_key: productData.company_key,
      category_name: productData.category_name,
      hasDescription: !!productData.description,
      hasSpecs: !!productData.specs,
      hasImage: !!productData.image,
      imageType: productData.image instanceof File ? 'File' : typeof productData.image,
      imageDetails: productData.image instanceof File ? {
        name: productData.image.name,
        size: productData.image.size,
        type: productData.image.type
      } : 'Not a File'
    });
    
    // Try to log FormData entries if available (for debugging)
    if (typeof FormData.prototype.entries !== 'undefined') {
      try {
        const entries: string[] = [];
        for (const [key, value] of formData.entries()) {
          if (value instanceof File) {
            entries.push(`${key}: [File: ${value.name}, ${value.size} bytes, ${value.type}]`);
          } else {
            entries.push(`${key}: ${String(value).substring(0, 50)}`);
          }
        }
        console.log('[ProductsAPI] FormData entries:', entries);
      } catch (e) {
        console.log('[ProductsAPI] Could not iterate FormData entries:', e);
      }
    }

    const response = await apiRequest('/products/', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      let errorMessage = 'Failed to create product';
      
      // Handle 504 Gateway Timeout specifically
      if (response.status === 504) {
        errorMessage = 
          'Gateway Timeout (504): The upload took too long and timed out. This usually happens when:\n\n' +
          '1. The image file is too large (try compressing/resizing it to under 2 MB)\n' +
          '2. The network connection is slow\n' +
          '3. The server is processing the file slowly\n\n' +
          'Try again with a smaller image file. Recommended image size: under 2 MB.';
        throw new Error(errorMessage);
      }
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
      
      if (response.status === 403) {
        errorMessage = 'Not authenticated. Please login again.';
        removeAuthToken();
        localStorage.removeItem('adminAuthenticated');
      }
      
      throw new Error(errorMessage);
    }
    
    return response.json();
  },

  update: async (productId: string, productData: {
    name?: string;
    description?: string;
    specs?: string;
    image?: string | File;
    category_name?: string;
    company_key?: string;
  }) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }

    // According to API docs: query params for name, description, specs, category_name, company_key; FormData for image
    const params = new URLSearchParams();
    if (productData.name) params.append('name', productData.name);
    if (productData.description !== undefined) params.append('description', productData.description);
    if (productData.specs !== undefined) params.append('specs', productData.specs);
    if (productData.category_name) params.append('category_name', productData.category_name);
    if (productData.company_key) params.append('company_key', productData.company_key);

    // Use FormData for multipart/form-data (image)
    // IMPORTANT: Only send FormData if there's a new image file to upload
    // If no new image, don't send FormData body at all - backend will keep existing image
    // Sending empty FormData or FormData without image field might cause backend issues
    let requestBody: FormData | undefined = undefined;
    
    if (productData.image && productData.image instanceof File) {
      // Only include image field if we have a new File to upload
      const formData = new FormData();
      console.log('[ProductsAPI] Appending image file for update:', {
        name: productData.image.name,
        size: productData.image.size,
        type: productData.image.type
      });
      // Append the file with the exact field name 'image' as expected by backend
      formData.append('image', productData.image, productData.image.name);
      requestBody = formData;
    } else {
      // Explicitly don't send FormData if no new image
      // This ensures backend doesn't try to process a non-existent file
      console.log('[ProductsAPI] No new image file for update - not sending FormData body, backend will keep existing image');
      requestBody = undefined;
    }
    // If image is a string URL (existing image), don't include it in FormData
    // Backend will keep the existing image when image field is not provided

    const response = await apiRequest(`/products/${productId}?${params.toString()}`, {
      method: 'PUT',
      body: requestBody, // Only send FormData if there's a new image, otherwise undefined (no body)
    });
    
    if (!response.ok) {
      let errorMessage = 'Failed to update product';
      try {
        const clonedResponse = response.clone();
        const errorData = await clonedResponse.json();
        
        // Handle array of error details
        if (errorData.detail && Array.isArray(errorData.detail)) {
          const errorMessages = errorData.detail.map((err: any) => {
            if (typeof err === 'string') return err;
            if (err.msg) return `${err.loc?.join('.') || 'Field'}: ${err.msg}`;
            return JSON.stringify(err);
          });
          errorMessage = errorMessages.join(', ');
        } else if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail);
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        try {
          const clonedResponse = response.clone();
          const errorText = await clonedResponse.text();
          errorMessage = errorText || errorMessage;
        } catch {
          // If both fail, use default message
        }
      }
      
      if (response.status === 403) {
        errorMessage = 'Not authenticated. Please login again.';
        removeAuthToken();
        localStorage.removeItem('adminAuthenticated');
      }
      
      throw new Error(errorMessage);
    }
    
    return response.json();
  },

  delete: async (productId: string) => {
    const response = await apiRequest(`/products/${productId}`, {
      method: 'DELETE',
    });
    return response.json();
  },
};

// Vehicles APIs
export const vehiclesAPI = {
  getAll: async (page: number = 1, limit: number = 100) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await apiRequest(`/vehicles/?${params}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: `Failed to fetch vehicles: ${response.status}` }));
      throw new Error(errorData.detail || `Failed to fetch vehicles: ${response.status}`);
    }
    
    // Backend returns: { totalPages, vehicles: [...] }
    const data = await response.json();
    return data;
  },

  getById: async (vehicleId: string) => {
    const response = await apiRequest(`/vehicles/${vehicleId}`);
    return response.json();
  },

  create: async (vehicleData: {
    name: string;
    category: string;
    description?: string;
    size?: string;
    popular?: boolean;
    specs?: string;
    images?: (string | File)[];
    features?: string[];
    catalog?: File;
    subcategory?: string;
  }) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }

    // Use FormData for multipart/form-data
    const formData = new FormData();
    formData.append('name', vehicleData.name);
    formData.append('category', vehicleData.category);
    if (vehicleData.subcategory) formData.append('subcategory', vehicleData.subcategory);
    if (vehicleData.description) formData.append('description', vehicleData.description);
    if (vehicleData.size) formData.append('size', vehicleData.size);
    if (vehicleData.popular !== undefined) formData.append('popular', String(vehicleData.popular));
    if (vehicleData.specs) formData.append('specs', vehicleData.specs);
    if (vehicleData.catalog) formData.append('catalog', vehicleData.catalog);
    
    // Handle images array - backend expects array of files or strings
    // For FormData, we append each image (File objects or strings)
    if (vehicleData.images && vehicleData.images.length > 0) {
      vehicleData.images.forEach((img) => {
        if (img instanceof File) {
          // Append File object directly
          formData.append('images', img);
        } else if (typeof img === 'string' && img.trim() !== '') {
          // For string URLs, append as string
          formData.append('images', img);
        }
        // Skip empty strings
      });
    }
    
    // Handle features - backend expects string | null
    // If features is an array, join it into a comma-separated string
    // If it's already a string, use it directly
    if (vehicleData.features !== undefined) {
      if (Array.isArray(vehicleData.features)) {
        formData.append('features', vehicleData.features.join(', ') || '');
      } else if (typeof vehicleData.features === 'string') {
        formData.append('features', vehicleData.features);
      } else {
        formData.append('features', '');
      }
    }

    const response = await apiRequest('/vehicles/', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = 'Failed to create vehicle';
      try {
        const clonedResponse = response.clone();
        const errorData = await clonedResponse.json();
        
        // Handle array of error details
        if (errorData.detail && Array.isArray(errorData.detail)) {
          const errorMessages = errorData.detail.map((err: any) => {
            if (typeof err === 'string') return err;
            if (err.msg) return `${err.loc?.join('.') || 'Field'}: ${err.msg}`;
            return JSON.stringify(err);
          });
          errorMessage = errorMessages.join(', ');
        } else if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail);
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        try {
          const clonedResponse = response.clone();
          const errorText = await clonedResponse.text();
          errorMessage = errorText || errorMessage;
        } catch {
          // If both fail, use default message
        }
      }

      if (response.status === 403) {
        errorMessage = 'Not authenticated. Please login again.';
        removeAuthToken();
        localStorage.removeItem('adminAuthenticated');
      }

      throw new Error(errorMessage);
    }

    return response.json();
  },

  update: async (vehicleId: string, vehicleData: {
    name: string; // Required by backend
    category: string; // Required by backend
    description?: string | null;
    size?: string | null;
    popular?: boolean;
    specs?: string | null;
    images?: (string | File)[];
    features?: string | null;
    catalog?: File;
    subcategory?: string | null;
  }) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }

    // Use FormData for multipart/form-data - all fields go in FormData
    const formData = new FormData();
    formData.append('name', vehicleData.name);
    formData.append('category', vehicleData.category);
    
    if (vehicleData.subcategory !== undefined) {
      formData.append('subcategory', vehicleData.subcategory || '');
    }
    if (vehicleData.description !== undefined) {
      formData.append('description', vehicleData.description || '');
    }
    if (vehicleData.size !== undefined) {
      formData.append('size', vehicleData.size || '');
    }
    if (vehicleData.popular !== undefined) {
      formData.append('popular', String(vehicleData.popular));
    }
    if (vehicleData.specs !== undefined) {
      formData.append('specs', vehicleData.specs || '');
    }
    if (vehicleData.catalog) {
      formData.append('catalog', vehicleData.catalog);
    }
    
    // Handle images array - backend expects array of files or strings
    if (vehicleData.images && vehicleData.images.length > 0) {
      vehicleData.images.forEach((img) => {
        if (img instanceof File) {
          // Append File object directly
          formData.append('images', img);
        } else if (typeof img === 'string' && img.trim() !== '') {
          // For string URLs, append as string
          formData.append('images', img);
        }
        // Skip empty strings
      });
    }
    
    // Handle features - backend expects string | null, but we'll send as string
    if (vehicleData.features !== undefined) {
      if (Array.isArray(vehicleData.features)) {
        // If it's an array, join it or send first item
        formData.append('features', vehicleData.features.join(', ') || '');
      } else if (typeof vehicleData.features === 'string') {
        formData.append('features', vehicleData.features);
      } else {
        formData.append('features', '');
      }
    }

    const response = await apiRequest(`/vehicles/${vehicleId}`, {
      method: 'PUT',
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = 'Failed to update vehicle';
      try {
        const clonedResponse = response.clone();
        const errorData = await clonedResponse.json();
        
        // Handle array of error details
        if (errorData.detail && Array.isArray(errorData.detail)) {
          const errorMessages = errorData.detail.map((err: any) => {
            if (typeof err === 'string') return err;
            if (err.msg) return `${err.loc?.join('.') || 'Field'}: ${err.msg}`;
            return JSON.stringify(err);
          });
          errorMessage = errorMessages.join(', ');
        } else if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail);
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        try {
          const clonedResponse = response.clone();
          const errorText = await clonedResponse.text();
          errorMessage = errorText || errorMessage;
        } catch {
          // If both fail, use default message
        }
      }

      if (response.status === 403) {
        errorMessage = 'Not authenticated. Please login again.';
        removeAuthToken();
        localStorage.removeItem('adminAuthenticated');
      }

      throw new Error(errorMessage);
    }

    return response.json();
  },

  delete: async (vehicleId: string) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }
    
    const response = await apiRequest(`/vehicles/${vehicleId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: `Failed to delete vehicle: ${response.status}` }));
      throw new Error(errorData.detail || `Failed to delete vehicle: ${response.status}`);
    }
    
    // Backend returns 204 (No Content) - no body to parse
    if (response.status === 204) {
      return { success: true };
    }
    
    // If there's a body, try to parse it
    const text = await response.text();
    if (text && text.trim()) {
      return JSON.parse(text);
    }
    
    return { success: true };
  },
};

// Careers APIs
export const careersAPI = {
  getAll: async () => {
    const response = await apiRequest('/careers');
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: `Failed to fetch careers: ${response.status}` }));
      throw new Error(errorData.detail || `Failed to fetch careers: ${response.status}`);
    }
    return response.json();
  },

  getAllAdmin: async () => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }
    const response = await apiRequest('/careers/all', {
      method: 'GET',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: `Failed to fetch careers: ${response.status}` }));
      throw new Error(errorData.detail || `Failed to fetch careers: ${response.status}`);
    }
    return response.json();
  },

  create: async (jobData: {
    title: string;
    department: string;
    location: string;
    description: string;
    requirements?: string[];
    status?: string;
  }) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }
    const response = await apiRequest('/careers', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: `Failed to create job: ${response.status}` }));
      throw new Error(errorData.detail || `Failed to create job: ${response.status}`);
    }
    return response.json();
  },

  update: async (jobId: string, jobData: {
    title?: string;
    department?: string;
    location?: string;
    description?: string;
    requirements?: string[];
    status?: string;
  }) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }
    const response = await apiRequest(`/careers/${jobId}`, {
      method: 'PUT',
      body: JSON.stringify(jobData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: `Failed to update job: ${response.status}` }));
      throw new Error(errorData.detail || `Failed to update job: ${response.status}`);
    }
    return response.json();
  },

  delete: async (jobId: string) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }
    const response = await apiRequest(`/careers/${jobId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: `Failed to delete job: ${response.status}` }));
      throw new Error(errorData.detail || `Failed to delete job: ${response.status}`);
    }
    return response.json();
  },
};

// Applications APIs
export const applicationsAPI = {
  submit: async (applicationData: {
    jobId: string;
    name: string;
    email: string;
    phone: string;
    coverLetter?: string;
    resume: File;
  }) => {
    const formData = new FormData();
    formData.append('jobId', applicationData.jobId);
    formData.append('name', applicationData.name);
    formData.append('email', applicationData.email);
    formData.append('phone', applicationData.phone);
    if (applicationData.coverLetter) {
      formData.append('coverLetter', applicationData.coverLetter);
    }
    formData.append('resume', applicationData.resume);

    const response = await apiRequest('/applications', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: `Failed to submit application: ${response.status}` }));
      throw new Error(errorData.detail || `Failed to submit application: ${response.status}`);
    }
    return response.json();
  },

  getAll: async () => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }
    const response = await apiRequest('/applications', {
      method: 'GET',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: `Failed to fetch applications: ${response.status}` }));
      throw new Error(errorData.detail || `Failed to fetch applications: ${response.status}`);
    }
    return response.json();
  },

  getById: async (applicationId: string) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }
    const response = await apiRequest(`/applications/${applicationId}`, {
      method: 'GET',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: `Failed to fetch application: ${response.status}` }));
      throw new Error(errorData.detail || `Failed to fetch application: ${response.status}`);
    }
    return response.json();
  },

  updateStatus: async (applicationId: string, status: string) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }
    const response = await apiRequest(`/applications/${applicationId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: `Failed to update application status: ${response.status}` }));
      throw new Error(errorData.detail || `Failed to update application status: ${response.status}`);
    }
    return response.json();
  },
};

// Fuel Stations APIs
export const fuelStationsAPI = {
  getAll: async (page: number = 1, limit: number = 100) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await apiRequest(`/fuelStations/?${params.toString()}`);

      if (!response.ok) {
        // Provide more helpful error messages
        if (response.status === 404) {
          throw new Error('Fuel stations endpoint not found (404). Please check API configuration.');
        } else if (response.status === 500) {
          throw new Error('Backend server error (500). Please check backend logs.');
        } else {
          const errorText = await response.text().catch(() => '');
          throw new Error(`Backend returned ${response.status}: ${errorText || response.statusText}`);
        }
      }

      const data = await response.json();
      console.log('[fuelStationsAPI] Raw response data:', data);
      console.log('[fuelStationsAPI] Response keys:', Object.keys(data));
      
      // Backend returns: { page, limit, total, total_pages, fuel_stations: [...] }
      // Check for fuel_stations (with underscore) - this is the correct API response format
      if (Array.isArray(data.fuel_stations)) {
        console.log('[fuelStationsAPI] Found fuel_stations array with', data.fuel_stations.length, 'items');
        return data.fuel_stations;
      }
      
      // Some implementations return { items: [...], total: n }, others return an array
      if (Array.isArray(data)) {
        console.log('[fuelStationsAPI] Data is array, returning', data.length, 'items');
        return data;
      }
      if (Array.isArray(data.fuelstations)) {
        console.log('[fuelStationsAPI] Found fuelstations array with', data.fuelstations.length, 'items');
        return data.fuelstations;
      }
      if (Array.isArray(data.fuelStations)) {
        console.log('[fuelStationsAPI] Found fuelStations array with', data.fuelStations.length, 'items');
        return data.fuelStations;
      }
      if (Array.isArray(data.vehicles)) {
        console.log('[fuelStationsAPI] Found vehicles array with', data.vehicles.length, 'items');
        // Backend sometimes returns fuel stations under "vehicles" key
        return data.vehicles;
      }
      if (Array.isArray(data.data)) {
        console.log('[fuelStationsAPI] Found data array with', data.data.length, 'items');
        return data.data;
      }
      if (Array.isArray(data.results)) {
        console.log('[fuelStationsAPI] Found results array with', data.results.length, 'items');
        return data.results;
      }
      // Fallback to property names we control
      if (Array.isArray(data.stations)) {
        console.log('[fuelStationsAPI] Found stations array with', data.stations.length, 'items');
        return data.stations;
      }
      
      // If we have a valid response but no stations, return empty array instead of throwing
      console.warn('[fuelStationsAPI] No valid array found in response. Data structure:', data);
      console.warn('[fuelStationsAPI] This might indicate empty database or missing data.');
      return [];
    } catch (error: any) {
      console.error('[fuelStationsAPI] Failed to fetch fuel stations:', error);
      
      // Enhanced error message for network errors
      if (error?.message?.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to connect to the API. Please check your connection and ensure the backend server is running.');
      }
      
      // Re-throw with context
      throw error;
    }
  },
};

// Companies APIs
export const companiesAPI = {
  getAll: async () => {
    const response = await apiRequest('/companies/');
    return response.json();
  },
};

// Massey Products APIs
export const masseyAPI = {
  getAllProducts: async () => {
    try {
      const response = await apiRequest('/massey/products');
      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }
      
      // Backend returns: { data: [...], total_count, total_pages, current_page, per_page }
      const result = await response.json();
      
      // Return the full response object (components can access result.data, result.total_count, etc.)
      return result;
    } catch (error) {
      console.warn('masseyAPI.getAllProducts failed:', error);
      // Return empty structure matching expected format
      return {
        data: [],
        total_count: 0,
        total_pages: 0,
        current_page: 1,
        per_page: 10
      };
    }
  },

  getAllCategories: async () => {
    try {
      const response = await apiRequest('/massey/categories');
      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        return data;
      }
      if (Array.isArray(data.categories)) {
        return data.categories;
      }
      if (Array.isArray(data.data)) {
        return data.data;
      }
      return [];
    } catch (error) {
      console.warn('masseyAPI.getAllCategories failed:', error);
      return [];
    }
  },

  createProduct: async (payload: { name: string; category: string; description?: string; specs?: string; image?: string }) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }

    const params = new URLSearchParams();
    params.append('name', payload.name);
    params.append('category', payload.category);
    if (payload.description) params.append('description', payload.description);
    if (payload.specs) params.append('specs', payload.specs);
    if (payload.image) params.append('image', payload.image);

    const response = await apiRequest(`/massey/products?${params.toString()}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.detail || errorData.message || 'Failed to create massey product';
      throw new Error(message);
    }

    return response.json();
  },

  createCategory: async (label: string) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }

    const params = new URLSearchParams({ label });
    const response = await apiRequest(`/massey/categories?${params.toString()}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.detail || errorData.message || 'Failed to create massey category';
      throw new Error(message);
    }

    return response.json();
  },
};

// About APIs
export const aboutAPI = {
  getAll: async () => {
    try {
      const response = await apiRequest('/about/');
      if (!response.ok) {
        let errorMessage = `Backend returned ${response.status}`;
        let isDatabaseError = false;
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            // Check if it's a database connection error
            if (errorData.detail.includes('could not translate host name') || 
                errorData.detail.includes('OperationalError') ||
                errorData.detail.includes('database') ||
                errorData.detail.includes('psycopg2')) {
              isDatabaseError = true;
              errorMessage = 'Database connection error';
            } else {
              errorMessage = errorData.detail;
            }
          }
        } catch (e) {
          // If we can't parse error, use status code message
        }
        
        // For database errors, return empty array silently
        // For other errors, log but still return empty array to prevent crashes
        if (isDatabaseError) {
          console.warn('[About API] Database connection error - returning empty array');
          return [];
        }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        return data;
      }
      if (Array.isArray(data.about)) {
        return data.about;
      }
      if (Array.isArray(data.data)) {
        return data.data;
      }
      return data.entries ? data.entries : [];
    } catch (error) {
      console.warn('aboutAPI.getAll failed:', error);
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  },

  create: async (payload: { title: string; description: string; file?: string | File }) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }

    // Use FormData for multipart/form-data
    const formData = new FormData();
    formData.append('title', payload.title);
    formData.append('description', payload.description);
    if (payload.file) {
      if (payload.file instanceof File) {
        formData.append('file', payload.file);
      } else {
        try {
          const fileResponse = await fetch(payload.file);
          const blob = await fileResponse.blob();
          const fileName = payload.file.split('/').pop() || 'file.jpg';
          formData.append('file', blob, fileName);
        } catch (e) {
          console.warn('Could not convert file URL to blob, sending as string:', e);
          formData.append('file', payload.file);
        }
      }
    }

    const response = await apiRequest('/about/', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.detail || errorData.message || 'Failed to create about entry';
      throw new Error(message);
    }

    return response.json();
  },

  update: async (aboutId: string, payload: { title?: string; description?: string; file?: string | File }) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }

    // Use FormData for multipart/form-data
    // According to API spec, all fields are optional but we need to send FormData
    const formData = new FormData();
    
    // Always append title and description (even if empty string) if they're provided
    // This ensures the backend knows we're updating these fields
    if (payload.title !== undefined) {
      formData.append('title', payload.title || '');
    }
    if (payload.description !== undefined) {
      formData.append('description', payload.description || '');
    }
    
    // Handle file upload - only append if a new file is provided
    if (payload.file !== undefined && payload.file !== null) {
      if (payload.file instanceof File) {
        console.log('[AboutAPI] Appending file to FormData:', {
          name: payload.file.name,
          size: payload.file.size,
          type: payload.file.type
        });
        formData.append('file', payload.file, payload.file.name);
      } else if (typeof payload.file === 'string' && payload.file.trim() !== '') {
        // String URL - try to fetch and convert to blob
        try {
          console.log('[AboutAPI] Converting file URL to blob:', payload.file);
          const fileResponse = await fetch(payload.file);
          if (!fileResponse.ok) {
            throw new Error(`Failed to fetch file: ${fileResponse.status}`);
          }
          const blob = await fileResponse.blob();
          const fileName = payload.file.split('/').pop() || 'file.jpg';
          console.log('[AboutAPI] Converted URL to blob, appending:', fileName);
          formData.append('file', blob, fileName);
        } catch (e) {
          console.error('[AboutAPI] Could not convert file URL to blob:', e);
          // Don't append if conversion fails - backend will keep existing file
          console.warn('[AboutAPI] Skipping file upload, backend will keep existing file');
        }
      }
    }
    
    // Log FormData contents for debugging
    const formDataEntries: string[] = [];
    try {
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          formDataEntries.push(`${key}: [File: ${value.name}, ${value.size} bytes]`);
        } else {
          formDataEntries.push(`${key}: ${String(value).substring(0, 50)}`);
        }
      }
    } catch (e) {
      // FormData.entries() might not be available in all browsers
      console.log('[AboutAPI] Could not iterate FormData entries');
    }
    
    console.log('[AboutAPI] FormData prepared for update:', {
      hasTitle: payload.title !== undefined,
      hasDescription: payload.description !== undefined,
      hasFile: payload.file !== undefined && payload.file !== null,
      fileType: payload.file instanceof File ? 'File' : typeof payload.file,
      formDataEntries: formDataEntries.length > 0 ? formDataEntries : 'No entries (empty FormData)'
    });
    
    // Ensure we have at least one field to update
    if (formDataEntries.length === 0) {
      console.warn('[AboutAPI] Warning: FormData is empty. At least one field (title, description, or file) should be provided for update.');
    }

    const response = await apiRequest(`/about/${aboutId}`, {
      method: 'PUT',
      body: formData,
    });

    if (!response.ok) {
      // Handle timeout errors specifically
      if (response.status === 504) {
        throw new Error('Gateway Timeout (504): The server took too long to process your request. This might be due to a large file upload. Please try with a smaller file or try again later.');
      }
      
      let errorMessage = 'Failed to update about entry';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        // If JSON parsing fails, use status text
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  },

  delete: async (aboutId: string) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }

    const response = await apiRequest(`/about/${aboutId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.detail || errorData.message || 'Failed to delete about entry';
      throw new Error(message);
    }

    return response.json();
  },
};

// Home Video APIs
export const homeAPI = {
  getVideo: async (): Promise<string> => {
    try {
      const response = await apiRequest('/home/video');
      if (!response.ok) {
        // If 404 or other error, return empty string (no video set yet)
        if (response.status === 404) {
          return '';
        }
        throw new Error(`Failed to fetch home video: ${response.status}`);
      }
      const data = await response.json();
      // Backend returns a string (video URL)
      return typeof data === 'string' ? data : data.video || data.url || '';
    } catch (error) {
      console.warn('homeAPI.getVideo failed:', error);
      // Return empty string on error so page doesn't break
      return '';
    }
  },

  uploadVideo: async (file: File): Promise<string> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }

    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    // Check if it's a video file
    if (!file.type.startsWith('video/')) {
      throw new Error('File must be a video');
    }

    // Use FormData for multipart/form-data
    const formData = new FormData();
    formData.append('file', file, file.name);

    console.log('[HomeAPI] Uploading video:', {
      name: file.name,
      size: file.size,
      type: file.type,
      endpoint: `${API_BASE_URL}/home/video/`
    });

    try {
      const response = await apiRequest('/home/video/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.detail || errorData.message || 'Failed to upload video';
        throw new Error(message);
      }

      return response.json();
    } catch (error: any) {
      console.error('[HomeAPI] Upload error:', error);
      throw error;
    }
  },

  getAdvertisementVideo: async (): Promise<string> => {
    try {
      const response = await apiRequest('/home/advertisement-video');
      if (!response.ok) {
        // If 404 or other error, return default path
        if (response.status === 404) {
          return '/videos/advertisement.mp4';
        }
        return '/videos/advertisement.mp4';
      }
      const data = await response.json();
      // Backend returns a string (video URL)
      return typeof data === 'string' ? data : data.video || data.url || '/videos/advertisement.mp4';
    } catch (error) {
      console.warn('homeAPI.getAdvertisementVideo failed:', error);
      // Return default path on error
      return '/videos/advertisement.mp4';
    }
  },

  uploadAdvertisementVideo: async (file: File): Promise<string> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }

    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    // Check if it's a video file
    if (!file.type.startsWith('video/')) {
      throw new Error('File must be a video');
    }

    // Use FormData for multipart/form-data
    const formData = new FormData();
    formData.append('file', file, file.name);

    const response = await apiRequest('/home/advertisement-video', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.detail || errorData.message || 'Failed to upload advertisement video';
      throw new Error(message);
    }

    return response.json();
  },
};

// Showrooms APIs
export const showroomsAPI = {
  getAll: async () => {
    const response = await apiRequest('/showrooms/');
    return response.json();
  },
  create: async (showroomData: {
    city: string;
    address: string;
    phone: string;
    email: string;
    is_main?: boolean;
    image?: string | File;
  }) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }

    // Use FormData for multipart/form-data
    const formData = new FormData();
    formData.append('city', showroomData.city);
    formData.append('address', showroomData.address);
    formData.append('phone', showroomData.phone);
    formData.append('email', showroomData.email);
    if (showroomData.is_main !== undefined) formData.append('is_main', String(showroomData.is_main));
    if (showroomData.image) {
      if (showroomData.image instanceof File) {
        formData.append('image', showroomData.image);
      } else {
        try {
          const imageResponse = await fetch(showroomData.image);
          const blob = await imageResponse.blob();
          const fileName = showroomData.image.split('/').pop() || 'image.jpg';
          formData.append('image', blob, fileName);
        } catch (e) {
          console.warn('Could not convert image URL to blob, sending as string:', e);
          formData.append('image', showroomData.image);
        }
      }
    }

    const response = await apiRequest('/showrooms/', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = 'Failed to create showroom';
      try {
        // Clone response to avoid "body stream already read" error
        const clonedResponse = response.clone();
        const errorData = await clonedResponse.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        try {
          // Try to read as text if JSON parsing fails
          const clonedResponse = response.clone();
          const errorText = await clonedResponse.text();
          errorMessage = errorText || errorMessage;
        } catch {
          // If both fail, use default message
        }
      }

      if (response.status === 403) {
        errorMessage = 'Not authenticated. Please login again.';
        removeAuthToken();
        localStorage.removeItem('adminAuthenticated');
      }

      throw new Error(errorMessage);
    }

    return response.json();
  },
  update: async (showroomId: string, showroomData: {
    city?: string;
    address?: string;
    phone?: string;
    email?: string;
    is_main?: boolean;
    image?: string | File;
  }) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }

    // Use FormData for multipart/form-data
    const formData = new FormData();
    if (showroomData.city !== undefined) formData.append('city', showroomData.city || '');
    if (showroomData.address !== undefined) formData.append('address', showroomData.address || '');
    if (showroomData.phone !== undefined) formData.append('phone', showroomData.phone || '');
    if (showroomData.email !== undefined) formData.append('email', showroomData.email || '');
    if (showroomData.is_main !== undefined) formData.append('is_main', String(showroomData.is_main));
    if (showroomData.image !== undefined) {
      if (showroomData.image instanceof File) {
        formData.append('image', showroomData.image);
      } else if (showroomData.image) {
        try {
          const imageResponse = await fetch(showroomData.image);
          const blob = await imageResponse.blob();
          const fileName = showroomData.image.split('/').pop() || 'image.jpg';
          formData.append('image', blob, fileName);
        } catch (e) {
          console.warn('Could not convert image URL to blob, sending as string:', e);
          formData.append('image', showroomData.image);
        }
      }
    }

    const response = await apiRequest(`/showrooms/${showroomId}`, {
      method: 'PUT',
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = 'Failed to update showroom';
      try {
        // Clone response to avoid "body stream already read" error
        const clonedResponse = response.clone();
        const errorData = await clonedResponse.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        try {
          // Try to read as text if JSON parsing fails
          const clonedResponse = response.clone();
          const errorText = await clonedResponse.text();
          errorMessage = errorText || errorMessage;
        } catch {
          // If both fail, use default message
        }
      }

      if (response.status === 403) {
        errorMessage = 'Not authenticated. Please login again.';
        removeAuthToken();
        localStorage.removeItem('adminAuthenticated');
      }

      throw new Error(errorMessage);
    }

    return response.json();
  },
  delete: async (showroomId: string) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }

    const response = await apiRequest(`/showrooms/${showroomId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      let errorMessage = 'Failed to delete showroom';
      try {
        // Clone response to avoid "body stream already read" error
        const clonedResponse = response.clone();
        const errorData = await clonedResponse.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        try {
          // Try to read as text if JSON parsing fails
          const clonedResponse = response.clone();
          const errorText = await clonedResponse.text();
          errorMessage = errorText || errorMessage;
        } catch {
          // If both fail, use default message
        }
      }

      if (response.status === 403) {
        errorMessage = 'Not authenticated. Please login again.';
        removeAuthToken();
        localStorage.removeItem('adminAuthenticated');
      }

      throw new Error(errorMessage);
    }

    return response.json();
  },
};

// Legacy APIs for backward compatibility with frontend pages - BACKEND ONLY
export const vehiclesApi = {
  getAll: async () => {
    try {
      const endpoint = `${API_BASE_URL}/vehicles?page=1&limit=100`;
      console.log(`[Legacy Vehicles API] GET ${endpoint}`);
      
      const response = await fetch(endpoint, {
        headers: {
          'Accept': 'application/json',
        },
      });
      
      console.log(`[Legacy Vehicles API] Response: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data : (data.vehicles || data.data || []);
      }
      throw new Error(`API returned ${response.status}`);
    } catch (error) {
      console.error('[Legacy Vehicles API] Failed:', error);
      throw error;
    }
  },
  getById: async (id: number | string) => {
    try {
      const endpoint = `${API_BASE_URL}/vehicles/${id}`;
      console.log(`[Legacy Vehicles API] GET ${endpoint}`);
      
      const response = await fetch(endpoint, {
        headers: {
          'Accept': 'application/json',
        },
      });
      
      console.log(`[Legacy Vehicles API] Response: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data[0] : (data.vehicle || data.data || data);
      }
      throw new Error('Vehicle not found');
    } catch (error) {
      console.error('[Legacy Vehicles API] Failed:', error);
      throw error;
    }
  },
  getByCategory: async (category: string) => {
    try {
      const endpoint = `${API_BASE_URL}/vehicles?page=1&limit=100`;
      console.log(`[Legacy Vehicles API] GET ${endpoint} (category: ${category})`);
      
      const response = await fetch(endpoint, {
        headers: {
          'Accept': 'application/json',
        },
      });
      
      console.log(`[Legacy Vehicles API] Response: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        const vehicles = Array.isArray(data) ? data : (data.vehicles || data.data || []);
        // Filter by category on client side since API doesn't support category filter
        return vehicles.filter((v: any) => v.category === category);
      }
      throw new Error('No vehicles found for category');
    } catch (error) {
      console.error('[Legacy Vehicles API] Failed:', error);
      throw error;
    }
  },
};

export const productsApi = {
  getAll: async () => {
    try {
      const endpoint = `${API_BASE_ENDPOINT}/api/products/?page=1&limit=100`;
      console.log(`[Legacy Products API] GET ${endpoint}`);
      
      const response = await fetch(endpoint, {
        headers: {
          'Accept': 'application/json',
        },
      });
      
      console.log(`[Legacy Products API] Response: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data : (data.products || data.data || []);
      }
      throw new Error(`API returned ${response.status}`);
    } catch (error) {
      console.error('[Legacy Products API] Failed:', error);
      throw error;
    }
  },
  getById: async (id: number | string) => {
    try {
      const endpoint = `${API_BASE_ENDPOINT}/api/products/${id}`;
      console.log(`[Legacy Products API] GET ${endpoint}`);
      
      const response = await fetch(endpoint, {
        headers: {
          'Accept': 'application/json',
        },
      });
      
      console.log(`[Legacy Products API] Response: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data[0] : (data.product || data.data || data);
      }
      throw new Error('Product not found');
    } catch (error) {
      console.error('[Legacy Products API] Failed:', error);
      throw error;
    }
  },
  getByCategory: async (category: string) => {
    try {
      const endpoint = `${API_BASE_ENDPOINT}/api/products/?page=1&limit=100&search=${encodeURIComponent(category)}`;
      console.log(`[Legacy Products API] GET ${endpoint} (category: ${category})`);
      
      const response = await fetch(endpoint, {
        headers: {
          'Accept': 'application/json',
        },
      });
      
      console.log(`[Legacy Products API] Response: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        const products = Array.isArray(data) ? data : (data.products || data.data || []);
        // Filter by category on client side since API uses search parameter
        return products.filter((p: any) => p.category === category || p.category_name === category);
      }
      throw new Error('No products found for category');
    } catch (error) {
      console.error('[Legacy Products API] Failed:', error);
      throw error;
    }
  },
  getMetadata: async () => {
    try {
      // Metadata endpoint may not exist in the new API, return empty object
      return {};
    } catch (error) {
      console.error('Backend API failed:', error);
      throw error;
    }
  },
};

// Awards APIs
export const awardsAPI = {
  getAll: async (flat = false) => {
    const url = flat ? '/awards?flat=true' : '/awards';
    const response = await apiRequest(url);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: `Failed to fetch awards: ${response.status}` }));
      throw new Error(errorData.detail || `Failed to fetch awards: ${response.status}`);
    }
    return response.json();
  },

  getById: async (id: string) => {
    const response = await apiRequest(`/awards/${id}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: `Failed to fetch award: ${response.status}` }));
      throw new Error(errorData.detail || `Failed to fetch award: ${response.status}`);
    }
    return response.json();
  },

  create: async (awardData: {
    brand: string;
    award_text: string;
    year?: string;
    logo?: File;
    display_order?: number;
  }) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }

    const formData = new FormData();
    formData.append('brand', awardData.brand);
    formData.append('award_text', awardData.award_text);
    if (awardData.year) {
      formData.append('year', awardData.year);
    }
    if (awardData.logo) {
      formData.append('logo', awardData.logo);
    }
    if (awardData.display_order !== undefined) {
      formData.append('display_order', awardData.display_order.toString());
    }

    const response = await apiRequest('/awards', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: `Failed to create award: ${response.status}` }));
      throw new Error(errorData.detail || `Failed to create award: ${response.status}`);
    }
    return response.json();
  },

  update: async (awardId: string, awardData: {
    brand?: string;
    award_text?: string;
    year?: string;
    logo?: File;
    display_order?: number;
  }) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }

    const formData = new FormData();
    if (awardData.brand !== undefined) {
      formData.append('brand', awardData.brand);
    }
    if (awardData.award_text !== undefined) {
      formData.append('award_text', awardData.award_text);
    }
    if (awardData.year !== undefined) {
      formData.append('year', awardData.year);
    }
    if (awardData.logo) {
      formData.append('logo', awardData.logo);
    }
    if (awardData.display_order !== undefined) {
      formData.append('display_order', awardData.display_order.toString());
    }

    const response = await apiRequest(`/awards/${awardId}`, {
      method: 'PUT',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: `Failed to update award: ${response.status}` }));
      throw new Error(errorData.detail || `Failed to update award: ${response.status}`);
    }
    return response.json();
  },

  delete: async (awardId: string) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }
    const response = await apiRequest(`/awards/${awardId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: `Failed to delete award: ${response.status}` }));
      throw new Error(errorData.detail || `Failed to delete award: ${response.status}`);
    }
    return response.json();
  },
};
