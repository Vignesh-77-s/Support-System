// routes/escalationRoutes.ts
import { Router } from "express";
import { protect, admin } from "../middleware/authMiddleware";
import {
  
  checkMultiLevelEscalations,
  getEscalationRules,
  saveEscalationRules,
} from "../controllers/escalationController";

const router = Router();

router
  .route("/escalation-rules")
  .get(protect, admin, getEscalationRules)
  .post(protect, admin, saveEscalationRules);

router
  .route("/check-escalations")
  .get(protect, admin, checkMultiLevelEscalations); // Replace the old one

// Or keep both for backward compatibility
router
  .route("/check-multi-level-escalations")
  .get(protect, admin, checkMultiLevelEscalations);

export default router;
