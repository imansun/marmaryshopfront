// src/app/pages/dashboards/collections/index.tsx
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
  type CollectionItem,
  createCollection,
  deleteCollection,
  getCollections,
  restoreCollection,
  updateCollection,
  type CreateCollectionPayload,
  type UpdateCollectionPayload,
} from "@/app/services/endpoints/collections";

import { fuzzyFilter } from "@/utils/react-table/fuzzyFilter";
import { columns } from "./table/columns";
import { CollectionForm } from "./table/CollectionForm";
import { CollectionsMenuAction } from "./table/MenuActions";
import { CreateCollectionDrawer } from "./table/CreateCollectionDrawer";

// ----------------------------------------------------------------------

type TabType = "active" | "deleted";

interface CollectionFormState {
  title: string;
  slug: string;
  description: string;
  imageUrl: string;
  image?: File;
  isActive: boolean;
  sortOrder: string;
}

const initialFormState: CollectionFormState = {
  title: "",
  slug: "",
  description: "",
  imageUrl: "",
  image: undefined,
  isActive: true,
  sortOrder: "0",
};

const DEFAULT_COLLECTION_IMAGE = "/images/collections/default-collection.png";

const toSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const getCollectionImageSource = (item: CollectionItem) => {
  const rawItem = item as CollectionItem & Record<string, unknown>;

  const possibleSources = [
    rawItem.imageSource,
    rawItem.imageUrl,
    rawItem.image,
    rawItem.thumbnailUrl,
    rawItem.thumbnail,
    rawItem.icon,
    rawItem.cover,
    rawItem.banner,
  ];

  const source = possibleSources.find(
    (value) => typeof value === "string" && value.trim().length > 0,
  );

  return typeof source === "string" ? source : "";
};

const getCollectionTitle = (item: CollectionItem) => {
  const rawItem = item as CollectionItem & Record<string, unknown>;

  const possibleTitles = [rawItem.title, rawItem.name];

  const title = possibleTitles.find(
    (value) => typeof value === "string" && value.trim().length > 0,
  );

  return typeof title === "string" ? title : "";
};

const normalizeCollectionItems = (response: unknown): CollectionItem[] => {
  if (Array.isArray(response)) {
    return response as CollectionItem[];
  }

  if (!response || typeof response !== "object") {
    return [];
  }

  const rawResponse = response as Record<string, unknown>;

  const possibleItems = [
    rawResponse.data,
    rawResponse.items,
    rawResponse.collections,
    rawResponse.results,
    rawResponse.docs,
  ];

  const items = possibleItems.find((value) => Array.isArray(value));

  return Array.isArray(items) ? (items as CollectionItem[]) : [];
};

const isDeletedCollection = (item: CollectionItem) => {
  const rawItem = item as CollectionItem & Record<string, unknown>;

  return Boolean(rawItem.deletedAt || rawItem.isDeleted);
};

// ----------------------------------------------------------------------

export default function CollectionsPage() {
  const [tab, setTab] = useState<TabType>("active");

  const [items, setItems] = useState<CollectionItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const [editingItem, setEditingItem] = useState<CollectionItem | null>(null);
  const [form, setForm] = useState<CollectionFormState>(initialFormState);
  const [isFormOpen, setIsFormOpen] = useState(false);

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

  const fetchActive = useCallback(async () => {
    try {
      setLoading(true);

      const response = await getCollections({
        page: 1,
        limit: 100,
        includeDeleted: false,
      });

      const normalizedItems = normalizeCollectionItems(response).filter(
        (item) => !isDeletedCollection(item),
      );

      setItems(normalizedItems);
    } catch {
      setItems([]);
      toast.error("خطا در دریافت مجموعه‌های فعال");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDeleted = useCallback(async () => {
    try {
      setLoading(true);

      const response = await getCollections({
        page: 1,
        limit: 100,
        includeDeleted: true,
        sortBy: "deletedAt",
        sortOrder: "DESC",
      });

      const normalizedItems = normalizeCollectionItems(response).filter(
        (item) => isDeletedCollection(item),
      );

      setItems(normalizedItems);
    } catch {
      setItems([]);
      toast.error("خطا در دریافت مجموعه‌های حذف‌شده");
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

  const handleChange = useCallback(
    (
      key: keyof CollectionFormState,
      value: string | boolean | File | undefined,
    ) => {
      setForm((prev) => {
        const nextForm: CollectionFormState = {
          ...prev,
          [key]: value,
        } as CollectionFormState;

        if (key === "title" && typeof value === "string") {
          nextForm.slug = toSlug(value);
        }

        return nextForm;
      });
    },
    [],
  );

  const handleEdit = useCallback((item: CollectionItem) => {
    const resolvedImageSource = getCollectionImageSource(item);
    const resolvedTitle = getCollectionTitle(item);

    const rawItem = item as CollectionItem & Record<string, unknown>;

    setEditingItem(item);

    setForm({
      title: resolvedTitle,
      slug:
        typeof rawItem.slug === "string" && rawItem.slug.trim()
          ? rawItem.slug
          : toSlug(resolvedTitle),
      description:
        typeof rawItem.description === "string" ? rawItem.description : "",
      imageUrl:
        resolvedImageSource ||
        (typeof rawItem.imageUrl === "string" ? rawItem.imageUrl : "") ||
        DEFAULT_COLLECTION_IMAGE,
      image: undefined,
      isActive: Boolean(rawItem.isActive),
      sortOrder: String(rawItem.sortOrder ?? 0),
    });

    setIsFormOpen(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      const trimmedTitle = form.title.trim();
      const trimmedDescription = form.description.trim();
      const generatedSlug = toSlug(trimmedTitle);
      const resolvedSlug = form.slug.trim() || generatedSlug;

      if (!trimmedTitle) {
        toast.warning("عنوان مجموعه الزامی است");
        return;
      }

      setSubmitting(true);

      if (editingItem) {
        const payload: UpdateCollectionPayload = {
          title: trimmedTitle || undefined,
          slug: resolvedSlug || undefined,
          description: trimmedDescription || undefined,
          isActive: form.isActive,
          sortOrder: Number(form.sortOrder || 0),
        };

        await updateCollection(editingItem.id, payload);

        if (form.image) {
          await updateCollection(editingItem.id, {
            image: form.image,
          } as UpdateCollectionPayload);
        }

        toast.success("مجموعه با موفقیت ویرایش شد");
      } else {
        const payload: CreateCollectionPayload = {
          title: trimmedTitle,
          slug: resolvedSlug || undefined,
          description: trimmedDescription || undefined,
          isActive: form.isActive,
          sortOrder: Number(form.sortOrder || 0),
        };

        const created = await createCollection(payload);
        const createdId =
          (created as { id?: string | number })?.id ??
          (created as { data?: { id?: string | number } })?.data?.id;

        if (form.image && createdId !== undefined && createdId !== null) {
          await updateCollection(createdId, {
            image: form.image,
          } as UpdateCollectionPayload);
        }

        toast.success("مجموعه جدید با موفقیت ایجاد شد");
      }

      setIsFormOpen(false);
      resetForm();

      await fetchItems();
    } catch {
      toast.error("خطا در ثبت اطلاعات مجموعه");
    } finally {
      setSubmitting(false);
    }
  }, [editingItem, fetchItems, form, resetForm]);

  const handleTabChange = useCallback(
    (nextTab: TabType) => {
      if (nextTab === tab) return;

      setTab(nextTab);
      setGlobalFilter("");
      setSorting([]);
    },
    [tab],
  );

  const tableColumns = useMemo(
    () =>
      columns({
        tab,
        onEdit: handleEdit,
        onDelete: async (row) => {
          try {
            await deleteCollection(row.id);
            toast.success("مجموعه با موفقیت حذف شد");
            await fetchItems();
          } catch {
            toast.error("خطا در حذف مجموعه");
          }
        },
        onRestore: async (row) => {
          try {
            await restoreCollection(row.id);
            toast.success("مجموعه با موفقیت بازیابی شد");
            await fetchItems();
          } catch {
            toast.error("خطا در بازیابی مجموعه");
          }
        },
        onHardDelete: async (row) => {
          try {
            await deleteCollection(row.id);
            toast.success("مجموعه برای همیشه حذف شد");
            await fetchItems();
          } catch {
            toast.error("خطا در حذف دائمی مجموعه");
          }
        },
      }) as ColumnDef<CollectionItem>[],
    [fetchItems, handleEdit, tab],
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
      return "در حال بارگذاری اطلاعات مجموعه‌ها...";
    }

    if (globalFilter.trim()) {
      return `${filteredRowsCount} نتیجه برای جستجوی شما پیدا شد`;
    }

    if (tab === "active") {
      return `${items.length} مجموعه فعال`;
    }

    return `${items.length} مجموعه حذف‌شده`;
  }, [filteredRowsCount, globalFilter, isBusy, items.length, tab]);

  const pageDescription = useMemo(() => {
    if (tab === "active") {
      return "مدیریت مجموعه‌های فعال، ایجاد، ویرایش و حذف آیتم‌ها";
    }

    return "مرور مجموعه‌های حذف‌شده و بازیابی آیتم‌ها";
  }, [tab]);

  const emptyStateTitle = useMemo(() => {
    if (globalFilter.trim()) {
      return "نتیجه‌ای برای جستجوی شما پیدا نشد";
    }

    return tab === "active"
      ? "هنوز مجموعه فعالی ثبت نشده است"
      : "هیچ مجموعه حذف‌شده‌ای وجود ندارد";
  }, [globalFilter, tab]);

  const emptyStateDescription = useMemo(() => {
    if (globalFilter.trim()) {
      return "عبارت جستجو را تغییر دهید یا فیلترها را پاک کنید و دوباره تلاش کنید.";
    }

    return tab === "active"
      ? "برای شروع، یک مجموعه جدید ایجاد کنید."
      : "آیتم‌های حذف‌شده در این بخش نمایش داده می‌شوند.";
  }, [globalFilter, tab]);

  const drawerTitle = editingItem ? "ویرایش مجموعه" : "ایجاد مجموعه جدید";

  const drawerDescription = editingItem
    ? "اطلاعات مجموعه را ویرایش و ذخیره کنید."
    : "اطلاعات مجموعه جدید را وارد و ثبت کنید.";

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
                      مدیریت مجموعه‌ها
                    </span>

                    <span className="dark:bg-dark-600 dark:text-dark-100 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600">
                      {tab === "active" ? "بخش فعال" : "بخش حذف‌شده"}
                    </span>
                  </div>

                  <div>
                    <h1 className="dark:text-dark-100 text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
                      مجموعه‌ها
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
                    placeholder="جستجو در مجموعه‌ها..."
                    value={globalFilter ?? ""}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                  />

                  <div className="flex shrink-0 justify-end">
                    <CollectionsMenuAction />
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
                    ? "لیست مجموعه‌های فعال"
                    : "لیست مجموعه‌های حذف‌شده"}
                </h2>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {globalFilter.trim()
                    ? "نتایج بر اساس عبارت جستجوی وارد شده فیلتر شده‌اند."
                    : tab === "active"
                      ? "می‌توانید مجموعه‌ها را ویرایش یا حذف کنید."
                      : "می‌توانید مجموعه‌های حذف‌شده را بازیابی کنید."}
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
                    افزودن مجموعه
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
                              ایجاد مجموعه جدید
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

      <CreateCollectionDrawer
        isOpen={isFormOpen}
        onClose={closeFormModal}
        title={drawerTitle}
        description={drawerDescription}
        closeDisabled={submitting}
      >
        <CollectionForm
          form={form}
          editingItem={editingItem}
          submitting={submitting}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancel={closeFormModal}
        />
      </CreateCollectionDrawer>
    </>
  );
}
