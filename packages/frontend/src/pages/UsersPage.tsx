import React, { useState, useEffect, useMemo } from "react";
import { AuditLogAction, User, UserRole } from "../types";
import { ROLE_COLORS, STATUS_COLORS } from "../constants";
import { Plus, Search } from "lucide-react";
import Modal from "../components/ui/Modal";
import { apiService, auditLogService, useToast } from "../App";

// --- Confirmation Modal ---
const ConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  confirmText: string;
  confirmColorClasses: string;
  children: React.ReactNode;
}> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  confirmText,
  confirmColorClasses,
  children,
}) => {
  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-gray-600">{children}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className={`px-4 py-2 text-white rounded-md ${confirmColorClasses}`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
};

// --- Create/Edit User Modals ---
const CreateUserModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
  mockUsers: User[];
}> = ({ isOpen, onClose, onUserCreated, mockUsers }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    role: "Support Agent" as UserRole,
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        fullName: "",
        role: "Support Agent",
        email: "",
        mobile: "",
        password: "",
        confirmPassword: "",
      });
      setErrors({});
    }
  }, [isOpen]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.fullName.trim())
      newErrors.fullName = "Full Name is required.";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid.";
    }
    if (!formData.mobile.trim())
      newErrors.mobile = "Mobile number is required.";
    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleGeneratePassword = () => {
    const randomPassword = Math.random().toString(36).slice(-10) + "A1!";
    setFormData((prev) => ({
      ...prev,
      password: randomPassword,
      confirmPassword: randomPassword,
    }));
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const userData = {
        name: formData.fullName,
        role: formData.role,
        email: formData.email,
        mobile: formData.mobile,
        password: formData.password,
        status: "Active" as const,
        createdAt: new Date().toISOString().split("T")[0], // Format as YYYY-MM-DD
      };

      await apiService.createUser(userData);
      // Audit log
      await auditLogService.logAction(
        AuditLogAction.USER_CREATED,
        `Created user: ${formData.fullName} (${formData.email})`,
        { email: userData.email, role: userData.role }
      );
      toast.addToast("User created successfully!", "success");
      onUserCreated();
      onClose();
    } catch (error) {
      toast.addToast("Failed to create user", "error");
      console.error("Error creating user:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const userRoles = useMemo(
    () => Array.from(new Set(mockUsers.map((u) => u.role))),
    []
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New User">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            type="text"
            placeholder="Enter full name"
            className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-neokred-primary ${
              errors.fullName ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.fullName && (
            <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Role
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-neokred-primary focus:border-neokred-primary"
          >
            {userRoles.map((role) => (
              <option key={role}>{role}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            name="email"
            value={formData.email}
            onChange={handleChange}
            type="email"
            placeholder="Enter email address"
            className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-neokred-primary ${
              errors.email ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Mobile Number <span className="text-red-500">*</span>
          </label>
          <input
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            type="tel"
            placeholder="Enter mobile number"
            className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-neokred-primary ${
              errors.mobile ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.mobile && (
            <p className="text-xs text-red-500 mt-1">{errors.mobile}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Password <span className="text-red-500">*</span>
          </label>
          <input
            name="password"
            value={formData.password}
            onChange={handleChange}
            type="password"
            placeholder="Enter password"
            className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-neokred-primary ${
              errors.password ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.password && (
            <p className="text-xs text-red-500 mt-1">{errors.password}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <input
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            type="password"
            placeholder="Confirm password"
            className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-neokred-primary ${
              errors.confirmPassword ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-red-500 mt-1">
              {errors.confirmPassword}
            </p>
          )}
        </div>
        <div className="md:col-span-2">
          <button
            type="button"
            onClick={handleGeneratePassword}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100"
          >
            Generate Random Password
          </button>
        </div>
      </div>
      <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400">
        <h4 className="font-bold text-yellow-800">Important Notes</h4>
        <ul className="list-disc list-inside text-sm text-yellow-700 mt-2 space-y-1">
          <li>The user will receive login credentials via email</li>
          <li>They will be required to verify their email address</li>
          <li>
            Make sure to choose the appropriate role for their access level
          </li>
        </ul>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-4 py-2 bg-neokred-primary text-white rounded-md hover:bg-neokred-primary-dark disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Create User"}
        </button>
      </div>
    </Modal>
  );
};

const EditUserModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUserUpdated: () => void;
  mockUsers: User[];
}> = ({ isOpen, onClose, user, onUserUpdated, mockUsers }) => {
  const [formData, setFormData] = useState<Partial<User>>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (user) {
      setFormData(user);
    }
  }, [user]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name?.trim()) newErrors.name = "Full Name is required.";
    if (!formData.email?.trim()) {
      newErrors.email = "Email is required.";
    } else if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid.";
    }
    if (!formData.mobile?.trim())
      newErrors.mobile = "Mobile number is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        status: checked ? "Active" : "Inactive",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async () => {
    if (!validate() || !user) return;

    setIsSubmitting(true);
    try {
      const updateData = {
        name: formData.name,
        role: formData.role,
        email: formData.email,
        mobile: formData.mobile,
        status: formData.status,
      };

      const updatedUser = await apiService.updateUser(user.id, updateData);
      await auditLogService.logAction(
        AuditLogAction.USER_UPDATED,
        `Updated user: ${updatedUser.name} (${updatedUser.email})`,
        {
          // userId,
          changes: Object.keys(updateData),
          previousData: user,
          newData: updatedUser,
        }
      );
      toast.addToast("User updated successfully!", "success");
      onUserUpdated();
      onClose();
    } catch (error) {
      toast.addToast("Failed to update user", "error");
      console.error("Error updating user:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const userRoles = useMemo(
    () => Array.from(new Set(mockUsers.map((u) => u.role))),
    []
  );

  if (!user) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit User">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            value={formData.name || ""}
            onChange={handleChange}
            type="text"
            className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-neokred-primary ${
              errors.name ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.name && (
            <p className="text-xs text-red-500 mt-1">{errors.name}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Role
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-neokred-primary focus:border-neokred-primary"
          >
            {userRoles.map((role) => (
              <option key={role}>{role}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            name="email"
            value={formData.email || ""}
            onChange={handleChange}
            type="email"
            className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-neokred-primary ${
              errors.email ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Mobile Number <span className="text-red-500">*</span>
          </label>
          <input
            name="mobile"
            value={formData.mobile || ""}
            onChange={handleChange}
            type="tel"
            className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-neokred-primary ${
              errors.mobile ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.mobile && (
            <p className="text-xs text-red-500 mt-1">{errors.mobile}</p>
          )}
        </div>
        <div className="md:col-span-2 flex items-center">
          <input
            id="active"
            name="status"
            type="checkbox"
            checked={formData.status === "Active"}
            onChange={handleChange}
            className="h-4 w-4 text-neokred-primary border-gray-300 rounded focus:ring-neokred-primary"
          />
          <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
            Account is active
          </label>
        </div>
      </div>
      <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-400">
        <h4 className="font-bold text-blue-800">Update Information</h4>
        <ul className="list-disc list-inside text-sm text-blue-700 mt-2 space-y-1">
          <li>Email changes will require verification</li>
          <li>Role changes take effect immediately</li>
          <li>Deactivated users cannot log in</li>
        </ul>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-4 py-2 bg-neokred-primary text-white rounded-md hover:bg-neokred-primary-dark disabled:opacity-50"
        >
          {isSubmitting ? "Updating..." : "Update User"}
        </button>
      </div>
    </Modal>
  );
};

// --- Users Page Component ---
const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[] | any[]>([]);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);

  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedUserForAction, setSelectedUserForAction] =
    useState<User | null>(null);
  const [actionType, setActionType] = useState<
    "delete" | "deactivate" | "activate" | null
  >(null);
  const toast = useToast();

  // Fetch users from API
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const usersData = await apiService.getUsers();
      // Normalize user data
      const normalizedUsers = Array.isArray(usersData)
        ? usersData.map((user) => ({
            ...user,
            status: user.status || "Active",
            createdAt: user.createdAt || new Date().toISOString().split("T")[0],
          }))
        : [];
      setUsers(normalizedUsers);
    } catch (error) {
      toast.addToast("Failed to load users", "error");
      console.error("Error loading users:", error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleActionClick = (
    user: User,
    type: "delete" | "deactivate" | "activate"
  ) => {
    setSelectedUserForAction(user);
    setActionType(type);
    setConfirmModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedUserForAction || !actionType) return;

    try {
      let message = "";
      if (actionType === "delete") {
        await apiService.deleteUser(selectedUserForAction.id);
        setUsers((prev) =>
          prev.filter((u) => u.id !== selectedUserForAction.id)
        );
        // Audit log
        await auditLogService.logAction(
          AuditLogAction.USER_DELETED,
          `Deleted user: ${selectedUserForAction?.name} (${selectedUserForAction?.email})`,
          {
            userId: selectedUserForAction.id,
            userName: selectedUserForAction?.name,
            userEmail: selectedUserForAction?.email,
          }
        );
        message = `User "${selectedUserForAction.name}" has been deleted.`;
      } else {
        const updatedUser = await apiService.updateUser(
          selectedUserForAction.id,
          {
            status: actionType === "activate" ? "Active" : "Inactive",
          }
        );
        setUsers((prev: any) =>
          prev.map((u) => (u.id === selectedUserForAction.id ? updatedUser : u))
        );
        // Audit log
        await auditLogService.logAction(
          AuditLogAction.USER_STATUS_UPDATE,
          `Changed user ${selectedUserForAction?.name} status to ${
            actionType === "activate" ? "Active" : "Inactive"
          }`,
          {
            userId: selectedUserForAction.id,
            userName: selectedUserForAction?.name,
            previousStatus: selectedUserForAction?.status,
            newStatus: actionType === "activate" ? "Active" : "Inactive",
          }
        );
        message = `User "${selectedUserForAction.name}" has been ${actionType}d.`;
      }

      toast.addToast(message, "success");
    } catch (error) {
      toast.addToast(`Failed to ${actionType} user`, "error");
      console.error(`Error ${actionType} user:`, error);
    } finally {
      setConfirmModalOpen(false);
      setSelectedUserForAction(null);
      setActionType(null);
    }
  };

  const modalConfig = useMemo(() => {
    if (!actionType || !selectedUserForAction) return null;
    switch (actionType) {
      case "delete":
        return {
          title: "Confirm Deletion",
          confirmText: "Delete",
          confirmColorClasses: "bg-red-600 hover:bg-red-700",
          body: `Are you sure you want to delete the user "${selectedUserForAction.name}"? This action cannot be undone.`,
        };
      case "deactivate":
        return {
          title: "Confirm Deactivation",
          confirmText: "Deactivate",
          confirmColorClasses: "bg-yellow-500 hover:bg-yellow-600",
          body: `Are you sure you want to deactivate the user "${selectedUserForAction.name}"? They will no longer be able to log in.`,
        };
      case "activate":
        return {
          title: "Confirm Activation",
          confirmText: "Activate",
          confirmColorClasses: "bg-green-500 hover:bg-green-600",
          body: `Are you sure you want to activate the user "${selectedUserForAction.name}"? They will regain access to the portal.`,
        };
    }
  }, [actionType, selectedUserForAction]);

  const userRoles = useMemo(
    () => ["All", ...Array.from(new Set(users.map((u: any) => u.role)))],
    [users]
  );

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        searchTerm === "" ||
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === "All" || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onUserCreated={loadUsers}
        mockUsers={users}
      />
      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => setEditModalOpen(false)}
        user={selectedUser}
        onUserUpdated={loadUsers}
        mockUsers={users}
      />
      {modalConfig && (
        <ConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => setConfirmModalOpen(false)}
          onConfirm={handleConfirmAction}
          title={modalConfig.title}
          confirmText={modalConfig.confirmText}
          confirmColorClasses={modalConfig.confirmColorClasses}
        >
          {modalConfig.body}
        </ConfirmationModal>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            User Management
          </h2>
          <p className="text-sm text-gray-500">
            Manage users and their permissions
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-neokred-primary text-white rounded-md hover:bg-neokred-primary-dark"
        >
          <Plus size={16} /> Add New User
        </button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neokred-primary/50"
          />
        </div>
        <div className="w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-neokred-primary/50"
          >
            {userRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">
                User
              </th>
              <th scope="col" className="px-6 py-3">
                Role
              </th>
              <th scope="col" className="px-6 py-3">
                Status
              </th>
              <th scope="col" className="px-6 py-3">
                Created
              </th>
              <th scope="col" className="px-6 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="bg-white border-b">
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neokred-primary/20 text-neokred-primary flex items-center justify-center font-bold">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-gray-500 text-xs">{user.email}</p>
                      <p className="text-gray-500 text-xs">{user.mobile}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      ROLE_COLORS[user.role]
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      STATUS_COLORS[user.status]
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4">{user.createdAt}</td>
                <td className="px-6 py-4">
                  <div className="flex justify-end items-center gap-2">
                    <button
                      onClick={() => handleEditClick(user)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    {user.status === "Active" ? (
                      <button
                        onClick={() => handleActionClick(user, "deactivate")}
                        className="min-w-[90px] text-center px-3 py-1.5 text-xs font-medium text-yellow-800 bg-yellow-400/50 border border-yellow-400/80 rounded-md hover:bg-yellow-400/70"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleActionClick(user, "activate")}
                        className="min-w-[90px] text-center px-3 py-1.5 text-xs font-medium text-green-800 bg-green-400/50 border border-green-400/80 rounded-md hover:bg-green-400/70"
                      >
                        Activate
                      </button>
                    )}
                    <button
                      onClick={() => handleActionClick(user, "delete")}
                      className="px-3 py-1.5 text-xs font-medium text-red-800 bg-red-400/50 border border-red-400/80 rounded-md hover:bg-red-400/70"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr className="bg-white border-b">
                <td colSpan={5} className="text-center py-10 text-gray-500">
                  No users found for the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersPage;
