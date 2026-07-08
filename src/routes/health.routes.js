import { Router } from 'express';
import { sendSuccess } from '../utils/responseHelper.js';
import sequelize from '../config/db.js';

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health Check Endpoint
 *     description: Returns the status of the backend API and database connection.
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: Server is healthy.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Server is healthy
 *                 data:
 *                   type: object
 *                   properties:
 *                     uptime:
 *                       type: number
 *                       example: 4.5219
 *                     database:
 *                       type: string
 *                       example: connected
 *                     timestamp:
 *                       type: string
 *                       example: "2026-07-07T12:00:00.000Z"
 *       500:
 *         description: Database or server connectivity failed.
 */
router.get('/health', async (req, res, next) => {
  try {
    // Authenticate database connectivity
    await sequelize.authenticate();
    
    return sendSuccess(res, {
      uptime: process.uptime(),
      database: 'connected',
      timestamp: new Date()
    }, 'Server is healthy');
  } catch (error) {
    // Pass to global error handler or construct error
    const err = new Error('Database connection failed during health check');
    err.statusCode = 500;
    err.errors = [error.message];
    return next(err);
  }
});

export default router;
