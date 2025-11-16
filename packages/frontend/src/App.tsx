import React, {
  useState,
  createContext,
  useContext,
  useCallback,
  useEffect,
} from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Layout from "../src/components/Layout";

import {
  User,
  ToastMessage,
  UserRole,
  Ticket,
  Product,
  Notification,
  AuditLog,
  AuditLogAction,
  EscalationRule,
} from "../types";
import { CheckCircle, AlertTriangle, Info, X } from "lucide-react";
import AuditLogPage from "./pages/AuditLogPage";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProductsPage from "./pages/ProductsPage";
import TicketsPage from "./pages/TicketsPage";
import UsersPage from "./pages/UsersPage";

export const API_URL = "http://localhost:5001/api";

// --- Enhanced API Client ---
export const apiClient = {
  async request(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    endpoint: string,
    body?: any
  ) {
    const userJson = localStorage.getItem("user");
    const token = userJson ? JSON.parse(userJson).token : null;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "An API error occurred.");
    }
    return data;
  },
  get(endpoint: string) {
    return this.request("GET", endpoint);
  },
  post(endpoint: string, body: any) {
    return this.request("POST", endpoint, body);
  },
  put(endpoint: string, body: any) {
    return this.request("PUT", endpoint, body);
  },
  patch(endpoint: string, body: any) {
    return this.request("PATCH", endpoint, body);
  },
  delete(endpoint: string) {
    return this.request("DELETE", endpoint);
  },
};

// --- API Service Functions ---
export const apiService = {
  // stats
  async getDashboardStats(): Promise<any> {
    return apiClient.get("/dashboard/stats");
  },

  // Users
  async getUsers(): Promise<User[]> {
    return apiClient.get("/users");
  },
  async createUser(userData: Partial<User>): Promise<User> {
    return apiClient.post("/users", userData);
  },
  async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    return apiClient.put(`/users/${userId}`, userData);
  },
  async deleteUser(userId: string): Promise<void> {
    return apiClient.delete(`/users/${userId}`);
  },

  // Products
  async getProducts(): Promise<Product[]> {
    return apiClient.get("/products");
  },
  async createProduct(productData: Partial<Product>): Promise<Product> {
    return apiClient.post("/products", productData);
  },
  async updateProduct(
    productId: string,
    productData: Partial<Product>
  ): Promise<Product> {
    return apiClient.put(`/products/${productId}`, productData);
  },
  async deleteProduct(productId: string): Promise<void> {
    return apiClient.delete(`/products/${productId}`);
  },

  // Tickets
  async getTickets(): Promise<Ticket[]> {
    return apiClient.get("/tickets");
  },
  async getTicket(ticketId: string): Promise<Ticket> {
    return apiClient.get(`/tickets/${ticketId}`);
  },
  async createTicket(ticketData: Partial<Ticket>): Promise<Ticket> {
    return apiClient.post("/tickets", ticketData);
  },
  async updateTicket(
    ticketId: string,
    ticketData: Partial<Ticket>
  ): Promise<Ticket> {
    return apiClient.patch(`/tickets/${ticketId}`, ticketData);
  },
  async addComment(ticketId: string, commentData: any): Promise<Ticket> {
    return apiClient.post(`/tickets/${ticketId}/comments`, commentData);
  },

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    return apiClient.get("/notifications");
  },
  async createNotification(
    notificationData: Partial<Notification>
  ): Promise<Notification> {
    return apiClient.post("/notifications", notificationData);
  },
  async markNotificationAsRead(notificationId: string): Promise<Notification> {
    return apiClient.patch(`/notifications/${notificationId}/read`, {});
  },
  async markAllNotificationsAsRead(): Promise<void> {
    const data = await apiClient.patch("/notifications/read-all", {});
    console.log(data, "---data");
    return data;
  },

  // Get escalation rules
  getEscalationRules: async (): Promise<EscalationRule[]> => {
    try {
      const response = await apiClient.get("/escalation/escalation-rules");
      console.log(response, "----response----");
      if (!response) throw new Error("Failed to fetch escalation rules");
      const data = await response;
      return data;
    } catch (error) {
      console.error("Error fetching escalation rules:", error);
      return []; // Return empty array as fallback
    }
  },

  // Create or update escalation rules
  setEscalationRules: async (
    rules: EscalationRule[]
  ): Promise<EscalationRule[]> => {
    try {
      const response = await apiClient.post("/escalation/escalation-rules", {
        rules,
      });
      console.log(response.rules, "----response");
      if (!response) throw new Error("Failed to save escalation rules");

      return response.rules; // Return the rules array from response
    } catch (error) {
      console.error("Error saving escalation rules:", error);
      throw error;
    }
  },

  // Check if escalation rules exist
  checkEscalationRules: async (): Promise<boolean> => {
    try {
      const rules = await apiClient.get("/escalation/escalation-rules");
      return rules.length > 0;
    } catch (error) {
      console.error("Error checking escalation rules:", error);
      return false;
    }
  },

  // Check and perform escalations (optional - if you want to use backend escalation check)
  checkAndPerformEscalations: async (): Promise<{
    message: string;
    escalatedCount: number;
    escalatedTickets: any[];
  }> => {
    try {
      const response = await apiClient.get("/escalation/check-escalations"); // or '/api/check-multi-level-escalations'
      console.log(response, "---response1234567");
      if (!response) throw new Error("Failed to check escalations");
      return await response;
    } catch (error) {
      console.error("Error checking escalations:", error);
      throw error;
    }
  },

  // Auth
  // async login(credentials: {
  //   email: string;
  //   password: string;
  // }): Promise<User & { token: string }> {
  //   // Changed this line
  //   return apiClient.post("/auth/login", credentials);
  // },
  // Auth

  async login(credentials: {
    email: string;
    password: string;
  }): Promise<User & { token: string }> {
    // Validate credentials before making the API call
    if (!credentials.email || !credentials.password) {
      throw new Error("Email and password are required");
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(credentials.email)) {
      throw new Error("Please enter a valid email address");
    }

    // Password length validation
    if (credentials.password.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }

    return apiClient.post("/auth/login", credentials);
  },
  async forgotPassword(email: string): Promise<void> {
    return apiClient.post("/auth/forgot-password", { email });
  },
  async resetPassword(token: string, password: string): Promise<void> {
    return apiClient.post("/auth/reset-password", { token, password });
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    return apiClient.get("/audit-logs");
  },
  async createAuditLog(auditLogData: Partial<AuditLog>): Promise<AuditLog> {
    return apiClient.post("/audit-logs", auditLogData);
  },

  // async exportAuditLogs(): Promise<Blob> {
  //   return apiClient.get("/audit-logs/export", {
  //     responseType: "blob",
  //   });
  // },
};

export const auditLogService = {
  async logAction(
    action: AuditLogAction,
    details: string,
    metadata?: any
  ): Promise<void> {
    try {
      const userJson = localStorage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;

      if (!user) {
        console.warn("No user found for audit logging");
        return;
      }

      const auditLogData = {
        timestamp: new Date().toLocaleString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          email: user.email,
        },
        action,
        details,
        metadata,
        ipAddress: "192.168.1.1", // You might want to get this from the request
        userAgent: navigator.userAgent,
      };

      // Send to backend API
      const response = await apiClient.post("/audit-logs", auditLogData);
      console.log(response, "---response");
      // Also log to console for development
      console.log("Audit Log:", auditLogData);
    } catch (error) {
      console.error("Failed to log audit action:", error);
      // Don't throw error to avoid breaking the main functionality
    }
  },
};

// --- Auth Context ---
interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const userJson = localStorage.getItem("user");
      console.log("Retrieved user from localStorage:", userJson);
      const userData = userJson ? JSON.parse(userJson) : null;
      console.log("Parsed user data:", userData);
      return userData;
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      return null;
    }
  });

  const login = (userData: User) => {
    // console.log("Storing user data:", userData);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    console.log("Logging out, clearing user data");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Toast Notification System ---
interface ToastContextType {
  addToast: (message: string, type?: "success" | "error" | "info") => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
};

const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        5000
      );
    },
    []
  );
  const removeToast = (id: number) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-5 right-5 z-[100]">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const Toast: React.FC<{ toast: ToastMessage; onClose: () => void }> = ({
  toast,
  onClose,
}) => {
  const icons = {
    success: <CheckCircle className="text-green-500" />,
    error: <AlertTriangle className="text-red-500" />,
    info: <Info className="text-blue-500" />,
  };
  return (
    <div
      className="flex items-center p-4 mb-4 text-gray-500 bg-white rounded-lg shadow-lg"
      role="alert"
    >
      <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg">
        {icons[toast.type]}
      </div>
      <div className="ml-3 text-sm font-normal">{toast.message}</div>
      <button
        type="button"
        className="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg p-1.5 hover:bg-gray-100"
        onClick={onClose}
      >
        <X size={20} />
      </button>
    </div>
  );
};

// --- Role-Based Route Protection ---
const RoleBasedRoute: React.FC<{
  allowedRoles: UserRole[];
  children: React.ReactNode;
}> = ({ allowedRoles, children }) => {
  const { user } = useAuth();
  if (!user || (allowedRoles.length > 0 && !allowedRoles.includes(user.role))) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

// --- App Structure & Routing ---
const App: React.FC = () => (
  <AuthProvider>
    <ToastProvider>
      <AppRoutes />
    </ToastProvider>
  </AuthProvider>
);

const AppRoutes: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Simulate checking auth status
    const timer = setTimeout(() => {
      setIsCheckingAuth(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/auth"
        element={!user ? <AuthPage /> : <Navigate to="/" replace />}
      />
      <Route
        path="/*"
        element={
          user ? (
            <ProtectedRoutes />
          ) : (
            <Navigate to="/auth" state={{ from: location }} replace />
          )
        }
      />
    </Routes>
  );
};

const ProtectedRoutes: React.FC = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />

        <Route
          path="/users"
          element={
            <RoleBasedRoute allowedRoles={["Admin", "Support Manager"]}>
              <UsersPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/audit-log"
          element={
            <RoleBasedRoute allowedRoles={["Admin"]}>
              <AuditLogPage />
            </RoleBasedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

export default App;
