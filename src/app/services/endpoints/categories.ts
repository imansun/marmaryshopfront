// src/app/services/endpoints/categories.ts
import axios from "@/utils/axios";

// -------------------------
// Category Types
// -------------------------

export interface CategoryItem {
  id: number;
  title: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: number | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
  children?: CategoryItem[];
}

export interface CategoriesParams {
  limit?: number;
  page?: number;
  parentId?: number;
  isActive?: boolean;
  search?: string;
}

export interface DeletedCategoriesParams {
  limit?: number;
  page?: number;
  parentId?: number;
  isActive?: boolean;
  search?: string;
  sortBy?: "createdAt" | "updatedAt" | "deletedAt" | "title" | "sortOrder";
  sortOrder?: "ASC" | "DESC";
}

export interface CreateCategoryPayload {
  title: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  image?: File;
  parentId?: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateCategoryPayload {
  title?: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  image?: File;
  parentId?: number | null;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CategoryListResponse {
  data: CategoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CategoryActionResponse {
  message: string;
}

// -------------------------
// Helpers
// -------------------------

const buildCategoryFormData = (
  payload: CreateCategoryPayload | UpdateCategoryPayload
): FormData => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined) return;

    if (value === null) {
      formData.append(key, "null");
      return;
    }

    if (value instanceof File) {
      formData.append(key, value);
      return;
    }

    if (typeof value === "boolean") {
      formData.append(key, value ? "true" : "false");
      return;
    }

    formData.append(key, String(value));
  });

  return formData;
};

// -------------------------
// API: POST /admin/categories
// -------------------------

export const createCategory = async (
  payload: CreateCategoryPayload
): Promise<CategoryItem> => {
  const formData = buildCategoryFormData(payload);

  const response = await axios.post("/admin/categories", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

// -------------------------
// API: GET /admin/categories
// -------------------------

export const getCategories = async (
  params?: CategoriesParams
): Promise<CategoryListResponse> => {
  const response = await axios.get("/admin/categories", {
    params: {
      limit: params?.limit ?? 10,
      page: params?.page ?? 1,
      parentId: params?.parentId,
      isActive: params?.isActive,
      search: params?.search,
    },
  });

  return response.data;
};

// -------------------------
// API: GET /admin/categories/tree
// -------------------------

export const getCategoriesTree = async (): Promise<CategoryItem[]> => {
  const response = await axios.get("/admin/categories/tree");
  return response.data;
};

// -------------------------
// API: GET /admin/categories/deleted
// -------------------------

export const getDeletedCategories = async (
  params?: DeletedCategoriesParams
): Promise<CategoryListResponse> => {
  const response = await axios.get("/admin/categories/deleted", {
    params: {
      limit: params?.limit ?? 10,
      page: params?.page ?? 1,
      parentId: params?.parentId,
      isActive: params?.isActive,
      search: params?.search,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
    },
  });

  return response.data;
};

// -------------------------
// API: GET /admin/categories/{id}
// -------------------------

export const getCategoryById = async (
  id: number | string
): Promise<CategoryItem> => {
  const response = await axios.get(`/admin/categories/${id}`);
  return response.data;
};

// -------------------------
// API: PATCH /admin/categories/{id}
// -------------------------

export const updateCategory = async (
  id: number | string,
  payload: UpdateCategoryPayload
): Promise<CategoryItem> => {
  const formData = buildCategoryFormData(payload);

  const response = await axios.patch(`/admin/categories/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

// -------------------------
// API: DELETE /admin/categories/{id}
// -------------------------

export const deleteCategory = async (
  id: number | string
): Promise<CategoryActionResponse> => {
  const response = await axios.delete(`/admin/categories/${id}`);
  return response.data;
};

// -------------------------
// API: DELETE /admin/categories/{id}/hard
// -------------------------

export const hardDeleteCategory = async (
  id: number | string
): Promise<CategoryActionResponse> => {
  const response = await axios.delete(`/admin/categories/${id}/hard`);
  return response.data;
};

// -------------------------
// API: PATCH /admin/categories/{id}/restore
// -------------------------

export const restoreCategory = async (
  id: number | string
): Promise<CategoryActionResponse> => {
  const response = await axios.patch(`/admin/categories/${id}/restore`);
  return response.data;
};
