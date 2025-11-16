import React, { useState, useMemo } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { ICONS } from "../constants";
import { mockNotifications } from "../data";
import {
  ChevronDown,
  LogOut,
  Bell as BellIcon,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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
  const initials =
    user?.name
      .split(" ")
      .map((n) => n[0])
      .join("") || "SA";

  const navLinks = [
    { to: "/", text: "Dashboard", icon: ICONS.dashboard },
    { to: "/tickets", text: "Tickets", icon: ICONS.tickets },
    { to: "/users", text: "Users", icon: ICONS.users },
    { to: "/products", text: "Products", icon: ICONS.products },
    { to: "/notifications", text: "Notifications", icon: ICONS.notifications },
  ];

  if (user?.role === "Admin") {
    navLinks.push({
      to: "/audit-log",
      text: "Audit Log",
      icon: ICONS.auditLog,
    });
  }

  return (
    <aside
      className={`bg-white h-full flex flex-col transition-all duration-300 ${
        isSidebarOpen ? "w-64" : "w-0 overflow-hidden"
      } ${isCollapsed ? "lg:w-20" : "lg:w-64"}`}
    >
      <div
        className={`p-4 border-b border-gray-200 h-16 flex items-center shrink-0 justify-between`}
      >
        <div className={`flex items-center gap-2 overflow-hidden`}>
          <div className="w-8 h-8 bg-neokred-primary rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
            N
          </div>
          <h1
            className={`text-xl font-bold text-gray-800 transition-opacity duration-200`}
          >
            NeokRED
          </h1>
        </div>
        <button
          onClick={toggleCollapse}
          className="hidden lg:block p-1 rounded-md text-gray-500 hover:bg-gray-100"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul>
          {navLinks.map((link) => (
            <li key={link.to} className="px-4">
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
            isCollapsed ? "lg:justify-center" : ""
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

// --- Header Component ---
const Header: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const [isUserDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isNotifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const initials =
    user?.name
      .split(" ")
      .map((n) => n[0])
      .join("") || "SA";

  const showSendNotification = ["/", "/notifications"].includes(
    location.pathname
  );

  const {
    data: notifications = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationService.getNotifications(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !n.isRead),
    [notifications]
  );

  const handleNotificationClick = (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      markAsReadMutation.mutate(notificationId);
    }
    navigate("/notifications");
    setNotifDropdownOpen(false);
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
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-gray-500 hover:text-gray-800"
        >
          <Menu size={24} />
        </button>
      </div>
      <div className="flex items-center gap-4">
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
            className="relative text-gray-500 hover:text-gray-800"
          >
            <BellIcon size={24} />
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
              <div className="p-3 border-b">
                <h4 className="font-semibold text-gray-800">Notifications</h4>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {unreadNotifications.length > 0 ? (
                  unreadNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 cursor-pointer"
                      onClick={() => navigate("/notifications")}
                    >
                      <div className="w-8 h-8 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                        {ICONS.notificationBell}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {notif.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">
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
            className="flex items-center gap-2"
          >
            <div className="w-9 h-9 rounded-full bg-neokred-primary text-white flex items-center justify-center font-bold text-sm">
              {initials}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-gray-800">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500">{user?.role}</p>
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
