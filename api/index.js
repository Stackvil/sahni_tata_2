// Vercel serverless function wrapper for Express app
import app from '../backend/server.js';

// Set Vercel environment flag
process.env.VERCEL = '1';

// Vercel serverless function handler
// Vercel's @vercel/node provides Node.js-compatible req/res objects
export default function handler(req, res) {
  try {
    // Vercel rewrites /api/(.*) to /api/index.js
    // The original path is preserved in req.url
    // For example: /api/products becomes req.url = '/api/products'
    
    // Get the original URL from the request
    let requestPath = req.url || req.path || req.originalUrl || '/';
    
    // Handle query string
    const urlParts = requestPath.split('?');
    const pathPart = urlParts[0];
    const queryString = urlParts[1] ? `?${urlParts[1]}` : '';
    
    // Ensure path starts with /api (it should already, but just in case)
    let finalPath = pathPart;
    if (!finalPath.startsWith('/api')) {
      finalPath = `/api${finalPath === '/' ? '' : finalPath}`;
    }
    
    // Reconstruct full URL with query string
    const fullUrl = finalPath + queryString;
    
    // Update request properties for Express
    // Express uses these properties to match routes
    req.url = fullUrl;
    req.path = finalPath;
    req.originalUrl = fullUrl;
    
    // Log for debugging
    console.log('[Vercel Handler]', {
      method: req.method,
      originalPath: requestPath,
      finalPath: finalPath,
      fullUrl: fullUrl,
      query: req.query
    });
    
    // Handle the request with Express app
    // Express will match routes and send JSON responses
    app(req, res, (err) => {
      if (err) {
        console.error('[Express Error]', err);
        if (!res.headersSent) {
          res.status(500).json({
            error: 'Internal Server Error',
            detail: err.message
          });
        }
      }
    });
  } catch (error) {
    console.error('[Vercel Handler Error]', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal Server Error',
        detail: error.message,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
      });
    }
  }
}

