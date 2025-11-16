import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuditLog, AuditLogAction } from "../types";
import {
  Search,
  Calendar,
  Download,
  Filter,
  X,
  Loader,
  RefreshCw,
} from "lucide-react";
import { AUDIT_ACTION_COLORS, ROLE_COLORS } from "../constants";
import { apiService, useAuth } from "../App";
import { Navigate } from "react-router-dom";

// // API service functions
// const auditLogAPI = {
//   getAuditLogs: async (filters?: any): Promise<AuditLog[]> => {
//     const queryParams = new URLSearchParams();

//     if (filters?.searchTerm) queryParams.append("search", filters.searchTerm);
//     if (filters?.action && filters.action !== "All")
//       queryParams.append("action", filters.action);
//     if (filters?.role && filters.role !== "All")
//       queryParams.append("role", filters.role);
//     if (filters?.startDate) queryParams.append("startDate", filters.startDate);
//     if (filters?.endDate) queryParams.append("endDate", filters.endDate);

//     const response = await fetch(`/api/audit-logs?${queryParams}`, {
//       headers: {
//         Authorization: `Bearer ${localStorage.getItem("token")}`,
//         "Content-Type": "application/json",
//       },
//     });

//     if (!response.ok) {
//       throw new Error("Failed to fetch audit logs");
//     }

//     return response.json();
//   },

//   exportAuditLogs: async (filters?: any): Promise<Blob> => {
//     const queryParams = new URLSearchParams();

//     if (filters?.searchTerm) queryParams.append("search", filters.searchTerm);
//     if (filters?.action && filters.action !== "All")
//       queryParams.append("action", filters.action);
//     if (filters?.role && filters.role !== "All")
//       queryParams.append("role", filters.role);
//     if (filters?.startDate) queryParams.append("startDate", filters.startDate);
//     if (filters?.endDate) queryParams.append("endDate", filters.endDate);

//     const response = await fetch(`/api/audit-logs/export?${queryParams}`, {
//       headers: {
//         Authorization: `Bearer ${localStorage.getItem("token")}`,
//       },
//     });

//     if (!response.ok) {
//       throw new Error("Failed to export audit logs");
//     }

//     return response.blob();
//   },
// };

const AuditLogPage: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState("All");
  const [selectedRole, setSelectedRole] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  // Fetch logs from API
  // const fetchLogs = async () => {
  //   try {
  //     setLoading(true);
  //     setError(null);
  //     const filters = {
  //       searchTerm,
  //       action: selectedAction,
  //       role: selectedRole,
  //       startDate,
  //       endDate,
  //     };
  //     const auditLogs = await .getAuditLogs(filters);
  //     setLogs(auditLogs);
  //   } catch (err) {
  //     setError(
  //       err instanceof Error ? err.message : "Failed to fetch audit logs"
  //     );
  //     console.error("Error fetching audit logs:", err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // Initial load and when filters change
  // useEffect(() => {
  //   fetchLogs();
  // }, [searchTerm, selectedAction, selectedRole, startDate, endDate]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const logs: any = await apiService.getAuditLogs();
      setLogs(logs);
    } catch (err) {
      setError("Failed to fetch audit logs");
      console.error("Error fetching audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const parseLogTimestamp = (timestamp: string) => {
    // Handle both API format (ISO) and display format
    if (timestamp.includes("T")) {
      return new Date(timestamp).getTime();
    }
    // Fallback for displayed format
    const [datePart, timePart] = timestamp.split(", ");
    const [day, month, year] = datePart.split("/");
    return new Date(`${year}-${month}-${day}T${timePart}`).getTime();
  };

  // Get unique roles for filter
  const uniqueRoles = useMemo(() => {
    const roles = [...new Set(logs.map((log) => log.user.role))];
    return roles.sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    // API already filters, but we can do additional client-side sorting
    return [...logs].sort(
      (a, b) => parseLogTimestamp(b.timestamp) - parseLogTimestamp(a.timestamp)
    );
  }, [logs]);

  // Pagination
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  if (user?.role !== "Admin") {
    return <Navigate to="/" replace />;
  }

  const formatAction = (action: AuditLogAction) => {
    return action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);
      exportAuditLogsToCsv(
        filteredLogs,
        `audit-logs-${new Date().toISOString().split("T")[0]}.csv`
      );
      // const blob = await apiService.exportAuditLogs();

      // // Create download link
      // const url = window.URL.createObjectURL(blob);
      // const link = document.createElement("a");
      // link.href = url;
      // link.download = `audit-logs-${
      //   new Date().toISOString().split("T")[0]
      // }.csv`;
      // document.body.appendChild(link);
      // link.click();
      // document.body.removeChild(link);
      // window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to export audit logs");
      console.error("Error exporting audit logs:", err);
    } finally {
      setExportLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedAction("All");
    setSelectedRole("All");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const renderLogDetails = (details: string) => {
    const ticketIdMatch = details.match(/(TK\d+)/);
    if (ticketIdMatch) {
      const ticketId = ticketIdMatch[0];
      const parts = details.split(ticketId);
      return (
        <span>
          {parts[0]}
          <button
            onClick={() =>
              navigate("/tickets", { state: { openTicketId: ticketId } })
            }
            className="font-semibold text-neokred-primary hover:underline"
          >
            {ticketId}
          </button>
          {parts[1]}
        </span>
      );
    }
    return details;
  };
  const exportAuditLogsToCsv = (data: AuditLog[], filename: string) => {
    const headers = [
      "Timestamp",
      "User Name",
      "User Email",
      "User Role",
      "Action",
      "Details",
    ];

    const rows = data.map((log) =>
      [
        log.timestamp,
        `"${log.user.name}"`,
        `"${log.user.email || "N/A"}"`,
        `"${log.user.role}"`,
        `"${log.action}"`,
        `"${log.details.replace(/"/g, '""')}"`, // Escape quotes in CSV
      ].join(",")
    );

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const getActivityStats = () => {
    const stats = {
      total: filteredLogs.length,
      byAction: {} as Record<string, number>,
      byRole: {} as Record<string, number>,
    };

    filteredLogs.forEach((log) => {
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
      stats.byRole[log.user.role] = (stats.byRole[log.user.role] || 0) + 1;
    });

    return stats;
  };

  const activityStats = getActivityStats();

  if (loading && logs.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm flex justify-center items-center min-h-96">
        <div className="text-center">
          <Loader className="animate-spin h-8 w-8 mx-auto text-neokred-primary" />
          <p className="mt-2 text-gray-600">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Audit Log</h2>
          <p className="text-sm text-gray-500">
            Track all key events and activities within the portal. Showing{" "}
            {filteredLogs.length} logs.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            <Filter size={16} /> Filters
          </button>
          <button
            onClick={handleExport}
            // onClick={() => exportToCsv(logs, "audit-logs.csv")}
            disabled={exporting || filteredLogs.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            {exporting ? (
              <Loader size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {exporting ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex justify-between items-center">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h3 className="text-sm font-medium text-blue-800">
            Total Activities
          </h3>
          <p className="text-2xl font-bold text-blue-900">
            {activityStats.total}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <h3 className="text-sm font-medium text-green-800">
            Most Common Action
          </h3>
          <p className="text-lg font-semibold text-green-900">
            {Object.entries(activityStats.byAction).sort(
              (a, b) => b[1] - a[1]
            )[0]?.[0]
              ? formatAction(
                  Object.entries(activityStats.byAction).sort(
                    (a, b) => b[1] - a[1]
                  )[0][0] as AuditLogAction
                )
              : "N/A"}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <h3 className="text-sm font-medium text-purple-800">
            Most Active Role
          </h3>
          <p className="text-lg font-semibold text-purple-900">
            {Object.entries(activityStats.byRole).sort(
              (a, b) => b[1] - a[1]
            )[0]?.[0] || "N/A"}
          </p>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div
        className={`${
          showFilters ? "block" : "hidden"
        } mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50`}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium text-gray-800">Filters</h3>
          <div className="flex gap-2">
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
            >
              <X size={16} /> Clear All
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search users, details, email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neokred-primary/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action Type
            </label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-neokred-primary/50"
            >
              <option value="All">All Actions</option>
              {Object.values(AuditLogAction).map((action) => (
                <option key={action} value={action}>
                  {formatAction(action)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-neokred-primary/50"
            >
              <option value="All">All Roles</option>
              {uniqueRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md p-2 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md p-2 text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results and Pagination Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
        <div className="text-sm text-gray-600">
          Showing {paginatedLogs.length} of {filteredLogs.length} logs
          {loading && <Loader className="inline animate-spin ml-2 h-3 w-3" />}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Show:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-md p-1 text-sm"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
            <span className="text-sm text-gray-600">per page</span>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">
                Timestamp
              </th>
              <th scope="col" className="px-6 py-3">
                User
              </th>
              <th scope="col" className="px-6 py-3">
                Action
              </th>
              <th scope="col" className="px-6 py-3">
                Details
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedLogs.map((log) => (
              <tr key={log.id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-gray-700 font-mono text-xs">
                  {log.timestamp}
                </td>
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                  <div className="flex flex-col gap-1 " >
                    <p className="font-semibold">{log.user.name}</p>
                    {log.user.email && (
                      <p className="text-xs text-gray-500">{log.user.email}</p>
                    )}
                    <span
                      className={`w-fit mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                        ROLE_COLORS[log.user.role]
                      }`}
                    >
                      {log.user.role}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      AUDIT_ACTION_COLORS[log.action]
                    }`}
                  >
                    {formatAction(log.action)}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600 max-w-md break-words">
                  {renderLogDetails(log.details)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredLogs.length === 0 && !loading && (
          <div className="text-center py-10 text-gray-500">
            <p>No audit logs found for the selected filters.</p>
            <button
              onClick={clearFilters}
              className="mt-2 text-neokred-primary hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 border text-sm rounded-md ${
                    currentPage === pageNum
                      ? "bg-neokred-primary text-white border-neokred-primary"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogPage;
