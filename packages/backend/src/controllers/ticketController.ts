import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import Ticket from "../models/Ticket";
import {
  sendTicketCreationEmail,
  sendTicketUpdateEmail,
} from "../utils/emailService";

// @desc    Fetch all tickets
// @route   GET /api/tickets
// @access  Private
export const getTickets = asyncHandler(async (req: Request, res: Response) => {
  let query = {};
  if (req.user?.role === "Merchant") {
    // @ts-ignore
    query = { createdBy: req.user._id };
  }
  const tickets = await Ticket.find(query)
    .populate("products")
    .populate("createdBy", "id name email role")
    .populate("assignedTo", "id name email role")
    .sort({ createdAt: -1 });

  res.json(tickets);
});

// @desc    Create a ticket
// @route   POST /api/tickets
// @access  Private
export const createTicket = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      res.status(401);
      throw new Error("User not authenticated");
    }

    const ticketData = req.body;
    console.log(ticketData, "--->ticketData");
    // Extract only product IDs from the products array
    const productIds =
      ticketData.products?.map((product: any) => product.id) || [];

    const ticket = new Ticket({
      ...ticketData,
      products: productIds, // Replace full objects with just IDs
      // @ts-ignore
      createdBy: req.user._id,
    });
    console.log(ticket, "----ticket");
    // const createdTicket = await ticket.save();
    const createdTicket = await Ticket.create(ticket);
    console.log(createdTicket, "----createdTicket");
    // Send email notification
    await sendTicketCreationEmail(createdTicket);

    // Populate fields before sending back to client
    const populatedTicket = await Ticket.findById(createdTicket._id)
      .populate("products")
      .populate("createdBy", "id name email role")
      .populate("assignedTo", "id name email role");

    res.status(201).json(populatedTicket);
    console.log("------>>>exit");
  }
);

// @desc    Update a ticket
// @route   PUT /api/tickets/:id
// @access  Private
// export const updateTicket = asyncHandler(
//   async (req: Request, res: Response) => {
//     const ticket = await Ticket.findOne({ id: req.params.id });

//     if (ticket) {
//       const hasCommentUpdate =
//         req.body.comments && req.body.comments.length > ticket.comments.length;

//       // Only update fields that are present in the request
//       if (req.body.status !== undefined) ticket.status = req.body.status;
//       if (req.body.assignedTo !== undefined) {
//         ticket.assignedTo = req.body.assignedTo;
//       }
//       if (req.body.comments !== undefined) ticket.comments = req.body.comments;

//       ticket.updatedAt = new Date().toLocaleString("en-GB");

//       const updatedTicket = await ticket.save();

//       // Send email notification on significant updates
//       if (
//         req.body.status ||
//         req.body.assignedTo !== undefined ||
//         hasCommentUpdate
//       ) {
//         await sendTicketUpdateEmail(updatedTicket);
//       }

//       const populatedTicket = await Ticket.findById(updatedTicket._id)
//         .populate("products")
//         .populate("createdBy", "id name email role")
//         .populate("assignedTo", "id name email role");

//       res.json(populatedTicket);
//     } else {
//       res.status(404);
//       throw new Error("Ticket not found");
//     }
//   }
// );
export const updateTicket = asyncHandler(
  async (req: Request, res: Response) => {
    const ticket = await Ticket.findOne({ id: req.params.id });
    console.log(ticket, "====ticket");

    if (ticket) {
      const hasCommentUpdate =
        req.body.comments && req.body.comments.length > ticket.comments.length;

      // Only update fields that are present in the request
      if (req.body.status !== undefined) ticket.status = req.body.status;

      // Fix: Extract only the user ID from assignedTo object
      if (req.body.assignedTo !== undefined) {
        console.log("Raw assignedTo data:", req.body.assignedTo);

        // If assignedTo is an object with id property, use just the ID
        if (typeof req.body.assignedTo === "object" && req.body.assignedTo.id) {
          ticket.assignedTo = req.body.assignedTo.id;
        } else if (typeof req.body.assignedTo === "string") {
          // If it's already a string (ID), use it directly
          ticket.assignedTo = req.body.assignedTo;
        } else {
          // If it's null or undefined, set to null
          ticket.assignedTo = null;
        }

        console.log("Processed assignedTo:", ticket.assignedTo);
      }

      if (req.body.comments !== undefined) ticket.comments = req.body.comments;

      console.log(req.body.assignedTo, "==-----req.body.assignedTo");
      ticket.updatedAt = new Date().toLocaleString("en-GB");

      const updatedTicket = await ticket.save();
      console.log(updatedTicket, "------updatedTicket");

      // Send email notification on significant updates (but don't fail if email fails)
      try {
        if (
          req.body.status ||
          req.body.assignedTo !== undefined ||
          hasCommentUpdate
        ) {
          await sendTicketUpdateEmail(updatedTicket);
        }
      } catch (emailError) {
        console.error(
          "Email sending failed, but ticket was updated:",
          emailError
        );
        // Continue with the response even if email fails
      }

      const populatedTicket = await Ticket.findById(updatedTicket._id)
        .populate("products")
        .populate("createdBy", "id name email role")
        .populate("assignedTo", "id name email role");

      res.json(populatedTicket);
    } else {
      res.status(404);
      throw new Error("Ticket not found");
    }
  }
);
