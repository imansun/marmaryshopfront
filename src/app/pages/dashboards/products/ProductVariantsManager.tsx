"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui";
import { PlusIcon, TrashIcon, PencilIcon, PhotoIcon } from "@heroicons/react/24/outline";
import type { ProductItem, ProductVariant, CreateProductImagePayload } from "@/app/services/endpoints/products";
import {
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
  addVariantImage,
  getProductVariantById,
} from "@/app/services/endpoints/products";

type ProductVariantsManagerProps = {
  product: ProductItem;
  onVariantsChange?: (variants: ProductVariant[]) => void;
};

type VariantForm = {
  sku?: string;
  title?: string;
  price?: number | "";
  stock?: number | "";
  isActive?: boolean;
};

export function ProductVariantsManager({
  product,
  onVariantsChange,
}: ProductVariantsManagerProps) {
  const [variants, setVariants] = useState<ProductVariant[]>(product.variants || []);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<VariantForm>({});
  const [uploadingVariantId, setUploadingVariantId] = useState<number | null>(null);

  const handleCreateVariant = useCallback(async () => {
    try {
      setIsCreating(true);
      const newVariant = await createProductVariant(product.id, {
        sku: formData.sku,
        title: formData.title,
        price: formData.price === "" ? undefined : formData.price,
        stock: formData.stock === "" ? undefined : formData.stock,
        isActive: formData.isActive ?? true,
      });
      setVariants((prev) => [...prev, newVariant]);
      onVariantsChange?.([...variants, newVariant]);
      setFormData({});
    } catch {
      // Error handling
    } finally {
      setIsCreating(false);
    }
  }, [product.id, formData, variants, onVariantsChange]);

  const handleUpdateVariant = useCallback(
    async (variantId: number) => {
      try {
        const updatedVariant = await updateProductVariant(product.id, variantId, {
          sku: formData.sku,
          title: formData.title,
          price: formData.price === "" ? undefined : formData.price,
          stock: formData.stock === "" ? undefined : formData.stock,
          isActive: formData.isActive ?? true,
        });
        setVariants((prev) =>
          prev.map((v) => (v.id === variantId ? updatedVariant : v)),
        );
        onVariantsChange?.(
          variants.map((v) => (v.id === variantId ? updatedVariant : v)),
        );
        setEditingId(null);
        setFormData({});
      } catch {
        // Error handling
      }
    },
    [product.id, formData, variants, onVariantsChange],
  );

  const handleDeleteVariant = useCallback(
    async (variantId: number) => {
      try {
        await deleteProductVariant(product.id, variantId);
        setVariants((prev) => prev.filter((v) => v.id !== variantId));
        onVariantsChange?.(variants.filter((v) => v.id !== variantId));
      } catch {
        // Error handling
      }
    },
    [product.id, variants, onVariantsChange],
  );

  const startEdit = useCallback((variant: ProductVariant) => {
    setEditingId(variant.id);
    setFormData({
      sku: variant.sku ?? "",
      title: variant.title ?? "",
      price: variant.price ?? "",
      stock: variant.stock ?? "",
      isActive: variant.isActive ?? true,
    });
  }, []);

  const handleLoadVariant = useCallback(
    async (variantId: number) => {
      try {
        const variantData = await getProductVariantById(product.id, variantId);
        setVariants((prev) =>
          prev.map((v) => (v.id === variantId ? variantData : v)),
        );
      } catch {
        // Error handling
      }
    },
    [product.id],
  );

  const handleUploadVariantImage = useCallback(
    async (variantId: number, file: File) => {
      try {
        setUploadingVariantId(variantId);
        const payload: CreateProductImagePayload = {
          image: file,
          altText: file.name,
          isPrimary: false,
        };
        await addVariantImage(product.id, variantId, payload);
        handleLoadVariant(variantId);
      } catch {
        // Error handling
      } finally {
        setUploadingVariantId(null);
      }
    },
    [product.id, handleLoadVariant],
  );

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
        variantes محصول
      </h3>

      <div className="space-y-2">
        {variants.length === 0 ? (
          <div className="text-center py-4 text-sm text-gray-500">
            هیچ variante‌ای وجود ندارد
          </div>
        ) : (
          variants.map((variant) => (
            <div
              key={variant.id}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-dark-600"
            >
              {editingId === variant.id ? (
                <div className="flex-1 grid grid-cols-5 gap-2">
                  <input
                    type="text"
                    placeholder="SKU"
                    value={formData.sku || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, sku: e.target.value }))
                    }
                    className="px-2 py-1 text-sm border rounded"
                  />
                  <input
                    type="text"
                    placeholder="عنوان"
                    value={formData.title || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="px-2 py-1 text-sm border rounded"
                  />
                  <input
                    type="number"
                    placeholder="قیمت"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        price: e.target.value === "" ? "" : Number(e.target.value),
                      }))
                    }
                    className="px-2 py-1 text-sm border rounded"
                  />
                  <input
                    type="number"
                    placeholder="موجودی"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        stock: e.target.value === "" ? "" : Number(e.target.value),
                      }))
                    }
                    className="px-2 py-1 text-sm border rounded"
                  />
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      color="success"
                      onClick={() => handleUpdateVariant(variant.id)}
                    >
                      ذخیره
                    </Button>
                    <Button
                      size="sm"
                      variant="flat"
                      onClick={() => {
                        setEditingId(null);
                        setFormData({});
                      }}
                    >
                      انصراف
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <p className="font-medium">{variant.title || "بدون عنوان"}</p>
                    <p className="text-xs text-gray-500">
                      SKU: {variant.sku || "—"} | قیمت:{" "}
                      {variant.price ? `${variant.price.toLocaleString()} تومان` : "—"} | موجودی:{" "}
                      {variant.stock ?? "—"}
                    </p>
                    {variant.images && variant.images.length > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        تعداد تصاویر: {variant.images.length}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-col">
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="flat"
                        onClick={() => startEdit(variant)}
                        disabled={uploadingVariantId === variant.id}
                      >
                        <PencilIcon className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        color="error"
                        variant="flat"
                        onClick={() => handleDeleteVariant(variant.id)}
                        disabled={uploadingVariantId === variant.id}
                      >
                        <TrashIcon className="size-4" />
                      </Button>
                    </div>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleUploadVariantImage(variant.id, file);
                          }
                        }}
                        disabled={uploadingVariantId === variant.id}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <Button
                        size="sm"
                        variant="flat"
                        disabled={uploadingVariantId === variant.id}
                        loading={uploadingVariantId === variant.id}
                      >
                        <PhotoIcon className="size-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {!isCreating && !editingId && (
        <Button
          size="sm"
          onClick={() => setIsCreating(true)}
          className="w-full"
          variant="flat"
        >
          <PlusIcon className="size-4" />
          افزودن variante جدید
        </Button>
      )}

      {isCreating && (
        <div className="p-3 rounded-lg border border-gray-200 dark:border-dark-600 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="SKU"
              value={formData.sku || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, sku: e.target.value }))
              }
              className="px-2 py-1 text-sm border rounded"
            />
            <input
              type="text"
              placeholder="عنوان"
              value={formData.title || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className="px-2 py-1 text-sm border rounded"
            />
            <input
              type="number"
              placeholder="قیمت"
              value={formData.price}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  price: e.target.value === "" ? "" : Number(e.target.value),
                }))
              }
              className="px-2 py-1 text-sm border rounded"
            />
            <input
              type="number"
              placeholder="موجودی"
              value={formData.stock}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  stock: e.target.value === "" ? "" : Number(e.target.value),
                }))
              }
              className="px-2 py-1 text-sm border rounded"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={formData.isActive ?? true}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
                }
              />
              فعال
            </label>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              color="primary"
              onClick={handleCreateVariant}
              loading={isCreating}
            >
              ایجاد
            </Button>
            <Button
              size="sm"
              variant="flat"
              onClick={() => {
                setIsCreating(false);
                setFormData({});
              }}
            >
              انصراف
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
