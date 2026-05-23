// src/app/pages/dashboards/brands/index.tsx
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
  type BrandItem,
  createBrand,
  deleteBrand,
  getBrands,
  getDeletedBrands,
  hardDeleteBrand,
  restoreBrand,
  updateBrand,
  type CreateBrandPayload,
  type UpdateBrandPayload,
} from "@/app/services/endpoints/brands";

import { fuzzyFilter } from "@/utils/react-table/fuzzyFilter";
import { columns } from "./table/columns";
import { BrandForm } from "./table/BrandForm";
import { BrandsMenuAction } from "./table/MenuActions";
import { CreateBrandDrawer } from "./table/CreateBrandDrawer";

// ----------------------------------------------------------------------

type TabType = "active" | "deleted";

interface BrandFormState {
  name: string;
  description: string;
  logoUrl: string;
  logo?: File;
  isActive: boolean;
  sortOrder: string;
}

const initialFormState: BrandFormState = {
  name: "",
  description: "",
  logoUrl: "",
  logo: undefined,
  isActive: true,
  sortOrder: "0",
};

const DEFAULT_BRAND_LOGO = "/images/brands/default-brand.png";

const getBrandLogoSource = (item: BrandItem) => {
  const rawItem = item as unknown as BrandItem & Record<string, unknown>;

  const possibleSources = [
    rawItem.logoSource,
    rawItem.logoUrl,
    rawItem.logo,
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

const normalizeBrandItems = (response: unknown): BrandItem[] => {
  if (Array.isArray(response)) {
    return response as BrandItem[];
  }

  if (!response || typeof response !== "object") {
    return [];
  }

  const rawResponse = response as unknown as Record<string, unknown>;

  const possibleItems = [
    rawResponse.data,
    rawResponse.items,
    rawResponse.brands,
    rawResponse.results,
    rawResponse.docs,
  ];

  const items = possibleItems.find((value) => Array.isArray(value));

  return Array.isArray(items) ? (items as BrandItem[]) : [];
};

// ----------------------------------------------------------------------

export default function BrandsPage() {
  const [tab, setTab] = useState<TabType>("active");

  const [items, setItems] = useState<BrandItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const [editingItem, setEditingItem] = useState<BrandItem | null>(null);
  const [form, setForm] = useState<BrandFormState>(initialFormState);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // ----------------------------------------------------------------------

  const resetForm = useCallback(() => {
    setForm(initialFormState);
    setEditingItem(null);
  }, []);

  const openCreateModal = useCallback(() => {
    console.log("[BRANDS] open create drawer");

    resetForm();
    setIsFormOpen(true);
  }, [resetForm]);

  const closeFormModal = useCallback(() => {
    if (submitting) return;

    console.log("[BRANDS] close drawer");

    setIsFormOpen(false);
    resetForm();
  }, [resetForm, submitting]);

  const fetchActive = useCallback(async () => {
    try {
      setLoading(true);

      console.log("[BRANDS] fetchActive started");
      console.log("[BRANDS] fetchActive params:", {
        page: 1,
        limit: 100,
      });

      const response = await getBrands({
        page: 1,
        limit: 100,
      });

      console.log("[BRANDS] active brands raw response:", response);
      console.log(
        "[BRANDS] active brands is array response:",
        Array.isArray(response),
      );

      const normalizedItems = normalizeBrandItems(response);

      console.log("[BRANDS] active brands normalized items:", normalizedItems);
      console.log("[BRANDS] active brands count:", normalizedItems.length);

      setItems(normalizedItems);
    } catch (error) {
      console.error("[BRANDS] fetchActive error:", error);

      setItems([]);
      toast.error("خطا در دریافت برندهای فعال");
    } finally {
      console.log("[BRANDS] fetchActive finished");

      setLoading(false);
    }
  }, []);

  const fetchDeleted = useCallback(async () => {
    try {
      setLoading(true);

      console.log("[BRANDS] fetchDeleted started");
      console.log("[BRANDS] fetchDeleted params:", {
        page: 1,
        limit: 100,
        sortBy: "deletedAt",
        sortOrder: "DESC",
      });

      const response = await getDeletedBrands({
        page: 1,
        limit: 100,
        sortBy: "deletedAt",
        sortOrder: "DESC",
      });

      console.log("[BRANDS] deleted brands raw response:", response);
      console.log(
        "[BRANDS] deleted brands is array response:",
        Array.isArray(response),
      );

      if (response && typeof response === "object") {
        const rawResponse = response as unknown as Record<string, unknown>;

        console.log("[BRANDS] deleted brands response.data:", rawResponse.data);
        console.log(
          "[BRANDS] deleted brands response.items:",
          rawResponse.items,
        );
        console.log(
          "[BRANDS] deleted brands response.brands:",
          rawResponse.brands,
        );
      }

      const normalizedItems = normalizeBrandItems(response);

      console.log("[BRANDS] deleted brands normalized items:", normalizedItems);
      console.log("[BRANDS] deleted brands count:", normalizedItems.length);

      setItems(normalizedItems);
    } catch (error) {
      console.error("[BRANDS] fetchDeleted error:", error);

      setItems([]);
      toast.error("خطا در دریافت برندهای حذف‌شده");
    } finally {
      console.log("[BRANDS] fetchDeleted finished");

      setLoading(false);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    console.log("[BRANDS] fetchItems called. current tab:", tab);

    if (tab === "active") {
      await fetchActive();
      return;
    }

    await fetchDeleted();
  }, [fetchActive, fetchDeleted, tab]);

  useEffect(() => {
    console.log("[BRANDS] useEffect fetchItems triggered. tab:", tab);

    void fetchItems();
  }, [fetchItems, tab]);

  // ----------------------------------------------------------------------

  const handleChange = useCallback(
    (key: keyof BrandFormState, value: string | boolean | File | undefined) => {
      console.log("[BRANDS] form change:", {
        key,
        value:
          value instanceof File
            ? {
                name: value.name,
                size: value.size,
                type: value.type,
              }
            : value,
      });

      setForm((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [],
  );

  const handleEdit = useCallback((item: BrandItem) => {
    const resolvedLogoSource = getBrandLogoSource(item);

    console.log("[BRANDS] edit brand item:", item);
    console.log("[BRANDS] edit brand resolved logo:", resolvedLogoSource);

    setEditingItem(item);

    setForm({
      name: item.name || "",
      description: item.description || "",
      logoUrl: resolvedLogoSource || item.logoUrl || DEFAULT_BRAND_LOGO,
      logo: undefined,
      isActive: Boolean(item.isActive),
      sortOrder: String(item.sortOrder ?? 0),
    });

    setIsFormOpen(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      const trimmedName = form.name.trim();
      const trimmedDescription = form.description.trim();
      const resolvedLogoUrl = form.logoUrl.trim() || DEFAULT_BRAND_LOGO;

      console.log("[BRANDS] submit started");
      console.log("[BRANDS] submit mode:", editingItem ? "edit" : "create");
      console.log("[BRANDS] submit editing item:", editingItem);
      console.log("[BRANDS] submit form:", {
        ...form,
        logo: form.logo
          ? {
              name: form.logo.name,
              size: form.logo.size,
              type: form.logo.type,
            }
          : undefined,
      });

      if (!trimmedName) {
        console.warn("[BRANDS] submit stopped. name is empty");

        toast.warning("نام برند الزامی است");
        return;
      }

      setSubmitting(true);

      if (editingItem) {
        const payload: UpdateBrandPayload = {
          name: trimmedName || undefined,
          description: trimmedDescription || undefined,
          logoUrl: form.logo ? undefined : resolvedLogoUrl,
          logo: form.logo,
          isActive: form.isActive,
          sortOrder: Number(form.sortOrder || 0),
        };

        console.log("[BRANDS] updateBrand payload:", {
          ...payload,
          logo: payload.logo
            ? {
                name: payload.logo.name,
                size: payload.logo.size,
                type: payload.logo.type,
              }
            : undefined,
        });

        const response = await updateBrand(editingItem.id, payload);

        console.log("[BRANDS] updateBrand response:", response);

        toast.success("برند با موفقیت ویرایش شد");
      } else {
        const payload: CreateBrandPayload = {
          name: trimmedName,
          description: trimmedDescription || undefined,
          logoUrl: form.logo ? undefined : resolvedLogoUrl,
          logo: form.logo,
          isActive: form.isActive,
          sortOrder: Number(form.sortOrder || 0),
        };

        console.log("[BRANDS] createBrand payload:", {
          ...payload,
          logo: payload.logo
            ? {
                name: payload.logo.name,
                size: payload.logo.size,
                type: payload.logo.type,
              }
            : undefined,
        });

        const response = await createBrand(payload);

        console.log("[BRANDS] createBrand response:", response);

        toast.success("برند جدید با موفقیت ایجاد شد");
      }

      setIsFormOpen(false);
      resetForm();

      console.log("[BRANDS] submit finished. refetch items");

      await fetchItems();
    } catch (error) {
      console.error("[BRANDS] submit error:", error);

      toast.error("خطا در ثبت اطلاعات برند");
    } finally {
      setSubmitting(false);
    }
  }, [editingItem, fetchItems, form, resetForm]);

  const handleInlineLogoUpload = useCallback(
    async (row: BrandItem, file: File) => {
      try {
        console.log("[BRANDS] inline logo upload started:", {
          row,
          file: {
            name: file.name,
            size: file.size,
            type: file.type,
          },
        });

        const payload: UpdateBrandPayload = {
          logo: file,
        };

        const response = await updateBrand(row.id, payload);

        console.log("[BRANDS] inline logo upload response:", response);

        await fetchItems();

        toast.success("لوگوی برند با موفقیت به‌روزرسانی شد");
      } catch (error) {
        console.error("[BRANDS] inline logo upload error:", error);

        toast.error("خطا در بارگذاری لوگوی برند");
        throw new Error("Failed to upload brand logo");
      }
    },
    [fetchItems],
  );

  const handleTabChange = useCallback(
    (nextTab: TabType) => {
      if (nextTab === tab) return;

      console.log("[BRANDS] tab changed:", {
        from: tab,
        to: nextTab,
      });

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
            console.log("[BRANDS] soft delete started:", row);
            console.log("[BRANDS] soft delete id:", row.id);

            const response = await deleteBrand(row.id);

            console.log("[BRANDS] soft delete response:", response);

            toast.success("برند با موفقیت حذف شد");

            console.log("[BRANDS] soft delete finished. refetch items");

            await fetchItems();
          } catch (error) {
            console.error("[BRANDS] soft delete error:", error);

            toast.error("خطا در حذف برند");
          }
        },
        onRestore: async (row) => {
          try {
            console.log("[BRANDS] restore started:", row);
            console.log("[BRANDS] restore id:", row.id);

            const response = await restoreBrand(row.id);

            console.log("[BRANDS] restore response:", response);

            toast.success("برند با موفقیت بازیابی شد");

            console.log("[BRANDS] restore finished. refetch items");

            await fetchItems();
          } catch (error) {
            console.error("[BRANDS] restore error:", error);

            toast.error("خطا در بازیابی برند");
          }
        },
        onHardDelete: async (row) => {
          try {
            console.log("[BRANDS] hard delete started:", row);
            console.log("[BRANDS] hard delete id:", row.id);

            const response = await hardDeleteBrand(row.id);

            console.log("[BRANDS] hard delete response:", response);

            toast.success("برند برای همیشه حذف شد");

            console.log("[BRANDS] hard delete finished. refetch items");

            await fetchItems();
          } catch (error) {
            console.error("[BRANDS] hard delete error:", error);

            toast.error("خطا در حذف دائمی برند");
          }
        },
        onLogoUpload: handleInlineLogoUpload,
      }) as ColumnDef<BrandItem>[],
    [fetchItems, handleEdit, handleInlineLogoUpload, tab],
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
  const isBusy = loading;

  const tableStatusText = useMemo(() => {
    if (isBusy) {
      return "در حال بارگذاری اطلاعات برندها...";
    }

    if (globalFilter.trim()) {
      return `${filteredRowsCount} نتیجه برای جستجوی شما پیدا شد`;
    }

    if (tab === "active") {
      return `${items.length} برند فعال`;
    }

    return `${items.length} برند حذف‌شده`;
  }, [filteredRowsCount, globalFilter, isBusy, items.length, tab]);

  const pageDescription = useMemo(() => {
    if (tab === "active") {
      return "مدیریت برندهای فعال، ایجاد، ویرایش و حذف آیتم‌ها";
    }

    return "مرور برندهای حذف‌شده، بازیابی یا حذف دائمی آیتم‌ها";
  }, [tab]);

  const emptyStateTitle = useMemo(() => {
    if (globalFilter.trim()) {
      return "نتیجه‌ای برای جستجوی شما پیدا نشد";
    }

    return tab === "active"
      ? "هنوز برند فعالی ثبت نشده است"
      : "هیچ برند حذف‌شده‌ای وجود ندارد";
  }, [globalFilter, tab]);

  const emptyStateDescription = useMemo(() => {
    if (globalFilter.trim()) {
      return "عبارت جستجو را تغییر دهید یا فیلترها را پاک کنید و دوباره تلاش کنید.";
    }

    return tab === "active"
      ? "برای شروع، یک برند جدید ایجاد کنید."
      : "آیتم‌های حذف‌شده در این بخش نمایش داده می‌شوند.";
  }, [globalFilter, tab]);

  const drawerTitle = editingItem ? "ویرایش برند" : "ایجاد برند جدید";

  const drawerDescription = editingItem
    ? "اطلاعات برند را ویرایش و ذخیره کنید."
    : "اطلاعات برند جدید را وارد و ثبت کنید.";

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
                      مدیریت برندها
                    </span>

                    <span className="dark:bg-dark-600 dark:text-dark-100 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600">
                      {tab === "active" ? "بخش فعال" : "بخش حذف‌شده"}
                    </span>
                  </div>

                  <div>
                    <h1 className="dark:text-dark-100 text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
                      برندها
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
                      variant={tab === "active" ? "flat" : "flat"}
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
                      variant={tab === "deleted" ? "flat" : "flat"}
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
                    placeholder="جستجو در برندها..."
                    value={globalFilter ?? ""}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                  />

                  <div className="flex shrink-0 justify-end">
                    <BrandsMenuAction />
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
                    ? "لیست برندهای فعال"
                    : "لیست برندهای حذف‌شده"}
                </h2>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {globalFilter.trim()
                    ? "نتایج بر اساس عبارت جستجوی وارد شده فیلتر شده‌اند."
                    : tab === "active"
                      ? "می‌توانید برندها را ویرایش یا حذف کنید."
                      : "می‌توانید برندهای حذف‌شده را بازیابی یا حذف دائمی کنید."}
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
                    افزودن برند
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
                              ایجاد برند جدید
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

      <CreateBrandDrawer
        isOpen={isFormOpen}
        onClose={closeFormModal}
        title={drawerTitle}
        description={drawerDescription}
        closeDisabled={submitting}
      >
        <BrandForm
          form={form}
          editingItem={editingItem}
          submitting={submitting}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancel={closeFormModal}
        />
      </CreateBrandDrawer>
    </>
  );
}
