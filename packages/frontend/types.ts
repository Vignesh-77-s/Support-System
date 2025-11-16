export type UserRole =
  | "Admin"
  | "Support Manager"
  | "Support Agent"
  | "Technical Lead"
  | "Merchant";

export enum TicketStatus {
  New = "New",
  InProgress = "In Progress",
  Escalated = "Escalated",
  Resolved = "Resolved",
  Closed = "Closed",
}

export enum TicketPriority {
  Low = "Low",
  Medium = "Medium",
  High = "High",
  Critical = "Critical",
}

export enum ProductCategory {
  Software = "Software",
  Hardware = "Hardware",
  Services = "Services",
}

export interface User {
  id: string;
  name: string;
  email: string;
  mobile?: string; // Made optional as it might not be in every context
  role: UserRole;
  status?: "Active" | "Inactive"; // Made optional
  createdAt?: string; // Made optional
  token?: string; // Added for auth
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  description: string;
  color: string;
  createdAt: string;
  status: "Active" | "Inactive";
}

export interface Attachment {
  name: string;
  size: string;
  type: "image" | "file";
  url?: string;
}

export interface Comment {
  id: string;
  user: Pick<User, "name" | "role"> | { name: "System"; role: "Admin" };
  content: string;
  timestamp: string;
  isSystem: boolean;
  attachments?: Attachment[];
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdBy: User;
  assignedTo: User | null;
  createdAt: string;
  updatedAt: string;
  slaDeadline: string;
  products: Product[];
  attachments: Attachment[];
  comments: Comment[];
}

export enum NotificationType {
  Announcement = "Announcement",
  FeatureRelease = "Feature Release",
  SystemUpdate = "System Update",
  Alert = "Alert",
}

export type NotificationAudience =
  | "Everyone"
  | "Admins"
  | "Merchants"
  | "Support Team";
export type NotificationPriority = "Low" | "Medium" | "High" | "Critical";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  sender: string;
  timestamp: string;
  isRead: boolean;
  attachments?: Attachment[];
}

export enum AuditLogAction {
  USER_LOGIN = "USER_LOGIN",
  USER_LOGOUT = "USER_LOGOUT",
  TICKET_CREATE = "TICKET_CREATE",
  TICKET_STATUS_UPDATE = "TICKET_STATUS_UPDATE",
  TICKET_PRIORITY_UPDATE = "TICKET_PRIORITY_UPDATE",
  TICKET_ASSIGNMENT = "TICKET_ASSIGNMENT",
  PRODUCT_CREATE = "PRODUCT_CREATE",
  PRODUCT_UPDATE = "PRODUCT_UPDATE",
  PRODUCT_DELETE = "PRODUCT_DELETE",
  USER_CREATE = "USER_CREATE",
  USER_UPDATE = "USER_UPDATE",
  USER_STATUS_UPDATE = "USER_STATUS_UPDATE",
  USER_CREATED = "USER_CREATED",
  USER_UPDATED = "USER_UPDATED",
  USER_DELETED = "USER_DELETED",
  TICKET_CREATED = "TICKET_CREATED",
  TICKET_UPDATED = "TICKET_UPDATED",
  TICKET_ESCALATED = "TICKET_ESCALATED",
  TICKET_DELETED = "TICKET_DELETED",
  TICKET_ASSIGNED = "TICKET_ASSIGNED",
  TICKET_RESOLVED = "TICKET_RESOLVED",
  TICKET_REOPENED = "TICKET_REOPENED",
  PAYMENT_PROCESSED = "PAYMENT_PROCESSED",
  NOTIFICATION_SENT = "NOTIFICATION_SENT",
  NOTIFICATION_READ = "NOTIFICATION_READ",
  ESCALATION_RULE_CREATED = "ESCALATION_RULE_CREATED",
  ESCALATION_RULE_DELETED = "ESCALATION_RULE_DELETED",
  ESCALATION_RULES_UPDATED = "ESCALATION_RULES_UPDATED",
  ESCALATION_RULES_CHECKED = "ESCALATION_RULES_CHECKED",
  ESCALATION_CHECK_PERFORMED = "ESCALATION_CHECK_PERFORMED",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  SETTINGS_UPDATED = "SETTINGS_UPDATED",
  REPORT_GENERATED = "REPORT_GENERATED",
  DATA_EXPORTED = "DATA_EXPORTED",
  PASSWORD_CHANGED = "PASSWORD_CHANGED",
  PROFILE_UPDATED = "PROFILE_UPDATED",
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: Pick<User, "id" | "name" | "role">;
  action: AuditLogAction;
  details: string;
}

export interface ToastMessage {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

export interface EscalationRule {
  id: string;
  priority: TicketPriority;
  timeInHours: number;
  escalateToRole: UserRole;
}
