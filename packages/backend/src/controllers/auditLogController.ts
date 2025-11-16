import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import AuditLog from "../models/AuditLog";

// @desc    Fetch all audit logs
// @route   GET /api/audit-logs
// @access  Private/Admin
export const getAuditLogs = asyncHandler(
  async (req: Request, res: Response) => {
    const logs = await AuditLog.find({}).sort({ createdAt: -1 });
    res.json(logs);
  }
);

export const exportAuditLogs = asyncHandler(
  async (req: Request, res: Response) => {
    const logs = await AuditLog.find({}).sort({ timestamp: -1 });

    // Set headers for CSV download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=audit-logs.csv");

    // Create CSV content - matching your schema fields
    const csvHeaders = "Timestamp,User ID,User Name,User Role,Action,Details\n";

    const csvRows = logs
      .map((log) => {
        const timestamp = log.timestamp || "N/A";
        const userId = log.user?.id || "N/A";
        const userName = log.user?.name || "N/A";
        const userRole = log.user?.role || "N/A";
        const action = log.action || "N/A";
        const details = (log.details || "N/A").replace(/"/g, '""'); // Escape quotes for CSV

        return `"${timestamp}","${userId}","${userName}","${userRole}","${action}","${details}"`;
      })
      .join("\n");

    const csvContent = csvHeaders + csvRows;
    res.send(csvContent);
  }
);

// @desc    Create a new audit log
// @route   POST /api/audit-logs
// @access  Private
export const createAuditLog = asyncHandler(
  async (req: Request, res: Response) => {
    const { action, details } = req.body;

    if (!action) {
      res.status(400);
      throw new Error("Action is required");
    }

    const auditLog = await AuditLog.create({
      user: {
        id: req.user?._id,
        name: req.user?.name,
        role: req.user?.role,
      },
      action,
      details,
      timestamp: new Date(),
    });

    res.status(201).json({
      message: "Audit log created successfully",
      auditLog,
    });
  }
);
