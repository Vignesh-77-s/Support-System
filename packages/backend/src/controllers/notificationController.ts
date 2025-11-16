import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import Notification from "../models/Notification";
import { sendMassNotificationEmail } from "../utils/emailService";
import { Notification as INotification } from "../../../frontend/src/types";

// @desc    Fetch all notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = asyncHandler(
  async (req: Request, res: Response) => {
    const notifications = await Notification.find({}).sort({ createdAt: -1 });
    res.json(notifications);
  }
);

// @desc    Create a notification
// @route   POST /api/notifications
// @access  Private/Manager or Admin
export const createNotification = asyncHandler(
  async (req: Request, res: Response) => {
    const { title, message, type, priority, audience } = req.body;

    if (!req.user) {
      res.status(401);
      throw new Error("User not authenticated");
    }

    const notification = new Notification({
      title,
      message,
      type,
      priority,
      sender: req.user.name,
      timestamp: new Date().toLocaleString("en-GB"),
    });
    console.log(notification, "---notification");
    const createdNotification = await notification.save();
    console.log(createdNotification, "---createdNotification");
    // Send mass email notification
    // Fix: Convert Mongoose document to plain object to match INotification type
    await sendMassNotificationEmail(
      createdNotification.toJSON() as INotification,
      audience || "Everyone"
    );
    console.log("----->");
    res.status(201).json(createdNotification);
  }
);
// @desc    Mark a single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
export const markNotificationAsRead = asyncHandler(
  async (req: Request, res: Response) => {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      res.status(404);
      throw new Error("Notification not found");
    }

    // Update the notification to mark it as read
    notification.isRead = true;
    notification.readAt = new Date();

    const updatedNotification = await notification.save();

    res.json({
      _id: updatedNotification._id,
      title: updatedNotification.title,
      message: updatedNotification.message,
      type: updatedNotification.type,
      priority: updatedNotification.priority,
      isRead: updatedNotification.isRead,
      readAt: updatedNotification.readAt,
      sender: updatedNotification.sender,
      timestamp: updatedNotification.timestamp,
      // createdAt: updatedNotification.createdAt,
      // updatedAt: updatedNotification.updatedAt
    });
  }
);

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
export const markAllNotificationsAsRead = asyncHandler(
  async (req: Request, res: Response) => {
    // Update all notifications that are not read
    const result = await Notification.updateMany(
      { isRead: { $ne: true } }, // Find all unread notifications
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    res.json({
      message: `Successfully marked ${result.modifiedCount} notifications as read`,
      modifiedCount: result.modifiedCount,
    });
  }
);
