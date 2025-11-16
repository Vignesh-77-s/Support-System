import { Router } from 'express';
import { authUser } from '../controllers/authController';

const router = Router();

router.post('/login', authUser);

export default router;