// src/app/services/endpoints/products.ts
import axios from "@/utils/axios";

// -------------------------
// Product Types
// -------------------------

export interface ProductItem {
  id: number;
  title: string;
  slug?: string;
  description?: string | null;
  shortDescription?: string | null;
  basePrice: number;
  brandId?: number | null;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;

  brand?: ProductBrand | null;
  categories?: ProductCategory[];
  images?: ProductImage[];
  variants?: ProductVariant[];
}

export interface ProductBrand {
  id: number;
  name: string;
  slug?: string;
  imageUrl?: string | null;
  isActive?: boolean;
}

export interface ProductCategory {
  id: number;
  title?: string;
  name?: string;
  slug?: string;
  imageUrl?: string | null;
  isActive?: boolean;
}

export interface ProductImage {
  id: number;
  productId?: number;
  variantId?: number | null;
  imageUrl: string;
  altText?: string | null;
  isPrimary?: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductVariant {
  id: number;
  productId?: number;
  sku?: string | null;
  title?: string | null;
  price?: number | null;
  stock?: number | null;
  isActive?: boolean;
  attributes?: Record<string, unknown> | null;
  images?: ProductImage[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductsParams {
  limit?: number;
  page?: number;
  sort?: "price_asc" | "price_desc" | "oldest" | "title_asc" | "title_desc";
  isActive?: boolean;
  categoryId?: number;
  brandId?: number;
  search?: string;
}

export interface DeletedProductsParams {
  limit?: number;
  page?: number;
  sort?: "price_asc" | "price_desc" | "oldest" | "title_asc" | "title_desc";
  isActive?: boolean;
  categoryId?: number;
  brandId?: number;
  search?: string;
}

export interface ProductListResponse {
  data: ProductItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductActionResponse {
  message: string;
}

// -------------------------
// Product Payloads
// -------------------------

export interface CreateProductPayload {
  title: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  basePrice: number;
  brandId?: number | null;
  categoryIds?: number[];
  imageUrl?: string;
  isActive?: boolean;
  image?: File;
}

export interface UpdateProductPayload {
  title?: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  basePrice?: number;
  brandId?: number | null;
  categoryIds?: number[];
  imageUrl?: string;
  image?: File;
  isActive?: boolean;
}

export interface CreateProductImagePayload {
  image: File;
  altText?: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

export interface ReorderProductImagesPayload {
  items: Array<{
    id: number;
    sortOrder: number;
  }>;
}

export interface CreateProductVariantPayload {
  sku?: string;
  title?: string;
  price?: number;
  stock?: number;
  isActive?: boolean;
  attributes?: Record<string, unknown>;
}

export interface UpdateProductVariantPayload {
  sku?: string;
  title?: string;
  price?: number;
  stock?: number;
  isActive?: boolean;
  attributes?: Record<string, unknown>;
}

// -------------------------
// Helpers
// -------------------------

const buildProductFormData = (
  payload: CreateProductPayload | UpdateProductPayload
): FormData => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined) return;

    if (key === "categoryIds" && Array.isArray(value)) {
      value.forEach((id) => {
        formData.append("categoryIds", String(id));
      });
      return;
    }

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

const buildProductImageFormData = (
  payload: CreateProductImagePayload
): FormData => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined) return;

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
// API: POST /admin/products
// -------------------------

export const createProduct = async (
  payload: CreateProductPayload
): Promise<ProductItem> => {
  const formData = buildProductFormData(payload);

  const response = await axios.post("/admin/products", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

// -------------------------
// API: GET /admin/products
// -------------------------

export const getProducts = async (
  params?: ProductsParams
): Promise<ProductListResponse> => {
  const response = await axios.get("/admin/products", {
    params: {
      limit: params?.limit ?? 10,
      page: params?.page ?? 1,
      sort: params?.sort,
      isActive: params?.isActive,
      categoryId: params?.categoryId,
      brandId: params?.brandId,
      search: params?.search,
    },
  });

  return response.data;
};

// -------------------------
// API: GET /admin/products/{id}
// -------------------------

export const getProductById = async (
  id: number | string
): Promise<ProductItem> => {
  const response = await axios.get(`/admin/products/${id}`);
  return response.data;
};

// -------------------------
// API: PUT /admin/products/{id}
// -------------------------

export const updateProduct = async (
  id: number | string,
  payload: UpdateProductPayload
): Promise<ProductItem> => {
  const formData = buildProductFormData(payload);

  const response = await axios.put(`/admin/products/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

// -------------------------
// API: DELETE /admin/products/{id}
// -------------------------

export const deleteProduct = async (
  id: number | string
): Promise<ProductActionResponse> => {
  const response = await axios.delete(`/admin/products/${id}`);
  return response.data;
};

// -------------------------
// API: PATCH /admin/products/{id}/restore
// -------------------------

export const restoreProduct = async (
  id: number | string
): Promise<ProductActionResponse> => {
  const response = await axios.patch(`/admin/products/${id}/restore`);
  return response.data;
};

// -------------------------
// API: GET /admin/products/{productId}/images
// -------------------------

export const getProductImages = async (
  productId: number | string
): Promise<ProductImage[]> => {
  const response = await axios.get(`/admin/products/${productId}/images`);
  return response.data;
};

// -------------------------
// API: POST /admin/products/{productId}/images
// -------------------------

export const addProductImage = async (
  productId: number | string,
  payload: CreateProductImagePayload
): Promise<ProductImage> => {
  const formData = buildProductImageFormData(payload);

  const response = await axios.post(
    `/admin/products/${productId}/images`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

// -------------------------
// API: POST /admin/products/{productId}/variants/{variantId}/images
// -------------------------

export const addVariantImage = async (
  productId: number | string,
  variantId: number | string,
  payload: CreateProductImagePayload
): Promise<ProductImage> => {
  const formData = buildProductImageFormData(payload);

  const response = await axios.post(
    `/admin/products/${productId}/variants/${variantId}/images`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

// -------------------------
// API: PATCH /admin/products/{productId}/images/{imageId}/primary
// -------------------------

export const setPrimaryProductImage = async (
  productId: number | string,
  imageId: number | string
): Promise<ProductActionResponse> => {
  const response = await axios.patch(
    `/admin/products/${productId}/images/${imageId}/primary`
  );

  return response.data;
};

// -------------------------
// API: PATCH /admin/products/{productId}/images/sort
// -------------------------

export const reorderProductImages = async (
  productId: number | string,
  payload: ReorderProductImagesPayload
): Promise<ProductActionResponse> => {
  const response = await axios.patch(
    `/admin/products/${productId}/images/sort`,
    payload
  );

  return response.data;
};

// -------------------------
// API: DELETE /admin/products/{productId}/images/{imageId}
// -------------------------

export const deleteProductImage = async (
  productId: number | string,
  imageId: number | string
): Promise<ProductActionResponse> => {
  const response = await axios.delete(
    `/admin/products/${productId}/images/${imageId}`
  );

  return response.data;
};

// -------------------------
// API: POST /admin/products/{productId}/variants
// -------------------------

export const createProductVariant = async (
  productId: number | string,
  payload: CreateProductVariantPayload
): Promise<ProductVariant> => {
  const response = await axios.post(
    `/admin/products/${productId}/variants`,
    payload
  );

  return response.data;
};

// -------------------------
// API: GET /admin/products/{productId}/variants/{variantId}
// -------------------------

export const getProductVariantById = async (
  productId: number | string,
  variantId: number | string
): Promise<ProductVariant> => {
  const response = await axios.get(
    `/admin/products/${productId}/variants/${variantId}`
  );

  return response.data;
};

// -------------------------
// API: PATCH /admin/products/{productId}/variants/{variantId}
// -------------------------

export const updateProductVariant = async (
  productId: number | string,
  variantId: number | string,
  payload: UpdateProductVariantPayload
): Promise<ProductVariant> => {
  const response = await axios.patch(
    `/admin/products/${productId}/variants/${variantId}`,
    payload
  );

  return response.data;
};

// -------------------------
// API: DELETE /admin/products/{productId}/variants/{variantId}
// -------------------------

export const deleteProductVariant = async (
  productId: number | string,
  variantId: number | string
): Promise<ProductActionResponse> => {
  const response = await axios.delete(
    `/admin/products/${productId}/variants/${variantId}`
  );

  return response.data;
};
