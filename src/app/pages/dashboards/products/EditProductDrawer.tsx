"use client";

import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import {
  Fragment,
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";

import { Button, Input, Textarea } from "@/components/ui";
import { FilePond } from "@/components/shared/form/Filepond";
import { Combobox } from "@/components/shared/form/StyledCombobox";
import {
  TextEditor,
  Delta,
} from "@/components/shared/form/TextEditor/TextEditor";

import {
  updateProduct,
  getProductById,
  addProductImage,
  type UpdateProductPayload,
  type ProductItem,
} from "@/app/services/endpoints/products";

import { getBrands, type BrandItem } from "@/app/services/endpoints/brands";

import {
  getCategories,
  type CategoryItem,
} from "@/app/services/endpoints/categories";

import { ProductImagesManager } from "./ProductImagesManager";
import { ProductVariantsManager } from "./ProductVariantsManager";

const modules = {
  toolbar: [
    ["bold", "italic", "underline", "strike"],
    ["blockquote", "code-block"],
    [{ header: 1 }, { header: 2 }],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ script: "sub" }, { script: "super" }],
    [{ indent: "-1" }, { indent: "+1" }],
    [{ direction: "rtl" }],
    [{ size: ["small", false, "large", "huge"] }],
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ color: [] }, { background: [] }],
    [{ font: [] }],
    [{ align: [] }],
    ["clean"],
    ["table"],
  ],
  table: true,
};

type EditProductDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  product: ProductItem | null;
  onUpdated?: (product: ProductItem) => void;
};

type ProductFormErrors = {
  title?: string;
  slug?: string;
  basePrice?: string;
  brand?: string;
  categories?: string;
};

function isDeltaEmpty(delta?: Delta) {
  if (!delta?.ops?.length) return true;

  return (
    delta.ops.length === 1 &&
    typeof delta.ops[0]?.insert === "string" &&
    delta.ops[0].insert.trim() === ""
  );
}

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[ًٌٍَُِّْ]/g, "")
    .replace(/[^a-z0-9\u0600-\u06FF\s-_]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function EditProductDrawer({
  isOpen,
  onClose,
  product,
  onUpdated,
}: EditProductDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugTouched, setIsSlugTouched] = useState(false);

  const [basePrice, setBasePrice] = useState<number | "">("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState<Delta>(new Delta());

  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  const [selectedBrand, setSelectedBrand] = useState<BrandItem | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<CategoryItem[]>(
    [],
  );

  const [errors, setErrors] = useState<ProductFormErrors>({});

  const [image, setImage] = useState<File | undefined>();
  const [filePondKey, setFilePondKey] = useState(0);

  const [isActive, setIsActive] = useState(true);
  const [showImagesManager, setShowImagesManager] = useState(false);
  const [showVariantsManager, setShowVariantsManager] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadDependencies = async () => {
      try {
        const [brandsResponse, categoriesResponse] = await Promise.all([
          getBrands({ page: 1, limit: 100, isActive: true }),
          getCategories({ page: 1, limit: 100, isActive: true }),
        ]);

        setBrands(brandsResponse.data ?? []);
        setCategories(categoriesResponse.data ?? []);
      } catch {
        setBrands([]);
        setCategories([]);
      }
    };

    loadDependencies();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !product) return;

    const loadProduct = async () => {
      try {
        setIsLoading(true);
        const productData = await getProductById(product.id);

        setTitle(productData.title ?? "");
        setSlug(productData.slug ?? "");
        setIsSlugTouched(Boolean(productData.slug));
        setBasePrice(productData.basePrice ?? "");
        setShortDescription(productData.shortDescription ?? "");
        
        if (productData.description) {
          try {
            setDescription(new Delta(JSON.parse(productData.description)));
          } catch {
            setDescription(new Delta());
          }
        } else {
          setDescription(new Delta());
        }

        if (productData.brandId) {
          const brand = brands.find((b) => b.id === productData.brandId);
          if (brand) {
            setSelectedBrand(brand);
          }
        }

        if (Array.isArray(productData.categories) && productData.categories.length > 0) {
          setSelectedCategories(productData.categories as CategoryItem[]);
        }

        setIsActive(productData.isActive ?? true);
        
        // Show images and variants managers when editing
        setShowImagesManager(true);
        setShowVariantsManager(true);
      } catch {
        // Error loading product
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [isOpen, product, brands]);

  const handleClose = useCallback(() => {
    if (isSubmitting || isLoading) return;
    onClose();
  }, [isSubmitting, isLoading, onClose]);

  const resetForm = useCallback(() => {
    setTitle("");
    setSlug("");
    setIsSlugTouched(false);

    setBasePrice("");
    setShortDescription("");
    setDescription(new Delta());

    setSelectedBrand(null);
    setSelectedCategories([]);

    setErrors({});
    setImage(undefined);
    setFilePondKey((prev) => prev + 1);
    setIsActive(true);
    setShowImagesManager(false);
    setShowVariantsManager(false);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!product) return;

    const nextErrors: ProductFormErrors = {};

    if (!title.trim()) {
      nextErrors.title = "عنوان محصول الزامی است";
    }

    if (basePrice === "" || Number.isNaN(Number(basePrice))) {
      nextErrors.basePrice = "قیمت پایه الزامی است";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});

    try {
      setIsSubmitting(true);

      const normalizedSlug = createSlug(slug);

      const payload: UpdateProductPayload = {
        title: title.trim(),
        slug: normalizedSlug || undefined,
        description: !isDeltaEmpty(description)
          ? JSON.stringify(description)
          : undefined,
        shortDescription: shortDescription.trim() || undefined,
        basePrice: Number(basePrice),
        brandId: selectedBrand?.id,
        categoryIds: selectedCategories.length
          ? selectedCategories.map((category) => category.id)
          : undefined,
        isActive,
      };

      const updatedProduct = await updateProduct(product.id, payload);

      if (image) {
        await addProductImage(updatedProduct.id, {
          image,
          altText: title.trim(),
          isPrimary: true,
          sortOrder: 0,
        });
      }

      onUpdated?.(updatedProduct);
      resetForm();
      onClose();
    } catch {
      //
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImagesChange = useCallback((images: any[]) => {
    // Update product images in parent component if needed
    console.log('Images changed:', images);
  }, []);

  const handleVariantsChange = useCallback((variants: any[]) => {
    // Update product variants in parent component if needed
    console.log('Variants changed:', variants);
  }, []);

  if (!product) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-100" onClose={handleClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm dark:bg-black/40" />
        </TransitionChild>

        <TransitionChild
          as={Fragment}
          enter="ease-out transform-gpu transition-transform duration-200"
          enterFrom="-translate-y-full"
          enterTo="translate-y-0"
          leave="ease-in transform-gpu transition-transform duration-200"
          leaveFrom="translate-y-0"
          leaveTo="-translate-y-full"
        >
          <DialogPanel className="dark:bg-dark-700 fixed top-0 left-0 flex w-full flex-col bg-white shadow-2xl">
            <div className="dark:bg-dark-800 flex items-start justify-between gap-4 bg-gray-200 px-4 py-3 sm:px-5">
              <div>
                <DialogTitle className="dark:text-dark-100 text-base font-medium text-gray-800">
                  ویرایش محصول
                </DialogTitle>

                <p className="dark:text-dark-200 mt-1 text-xs text-gray-500">
                  اطلاعات محصول را ویرایش کنید
                </p>
              </div>

              <Button
                type="button"
                variant="flat"
                onClick={handleClose}
                disabled={isSubmitting || isLoading}
                className="size-7 rounded-full p-0"
              >
                <XMarkIcon className="size-4.5" />
              </Button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="max-h-[85vh] overflow-y-auto p-4 sm:p-5"
            >
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  در حال بارگذاری...
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="عنوان محصول"
                    value={title}
                    onChange={(e) => {
                      const nextTitle = e.target.value;

                      setTitle(nextTitle);

                      if (!isSlugTouched) {
                        setSlug(createSlug(nextTitle));
                      }

                      if (errors.title) {
                        setErrors((prev) => ({
                          ...prev,
                          title: undefined,
                        }));
                      }
                    }}
                    error={errors.title}
                    required
                  />

                  <Input
                    label="Slug"
                    value={slug}
                    onChange={(e) => {
                      setIsSlugTouched(true);
                      setSlug(createSlug(e.target.value));

                      if (errors.slug) {
                        setErrors((prev) => ({
                          ...prev,
                          slug: undefined,
                        }));
                      }
                    }}
                    error={errors.slug}
                  />

                  <Input
                    type="number"
                    label="قیمت پایه"
                    value={basePrice}
                    onChange={(e) => {
                      setBasePrice(
                        e.target.value === "" ? "" : Number(e.target.value),
                      );

                      if (errors.basePrice) {
                        setErrors((prev) => ({
                          ...prev,
                          basePrice: undefined,
                        }));
                      }
                    }}
                    error={errors.basePrice}
                    required
                  />

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="size-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
                      فعال
                    </label>
                  </div>

                  <Combobox
                    data={brands}
                    displayField="name"
                    value={selectedBrand}
                    onChange={(value: BrandItem | null) => {
                      setSelectedBrand(value);

                      if (errors.brand) {
                        setErrors((prev) => ({
                          ...prev,
                          brand: undefined,
                        }));
                      }
                    }}
                    placeholder="انتخاب برند"
                    label="برند"
                    searchFields={["name"]}
                    error={errors.brand}
                  />

                  <Combobox
                    data={categories}
                    displayField="title"
                    value={selectedCategories}
                    onChange={(value: CategoryItem[]) => {
                      setSelectedCategories(value);

                      if (errors.categories) {
                        setErrors((prev) => ({
                          ...prev,
                          categories: undefined,
                        }));
                      }
                    }}
                    placeholder="انتخاب دسته‌بندی"
                    label="دسته‌بندی‌ها"
                    searchFields={["title"]}
                    error={errors.categories}
                    multiple
                  />

                  <div className="md:col-span-2">
                    <label className="dark:text-dark-100 mb-2 block text-sm font-medium text-gray-700">
                      تصویر محصول
                    </label>

                    <div className="max-w-xl">
                      <FilePond
                        key={filePondKey}
                        filled
                        allowMultiple={false}
                        onupdatefiles={(fileItems: any[]) => {
                          const nextFile = fileItems?.[0]?.file;

                          if (nextFile instanceof File) {
                            setImage(nextFile);
                            return;
                          }

                          setImage(undefined);
                        }}
                      />
                    </div>
                  </div>

                  {showImagesManager && product && (
                    <div className="md:col-span-2">
                      <ProductImagesManager
                        product={product}
                        onImagesChange={handleImagesChange}
                      />
                    </div>
                  )}

                  {showVariantsManager && product && (
                    <div className="md:col-span-2">
                      <ProductVariantsManager
                        product={product}
                        onVariantsChange={handleVariantsChange}
                      />
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <Textarea
                      label="توضیح کوتاه"
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <TextEditor
                      label="توضیحات کامل"
                      modules={modules}
                      placeholder="اینجا بنویسید..."
                      value={description}
                      onChange={setDescription}
                    />
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="flat"
                  onClick={handleClose}
                  disabled={isSubmitting || isLoading}
                >
                  انصراف
                </Button>

                <Button
                  type="submit"
                  color="primary"
                  loading={isSubmitting || isLoading}
                >
                  ذخیره تغییرات
                </Button>
              </div>
            </form>
          </DialogPanel>
        </TransitionChild>
      </Dialog>
    </Transition>
  );
}
