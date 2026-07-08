import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { env } from '../config/env.js';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Health and Wellness Appointment Scheduling Platform API',
      version: '1.0.0',
      description: 'Enterprise-grade Node.js/Express.js backend for scheduling health appointments, managing records, and processing reminders on Azure.',
      contact: {
        name: 'API Development Team'
      }
    },
    servers: [
      {
        url: `http://localhost:${env.port}/api/v1`,
        description: 'Local Development Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  // Absolute paths to search for JSDoc documentation
  apis: ['./src/routes/*.js', './src/controllers/*.js']
};

const swaggerSpec = swaggerJSDoc(options);

/**
 * Mounts Swagger UI to the provided Express application.
 * @param {Object} app - Express application instance
 */
export const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

export default setupSwagger;
