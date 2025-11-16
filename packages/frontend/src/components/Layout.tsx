import React, { useState, useMemo, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ICONS } from "../constants";
import { Notification, UserRole } from "../types";
import logoUrl from "../public/asset/logo.svg";
import iconUrl from "../public/asset/icon.svg";
import profile from "../public/asset/pr.svg";
import {
  ChevronDown,
  LogOut,
  Bell as BellIcon,
  Menu,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { apiService, useAuth, apiClient } from "../App";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";

interface LayoutProps {
  children: React.ReactNode;
}

// --- Sidebar Component ---
const Sidebar: React.FC<{
  isSidebarOpen: boolean;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}> = ({ isSidebarOpen, isCollapsed, toggleCollapse }) => {
  const { user } = useAuth();
  console.log("User in sidebar:", user); // Debug log to see actual user structure

  // Safe fallback for initials
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
    : "U";
  if (!user) {
    return <div>Loading...</div>;
  }
  // Fix: Changed icon type to React.ReactNode to avoid potential JSX namespace errors.
  const navLinksBase: {
    to: string;
    text: string;
    icon: React.ReactNode;
    roles: UserRole[];
  }[] = [
    { to: "/", text: "Dashboard", icon: ICONS.dashboard, roles: [] },
    { to: "/tickets", text: "Tickets", icon: ICONS.tickets, roles: [] },
    {
      to: "/users",
      text: "Users",
      icon: ICONS.users,
      roles: ["Admin", "Support Manager"],
    },
    { to: "/products", text: "Products", icon: ICONS.products, roles: [] },
    {
      to: "/notifications",
      text: "Notifications",
      icon: ICONS.notifications,
      roles: [],
    },
    {
      to: "/audit-log",
      text: "Audit Log",
      icon: ICONS.auditLog,
      roles: ["Admin"],
    },
  ];

  const navLinks = useMemo(() => {
    if (!user) return [];
    return navLinksBase.filter(
      (link) => link.roles.length === 0 || link.roles.includes(user.role)
    );
  }, [user, navLinksBase]);

  return (
    <aside
      className={`bg-white h-full flex flex-col transition-all duration-300 ${
        isSidebarOpen ? "w-64" : "w-0 overflow-hidden"
      } ${isCollapsed ? "lg:w-20" : "lg:w-64"}`}
    >
      <div
        className={`p-4 border-b border-gray-200 h-20 flex items-center shrink-0 justify-between`}
      >
        <div className={`flex items-center gap-2 overflow-hidden`}>
          {/* <div className="w-8 h-8 bg-neokred-primary rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
            N
          </div> */}
          <div
            className={`text-xl font-bold text-gray-800 transition-opacity duration-200 whitespace-nowrap  ${
              isCollapsed ? "lg:opacity-0 lg:w-0" : "lg:opacity-100"
            }`}
          >
            <img
              src={logoUrl}
              alt=""
              className="w-[140px] h-[40px] ml-[20px]"
            />
          </div>
        </div>
        <button
          onClick={toggleCollapse}
          className="hidden lg:block p-1 rounded-md text-gray-500 hover:bg-gray-100"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <img src={iconUrl} alt="" />
          ) : (
            // <ChevronRight size={20} />
            <ChevronLeft size={20} />
          )}
        </button>
      </div>
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul>
          {navLinks.map((link) => (
            <li key={link.to} className="px-4 py-1.5">
              <NavLink
                to={link.to}
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isCollapsed ? "lg:justify-center" : ""
                  } ${
                    isActive
                      ? "bg-neokred-primary/10 text-neokred-primary"
                      : "text-gray-600 hover:bg-gray-100"
                  }`
                }
              >
                {link.icon}
                <span
                  className={`whitespace-nowrap ${
                    isCollapsed ? "lg:hidden" : ""
                  }`}
                >
                  {link.text}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div
        className={`p-4 border-t border-gray-200 ${
          isCollapsed ? "lg:p-2" : "lg:p-4"
        }`}
      >
        <div
          className={`flex items-center gap-3 ${
            isCollapsed ? " lg:justify-center" : " ml-2"
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-neokred-primary text-white flex items-center justify-center font-bold shrink-0">
            {initials}
          </div>
          <div
            className={`transition-opacity duration-200 ${
              isCollapsed ? "lg:hidden" : ""
            }`}
          >
            <p className="text-sm font-semibold text-gray-800 truncate">
              {user?.name}
            </p>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

const Header: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const [isUserDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isNotifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
    : "U";

  // Fetch notifications with React Query
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiService.getNotifications(),
    refetchOnWindowFocus: true, // Keep this true for real-time updates
    staleTime: 1000, // Shorter stale time for frequent updates
  });

  // Mark as read mutation with optimistic update
  const markAsReadMutation = useMutation({
    mutationFn: apiService.markNotificationAsRead,
    onMutate: async (notificationId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["notifications"] });

      // Snapshot the previous value
      const previousNotifications = queryClient.getQueryData(["notifications"]);

      // Optimistically update to the new value
      queryClient.setQueryData(["notifications"], (old: any) =>
        old.map((notif: any) =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );

      return { previousNotifications };
    },
    onError: (err, notificationId, context) => {
      // Rollback on error
      queryClient.setQueryData(
        ["notifications"],
        context?.previousNotifications
      );
    },
    onSettled: () => {
      // Refetch to ensure sync with server
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: apiService.markAllNotificationsAsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previousNotifications = queryClient.getQueryData(["notifications"]);

      queryClient.setQueryData(["notifications"], (old: any) =>
        old.map((notif: any) => ({ ...notif, isRead: true }))
      );

      return { previousNotifications };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(
        ["notifications"],
        context?.previousNotifications
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Calculate unread notifications - this will automatically update
  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !n.isRead),
    [notifications] // This recalculates when notifications change
  );

  const showSendNotification = useMemo(() => {
    if (!user) return false;
    const allowedRoles: UserRole[] = ["Admin", "Support Manager"];
    const allowedPaths = ["/"];
    return (
      allowedRoles.includes(user.role) &&
      allowedPaths.includes(location.pathname)
    );
  }, [user, location.pathname]);

  const handleNotificationClick = (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      markAsReadMutation.mutate(notificationId);
    }
    navigate("/notifications");
    setNotifDropdownOpen(false);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const toggleUserDropdown = () => {
    setUserDropdownOpen((prev) => !prev);
    setNotifDropdownOpen(false);
  };

  const toggleNotifDropdown = () => {
    setNotifDropdownOpen((prev) => !prev);
    setUserDropdownOpen(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 h-20 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-gray-500 hover:text-gray-800"
        >
          <Menu size={24} />
        </button>
      </div>
      <div className="flex items-center gap-6">
        {showSendNotification && (
          <button
            onClick={() =>
              navigate("/notifications", {
                state: { openSendNotificationModal: true },
              })
            }
            className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-neokred-primary rounded-md hover:bg-neokred-primary-dark"
          >
            {ICONS.send} Send Notification
          </button>
        )}
        <div className="relative">
          <button
            onClick={toggleNotifDropdown}
            className="relative text-gray-500 hover:text-gray-800 mt-1"
          >
            <BellIcon size={26} />
            {/* This will dynamically update */}
            {unreadNotifications.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-xs items-center justify-center">
                  {unreadNotifications.length}
                </span>
              </span>
            )}
          </button>
          {isNotifDropdownOpen && (
            <div className="absolute right-0 mt-2 py-1 w-80 bg-white rounded-md shadow-lg border z-10">
              <div className="p-3 border-b flex justify-between items-center">
                <h4 className="font-semibold text-gray-800">Notifications</h4>
                {unreadNotifications.length > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-neokred-primary hover:text-neokred-primary-dark font-medium"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {isLoading ? (
                  <div className="text-center py-4 text-sm text-gray-500">
                    Loading notifications...
                  </div>
                ) : unreadNotifications.length > 0 ? (
                  unreadNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 cursor-pointer"
                      onClick={() =>
                        handleNotificationClick(notif.id, notif.isRead)
                      }
                    >
                      <div className="w-8 h-8 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                        {ICONS.notificationBell}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {notif.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {notif.timestamp}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-sm text-gray-500">
                    No new notifications
                  </div>
                )}
              </div>
              <div className="p-2 border-t">
                <button
                  onClick={() => {
                    navigate("/notifications");
                    setNotifDropdownOpen(false);
                  }}
                  className="w-full text-center text-sm font-medium text-neokred-primary hover:bg-neokred-primary/10 rounded-md py-1.5"
                >
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="relative">
          <button
            onClick={toggleUserDropdown}
            className="flex items-center gap-3"
          >
            {/* <div className="w-9 h-9 rounded-full bg-neokred-primary text-white flex items-center justify-center font-bold text-sm">
              {initials}
            </div> */}
            <div>
              <img src={profile} alt="" className="w-8 h-8" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-gray-800">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 ">{user?.role}</p>
            </div>
            <ChevronDown size={16} className="text-gray-500 hidden md:block" />
          </button>
          {isUserDropdownOpen && (
            <div className="absolute right-0 mt-2 py-1 w-48 bg-white rounded-md shadow-lg border z-10">
              <button
                onClick={logout}
                className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// --- Main Layout Component ---
const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const toggleCollapse = () => {
    setCollapsed(!isCollapsed);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar container */}
      <div
        className={`fixed lg:relative z-30 h-full transition-all duration-300 ${
          isCollapsed ? "lg:w-20" : "lg:w-64"
        }`}
      >
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          isCollapsed={isCollapsed}
          toggleCollapse={toggleCollapse}
        />
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={toggleSidebar} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
