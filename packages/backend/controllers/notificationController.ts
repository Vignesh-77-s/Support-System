import express from 'express';
import asyncHandler from 'express-async-handler';
import Notification from '../src/models/Notification';
import { sendMassNotificationEmail } from '../src/utils/emailService';

// @desc    Fetch all notifications
// @route   GET /api/notifications
// @access  Private
// Fix: Use express.Request and express.Response for correct typing
export const getNotifications = asyncHandler(async (req: express.Request, res: express.Response) => {
    const notifications = await Notification.find({}).sort({ createdAt: -1 });
    res.json(notifications);
});

// @desc    Create a notification
// @route   POST /api/notifications
// @access  Private/Manager or Admin
// Fix: Use express.Request and express.Response for correct typing
export const createNotification = asyncHandler(async (req: express.Request, res: express.Response) => {
    const { title, message, type, priority, audience } = req.body;
    
    if(!req.user){
        res.status(401);
        throw new Error("User not authenticated");
    }

    const notification = new Notification({
        title,
        message,
        type,
        priority,
        sender: req.user.name,
        timestamp: new Date().toLocaleString('en-GB'),
    });

    const createdNotification = await notification.save();

    // Send mass email notification
    await sendMassNotificationEmail(createdNotification, audience || 'Everyone');

    res.status(201).json(createdNotification);
});