import serverlessHttp from 'serverless-http';
import app from './server.js';

// Wrap Express app with serverless-http
const serverlessHandler = serverlessHttp(app, {
  request(request, event, context) {
    // Ensure CORS headers are set for all requests
    request.headers = request.headers || {};
    // Preserve original origin for CORS
    if (event.headers && event.headers.origin) {
      request.headers.origin = event.headers.origin;
    }
  },
  response(response, event, context) {
    // Add CORS headers to all responses
    const origin = event.headers?.origin || event.headers?.Origin || '*';
    const allowedOrigins = [
      '*',
      'https://sahniauto.com',
      'https://www.sahniauto.com',
      'https://sahni-tata.vercel.app',
      'http://localhost:5173'
    ];
    
    const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
    
    response.headers = response.headers || {};
    response.headers['Access-Control-Allow-Origin'] = allowedOrigin;
    response.headers['Access-Control-Allow-Credentials'] = 'true';
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS,PATCH';
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,Accept,Origin,X-Requested-With';
  }
});

// Export handler for Lambda
export const handler = serverlessHandler;

