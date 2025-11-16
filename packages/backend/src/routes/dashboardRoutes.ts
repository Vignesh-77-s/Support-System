import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.route('/stats').get(protect, getDashboardStats);

export default router;