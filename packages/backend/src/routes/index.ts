import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import productRoutes from './productRoutes';
import ticketRoutes from './ticketRoutes';
import notificationRoutes from './notificationRoutes';
import auditLogRoutes from './auditLogRoutes';
import dashboardRoutes from './dashboardRoutes';
import escalationRoutes from './escalationRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/tickets', ticketRoutes);
router.use('/notifications', notificationRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/escalation', escalationRoutes);

export default router;
