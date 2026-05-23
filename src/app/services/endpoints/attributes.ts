// src\app\services\endpoints\attributes.ts
import axios from "@/utils/axios";

// -------------------------
// Attribute Types
// -------------------------

export interface AttributeItem {
  id: number;
  name: string;
  slug?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface AttributeValueItem {
  id: number;
  attributeId: number;
  value: string;
  slug?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface AttributesParams {
  limit?: number;
  page?: number;
  search?: string;
  isActive?: boolean;
  sort?: "latest" | "oldest" | "name_asc" | "name_desc" | "sort_asc" | "sort_desc";
}

export interface AttributeValuesParams {
  limit?: number;
  page?: number;
  search?: string;
  isActive?: boolean;
  sort?:
    | "latest"
    | "oldest"
    | "value_asc"
    | "value_desc"
    | "sort_asc"
    | "sort_desc";
}

export interface CreateAttributePayload {
  name: string;
  slug?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateAttributePayload {
  name?: string;
  slug?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CreateAttributeValuePayload {
  attributeId: number;
  value: string;
  slug?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateAttributeValuePayload {
  attributeId?: number;
  value?: string;
  slug?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface AttributeListResponse {
  data: AttributeItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AttributeValueListResponse {
  data: AttributeValueItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AttributeActionResponse {
  message: string;
}

// -------------------------
// API: POST /admin/attributes
// -------------------------

export const createAttribute = async (
  payload: CreateAttributePayload
): Promise<AttributeItem> => {
  const response = await axios.post("/admin/attributes", payload);
  return response.data;
};

// -------------------------
// API: GET /admin/attributes
// -------------------------

export const getAttributes = async (
  params?: AttributesParams
): Promise<AttributeListResponse> => {
  const response = await axios.get("/admin/attributes", {
    params: {
      limit: params?.limit ?? 10,
      page: params?.page ?? 1,
      search: params?.search,
      isActive: params?.isActive,
      sort: params?.sort,
    },
  });

  return response.data;
};

// -------------------------
// API: GET /admin/attributes/{id}
// -------------------------

export const getAttributeById = async (
  id: number | string
): Promise<AttributeItem> => {
  const response = await axios.get(`/admin/attributes/${id}`);
  return response.data;
};

// -------------------------
// API: PATCH /admin/attributes/{id}
// -------------------------

export const updateAttribute = async (
  id: number | string,
  payload: UpdateAttributePayload
): Promise<AttributeItem> => {
  const response = await axios.patch(`/admin/attributes/${id}`, payload);
  return response.data;
};

// -------------------------
// API: DELETE /admin/attributes/{id}
// -------------------------

export const deleteAttribute = async (
  id: number | string
): Promise<AttributeActionResponse> => {
  const response = await axios.delete(`/admin/attributes/${id}`);
  return response.data;
};

// -------------------------
// API: POST /admin/attributes/values
// -------------------------

export const createAttributeValue = async (
  payload: CreateAttributeValuePayload
): Promise<AttributeValueItem> => {
  const response = await axios.post("/admin/attributes/values", payload);
  return response.data;
};

// -------------------------
// API: GET /admin/attributes/{attributeId}/values
// -------------------------

export const getAttributeValues = async (
  attributeId: number | string,
  params?: AttributeValuesParams
): Promise<AttributeValueListResponse> => {
  const response = await axios.get(`/admin/attributes/${attributeId}/values`, {
    params: {
      limit: params?.limit ?? 10,
      page: params?.page ?? 1,
      search: params?.search,
      isActive: params?.isActive,
      sort: params?.sort,
    },
  });

  return response.data;
};

// -------------------------
// API: GET /admin/attributes/values/{id}
// -------------------------

export const getAttributeValueById = async (
  id: number | string
): Promise<AttributeValueItem> => {
  const response = await axios.get(`/admin/attributes/values/${id}`);
  return response.data;
};

// -------------------------
// API: PATCH /admin/attributes/values/{id}
// -------------------------

export const updateAttributeValue = async (
  id: number | string,
  payload: UpdateAttributeValuePayload
): Promise<AttributeValueItem> => {
  const response = await axios.patch(`/admin/attributes/values/${id}`, payload);
  return response.data;
};

// -------------------------
// API: DELETE /admin/attributes/values/{id}
// -------------------------

export const deleteAttributeValue = async (
  id: number | string
): Promise<AttributeActionResponse> => {
  const response = await axios.delete(`/admin/attributes/values/${id}`);
  return response.data;
};
