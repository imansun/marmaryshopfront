"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui";
import { TrashIcon, PhotoIcon } from "@heroicons/react/24/outline";
import type { ProductItem, ProductImage } from "@/app/services/endpoints/products";
import {
  getProductImages,
  addProductImage,
  deleteProductImage,
  setPrimaryProductImage,
  reorderProductImages,
} from "@/app/services/endpoints/products";

type ProductImagesManagerProps = {
  product: ProductItem;
  onImagesChange?: (images: ProductImage[]) => void;
};

export function ProductImagesManager({
  product,
  onImagesChange,
}: ProductImagesManagerProps) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const loadImages = useCallback(async () => {
    try {
      setIsLoading(true);
      const loadedImages = await getProductImages(product.id);
      setImages(loadedImages);
    } catch {
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  }, [product.id]);

  const handleUploadImage = useCallback(
    async (file: File) => {
      try {
        setIsUploading(true);
        const newImage = await addProductImage(product.id, {
          image: file,
          altText: file.name,
          isPrimary: images.length === 0,
          sortOrder: images.length,
        });
        setImages((prev) => [...prev, newImage]);
        onImagesChange?.([...images, newImage]);
      } catch {
        // Error handling
      } finally {
        setIsUploading(false);
      }
    },
    [product.id, images, onImagesChange],
  );

  const handleDeleteImage = useCallback(
    async (imageId: number) => {
      try {
        await deleteProductImage(product.id, imageId);
        setImages((prev) => prev.filter((img) => img.id !== imageId));
        onImagesChange?.(images.filter((img) => img.id !== imageId));
      } catch {
        // Error handling
      }
    },
    [product.id, images, onImagesChange],
  );

  const handleSetPrimary = useCallback(
    async (imageId: number) => {
      try {
        await setPrimaryProductImage(product.id, imageId);
        setImages((prev) =>
          prev.map((img) => ({
            ...img,
            isPrimary: img.id === imageId,
          })),
        );
      } catch {
        // Error handling
      }
    },
    [product.id],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          تصاویر محصول
        </h3>
        <Button
          size="sm"
          onClick={loadImages}
          disabled={isLoading}
          variant="flat"
        >
          <PhotoIcon className="size-4" />
          بارگذاری تصاویر
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-4 text-sm text-gray-500">
          در حال بارگذاری...
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-4 text-sm text-gray-500">
          هیچ تصویری وجود ندارد
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-dark-600"
            >
              <img
                src={image.imageUrl}
                alt={image.altText || "Product image"}
                className="w-full h-full object-cover"
              />
              
              {image.isPrimary && (
                <span className="absolute top-1 left-1 bg-primary-600 text-white text-xs px-2 py-0.5 rounded">
                  اصلی
                </span>
              )}

              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!image.isPrimary && (
                  <Button
                    size="sm"
                    variant="flat"
                    onClick={() => handleSetPrimary(image.id)}
                    className="text-xs"
                  >
                    تنظیم به عنوان اصلی
                  </Button>
                )}
                <Button
                  size="sm"
                  color="error"
                  variant="flat"
                  onClick={() => handleDeleteImage(image.id)}
                  className="text-xs"
                >
                  <TrashIcon className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="pt-2">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleUploadImage(file);
            }
          }}
          disabled={isUploading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-primary-50 file:text-primary-700
            hover:file:bg-primary-100"
        />
      </div>
    </div>
  );
}
