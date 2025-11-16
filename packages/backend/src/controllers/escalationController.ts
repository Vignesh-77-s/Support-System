// controllers/escalationController.ts
import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import EscalationRule from "../models/EscalationRule"; // You'll need to create this model
import Ticket from "../models/Ticket";
import User from "../models/User";
import { sendTicketUpdateEmail } from "../utils/emailService";
import { AuditLogAction } from "../../../frontend/src/types";
import AuditLog from "../models/AuditLog";

// @desc    Get all escalation rules
// @route   GET /api/escalation-rules
// @access  Private/Admin
export const getEscalationRules = asyncHandler(
  async (req: Request, res: Response) => {
    const rules = await EscalationRule.find({}).sort({ createdAt: -1 });
    res.json(rules);
  }
);

// @desc    Save escalation rules
// @route   POST /api/escalation-rules
// @access  Private/Admin
export const saveEscalationRules = asyncHandler(
  async (req: Request, res: Response) => {
    const { rules } = req.body;

    // Clear existing rules and save new ones
    await EscalationRule.deleteMany({});
    const savedRules = await EscalationRule.insertMany(rules);

    res.json({
      message: "Escalation rules saved successfully",
      rules: savedRules,
    });
  }
);

// @desc    Check and perform escalations
// @route   GET /api/check-escalations
// @access  Private/Admin
// controllers/escalationController.ts
export const checkMultiLevelEscalations = asyncHandler(
  async (req: Request, res: Response) => {
    const rules = await EscalationRule.find({}).sort({ timeInHours: 1 }); // Sort by time ascending

    if (rules.length === 0) {
      res.json({ message: "No escalation rules defined", escalatedCount: 0 });
      return;
    }

    const tickets = await Ticket.find({
      status: { $nin: ["Resolved", "Closed"] }, // Only non-resolved/closed tickets
    })
      .populate("createdBy", "id name email role")
      .populate("assignedTo", "id name email role");

    const users = await User.find({});
    let escalatedCount = 0;
    const now = new Date();

    const escalationPromises = tickets.map(async (ticket) => {
      // Find all applicable rules for this ticket's priority
      const applicableRules = rules.filter(
        (rule) => rule.priority === ticket.priority
      );

      if (applicableRules.length === 0) {
        return null;
      }

      const lastUpdated = new Date(ticket.updatedAt);
      const hoursSinceUpdate =
        (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

      // Find the appropriate escalation level based on time
      let escalationRuleToApply = null;

      for (const rule of applicableRules) {
        if (hoursSinceUpdate > rule.timeInHours) {
          // Check if ticket is already assigned to this role (prevent circular escalation)
          const currentAssigneeRole = ticket.assignedTo?.role;
          if (currentAssigneeRole !== rule.escalateToRole) {
            escalationRuleToApply = rule;
          }
        } else {
          break; // Rules are sorted by time, so we can break early
        }
      }

      if (!escalationRuleToApply) {
        return null;
      }

      const targetUser = users.find(
        (u) => u.role === escalationRuleToApply!.escalateToRole
      );

      if (targetUser) {
        escalatedCount++;

        // Update ticket
        const updatedTicket = await Ticket.findOneAndUpdate(
          { id: ticket.id },
          {
            status: "Escalated",
            assignedTo: targetUser._id,
            updatedAt: new Date().toLocaleString("en-GB"),
            escalationLevel: escalationRuleToApply.escalateToRole, // Track escalation level
          },
          { new: true }
        )
          .populate("products")
          .populate("createdBy", "id name email role")
          .populate("assignedTo", "id name email role");

        // Create audit log
        await AuditLog.create({
          user: {
            id: req.user?._id || "system",
            name: req.user?.name || "System",
            role: req.user?.role || "System",
          },
          action: AuditLogAction.TICKET_ESCALATED,
          details: `Ticket ${ticket.id} escalated to ${targetUser.name} (${
            targetUser.role
          }) after ${hoursSinceUpdate.toFixed(1)} hours.`,
          timestamp: new Date().toLocaleString("en-GB"),
          metadata: {
            ticketId: ticket.id,
            previousAssignee: ticket.assignedTo?.name,
            newAssignee: targetUser.name,
            escalationRole: escalationRuleToApply.escalateToRole,
            hoursSinceUpdate: hoursSinceUpdate.toFixed(1),
            priority: ticket.priority,
          },
        });

        // Send email notification
        try {
          await sendTicketUpdateEmail(updatedTicket!);
        } catch (emailError) {
          console.error("Failed to send escalation email:", emailError);
        }

        return updatedTicket;
      }
      return null;
    });

    const results = await Promise.all(escalationPromises);
    const escalatedTickets = results.filter((ticket) => ticket !== null);

    res.json({
      message: `${escalatedCount} tickets escalated successfully`,
      escalatedCount,
      escalatedTickets,
    });
  }
);
