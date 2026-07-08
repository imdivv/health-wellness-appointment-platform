import app from './app.js';
import { env } from './config/env.js';
import sequelize, { connectDB } from './config/db.js';

// Load models to register associations before syncing
import './models/user.model.js';
import './models/doctor.model.js';
import './models/doctorAvailability.model.js';
import './models/appointment.model.js';
import './models/medicalRecord.model.js';
import './models/notification.model.js';
import reminderService from './services/reminder.service.js';

/**
 * Initializes and boots up the API server.
 */
const startServer = async () => {
  try {
    console.log('🔄 Initializing platform backend database connections...');
    
    // Connect and verify Azure SQL Database
    try {
      await connectDB();
      console.log('🔄 Synchronizing database tables...');
      await sequelize.sync();
      console.log('✔ Database synchronization complete.');
    } catch (dbError) {
      console.warn('⚠️ Warning: Could not connect to Azure SQL Database or sync tables. Server starting anyway...');
      console.error(dbError.message);
    }

    // Listen on configured port
    const server = app.listen(env.port, () => {
      console.log(`✔ Server running in ${env.nodeEnv.toUpperCase()} mode on port ${env.port}`);
      console.log(`✔ Swagger UI: http://localhost:${env.port}/api-docs`);
      
      // Start automated notification cron task
      reminderService.initializeCron();
    });

    // Handle graceful shutdowns for signals (e.g., Azure App Service, Docker deployments)
    const handleGracefulShutdown = (signal) => {
      console.log(`\n🔄 Received ${signal}. Shutting down application gracefully...`);
      server.close(() => {
        console.log('✔ Express HTTP server terminated.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start the server:', error.message);
    process.exit(1);
  }
};

startServer();
