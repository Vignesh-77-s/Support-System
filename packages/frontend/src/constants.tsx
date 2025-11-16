import React from "react";
import {
  UserRole,
  TicketStatus,
  TicketPriority,
  ProductCategory,
  AuditLogAction,
} from "./types";
import {
  LayoutDashboard,
  Ticket,
  Users,
  Box,
  Bell,
  FileText,
  MessageSquare,
  Send,
  BellRing,
  Building2,
  Palette,
  History,
} from "lucide-react";

export const ROLE_COLORS: Record<UserRole, string> = {
  Admin: "bg-purple-100 text-purple-800",
  "Support Manager": "bg-blue-100 text-blue-800",
  "Support Agent": "bg-green-100 text-green-800",
  "Technical Lead": "bg-yellow-100 text-yellow-800",
  Merchant: "bg-gray-100 text-gray-800",
};

export const STATUS_COLORS: Record<string, string> = {
  Active: "bg-green-100 text-green-800",
  Inactive: "bg-gray-100 text-gray-800",
  [TicketStatus.New]: "bg-blue-100 text-blue-800",
  [TicketStatus.InProgress]: "bg-yellow-100 text-yellow-800",
  [TicketStatus.Escalated]: "bg-orange-100 text-orange-800",
  [TicketStatus.Resolved]: "bg-green-100 text-green-800",
  [TicketStatus.Closed]: "bg-gray-100 text-gray-800",
};

export const PRIORITY_BADGE_COLORS: Record<TicketPriority, string> = {
  [TicketPriority.Low]: "bg-gray-100 text-gray-800",
  [TicketPriority.Medium]: "bg-yellow-100 text-yellow-800",
  [TicketPriority.High]: "bg-orange-100 text-orange-800",
  [TicketPriority.Critical]: "bg-red-100 text-red-800",
};

export const PRODUCT_CATEGORY_COLORS: Record<ProductCategory, string> = {
  [ProductCategory.Software]: "text-blue-500",
  [ProductCategory.Hardware]: "text-red-500",
  [ProductCategory.Services]: "text-purple-500",
};

export const BRAND_COLORS = [
  "#5B5FE3", // neokred-primary
  "#EF4444", // red-500
  "#22C55E", // green-500
  "#F59E0B", // amber-500
  "#8B5CF6", // violet-500
  "#06B6D4", // cyan-500
  "#F97316", // orange-500
  "#84CC16", // lime-500
];

export const ICONS = {
  dashboard: <LayoutDashboard size={20} />,
  tickets: <Ticket size={20} />,
  users: <Users size={20} />,
  products: <Box size={20} />,
  notifications: <Bell size={20} />,
  file: <FileText size={20} className="text-gray-500" />,
  comment: <MessageSquare size={16} />,
  send: <Send size={16} />,
  notificationBell: <BellRing size={20} className="text-blue-600" />,
  productIcon: <Building2 size={24} className="text-white" />,
  colorPalette: <Palette size={16} />,
  auditLog: <History size={20} />,
};

export const AUDIT_ACTION_COLORS: Record<AuditLogAction, string> = {
  [AuditLogAction.USER_LOGIN]: "bg-green-100 text-green-800",
  [AuditLogAction.USER_LOGOUT]: "bg-gray-100 text-gray-800",
  [AuditLogAction.TICKET_CREATE]: "bg-blue-100 text-blue-800",
  [AuditLogAction.TICKET_STATUS_UPDATE]: "bg-yellow-100 text-yellow-800",
  [AuditLogAction.TICKET_ASSIGNMENT]: "bg-indigo-100 text-indigo-800",
  [AuditLogAction.PRODUCT_CREATE]: "bg-purple-100 text-purple-800",
  [AuditLogAction.PRODUCT_UPDATE]: "bg-pink-100 text-pink-800",
  [AuditLogAction.USER_CREATE]: "bg-teal-100 text-teal-800",
  [AuditLogAction.USER_UPDATE]: "bg-orange-100 text-orange-800",
};
