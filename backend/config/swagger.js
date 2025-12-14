import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sahni Tata Backend API',
      version: '1.0.0',
      description: 'Backend API for Sahni Tata application with Products, Vehicles, Showrooms, Fuel Stations, Home Video, and About Us management',
      contact: {
        name: 'API Support',
        email: 'support@sahni.com'
      }
    },
    servers: [
      {
        url: '/',
        description: 'Current server (relative URL - uses same host/port as Swagger UI)'
      },
      {
        url: process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}` 
          : process.env.API_GATEWAY_URL || 'http://localhost:3001',
        description: process.env.VERCEL 
          ? 'Vercel Production server' 
          : process.env.NODE_ENV === 'production' 
            ? 'Production server' 
            : 'Development server (default)'
      },
      {
        url: 'http://localhost:3001',
        description: 'Local development server (port 3001)'
      },
      {
        url: 'http://localhost:3030',
        description: 'Local development server (port 3030)'
      },
      {
        url: 'https://sahni-tata.vercel.app',
        description: 'Vercel Production'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js', './server.js']
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;

