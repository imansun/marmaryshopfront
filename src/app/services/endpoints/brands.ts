// src\app\services\endpoints\brands.ts
import axios from "@/utils/axios";

// -------------------------
// Brand Types
// -------------------------

export interface BrandItem {
  id: number;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface BrandsParams {
  limit?: number;
  page?: number;
  isActive?: boolean;
  search?: string;
}

export interface DeletedBrandsParams {
  limit?: number;
  page?: number;
  isActive?: boolean;
  search?: string;
  sortBy?: "createdAt" | "updatedAt" | "deletedAt" | "name" | "sortOrder";
  sortOrder?: "ASC" | "DESC";
}

export interface CreateBrandPayload {
  name: string;
  description?: string;
  logoUrl?: string;
  logo?: File;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateBrandPayload {
  name?: string;
  description?: string;
  logoUrl?: string;
  logo?: File;
  isActive?: boolean;
  sortOrder?: number;
}

export interface BrandListResponse {
  data: BrandItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BrandActionResponse {
  message: string;
}

// -------------------------
// Helpers
// -------------------------

const buildBrandFormData = (
  payload: CreateBrandPayload | UpdateBrandPayload
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
// API: POST /admin/brands
// -------------------------

export const createBrand = async (
  payload: CreateBrandPayload
): Promise<BrandItem> => {
  const formData = buildBrandFormData(payload);

  const response = await axios.post("/admin/brands", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

// -------------------------
// API: GET /admin/brands
// -------------------------

export const getBrands = async (
  params?: BrandsParams
): Promise<BrandListResponse> => {
  const response = await axios.get("/admin/brands", {
    params: {
      limit: params?.limit ?? 10,
      page: params?.page ?? 1,
      isActive: params?.isActive,
      search: params?.search,
    },
  });

  return response.data;
};

// -------------------------
// API: GET /admin/brands/deleted
// -------------------------

export const getDeletedBrands = async (
  params?: DeletedBrandsParams
): Promise<BrandListResponse> => {
  const response = await axios.get("/admin/brands/deleted", {
    params: {
      limit: params?.limit ?? 10,
      page: params?.page ?? 1,
      isActive: params?.isActive,
      search: params?.search,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
    },
  });

  return response.data;
};

// -------------------------
// API: GET /admin/brands/{id}
// -------------------------

export const getBrandById = async (
  id: number | string
): Promise<BrandItem> => {
  const response = await axios.get(`/admin/brands/${id}`);
  return response.data;
};

// -------------------------
// API: PUT /admin/brands/{id}
// -------------------------

export const updateBrand = async (
  id: number | string,
  payload: UpdateBrandPayload
): Promise<BrandItem> => {
  const formData = buildBrandFormData(payload);

  const response = await axios.put(`/admin/brands/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

// -------------------------
// API: DELETE /admin/brands/{id}
// -------------------------

export const deleteBrand = async (
  id: number | string
): Promise<BrandActionResponse> => {
  const response = await axios.delete(`/admin/brands/${id}`);
  return response.data;
};

// -------------------------
// API: DELETE /admin/brands/{id}/hard
// -------------------------

export const hardDeleteBrand = async (
  id: number | string
): Promise<BrandActionResponse> => {
  const response = await axios.delete(`/admin/brands/${id}/hard`);
  return response.data;
};

// -------------------------
// API: PATCH /admin/brands/{id}/restore
// -------------------------

export const restoreBrand = async (
  id: number | string
): Promise<BrandActionResponse> => {
  const response = await axios.patch(`/admin/brands/${id}/restore`);
  return response.data;
};
