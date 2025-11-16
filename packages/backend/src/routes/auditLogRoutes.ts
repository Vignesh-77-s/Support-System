import { Router } from "express";
import {
  createAuditLog,
  exportAuditLogs,
  getAuditLogs,
} from "../controllers/auditLogController";
import { protect, admin } from "../middleware/authMiddleware";

const router = Router();

router.route("/").get(protect, admin, getAuditLogs);
router.route("/export").get(protect, admin, exportAuditLogs);
router.route("/").post(protect, admin, createAuditLog);

export default router;
