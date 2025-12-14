import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Validate AWS credentials
const validateAWSCredentials = () => {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  
  if (!accessKeyId || !secretAccessKey) {
    console.warn('⚠️  AWS credentials not found. S3 uploads will fail.');
    console.warn('   Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in environment variables.');
    return false;
  }
  
  if (accessKeyId === 'your-aws-access-key-id' || secretAccessKey === 'your-aws-secret-access-key') {
    console.warn('⚠️  AWS credentials appear to be placeholder values. Please set actual credentials.');
    return false;
  }
  
  return true;
};

// S3 Bucket: tata-storagebucket (ap-south-1)
// AWS Console: https://ap-south-1.console.aws.amazon.com/s3/buckets/tata-storagebucket
const BUCKET_NAME = process.env.AWS_BUCKET_NAME || 'tata-storagebucket';
const AWS_REGION = process.env.AWS_REGION_NAME || 'ap-south-1';

// CloudFront domain for serving S3 files
// Default to dh0blbvvlqdiy.cloudfront.net if not set in environment
const CLOUDFRONT_DOMAIN = process.env.AWS_CLOUDFRONT_DOMAIN 
  ? (process.env.AWS_CLOUDFRONT_DOMAIN.startsWith('http') 
      ? process.env.AWS_CLOUDFRONT_DOMAIN 
      : `https://${process.env.AWS_CLOUDFRONT_DOMAIN}`)
  : 'https://dh0blbvvlqdiy.cloudfront.net';

// Initialize S3 client with credentials validation
let s3Client = null;
try {
  if (validateAWSCredentials()) {
    s3Client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    console.log(`✅ S3 client initialized for bucket: ${BUCKET_NAME} in region: ${AWS_REGION}`);
  } else {
    console.warn('⚠️  S3 client not initialized - AWS credentials missing');
  }
} catch (error) {
  console.error('❌ Failed to initialize S3 client:', error.message);
  s3Client = null;
}

// Upload file to S3
export const uploadToS3 = async (file, folder = 'images') => {
  if (!s3Client) {
    throw new Error('S3 client not initialized. Please configure AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY).');
  }

  if (!file || !file.buffer) {
    throw new Error('Invalid file: file buffer is required');
  }

  try {
    // Generate unique filename with timestamp and random number
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    const extension = getFileExtension(file.originalname || 'file');
    const fileName = `${folder}/${timestamp}-${random}${extension}`;
    
    console.log(`[S3] Uploading file to: ${fileName} (${(file.buffer.length / 1024).toFixed(2)} KB)`);
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype || 'application/octet-stream',
      // No ACL needed - bucket is private, CloudFront will serve files
      // CacheControl: 'max-age=31536000', // Optional: cache for 1 year
    });

    await s3Client.send(command);
    
    // Return CloudFront URL
    const url = `${CLOUDFRONT_DOMAIN}/${fileName}`;
    console.log(`[S3] ✅ File uploaded successfully: ${url}`);
    return url;
  } catch (error) {
    console.error('[S3] ❌ Upload error:', {
      message: error.message,
      code: error.code,
      bucket: BUCKET_NAME,
      region: AWS_REGION,
    });
    
    // Provide helpful error messages
    if (error.code === 'CredentialsError' || error.name === 'CredentialsError') {
      throw new Error('AWS credentials are invalid. Please check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.');
    }
    if (error.code === 'NoSuchBucket') {
      throw new Error(`S3 bucket "${BUCKET_NAME}" not found. Please check AWS_BUCKET_NAME and ensure bucket exists in region ${AWS_REGION}.`);
    }
    if (error.code === 'AccessDenied') {
      throw new Error(`Access denied to S3 bucket. Please check IAM permissions for bucket "${BUCKET_NAME}".`);
    }
    
    throw new Error(`Failed to upload to S3: ${error.message}`);
  }
};

// Delete file from S3
export const deleteFromS3 = async (fileUrl) => {
  if (!s3Client) {
    console.warn('[S3] Cannot delete file - S3 client not initialized');
    return;
  }

  try {
    // Extract key from CloudFront URL or S3 URL
    const key = extractS3Key(fileUrl);
    if (!key) {
      console.warn(`[S3] Could not extract S3 key from URL: ${fileUrl}`);
      return;
    }

    console.log(`[S3] Deleting file: ${key}`);
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    console.log(`[S3] ✅ File deleted successfully: ${key}`);
  } catch (error) {
    console.error('[S3] ❌ Delete error:', error.message);
    // Don't throw - deletion is not critical
  }
};

// Get signed URL for private files (if needed)
export const getSignedUrlForFile = async (key, expiresIn = 3600) => {
  if (!s3Client) {
    throw new Error('S3 client not initialized. Please configure AWS credentials.');
  }

  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('[S3] ❌ Signed URL error:', error.message);
    throw error;
  }
};

// Check if S3 is configured and ready
export const isS3Configured = () => {
  return s3Client !== null && validateAWSCredentials();
};

// Get S3 configuration info (for debugging)
export const getS3Config = () => {
  return {
    bucket: BUCKET_NAME,
    region: AWS_REGION,
    cloudFrontDomain: CLOUDFRONT_DOMAIN,
    isConfigured: isS3Configured(),
    hasCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
  };
};

// Helper functions
const getFileExtension = (filename) => {
  return filename.substring(filename.lastIndexOf('.'));
};

const extractS3Key = (url) => {
  if (!url) return null;
  
  // If it's a CloudFront URL, extract the path
  if (url.includes(CLOUDFRONT_DOMAIN)) {
    return url.replace(CLOUDFRONT_DOMAIN + '/', '');
  }
  
  // If it's an S3 URL
  if (url.includes('s3.amazonaws.com') || url.includes('s3.')) {
    const parts = url.split('/');
    return parts.slice(3).join('/');
  }
  
  // If it's already a key (starts with folder/)
  if (url.startsWith('images/') || url.startsWith('catalouges/') || url.startsWith('videos/')) {
    return url;
  }
  
  return null;
};

export default { uploadToS3, deleteFromS3, getSignedUrlForFile, isS3Configured, getS3Config };

