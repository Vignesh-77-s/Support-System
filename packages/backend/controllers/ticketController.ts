import express from 'express';
import asyncHandler from 'express-async-handler';
import Ticket from '../models/Ticket';
import { sendTicketCreationEmail, sendTicketUpdateEmail } from '../src/utils/emailService';

// @desc    Fetch all tickets
// @route   GET /api/tickets
// @access  Private
export const getTickets = asyncHandler(async (req: express.Request, res: express.Response) => {
    let query = {};
    if (req.user?.role === 'Merchant') {
        // @ts-ignore
        query = { createdBy: req.user._id };
    }
    const tickets = await Ticket.find(query)
        .populate('products')
        .populate('createdBy', 'id name email role')
        .populate('assignedTo', 'id name email role');
        
    res.json(tickets);
});

// @desc    Create a ticket
// @route   POST /api/tickets
// @access  Private
export const createTicket = asyncHandler(async (req: express.Request, res: express.Response) => {
    if(!req.user) {
        res.status(401);
        throw new Error('User not authenticated');
    }
    
    const ticketData = req.body;
    const ticket = new Ticket({
       ...ticketData,
        // @ts-ignore
       createdBy: req.user._id
    });

    const createdTicket = await ticket.save();
    
    // Send email notification
    await sendTicketCreationEmail(createdTicket);
    
    // Populate fields before sending back to client
    const populatedTicket = await Ticket.findById(createdTicket._id)
        .populate('products')
        .populate('createdBy', 'id name email role')
        .populate('assignedTo', 'id name email role');

    res.status(201).json(populatedTicket);
});

// @desc    Update a ticket
// @route   PUT /api/tickets/:id
// @access  Private
export const updateTicket = asyncHandler(async (req: express.Request, res: express.Response) => {
    const ticket = await Ticket.findOne({id: req.params.id});

    if (ticket) {
        const hasCommentUpdate = req.body.comments && req.body.comments.length > ticket.comments.length;

        // Only update fields that are present in the request
        if (req.body.status !== undefined) ticket.status = req.body.status;
        if (req.body.assignedTo !== undefined) ticket.assignedTo = req.body.assignedTo;
        if (req.body.comments !== undefined) ticket.comments = req.body.comments;
        
        ticket.updatedAt = new Date().toLocaleString('en-GB');

        const updatedTicket = await ticket.save();
        
        // Send email notification on significant updates
        if (req.body.status || req.body.assignedTo || hasCommentUpdate) {
            await sendTicketUpdateEmail(updatedTicket);
        }
        
        const populatedTicket = await Ticket.findById(updatedTicket._id)
            .populate('products')
            .populate('createdBy', 'id name email role')
            .populate('assignedTo', 'id name email role');

        res.json(populatedTicket);
    } else {
        res.status(404);
        throw new Error('Ticket not found');
    }
});
