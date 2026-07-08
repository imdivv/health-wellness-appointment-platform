import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import { env } from './config/env.js';
import routes from './routes/index.js';
import { setupSwagger } from './swagger/swagger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

// Morgan request logging setup
const morganFormat = env.nodeEnv === 'development' ? 'dev' : 'combined';
app.use(morgan(morganFormat));

// Helmet for setting secure HTTP response headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));

// JSON body parser and URL-encoded body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount Swagger documentation UI
setupSwagger(app);

// Mount core API endpoints
app.use('/api/v1', routes);

// Handle unknown API requests (404)
app.use(notFoundHandler);

// Global Error Handler middleware
app.use(errorHandler);

export default app;
