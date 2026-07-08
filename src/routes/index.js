import { Router } from 'express';
import healthRouter from './health.routes.js';
import authRouter from './auth.routes.js';
import doctorRouter from './doctor.routes.js';
import appointmentRouter from './appointment.routes.js';
import medicalRecordRouter from './medicalRecord.routes.js';
import adminRouter from './admin.routes.js';

const router = Router();

// Mount individual domain routers
router.use('/', healthRouter);
router.use('/auth', authRouter);
router.use('/doctors', doctorRouter);
router.use('/appointments', appointmentRouter);
router.use('/medical-records', medicalRecordRouter);
router.use('/admin', adminRouter);

export default router;
