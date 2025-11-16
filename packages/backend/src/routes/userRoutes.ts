import { Router } from "express";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/userController";
import { protect, admin } from "../middleware/authMiddleware";

const router = Router();

router
  .route("/")
  .get(protect, admin, getUsers)
  .post(protect, admin, createUser);
router
  .route("/:id")
  .put(protect, admin, updateUser)
  .delete(protect, admin, deleteUser);
// Add this to your userRoutes.ts or create a test route
// router.get('/test-email', protect, admin, async (req: Request, res: Response) => {
//     try {
//         const { sendTestEmail } = await import('../utils/emailService');
//         await sendTestEmail();
//         res.json({ message: 'Test email sent successfully' });
//     } catch (error) {
//         console.error('Email test failed:', error);
//         res.status(500).json({ error: 'Email test failed' });
//     }
// });
export default router;
