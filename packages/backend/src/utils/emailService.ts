import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";
import User from "../models/User";
import { Notification as INotification } from "../../../frontend/types";
import { ITicketModel } from "../models/Ticket";

// Check if environment variables are loaded
console.log("Email User:", process.env.EMAIL_USER ? "Loaded" : "Missing");
console.log("Email Pass:", process.env.EMAIL_PASS ? "Loaded" : "Missing");

// Create transporter with better error handling
const transporter = nodemailer.createTransport({
  // service: "gmail",
  service: "gmail",
  host: "smtp.gmail.com",
  // port: 465, // or 587 with secure: false
  // secure: true,
  port: 587, // Use 587 for better compatibility
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter connection
transporter.verify(function (error, success) {
  if (error) {
    console.log("Email transporter error:", error);
  } else {
    console.log("Email server is ready to take messages");
  }
});

const sendEmail = async (
  to: string | string[],
  subject: string,
  body: string,
  html?: string
) => {
  try {
    // Check if credentials exist
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("Email credentials are missing. Check your .env file");
    }

    const mailOptions = {
      from: {
        name: "NeokRED Support Portal",
        address: process.env.EMAIL_USER!,
      },
      to: Array.isArray(to) ? to.join(", ") : to,
      subject: subject,
      text: body,
      html: html || convertToHTML(body),
    };

    console.log("Attempting to send email to:", mailOptions.to);
    const result = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", result.messageId);
    return result;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
};

// Helper function to convert plain text to basic HTML
const convertToHTML = (text: string): string => {
  return text
    .split("\n")
    .map((line) => {
      if (line.trim() === "") return "<br>";
      return `<p style="margin: 8px 0;">${line}</p>`;
    })
    .join("");
};

// HTML template for consistent email styling
const getEmailTemplate = (content: string, title?: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .ticket-info { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #667eea; border-radius: 4px; }
        .footer { text-align: center; margin-top: 20px; padding: 20px; color: #666; font-size: 12px; }
        .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
        .priority-critical { color: #82190dff; font-weight: bold; }
        .priority-high { color: #e74c3c; font-weight: bold; }
        .priority-medium { color: #f39c12; font-weight: bold; }
        .priority-low { color: #27ae60; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${title || "NeokRED Support Portal"}</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>This is an automated message from NeokRED Support Portal.</p>
          <p>Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const getPriorityClass = (priority: string): string => {
  switch (priority.toLowerCase()) {
    case "high":
      return "priority-high";
    case "medium":
      return "priority-medium";
    case "low":
      return "priority-low";
    case "critical":
      return "priority-critical";
    default:
      return "";
  }
};

export const sendTicketCreationEmail = async (ticket: ITicketModel) => {
  try {
    const supportTeam = await User.find({
      role: {
        $in: ["Support Agent", "Support Manager", "Technical Lead", "Admin"],
      },
    });
    const recipientEmails = supportTeam.map((user) => user.email);

    if (recipientEmails.length > 0) {
      await ticket.populate<{ createdBy: { name: string; email: string } }>(
        "createdBy",
        "name email"
      );
      const creator = ticket.createdBy as any;

      const subject = `🚨 New Support Ticket #${ticket.id}: ${ticket.title}`;

      const textBody = `
NEW SUPPORT TICKET CREATED

Ticket ID: ${ticket.id}
Title: ${ticket.title}
Created By: ${creator.name} (${creator.email})
Priority: ${ticket.priority}
Category: ${ticket.category || "Not specified"}
Created: ${ticket.createdAt.toLocaleString()}

Description:
${ticket.description}

Please review and assign this ticket in the NeokRED Support Portal to ensure timely resolution.

Best regards,
NeokRED Support System
`;

      const htmlContent = `
        <h2>New Support Ticket Created</h2>
        <div class="ticket-info">
          <p><strong>Ticket ID:</strong> ${ticket.id}</p>
          <p><strong>Title:</strong> ${ticket.title}</p>
          <p><strong>Created By:</strong> ${creator.name} (${creator.email})</p>
          <p><strong>Priority:</strong> <span class="${getPriorityClass(
            ticket.priority
          )}">${ticket.priority}</span></p>
          <p><strong>Category:</strong> ${
            ticket.category || "Not specified"
          }</p>
          <p><strong>Created:</strong> ${ticket.createdAt.toLocaleString()}</p>
        </div>
        
        <div class="ticket-info">
          <p><strong>Description:</strong></p>
          <p>${ticket.description}</p>
        </div>
        
        <p>Please review and assign this ticket in the NeokRED Support Portal to ensure timely resolution.</p>
        
        <a href="#" class="button">View Ticket in Portal</a> <!-- Link of the ticket need to be in the href -->
        
        <p><em>This ticket requires attention from the support team.</em></p>
      `;

      await sendEmail(
        recipientEmails,
        subject,
        textBody,
        getEmailTemplate(htmlContent, "New Support Ticket")
      );
    }
  } catch (error) {
    console.error("Failed to send ticket creation email:", error);
  }
};

export const sendTicketUpdateEmail = async (ticket: ITicketModel) => {
  try {
    await ticket.populate<{ createdBy: { name: string; email: string } }>(
      "createdBy",
      "name email"
    );
    await ticket.populate<{
      assignedTo: { name: string; email: string } | null;
    }>("assignedTo", "name email");

    const creator = ticket.createdBy as any;
    const assignee = ticket.assignedTo as any;

    if (creator && creator.email) {
      const subject = `📝 Update on Ticket #${ticket.id}: ${ticket.title}`;

      const lastComment = ticket.comments[ticket.comments.length - 1];

      const textBody = `
TICKET UPDATE NOTIFICATION

Hello ${creator.name},

Your support ticket has been updated:

Ticket ID: ${ticket.id}
Title: ${ticket.title}
Status: ${ticket.status}
Priority: ${ticket.priority}
Assigned To: ${assignee?.name || "Unassigned"}${
        assignee?.email ? ` (${assignee.email})` : ""
      }

${
  lastComment && lastComment.content
    ? `
Latest Comment:
"${lastComment.content}"
- ${lastComment.user.name}
`
    : ""
}

You can view the complete details and history of your ticket in the NeokRED Support Portal.

If you have any questions, please respond to this email or contact our support team.

Best regards,
NeokRED Support Team
`;

      const htmlContent = `
        <h2>Ticket Update Notification</h2>
        <p>Hello <strong>${creator.name}</strong>,</p>
        
        <p>Your support ticket has been updated. Here are the current details:</p>
        
        <div class="ticket-info">
          <p><strong>Ticket ID:</strong> ${ticket.id}</p>
          <p><strong>Title:</strong> ${ticket.title}</p>
          <p><strong>Status:</strong> ${ticket.status}</p>
          <p><strong>Priority:</strong> <span class="${getPriorityClass(
            ticket.priority
          )}">${ticket.priority}</span></p>
          <p><strong>Assigned To:</strong> ${assignee?.name || "Unassigned"}${
        assignee?.email ? ` (${assignee.email})` : ""
      }</p>
        </div>

        ${
          lastComment && lastComment.content
            ? `
        <div class="ticket-info">
          <p><strong>Latest Comment:</strong></p>
          <p>"${lastComment.content}"</p>
          <p><em>- ${lastComment.user.name}</em></p>
        </div>
        `
            : ""
        }

        <p>You can view the complete details and history of your ticket in the NeokRED Support Portal.</p>
        
        <a href="#" class="button">View Ticket Details</a>
        
        <p>If you have any questions, please respond to this email or contact our support team.</p>
      `;

      await sendEmail(
        creator.email,
        subject,
        textBody,
        getEmailTemplate(htmlContent, "Ticket Update")
      );
    }
  } catch (error) {
    console.error("Failed to send ticket update email:", error);
  }
};

export const sendMassNotificationEmail = async (
  notification: INotification,
  audience: string
) => {
  try {
    let query = {};
    let audienceDisplayName = "";

    switch (audience) {
      case "Everyone":
        query = {};
        audienceDisplayName = "All Users";
        break;
      case "Merchants":
        query = { role: "Merchant" };
        audienceDisplayName = "Merchants";
        break;
      case "Support Team":
        query = {
          role: {
            $in: [
              "Support Agent",
              "Support Manager",
              "Technical Lead",
              "Admin",
            ],
          },
        };
        audienceDisplayName = "Support Team";
        break;
      case "Admins":
        query = { role: "Admin" };
        audienceDisplayName = "Administrators";
        break;
    }

    const recipients = await User.find(query);
    const recipientEmails = recipients.map((user) => user.email);

    if (recipientEmails.length > 0) {
      const subject = `📢 ${notification.type === "Alert" ? "🚨 " : ""}${
        notification.title
      }`;

      const textBody = `
IMPORTANT NOTIFICATION

Audience: ${audienceDisplayName}
Type: ${notification.type}
Title: ${notification.title}

Message:
${notification.message}

This is an important notification from NeokRED Support Portal.

Thank you,
NeokRED Team
`;

      const htmlContent = `
        <h2>Important Notification</h2>
        
        <div class="ticket-info">
          <p><strong>Audience:</strong> ${audienceDisplayName}</p>
          <p><strong>Type:</strong> ${notification.type}</p>
          <p><strong>Title:</strong> ${notification.title}</p>
        </div>
        
        <div class="ticket-info">
          <p><strong>Message:</strong></p>
          <p>${notification.message.replace(/\n/g, "<br>")}</p>
        </div>
        
        <p><em>This is an important notification from NeokRED Support Portal.</em></p>
        
        ${
          notification.type === "Alert"
            ? '<p style="color: #e74c3c; font-weight: bold;">⚠️ Please pay special attention to this alert.</p>'
            : ""
        }
      `;

      await sendEmail(
        recipientEmails,
        subject,
        textBody,
        getEmailTemplate(htmlContent, "Official Notification")
      );
    }
  } catch (error) {
    console.error("Failed to send mass notification email:", error);
  }
};
