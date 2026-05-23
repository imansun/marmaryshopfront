// src\app\services\endpoints\collections.ts
import axios from "@/utils/axios";

// -------------------------
// Collection Types
// -------------------------

export type CollectionSortBy =
  | "id"
  | "title"
  | "slug"
  | "isActive"
  | "sortOrder"
  | "createdAt"
  | "updatedAt"
  | "deletedAt";

export type CollectionSortOrder = "ASC" | "DESC";

export interface CollectionItem {
  id: number;
  title: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
  productsCount?: number;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface CollectionProductItem {
  id: number;
  title: string;
  slug: string;
  price?: number;
}

export interface CollectionDetails {
  id: number;
  title: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
  products?: CollectionProductItem[];
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface CollectionsParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  includeDeleted?: boolean;
  sortBy?: CollectionSortBy;
  sortOrder?: CollectionSortOrder;
}

export interface CreateCollectionPayload {
  title: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateCollectionPayload {
  title?: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CollectionListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CollectionListFilters {
  search?: string;
  isActive?: boolean;
  includeDeleted?: boolean;
  sortBy?: CollectionSortBy;
  sortOrder?: CollectionSortOrder;
}

export interface CollectionListResponse {
  data: CollectionItem[];
  meta: CollectionListMeta;
  filters?: CollectionListFilters;
}

export interface CollectionActionResponse {
  success?: boolean;
  message: string;
}

export interface AssignCollectionProductsPayload {
  productIds: number[];
}

export interface AssignCollectionProductsResponse {
  id: number;
  title: string;
  slug: string;
  products: {
    id: number;
    title: string;
    slug: string;
  }[];
  updatedAt: string;
}

// -------------------------
// Helpers
// -------------------------

const createCollectionFormData = (
  payload: CreateCollectionPayload | UpdateCollectionPayload,
): FormData => {
  const formData = new FormData();

  if (payload.title !== undefined) {
    formData.append("title", payload.title);
  }

  if (payload.slug !== undefined) {
    formData.append("slug", payload.slug);
  }

  if (payload.description !== undefined) {
    formData.append("description", payload.description);
  }

  if (payload.isActive !== undefined) {
    formData.append("isActive", String(payload.isActive));
  }

  if (payload.sortOrder !== undefined) {
    formData.append("sortOrder", String(payload.sortOrder));
  }

  return formData;
};

const createAssignProductsFormData = (
  payload: AssignCollectionProductsPayload,
): FormData => {
  const formData = new FormData();

  payload.productIds.forEach((productId) => {
    formData.append("productIds", String(productId));
  });

  return formData;
};

// -------------------------
// API: POST /admin/collections
// -------------------------

export const createCollection = async (
  payload: CreateCollectionPayload,
): Promise<CollectionItem> => {
  const formData = createCollectionFormData(payload);

  const response = await axios.post("/admin/collections", formData);
  return response.data;
};

// -------------------------
// API: GET /admin/collections
// -------------------------

export const getCollections = async (
  params?: CollectionsParams,
): Promise<CollectionListResponse> => {
  const response = await axios.get("/admin/collections", {
    params: {
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
      search: params?.search,
      isActive: params?.isActive,
      includeDeleted: params?.includeDeleted,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
    },
  });

  return response.data;
};

// -------------------------
// API: GET /admin/collections/{id}
// -------------------------

export const getCollectionById = async (
  id: number | string,
): Promise<CollectionDetails> => {
  const response = await axios.get(`/admin/collections/${id}`);
  return response.data;
};

// -------------------------
// API: PATCH /admin/collections/{id}
// -------------------------

export const updateCollection = async (
  id: number | string,
  payload: UpdateCollectionPayload,
): Promise<CollectionItem> => {
  const formData = createCollectionFormData(payload);

  const response = await axios.patch(`/admin/collections/${id}`, formData);
  return response.data;
};

// -------------------------
// API: DELETE /admin/collections/{id}
// -------------------------

export const deleteCollection = async (
  id: number | string,
): Promise<CollectionActionResponse> => {
  const response = await axios.delete(`/admin/collections/${id}`);
  return response.data;
};

// -------------------------
// API: PATCH /admin/collections/{id}/restore
// -------------------------

export const restoreCollection = async (
  id: number | string,
): Promise<CollectionItem> => {
  const response = await axios.patch(`/admin/collections/${id}/restore`);
  return response.data;
};

// -------------------------
// API: POST /admin/collections/{id}/products
// -------------------------

export const assignProductsToCollection = async (
  id: number | string,
  payload: AssignCollectionProductsPayload,
): Promise<AssignCollectionProductsResponse> => {
  const formData = createAssignProductsFormData(payload);

  const response = await axios.post(`/admin/collections/${id}/products`, formData);
  return response.data;
};

// -------------------------
// API: DELETE /admin/collections/{id}/products/{productId}
// -------------------------

export const removeProductFromCollection = async (
  id: number | string,
  productId: number | string,
): Promise<CollectionActionResponse> => {
  const response = await axios.delete(
    `/admin/collections/${id}/products/${productId}`,
  );

  return response.data;
};
