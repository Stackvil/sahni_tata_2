// Helper to convert image paths to CloudFront URLs
// Use this in all routes that return image paths

const CLOUDFRONT_DOMAIN = process.env.AWS_CLOUDFRONT_DOMAIN 
  ? (process.env.AWS_CLOUDFRONT_DOMAIN.startsWith('http') 
      ? process.env.AWS_CLOUDFRONT_DOMAIN 
      : `https://${process.env.AWS_CLOUDFRONT_DOMAIN}`)
  : 'https://dh0blbvvlqdiy.cloudfront.net';

// Cache busting version - update this when images are modified
const IMAGE_CACHE_VERSION = process.env.IMAGE_CACHE_VERSION || 'v2.0.1';

/**
 * Add cache busting query parameter to URL
 * @param {string} url - URL to add cache busting to
 * @returns {string} - URL with cache busting parameter
 */
const addCacheBusting = (url) => {
  if (!url) return url;
  // Don't add cache busting if URL already has query parameters with version
  if (url.includes('?')) {
    if (url.includes('v=') || url.includes('version=') || url.includes('cache=')) {
      return url;
    }
    return `${url}&v=${IMAGE_CACHE_VERSION}`;
  }
  return `${url}?v=${IMAGE_CACHE_VERSION}`;
};

/**
 * Convert a local image path to CloudFront URL
 * @param {string} imagePath - Local path like /images/... or images/...
 * @returns {string} - CloudFront URL with cache busting
 */
export const toCloudFrontUrl = (imagePath) => {
  if (!imagePath) return '';
  
  let finalUrl = '';
  
  // If already a CloudFront URL, remove existing query params
  if (imagePath.includes('cloudfront.net')) {
    finalUrl = imagePath.split('?')[0];
  } else if (imagePath.includes('s3.amazonaws.com') || imagePath.includes('tata-storagebucket.s3')) {
    // If it's an S3 URL, convert to CloudFront
    // Extract the path/key from S3 URL
    let s3Key = '';
    if (imagePath.includes('tata-storagebucket.s3.ap-south-1.amazonaws.com/')) {
      s3Key = imagePath.split('tata-storagebucket.s3.ap-south-1.amazonaws.com/')[1];
      // Remove query parameters if present
      s3Key = s3Key.split('?')[0];
    } else if (imagePath.includes('.s3.amazonaws.com/')) {
      s3Key = imagePath.split('.s3.amazonaws.com/')[1];
      s3Key = s3Key.split('?')[0];
    } else {
      // Try to extract from any S3 URL pattern
      const match = imagePath.match(/\.s3[^/]*\/(.+?)(?:\?|$)/);
      s3Key = match ? match[1] : '';
    }
    
    // Convert to CloudFront URL
    if (s3Key) {
      finalUrl = `${CLOUDFRONT_DOMAIN}/${s3Key}`;
    } else {
      finalUrl = imagePath;
    }
  } else if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    // If already a full URL (but not CloudFront or S3), return as-is
    finalUrl = imagePath.split('?')[0]; // Remove existing query params
  } else {
    // Remove leading slash if present
    let cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    
    // Check if it's an image/video/catalog path
    if (cleanPath.match(/^(images|videos|catalouges|vehicles|resumes)\//)) {
      finalUrl = `${CLOUDFRONT_DOMAIN}/${cleanPath}`;
    } else if (imagePath.match(/^(images|videos|catalouges|vehicles|resumes)\//)) {
      // If it starts with images/ but no leading slash was there, it's already clean
      finalUrl = `${CLOUDFRONT_DOMAIN}/${imagePath}`;
    } else {
      // For other paths, assume they're images and prepend images/
      // This handles cases where path is just a filename
      finalUrl = `${CLOUDFRONT_DOMAIN}/images/${cleanPath}`;
    }
  }
  
  // Add cache busting to all image URLs
  return addCacheBusting(finalUrl);
};

/**
 * Convert array of image paths to CloudFront URLs
 * @param {string[]} imagePaths - Array of local paths
 * @returns {string[]} - Array of CloudFront URLs
 */
export const toCloudFrontUrls = (imagePaths) => {
  if (!Array.isArray(imagePaths)) {
    return [];
  }
  return imagePaths.map(path => toCloudFrontUrl(path));
};

export default { toCloudFrontUrl, toCloudFrontUrls };

