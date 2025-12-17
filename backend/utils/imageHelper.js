// Helper to convert image paths to CloudFront URLs
// Use this in all routes that return image paths

const CLOUDFRONT_DOMAIN = process.env.AWS_CLOUDFRONT_DOMAIN 
  ? (process.env.AWS_CLOUDFRONT_DOMAIN.startsWith('http') 
      ? process.env.AWS_CLOUDFRONT_DOMAIN 
      : `https://${process.env.AWS_CLOUDFRONT_DOMAIN}`)
  : 'https://dh0blbvvlqdiy.cloudfront.net';

/**
 * Convert a local image path to CloudFront URL
 * @param {string} imagePath - Local path like /images/... or images/...
 * @returns {string} - CloudFront URL
 */
export const toCloudFrontUrl = (imagePath) => {
  if (!imagePath) return '';
  
  // If already a CloudFront URL, return as-is
  if (imagePath.includes('cloudfront.net')) {
    return imagePath;
  }
  
  // If it's an S3 URL, convert to CloudFront
  if (imagePath.includes('s3.amazonaws.com') || imagePath.includes('tata-storagebucket.s3')) {
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
      return `${CLOUDFRONT_DOMAIN}/${s3Key}`;
    }
  }
  
  // If already a full URL (but not CloudFront or S3), return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Remove leading slash if present
  let cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
  
  // Check if it's an image/video/catalog path
  if (cleanPath.match(/^(images|videos|catalouges|vehicles|resumes)\//)) {
    return `${CLOUDFRONT_DOMAIN}/${cleanPath}`;
  }
  
  // If it starts with images/ but no leading slash was there, it's already clean
  if (imagePath.match(/^(images|videos|catalouges|vehicles|resumes)\//)) {
    return `${CLOUDFRONT_DOMAIN}/${imagePath}`;
  }
  
  // For other paths, assume they're images and prepend images/
  // This handles cases where path is just a filename
  return `${CLOUDFRONT_DOMAIN}/images/${cleanPath}`;
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

