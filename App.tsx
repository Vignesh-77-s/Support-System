import React, {
  useState,
  createContext,
  useContext,
  useCallback,
  useEffect,
} from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Layout from "./packages/frontend/src/components/Layout";

import { User, ToastMessage, UserRole } from "./types";
import { CheckCircle, AlertTriangle, Info, X } from "lucide-react";
import AuthPage from "./packages/frontend/src/pages/AuthPage";
import AuditLogPage from "./packages/frontend/src/pages/AuditLogPage";
import DashboardPage from "./packages/frontend/src/pages/DashboardPage";
import NotificationsPage from "./packages/frontend/src/pages/NotificationsPage";
import ProductsPage from "./packages/frontend/src/pages/ProductsPage";
import TicketsPage from "./packages/frontend/src/pages/TicketsPage";
import UsersPage from "./packages/frontend/src/pages/UsersPage";

export const API_URL = "http://localhost:5001/api";

// --- API Client ---
export const apiClient = {
  async request(
    method: "GET" | "POST" | "PUT" | "DELETE",
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
  delete(endpoint: string) {
    return this.request("DELETE", endpoint);
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
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      return null;
    }
  });

  const login = (userData: User) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
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
  if (!user || !allowedRoles.includes(user.role)) {
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
