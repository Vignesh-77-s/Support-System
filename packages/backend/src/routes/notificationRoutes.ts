import { Router } from "express";
import {
  getNotifications,
  createNotification,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../controllers/notificationController";
import { protect, supportManagerOrAdmin } from "../middleware/authMiddleware";

const router = Router();

router
  .route("/")
  .get(protect, getNotifications)
  .post(protect, supportManagerOrAdmin, createNotification);
router.route("/read-all").patch(protect, markAllNotificationsAsRead);
router.route("/:id/read").patch(protect, markNotificationAsRead);
export default router;
