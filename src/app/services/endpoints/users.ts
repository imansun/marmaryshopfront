// src\app\services\endpoints\users.ts
import axios from "@/utils/axios";

// -------------------------
// User Types
// -------------------------

export interface UserItem {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: "admin" | "customer" | string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  phone: string;
  role?: string;
  isActive?: boolean;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  isActive?: boolean;
}

export interface UsersParams {
  search?: string;
  role?: string;
  isActive?: boolean;
}

// -------------------------
// API: GET /admin/users
// -------------------------

export const getUsers = async (params?: UsersParams): Promise<UserItem[]> => {
  const response = await axios.get("/admin/users", { params });
  return response.data;
};

// -------------------------
// API: POST /admin/users
// -------------------------

export const createUser = async (data: CreateUserPayload) => {
  const response = await axios.post("/admin/users", data);
  return response.data;
};

// -------------------------
// API: GET /admin/users/{id}
// -------------------------

export const getUserById = async (id: string): Promise<UserItem> => {
  const response = await axios.get(`/admin/users/${id}`);
  return response.data;
};

// -------------------------
// API: PATCH /admin/users/{id}
// -------------------------

export const updateUser = async (id: string, data: UpdateUserPayload) => {
  const response = await axios.patch(`/admin/users/${id}`, data);
  return response.data;
};

// -------------------------
// API: DELETE /admin/users/{id}
// (Soft Delete)
// -------------------------

export const deleteUser = async (id: string) => {
  const response = await axios.delete(`/admin/users/${id}`);
  return response.data;
};

// -------------------------
// API: PATCH /admin/users/{id}/role
// -------------------------

export const changeUserRole = async (id: string, role: string) => {
  const response = await axios.patch(`/admin/users/${id}/role`, { role });
  return response.data;
};

// -------------------------
// API: PATCH /admin/users/{id}/activate
// -------------------------

export const activateUser = async (id: string) => {
  const response = await axios.patch(`/admin/users/${id}/activate`);
  return response.data;
};

// -------------------------
// API: PATCH /admin/users/{id}/deactivate
// -------------------------

export const deactivateUser = async (id: string) => {
  const response = await axios.patch(`/admin/users/${id}/deactivate`);
  return response.data;
};

// -------------------------
// API: PATCH /admin/users/{id}/restore
// (Restore Soft Deleted User)
// -------------------------

export const restoreUser = async (id: string) => {
  const response = await axios.patch(`/admin/users/${id}/restore`);
  return response.data;
};
