import React, { useState, useEffect } from "react";
import { useAuth } from "../App";
import { useNavigate } from "react-router-dom";
import {
  ArrowUp,
  Plus,
  Users,
  Eye,
  Box,
  Bell,
  BarChart2,
  PieChart,
  Ticket,
  ChevronRight,
  CheckCircle,
} from "lucide-react";
import { apiService } from "../App";

interface StatCardProps {
  title: string;
  value: number;
  change: string;
  icon: React.ReactNode;
  color: string;
}
interface DashboardStats {
  totalTickets: number;
  newTickets: number;
  closedTickets: number;
  inProgressTickets: number;
  highPriorityTickets: number;
  totalTicketsChange: string;
  newTicketsChange: string;
  closedTicketsChange: string;
  inProgressChange: string;
  highPriorityChange: string;
}
const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon,
  color,
}) => (
  <div className="bg-white p-5 rounded-lg shadow-sm flex items-start justify-between">
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
    </div>
    <div
      className={`w-14 h-14 mt-2 rounded-full flex items-center justify-center ${color}`}
    >
      {icon}
    </div>
  </div>
);

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const QuickAction: React.FC<QuickActionProps> = ({
  title,
  description,
  icon,
  onClick,
}) => (
  <button
    onClick={onClick}
    className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4 w-full text-left hover:bg-gray-50 transition-colors"
  >
    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-neokred-primary">
      {icon}
    </div>
    <div>
      <p className="font-semibold text-gray-800">{title}</p>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
    <ChevronRight size={20} className="ml-auto text-gray-400" />
  </button>
);

const PlaceholderChart: React.FC<{ title: string; subtitle: string }> = ({
  title,
  subtitle,
}) => (
  <div className="bg-white p-5 rounded-lg shadow-sm">
    <h3 className="font-semibold text-gray-800">{title}</h3>
    <p className="text-sm text-gray-500 mb-4">{subtitle}</p>
    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-md">
      <div className="text-center text-gray-400">
        <BarChart2 size={48} className="mx-auto" />
        <p className="mt-2 text-sm">No tickets found</p>
      </div>
    </div>
  </div>
);

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add default stats to prevent crashes
  const defaultStats: DashboardStats = {
    totalTickets: 0,
    newTickets: 0,
    inProgressTickets: 0,
    closedTickets: 0,
    highPriorityTickets: 0,
    totalTicketsChange: "+0%",
    newTicketsChange: "+0%",
    closedTicketsChange: "+0%",
    inProgressChange: "+0%",
    highPriorityChange: "No overdue",
  };
  // Fetch dashboard stats using your existing API
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const dashboardStats = await apiService.getDashboardStats();
      setStats(dashboardStats);
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
      setError("Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const statsData = [
    {
      title: "Total Tickets",
      value: stats?.totalTickets || 0,
      change: stats?.totalTicketsChange || "+0%",
      icon: <Ticket size={20} className="text-blue-500" />,
      color: "bg-blue-100",
    },
    {
      title: "New Tickets",
      value: stats?.newTickets || 0,
      change: stats?.newTicketsChange || "+0%",
      icon: <Plus size={20} className="text-green-500" />,
      color: "bg-green-100",
    },
    {
      title: "In Progress",
      value: stats?.inProgressTickets || 0,
      change: stats?.inProgressChange || "+0%",
      icon: <BarChart2 size={20} className="text-yellow-500" />,
      color: "bg-yellow-100",
    },
    {
      title: "High Priority",
      value: stats?.highPriorityTickets || 0,
      change: stats?.highPriorityChange || "No overdue",
      icon: <Bell size={20} className="text-red-500" />,
      color: "bg-red-100",
    },
    {
      title: "Closed Tickets",
      value: stats?.closedTickets || 0,
      change: stats?.closedTicketsChange || "+0%",
      icon: <CheckCircle size={20} className="text-green-500" />,
      color: "bg-green-100",
    },
  ];

  const quickActions = [
    {
      title: "Create New Ticket",
      description: "Report an issue or request support",
      icon: <Plus size={20} />,
      onClick: () =>
        navigate("/tickets", { state: { openCreateTicketModal: true } }),
    },
    {
      title: "Manage Users",
      description: "Add or update user accounts",
      icon: <Users size={20} />,
      onClick: () => navigate("/users"),
    },
    {
      title: "View All Tickets",
      description: "Browse and manage tickets",
      icon: <Eye size={20} />,
      onClick: () => navigate("/tickets"),
    },
    {
      title: "Manage Products",
      description: "Add or update products",
      icon: <Box size={20} />,
      onClick: () => navigate("/products"),
    },
    {
      title: "View Notifications",
      description: "Check announcements and updates",
      icon: <Bell size={20} />,
      onClick: () => navigate("/notifications"),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button
            onClick={fetchDashboardStats}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 m-2">
      <div className="gap-1">
        <h2 className="text-2xl font-bold text-gray-800">
          Welcome back , {user?.name.split(" ")[0]} ! 👋
        </h2>
        <p className="text-gray-600">
          Here's what's happening with your support portal today.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PlaceholderChart
            title="Ticket Status Distribution"
            subtitle="Overview of ticket statuses across your organization"
          />
          <PlaceholderChart
            title="Ticket Priority Analysis"
            subtitle="Breakdown of tickets by priority level"
          />
        </div>
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800">Quick Actions</h3>
          <div className="space-y-3">
            {quickActions.map((action) => (
              <QuickAction key={action.title} {...action} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
