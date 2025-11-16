import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import Ticket from "../models/Ticket";
import { TicketStatus, TicketPriority } from "../../../frontend/src/types";

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
export const getDashboardStats = asyncHandler(
  async (req: Request, res: Response) => {
    const totalTickets = await Ticket.countDocuments();
    const newTickets = await Ticket.countDocuments({
      status: TicketStatus.New,
    });
    const inProgressTickets = await Ticket.countDocuments({
      status: TicketStatus.InProgress,
    });
    const closedTickets = await Ticket.countDocuments({
      status: TicketStatus.Closed,
    });
    const highPriorityTickets = await Ticket.countDocuments({
      priority: TicketPriority.High,
    });

    res.json({
      totalTickets,
      newTickets,
      closedTickets,
      inProgressTickets,
      highPriorityTickets,
    });
  }
);
