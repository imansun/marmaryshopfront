// src/app/pages/dashboards/categories/index.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { toast } from "sonner";

import { Card, Table, TBody, Td, THead, Th, Tr, Button } from "@/components/ui";
import { CollapsibleSearch } from "@/components/shared/CollapsibleSearch";
import { PaginationSection } from "@/components/shared/table/PaginationSection";
import { TableSortIcon } from "@/components/shared/table/TableSortIcon";

import {
  type CategoryItem,
  createCategory,
  deleteCategory,
  getCategories,
  getCategoriesTree,
  getDeletedCategories,
  hardDeleteCategory,
  restoreCategory,
  updateCategory,
  type CreateCategoryPayload,
  type UpdateCategoryPayload,
} from "@/app/services/endpoints/categories";

import { fuzzyFilter } from "@/utils/react-table/fuzzyFilter";
import { columns } from "./table/columns";
import { CategoryForm } from "./table/CategoryForm";
import { CategoriesMenuAction } from "./table/MenuActions";
import { CreateCategoryDrawer } from "./table/CreateCategoryDrawer";

// ----------------------------------------------------------------------

type TabType = "active" | "deleted";

interface CategoryFormState {
  title: string;
  slug: string;
  description: string;
  imageUrl: string;
  image?: File;
  parentId: string;
  isActive: boolean;
  sortOrder: string;
}

const initialFormState: CategoryFormState = {
  title: "",
  slug: "",
  description: "",
  imageUrl: "",
  image: undefined,
  parentId: "",
  isActive: true,
  sortOrder: "0",
};

const DEFAULT_CATEGORY_IMAGE = "/images/categories/default-category.png";

const toSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const getCategoryImageSource = (item: CategoryItem) => {
  const rawItem = item as unknown as CategoryItem & Record<string, unknown>;

  const possibleSources = [
    rawItem.imageSource,
    rawItem.imageUrl,
    rawItem.image,
    rawItem.thumbnailUrl,
    rawItem.thumbnail,
    rawItem.icon,
    rawItem.cover,
  ];

  const source = possibleSources.find(
    (value) => typeof value === "string" && value.trim().length > 0,
  );

  return typeof source === "string" ? source : "";
};

const normalizeCategoryItems = (response: unknown): CategoryItem[] => {
  if (Array.isArray(response)) {
    return response as CategoryItem[];
  }

  if (!response || typeof response !== "object") {
    return [];
  }

  const rawResponse = response as unknown as Record<string, unknown>;

  const possibleItems = [
    rawResponse.data,
    rawResponse.items,
    rawResponse.categories,
    rawResponse.results,
    rawResponse.docs,
  ];

  const items = possibleItems.find((value) => Array.isArray(value));

  return Array.isArray(items) ? (items as CategoryItem[]) : [];
};

// ----------------------------------------------------------------------

export default function CategoriesPage() {
  const [tab, setTab] = useState<TabType>("active");

  const [items, setItems] = useState<CategoryItem[]>([]);
  const [treeItems, setTreeItems] = useState<CategoryItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [treeLoading, setTreeLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const [editingItem, setEditingItem] = useState<CategoryItem | null>(null);
  const [form, setForm] = useState<CategoryFormState>(initialFormState);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // ----------------------------------------------------------------------

  const resetForm = useCallback(() => {
    setForm(initialFormState);
    setEditingItem(null);
  }, []);

  const openCreateModal = useCallback(() => {
    resetForm();
    setIsFormOpen(true);
  }, [resetForm]);

  const closeFormModal = useCallback(() => {
    if (submitting) return;

    setIsFormOpen(false);
    resetForm();
  }, [resetForm, submitting]);

  const fetchTree = useCallback(async () => {
    try {
      setTreeLoading(true);

      const response = await getCategoriesTree();
      const normalizedItems = normalizeCategoryItems(response);

      setTreeItems(normalizedItems);
    } catch {
      setTreeItems([]);
      toast.error("خطا در دریافت ساختار دسته‌بندی‌ها");
    } finally {
      setTreeLoading(false);
    }
  }, []);

  const fetchActive = useCallback(async () => {
    try {
      setLoading(true);

      const response = await getCategories({
        page: 1,
        limit: 100,
      });

      const normalizedItems = normalizeCategoryItems(response);

      setItems(normalizedItems);
    } catch {
      setItems([]);
      toast.error("خطا در دریافت دسته‌بندی‌های فعال");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDeleted = useCallback(async () => {
    try {
      setLoading(true);

      const response = await getDeletedCategories({
        page: 1,
        limit: 100,
        sortBy: "deletedAt",
        sortOrder: "DESC",
      });

      const normalizedItems = normalizeCategoryItems(response);

      setItems(normalizedItems);
    } catch {
      setItems([]);
      toast.error("خطا در دریافت دسته‌بندی‌های حذف‌شده");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    if (tab === "active") {
      await fetchActive();
      return;
    }

    await fetchDeleted();
  }, [fetchActive, fetchDeleted, tab]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    void fetchTree();
  }, [fetchTree]);

  // ----------------------------------------------------------------------

  const handleChange = useCallback(
    (
      key: keyof CategoryFormState,
      value: string | boolean | File | undefined,
    ) => {
      setForm((prev) => {
        const nextForm: CategoryFormState = {
          ...prev,
          [key]: value,
        } as CategoryFormState;

        if (key === "title" && typeof value === "string") {
          nextForm.slug = toSlug(value);
        }

        return nextForm;
      });
    },
    [],
  );

  const handleEdit = useCallback((item: CategoryItem) => {
    const resolvedImageSource = getCategoryImageSource(item);

    setEditingItem(item);

    setForm({
      title: item.title || "",
      slug: item.slug || toSlug(item.title || ""),
      description: item.description || "",
      imageUrl: resolvedImageSource || item.imageUrl || DEFAULT_CATEGORY_IMAGE,
      image: undefined,
      parentId:
        item.parentId !== null && item.parentId !== undefined
          ? String(item.parentId)
          : "",
      isActive: Boolean(item.isActive),
      sortOrder: String(item.sortOrder ?? 0),
    });

    setIsFormOpen(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      const trimmedTitle = form.title.trim();
      const trimmedDescription = form.description.trim();
      const generatedSlug = toSlug(trimmedTitle);
      const resolvedSlug = form.slug.trim() || generatedSlug;
      const resolvedImageUrl = form.imageUrl.trim() || DEFAULT_CATEGORY_IMAGE;

      if (!trimmedTitle) {
        toast.warning("عنوان دسته‌بندی الزامی است");
        return;
      }

      setSubmitting(true);

      if (editingItem) {
        const payload: UpdateCategoryPayload = {
          title: trimmedTitle || undefined,
          slug: resolvedSlug || undefined,
          description: trimmedDescription || undefined,
          imageUrl: form.image ? undefined : resolvedImageUrl,
          image: form.image,
          parentId: form.parentId === "" ? null : Number(form.parentId),
          isActive: form.isActive,
          sortOrder: Number(form.sortOrder || 0),
        };

        await updateCategory(editingItem.id, payload);
        toast.success("دسته‌بندی با موفقیت ویرایش شد");
      } else {
        const payload: CreateCategoryPayload = {
          title: trimmedTitle,
          slug: resolvedSlug || undefined,
          description: trimmedDescription || undefined,
          imageUrl: form.image ? undefined : resolvedImageUrl,
          image: form.image,
          parentId: form.parentId === "" ? undefined : Number(form.parentId),
          isActive: form.isActive,
          sortOrder: Number(form.sortOrder || 0),
        };

        await createCategory(payload);
        toast.success("دسته‌بندی جدید با موفقیت ایجاد شد");
      }

      setIsFormOpen(false);
      resetForm();

      await fetchItems();
      await fetchTree();
    } catch {
      toast.error("خطا در ثبت اطلاعات دسته‌بندی");
    } finally {
      setSubmitting(false);
    }
  }, [editingItem, fetchItems, fetchTree, form, resetForm]);

  const handleInlineImageUpload = useCallback(
    async (row: CategoryItem, file: File) => {
      try {
        const payload: UpdateCategoryPayload = {
          image: file,
        };

        await updateCategory(row.id, payload);

        await fetchItems();
        await fetchTree();

        toast.success("تصویر دسته‌بندی با موفقیت به‌روزرسانی شد");
      } catch {
        toast.error("خطا در بارگذاری تصویر دسته‌بندی");
        throw new Error("Failed to upload category image");
      }
    },
    [fetchItems, fetchTree],
  );

  const handleTabChange = useCallback(
    (nextTab: TabType) => {
      if (nextTab === tab) return;

      setTab(nextTab);
      setGlobalFilter("");
      setSorting([]);
    },
    [tab],
  );

  // ----------------------------------------------------------------------

  const tableColumns = useMemo(
    () =>
      columns({
        tab,
        onEdit: handleEdit,
        onDelete: async (row) => {
          try {
            await deleteCategory(row.id);
            toast.success("دسته‌بندی با موفقیت حذف شد");
            await fetchItems();
            await fetchTree();
          } catch {
            toast.error("خطا در حذف دسته‌بندی");
          }
        },
        onRestore: async (row) => {
          try {
            await restoreCategory(row.id);
            toast.success("دسته‌بندی با موفقیت بازیابی شد");
            await fetchItems();
            await fetchTree();
          } catch {
            toast.error("خطا در بازیابی دسته‌بندی");
          }
        },
        onHardDelete: async (row) => {
          try {
            await hardDeleteCategory(row.id);
            toast.success("دسته‌بندی برای همیشه حذف شد");
            await fetchItems();
            await fetchTree();
          } catch {
            toast.error("خطا در حذف دائمی دسته‌بندی");
          }
        },
        onImageUpload: handleInlineImageUpload,
      }) as ColumnDef<CategoryItem>[],
    [fetchItems, fetchTree, handleEdit, handleInlineImageUpload, tab],
  );

  const table = useReactTable({
    data: items,
    columns: tableColumns,
    state: {
      globalFilter,
      sorting,
    },
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    globalFilterFn: fuzzyFilter,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  useEffect(() => {
    table.setPageIndex(0);
  }, [globalFilter, tab, table]);

  const filteredRowsCount = table.getFilteredRowModel().rows.length;
  const hasRows = filteredRowsCount > 0;
  const isBusy = loading || treeLoading;

  const tableStatusText = useMemo(() => {
    if (isBusy) {
      return "در حال بارگذاری اطلاعات دسته‌بندی‌ها...";
    }

    if (globalFilter.trim()) {
      return `${filteredRowsCount} نتیجه برای جستجوی شما پیدا شد`;
    }

    if (tab === "active") {
      return `${items.length} دسته‌بندی فعال`;
    }

    return `${items.length} دسته‌بندی حذف‌شده`;
  }, [filteredRowsCount, globalFilter, isBusy, items.length, tab]);

  const pageDescription = useMemo(() => {
    if (tab === "active") {
      return "مدیریت دسته‌بندی‌های فعال، ایجاد، ویرایش و حذف آیتم‌ها";
    }

    return "مرور دسته‌بندی‌های حذف‌شده، بازیابی یا حذف دائمی آیتم‌ها";
  }, [tab]);

  const emptyStateTitle = useMemo(() => {
    if (globalFilter.trim()) {
      return "نتیجه‌ای برای جستجوی شما پیدا نشد";
    }

    return tab === "active"
      ? "هنوز دسته‌بندی فعالی ثبت نشده است"
      : "هیچ دسته‌بندی حذف‌شده‌ای وجود ندارد";
  }, [globalFilter, tab]);

  const emptyStateDescription = useMemo(() => {
    if (globalFilter.trim()) {
      return "عبارت جستجو را تغییر دهید یا فیلترها را پاک کنید و دوباره تلاش کنید.";
    }

    return tab === "active"
      ? "برای شروع، یک دسته‌بندی جدید ایجاد کنید."
      : "آیتم‌های حذف‌شده در این بخش نمایش داده می‌شوند.";
  }, [globalFilter, tab]);

  const drawerTitle = editingItem ? "ویرایش دسته‌بندی" : "ایجاد دسته‌بندی جدید";

  const drawerDescription = editingItem
    ? "اطلاعات دسته‌بندی را ویرایش و ذخیره کنید."
    : "اطلاعات دسته‌بندی جدید را وارد و ثبت کنید.";

  // ----------------------------------------------------------------------

  return (
    <>
      <div className="space-y-6">
        <Card className="dark:border-dark-500 dark:bg-dark-800 overflow-hidden border border-gray-200/80 bg-white shadow-sm">
          <div className="dark:from-dark-700 dark:to-dark-800 bg-gradient-to-b from-gray-50 to-white px-4 py-5 sm:px-6">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-300 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium">
                      مدیریت دسته‌بندی‌ها
                    </span>

                    <span className="dark:bg-dark-600 dark:text-dark-100 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600">
                      {tab === "active" ? "بخش فعال" : "بخش حذف‌شده"}
                    </span>
                  </div>

                  <div>
                    <h1 className="dark:text-dark-100 text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
                      دسته‌بندی‌ها
                    </h1>
                    <p className="dark:text-dark-200 mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                      {pageDescription}
                    </p>
                  </div>
                </div>
              </div>

              <div className="dark:border-dark-500 dark:bg-dark-700/70 flex flex-col gap-3 rounded-2xl border border-gray-200/80 bg-white/80 p-3 backdrop-blur-sm lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <div className="dark:bg-dark-600 inline-flex w-fit items-center gap-1 rounded-xl bg-gray-100 p-1">
                    <Button
                      variant="flat"
                      className={
                        tab === "active"
                          ? "dark:bg-dark-500 min-w-[88px] bg-white shadow-sm"
                          : "min-w-[88px]"
                      }
                      onClick={() => handleTabChange("active")}
                    >
                      فعال
                    </Button>

                    <Button
                      variant="flat"
                      className={
                        tab === "deleted"
                          ? "dark:bg-dark-500 min-w-[88px] bg-white shadow-sm"
                          : "min-w-[88px]"
                      }
                      onClick={() => handleTabChange("deleted")}
                    >
                      حذف‌شده
                    </Button>
                  </div>

                  <div className="dark:text-dark-200 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span className="dark:bg-dark-600 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 font-medium">
                      {tableStatusText}
                    </span>

                    {globalFilter.trim() ? (
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                        فیلتر فعال
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <CollapsibleSearch
                    placeholder="جستجو در دسته‌بندی‌ها..."
                    value={globalFilter ?? ""}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                  />

                  <div className="flex shrink-0 justify-end">
                    <CategoriesMenuAction />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="dark:border-dark-500 border-b border-gray-200 px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="dark:text-dark-100 text-sm font-semibold text-gray-800">
                  {tab === "active"
                    ? "لیست دسته‌بندی‌های فعال"
                    : "لیست دسته‌بندی‌های حذف‌شده"}
                </h2>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {globalFilter.trim()
                    ? "نتایج بر اساس عبارت جستجوی وارد شده فیلتر شده‌اند."
                    : tab === "active"
                      ? "می‌توانید دسته‌بندی‌ها را ویرایش یا حذف کنید."
                      : "می‌توانید دسته‌بندی‌های حذف‌شده را بازیابی یا حذف دائمی کنید."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="dark:bg-dark-700 dark:text-dark-100 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
                  {hasRows ? `${filteredRowsCount} ردیف` : "بدون ردیف"}
                </span>

                {tab === "active" ? (
                  <Button
                    color="primary"
                    className="min-w-[140px] shadow-sm"
                    onClick={openCreateModal}
                  >
                    افزودن دسته‌بندی
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="table-wrapper min-w-full overflow-x-auto">
            <Table hoverable className="w-full text-left rtl:text-right">
              <THead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <Tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <Th
                        key={header.id}
                        className="dark:bg-dark-800 dark:text-dark-100 bg-gray-100 font-semibold text-gray-800 uppercase"
                      >
                        {header.column.getCanSort() ? (
                          <div
                            className="flex cursor-pointer items-center space-x-3 select-none"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <span className="flex-1">
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext(),
                                  )}
                            </span>

                            <TableSortIcon
                              sorted={header.column.getIsSorted()}
                            />
                          </div>
                        ) : header.isPlaceholder ? null : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )
                        )}
                      </Th>
                    ))}
                  </Tr>
                ))}
              </THead>

              <TBody>
                {isBusy ? (
                  <>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Tr
                        key={`skeleton-row-${index}`}
                        className="dark:border-b-dark-500 border-b border-gray-200"
                      >
                        {tableColumns.map((_, cellIndex) => (
                          <Td key={`skeleton-cell-${index}-${cellIndex}`}>
                            <div className="dark:bg-dark-600 h-4 w-full animate-pulse rounded bg-gray-200" />
                          </Td>
                        ))}
                      </Tr>
                    ))}
                  </>
                ) : hasRows ? (
                  table.getRowModel().rows.map((row) => (
                    <Tr
                      key={row.id}
                      className="dark:border-b-dark-500 relative border-y border-transparent border-b-gray-200"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <Td key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </Td>
                      ))}
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={tableColumns.length} className="py-14">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="dark:bg-dark-700 mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="h-6 w-6"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3 7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5v9A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9Z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8 10h8M8 14h5"
                            />
                          </svg>
                        </div>

                        <h3 className="dark:text-dark-100 text-sm font-medium text-gray-800">
                          {emptyStateTitle}
                        </h3>

                        <p className="mt-1 max-w-md text-xs text-gray-500">
                          {emptyStateDescription}
                        </p>

                        {globalFilter.trim() ? (
                          <div className="mt-4">
                            <Button
                              variant="flat"
                              onClick={() => setGlobalFilter("")}
                            >
                              پاک کردن جستجو
                            </Button>
                          </div>
                        ) : tab === "active" ? (
                          <div className="mt-4">
                            <Button color="primary" onClick={openCreateModal}>
                              ایجاد دسته‌بندی جدید
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    </Td>
                  </Tr>
                )}
              </TBody>
            </Table>
          </div>

          {hasRows && (
            <div className="dark:border-dark-500 border-t border-gray-200 p-4 sm:px-5">
              <PaginationSection table={table} />
            </div>
          )}
        </Card>
      </div>

      <CreateCategoryDrawer
        isOpen={isFormOpen}
        onClose={closeFormModal}
        title={drawerTitle}
        description={drawerDescription}
        closeDisabled={submitting}
      >
        <CategoryForm
          form={form}
          treeItems={treeItems}
          editingItem={editingItem}
          submitting={submitting}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancel={closeFormModal}
        />
      </CreateCategoryDrawer>
    </>
  );
}
