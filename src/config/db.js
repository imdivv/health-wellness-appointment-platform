import { Sequelize } from 'sequelize';
import { env } from './env.js';

const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: env.db.dialect,
  logging: env.nodeEnv === 'development' ? (msg) => console.log(`[Sequelize] ${msg}`) : false,
  dialectOptions: {
    options: {
      encrypt: true, // Required for Azure SQL Database
      trustServerCertificate: true // Allow self-signed certificates for local development
    }
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✔ Connection to Azure SQL Database has been established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    throw error;
  }
};

export default sequelize;
