import React, { useState, useEffect, useRef, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Notification,
  NotificationType,
  NotificationAudience,
  NotificationPriority,
  AuditLogAction,
} from "../types";
import { apiService, auditLogService, useToast } from "../App";
import {
  Bell,
  Plus,
  Check,
  ChevronDown,
  FileText,
  Paperclip,
} from "lucide-react";
import { ICONS } from "../constants";
import Modal from "../components/ui/Modal";

const ViewNotificationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  notification: Notification | null;
}> = ({ isOpen, onClose, notification }) => {
  if (!isOpen || !notification) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={notification.title}>
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-gray-800">Message</h4>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">
            {notification.message}
          </p>
        </div>
        <div className="border-t pt-4">
          <h4 className="font-semibold text-gray-800 mb-2">Details</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <strong className="text-gray-500">Sender:</strong>
            <span className="text-gray-700">{notification.sender}</span>

            <strong className="text-gray-500">Timestamp:</strong>
            <span className="text-gray-700">{notification.timestamp}</span>

            <strong className="text-gray-500">Type:</strong>
            <span className="text-gray-700">{notification.type}</span>

            <strong className="text-gray-500">Priority:</strong>
            <span className="text-gray-700">{notification.priority}</span>
          </div>
        </div>
        {notification.attachments && notification.attachments.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-semibold text-gray-800 mb-2">Attachments</h4>
            <div className="space-y-2">
              {notification.attachments.map((att) => (
                <a
                  key={att.name}
                  href={att.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-md hover:bg-gray-100"
                >
                  <FileText size={18} className="text-gray-500" />
                  <span>{att.name}</span>
                  <span className="text-gray-400">({att.size})</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="mt-6 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Close
        </button>
      </div>
    </Modal>
  );
};

const SendNotificationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onNotificationSent?: () => void;
}> = ({ isOpen, onClose, onNotificationSent }) => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotificationType>(
    NotificationType.Announcement
  );
  const [isLoading, setIsLoading] = useState(false);
  const [audience, setAudience] = useState<NotificationAudience>("Everyone");
  const [priority, setPriority] = useState<NotificationPriority>("Medium");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!title.trim()) newErrors.title = "Title is required.";
    if (!message.trim()) newErrors.message = "Message is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      addToast("Please fill in all required fields.", "error");
      return;
    }

    try {
      setIsLoading(true);

      const notificationData: any = {
        title: title.trim(),
        message: message.trim(),
        type,
        audience,
        priority,
        attachments: attachedFiles.map((file) => ({
          name: file.name,
          size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          url: URL.createObjectURL(file),
        })),
      };

      const newNotification = await apiService.createNotification(
        notificationData
      );
      // Audit log
      await auditLogService.logAction(
        AuditLogAction.NOTIFICATION_SENT,
        `Sent notification: ${newNotification.title}`,
        {
          notificationId: newNotification.id,
          title: newNotification.title,
          type: newNotification.type,
          priority: newNotification.priority,
        }
      );
      addToast("Notification sent successfully!", "success");
      onClose();

      // Refresh the notifications list
      if (onNotificationSent) {
        onNotificationSent();
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      addToast("Failed to send notification", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles(Array.from(e.target.files));
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setMessage("");
      setAttachedFiles([]);
      setErrors({});
      setType(NotificationType.Announcement);
      setAudience("Everyone");
      setPriority("Medium");
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send Notification">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Notification Title <span className="text-red-500">*</span>
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            type="text"
            placeholder="Enter notification title"
            className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-neokred-primary ${
              errors.title ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.title && (
            <p className="text-xs text-red-500 mt-1">{errors.title}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Enter notification message"
            className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-neokred-primary ${
              errors.message ? "border-red-500" : "border-gray-300"
            }`}
          ></textarea>
          {errors.message && (
            <p className="text-xs text-red-500 mt-1">{errors.message}</p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as NotificationType)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-neokred-primary focus:border-neokred-primary"
            >
              {Object.values(NotificationType).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Target Audience
            </label>
            <select
              value={audience}
              onChange={(e) =>
                setAudience(e.target.value as NotificationAudience)
              }
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-neokred-primary focus:border-neokred-primary"
            >
              {["Everyone", "Admins", "Merchants", "Support Team"].map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as NotificationPriority)
              }
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-neokred-primary focus:border-neokred-primary"
            >
              {["Medium", "Low", "High"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Attachments (Optional)
          </label>
          <div className="mt-1 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <div className="flex text-sm text-gray-600">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="relative cursor-pointer bg-white rounded-md font-medium text-neokred-primary hover:text-neokred-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-neokred-primary"
                >
                  <span>Choose files</span>
                </button>
                <input
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  multiple
                />
                <p className="pl-1">
                  {attachedFiles.length > 0
                    ? `${attachedFiles.length} file(s) selected`
                    : "or drag and drop"}
                </p>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="px-4 py-2 bg-neokred-primary text-white rounded-md hover:bg-neokred-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Sending..." : "Send Notification"}
        </button>
      </div>
    </Modal>
  );
};

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isSendModalOpen, setSendModalOpen] = useState(false);
  const [isViewModalOpen, setViewModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [readStatusFilter, setReadStatusFilter] = useState("All Notifications");
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  const location = useLocation();
  const navigate = useNavigate();

  // Fetch notifications from API
  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    if (location.state?.openSendNotificationModal) {
      setSendModalOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const notificationsData = await apiService.getNotifications();
      console.log(notifications, "---notifications");
      //@ts-ignore
      setNotifications(notificationsData);
    } catch (error) {
      addToast("Failed to load notifications", "error");
      console.error("Error loading notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewNotification = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        const updatedNotification = await apiService.markNotificationAsRead(
          notification.id
        );
        // Audit log
        await auditLogService.logAction(
          AuditLogAction.NOTIFICATION_READ,
          `Marked notification as read: ${updatedNotification.title}`,
          { notificationId: notification.id, title: updatedNotification.title }
        );
        setNotifications((prev: any) =>
          prev.map((n) => (n.id === notification.id ? updatedNotification : n))
        );
        //@ts-ignore
        setSelectedNotification(updatedNotification);
      } catch (error) {
        console.error("Error marking notification as read:", error);
        setSelectedNotification(notification);
      }
    } else {
      setSelectedNotification(notification);
    }
    setViewModalOpen(true);
  };

  const handleMarkAllRead = async () => {
    try {
      await apiService.markAllNotificationsAsRead();
      const updatedNotifications = await apiService.getNotifications();
      console.log(updatedNotifications, "----updatedNotifications");

      setNotifications(updatedNotifications as any);
      addToast("All notifications marked as read.", "success");
    } catch (error) {
      addToast("Failed to mark all notifications as read", "error");
      console.error("Error marking all notifications as read:", error);
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      const matchesType =
        typeFilter === "All Types" || notif.type === typeFilter;
      const matchesReadStatus =
        readStatusFilter === "All Notifications" ||
        (readStatusFilter === "Unread" && !notif.isRead) ||
        (readStatusFilter === "Read" && notif.isRead);
      return matchesType && matchesReadStatus;
    });
  }, [notifications, typeFilter, readStatusFilter]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading notifications...</div>
        </div>
      </div>
    );
  }

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case "High":
        return "text-red-600 bg-red-100";
      case "Medium":
        return "text-yellow-600 bg-yellow-100";
      case "Low":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="space-y-6">
      <SendNotificationModal
        isOpen={isSendModalOpen}
        onClose={() => setSendModalOpen(false)}
        onNotificationSent={loadNotifications}
      />
      <ViewNotificationModal
        isOpen={isViewModalOpen}
        onClose={() => setViewModalOpen(false)}
        notification={selectedNotification}
      />

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
          <p className="text-gray-600">
            Stay updated with announcements and alerts
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setSendModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-neokred-primary text-white rounded-md hover:bg-neokred-primary-dark"
          >
            {ICONS.send} Send Notification
          </button>
          <button
            onClick={handleMarkAllRead}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Check size={16} /> Mark All Read
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-neokred-primary/50"
          >
            <option value="All Types">All Types</option>
            {Object.values(NotificationType).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={readStatusFilter}
            onChange={(e) => setReadStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-neokred-primary/50"
          >
            <option value="All Notifications">All Notifications</option>
            <option value="Read">Read</option>
            <option value="Unread">Unread</option>
          </select>
        </div>

        <div className="space-y-3">
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-lg border-l-4 ${
                !notif.isRead
                  ? "bg-blue-50 border-blue-500"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                  {ICONS.notificationBell}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                      {notif.title}
                      {notif.attachments && notif.attachments.length > 0 && (
                        <Paperclip size={14} className="text-gray-500" />
                      )}
                      {!notif.isRead && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full inline-block"></span>
                      )}
                    </h4>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-md ${getPriorityClass(
                        notif.priority
                      )}`}
                    >
                      {notif.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500">
                      {notif.type} • From {notif.sender}
                    </p>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleViewNotification(notif)}
                        className="px-2 py-1 text-xs font-medium text-white bg-neokred-primary rounded-md hover:bg-neokred-primary-dark"
                      >
                        View
                      </button>
                      <p className="text-xs text-gray-400 w-24 text-right">
                        {notif.timestamp}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filteredNotifications.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              No notifications found for the selected filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
