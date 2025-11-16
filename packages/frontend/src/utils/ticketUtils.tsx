// utils/ticketUtils.ts
import { apiService } from "../App";
import { Ticket, User } from "../types";

// Utility functions to handle User type conversions
export const getUserName = (user: User | string | null): string => {
  if (!user) return "Unassigned";
  if (typeof user === "string") return user;
  return user.name;
};

export const getUserObject = async (
  user: User | string | null
): Promise<User | null> => {
  if (!user) return null;
  if (typeof user === "string") {
    const mockUsers = await apiService.getUsers();
    // Find user by name in mockUsers
    return mockUsers.find((u) => u.name === user) || null;
  }
  return user;
};

export const normalizeTicket = (ticket: any): Ticket => {
  const mockUsers = apiService.getUsers();
  return {
    ...ticket,
    createdBy:
      typeof ticket.createdBy === "string"
        ? mockUsers.find(
            (u) => u.id === ticket.createdBy || u.name === ticket.createdBy
          ) || {
            name: ticket.createdBy,
            id: "temp",
            email: "",
            role: "Merchant" as any,
          }
        : ticket.createdBy,
    assignedTo:
      typeof ticket.assignedTo === "string"
        ? mockUsers.find(
            (u) => u.id === ticket.assignedTo || u.name === ticket.assignedTo
          ) || null
        : ticket.assignedTo,
  };
};
