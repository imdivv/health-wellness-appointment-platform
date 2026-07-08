import dotenv from 'dotenv';
dotenv.config();

const requiredEnv = ['JWT_SECRET'];

// Validate critical environment variables
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`[CONFIG ERROR] Missing critical environment variable: ${key}`);
    process.exit(1);
  }
}

export const env = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    name: process.env.DB_NAME || 'health_wellness_db',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT, 10) || 1433,
    dialect: 'mssql'
  },
  azure: {
    storageConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
    storageContainerName: process.env.AZURE_STORAGE_CONTAINER_NAME || 'medical-records',
    communicationConnectionString: process.env.AZURE_COMMUNICATION_CONNECTION_STRING
  }
};
