import { Router } from 'express';
import { getTickets, createTicket, updateTicket } from '../controllers/ticketController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.route('/').get(protect, getTickets).post(protect, createTicket);
router.route('/:id').patch(protect, updateTicket);

export default router;