import axios from "@/utils/axios";

export interface TagProductItem {
  id: number;
  title: string;
  slug: string;
  price?: number;
}

export interface TagItem {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
  productsCount?: number;
  products?: TagProductItem[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateTagPayload {
  name: string;
  slug: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateTagPayload {
  name?: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface AssignProductsToTagPayload {
  productIds: number[];
}

export interface DeleteTagResponse {
  success: boolean;
  message: string;
}

export interface RemoveProductFromTagResponse {
  success: boolean;
  message: string;
}

export interface AssignProductsToTagResponse {
  id: number;
  name: string;
  slug: string;
  products: TagProductItem[];
  updatedAt: string;
}

const TAGS_ENDPOINT = "/admin/tags";

export const getTags = async (): Promise<TagItem[]> => {
  const response = await axios.get<TagItem[]>(TAGS_ENDPOINT);
  return response.data;
};

export const getTag = async (id: number): Promise<TagItem> => {
  const response = await axios.get<TagItem>(`${TAGS_ENDPOINT}/${id}`);
  return response.data;
};

export const createTag = async (
  payload: CreateTagPayload,
): Promise<TagItem> => {
  const response = await axios.post<TagItem>(TAGS_ENDPOINT, payload);
  return response.data;
};

export const updateTag = async (
  id: number,
  payload: UpdateTagPayload,
): Promise<TagItem> => {
  const response = await axios.patch<TagItem>(`${TAGS_ENDPOINT}/${id}`, payload);
  return response.data;
};

export const deleteTag = async (id: number): Promise<DeleteTagResponse> => {
  const response = await axios.delete<DeleteTagResponse>(
    `${TAGS_ENDPOINT}/${id}`,
  );
  return response.data;
};

export const restoreTag = async (id: number): Promise<TagItem> => {
  const response = await axios.patch<TagItem>(`${TAGS_ENDPOINT}/${id}/restore`);
  return response.data;
};

export const assignProductsToTag = async (
  id: number,
  payload: AssignProductsToTagPayload,
): Promise<AssignProductsToTagResponse> => {
  const response = await axios.post<AssignProductsToTagResponse>(
    `${TAGS_ENDPOINT}/${id}/products`,
    payload,
  );

  return response.data;
};

export const removeProductFromTag = async (
  id: number,
  productId: number,
): Promise<RemoveProductFromTagResponse> => {
  const response = await axios.delete<RemoveProductFromTagResponse>(
    `${TAGS_ENDPOINT}/${id}/products/${productId}`,
  );

  return response.data;
};
