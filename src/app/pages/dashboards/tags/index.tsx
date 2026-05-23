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
  type TagItem,
  createTag,
  deleteTag,
  getTags,
  restoreTag,
  updateTag,
  type CreateTagPayload,
  type UpdateTagPayload,
} from "@/app/services/endpoints/tags";

import { fuzzyFilter } from "@/utils/react-table/fuzzyFilter";
import { columns } from "./table/columns";
import { TagForm } from "./table/TagForm";
import { TagsMenuAction } from "./table/MenuActions";
import { CreateTagDrawer } from "./table/CreateTagDrawer";

// ----------------------------------------------------------------------

type TabType = "active" | "deleted";

interface TagFormState {
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  sortOrder: string;
}

const initialFormState: TagFormState = {
  name: "",
  slug: "",
  description: "",
  isActive: true,
  sortOrder: "0",
};

const toSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const getTagName = (item: TagItem) => {
  const rawItem = item as TagItem & Record<string, unknown>;

  const possibleNames = [rawItem.name, rawItem.title];

  const name = possibleNames.find(
    (value) => typeof value === "string" && value.trim().length > 0,
  );

  return typeof name === "string" ? name : "";
};

const normalizeTagItems = (response: unknown): TagItem[] => {
  if (Array.isArray(response)) {
    return response as TagItem[];
  }

  if (!response || typeof response !== "object") {
    return [];
  }

  const rawResponse = response as Record<string, unknown>;

  const possibleItems = [
    rawResponse.data,
    rawResponse.items,
    rawResponse.tags,
    rawResponse.results,
    rawResponse.docs,
  ];

  const items = possibleItems.find((value) => Array.isArray(value));

  return Array.isArray(items) ? (items as TagItem[]) : [];
};

const isDeletedTag = (item: TagItem) => {
  const rawItem = item as TagItem & Record<string, unknown>;

  return Boolean(rawItem.deletedAt || rawItem.isDeleted);
};

// ----------------------------------------------------------------------

export default function TagsPage() {
  const [tab, setTab] = useState<TabType>("active");

  const [items, setItems] = useState<TagItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const [editingItem, setEditingItem] = useState<TagItem | null>(null);
  const [form, setForm] = useState<TagFormState>(initialFormState);
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

      const response = await getTags();

      const normalizedItems = normalizeTagItems(response).filter(
        (item) => !isDeletedTag(item),
      );

      setItems(normalizedItems);
    } catch {
      setItems([]);
      toast.error("خطا در دریافت تگ‌های فعال");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDeleted = useCallback(async () => {
    try {
      setLoading(true);

      const response = await getTags();

      const normalizedItems = normalizeTagItems(response).filter((item) =>
        isDeletedTag(item),
      );

      setItems(normalizedItems);
    } catch {
      setItems([]);
      toast.error("خطا در دریافت تگ‌های حذف‌شده");
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
    (key: keyof TagFormState, value: string | boolean | undefined) => {
      setForm((prev) => {
        const nextForm: TagFormState = {
          ...prev,
          [key]: value,
        } as TagFormState;

        if (key === "name" && typeof value === "string") {
          nextForm.slug = toSlug(value);
        }

        return nextForm;
      });
    },
    [],
  );

  const handleEdit = useCallback((item: TagItem) => {
    const resolvedName = getTagName(item);

    const rawItem = item as TagItem & Record<string, unknown>;

    setEditingItem(item);

    setForm({
      name: resolvedName,
      slug:
        typeof rawItem.slug === "string" && rawItem.slug.trim()
          ? rawItem.slug
          : toSlug(resolvedName),
      description:
        typeof rawItem.description === "string" ? rawItem.description : "",
      isActive: Boolean(rawItem.isActive),
      sortOrder: String(rawItem.sortOrder ?? 0),
    });

    setIsFormOpen(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      const trimmedName = form.name.trim();
      const trimmedDescription = form.description.trim();
      const generatedSlug = toSlug(trimmedName);
      const resolvedSlug = form.slug.trim() || generatedSlug;

      if (!trimmedName) {
        toast.warning("نام تگ الزامی است");
        return;
      }

      setSubmitting(true);

      if (editingItem) {
        const payload: UpdateTagPayload = {
          name: trimmedName || undefined,
          slug: resolvedSlug || undefined,
          description: trimmedDescription || undefined,
          isActive: form.isActive,
          sortOrder: Number(form.sortOrder || 0),
        };

        await updateTag(editingItem.id, payload);

        toast.success("تگ با موفقیت ویرایش شد");
      } else {
        const payload: CreateTagPayload = {
          name: trimmedName,
          slug: resolvedSlug,
          description: trimmedDescription || undefined,
          isActive: form.isActive,
          sortOrder: Number(form.sortOrder || 0),
        };

        await createTag(payload);

        toast.success("تگ جدید با موفقیت ایجاد شد");
      }

      setIsFormOpen(false);
      resetForm();

      await fetchItems();
    } catch {
      toast.error("خطا در ثبت اطلاعات تگ");
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
            await deleteTag(row.id);
            toast.success("تگ با موفقیت حذف شد");
            await fetchItems();
          } catch {
            toast.error("خطا در حذف تگ");
          }
        },
        onRestore: async (row) => {
          try {
            await restoreTag(row.id);
            toast.success("تگ با موفقیت بازیابی شد");
            await fetchItems();
          } catch {
            toast.error("خطا در بازیابی تگ");
          }
        },
        onHardDelete: async (row) => {
          try {
            await deleteTag(row.id);
            toast.success("تگ برای همیشه حذف شد");
            await fetchItems();
          } catch {
            toast.error("خطا در حذف دائمی تگ");
          }
        },
      }) as ColumnDef<TagItem>[],
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
      return "در حال بارگذاری اطلاعات تگ‌ها...";
    }

    if (globalFilter.trim()) {
      return `${filteredRowsCount} نتیجه برای جستجوی شما پیدا شد`;
    }

    if (tab === "active") {
      return `${items.length} تگ فعال`;
    }

    return `${items.length} تگ حذف‌شده`;
  }, [filteredRowsCount, globalFilter, isBusy, items.length, tab]);

  const pageDescription = useMemo(() => {
    if (tab === "active") {
      return "مدیریت تگ‌های فعال، ایجاد، ویرایش و حذف آیتم‌ها";
    }

    return "مرور تگ‌های حذف‌شده و بازیابی آیتم‌ها";
  }, [tab]);

  const emptyStateTitle = useMemo(() => {
    if (globalFilter.trim()) {
      return "نتیجه‌ای برای جستجوی شما پیدا نشد";
    }

    return tab === "active"
      ? "هنوز تگ فعالی ثبت نشده است"
      : "هیچ تگ حذف‌شده‌ای وجود ندارد";
  }, [globalFilter, tab]);

  const emptyStateDescription = useMemo(() => {
    if (globalFilter.trim()) {
      return "عبارت جستجو را تغییر دهید یا فیلترها را پاک کنید و دوباره تلاش کنید.";
    }

    return tab === "active"
      ? "برای شروع، یک تگ جدید ایجاد کنید."
      : "آیتم‌های حذف‌شده در این بخش نمایش داده می‌شوند.";
  }, [globalFilter, tab]);

  const drawerTitle = editingItem ? "ویرایش تگ" : "ایجاد تگ جدید";

  const drawerDescription = editingItem
    ? "اطلاعات تگ را ویرایش و ذخیره کنید."
    : "اطلاعات تگ جدید را وارد و ثبت کنید.";

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
                      مدیریت تگ‌ها
                    </span>

                    <span className="dark:bg-dark-600 dark:text-dark-100 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600">
                      {tab === "active" ? "بخش فعال" : "بخش حذف‌شده"}
                    </span>
                  </div>

                  <div>
                    <h1 className="dark:text-dark-100 text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
                      تگ‌ها
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
                    placeholder="جستجو در تگ‌ها..."
                    value={globalFilter ?? ""}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                  />

                  <div className="flex shrink-0 justify-end">
                    <TagsMenuAction />
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
                    ? "لیست تگ‌های فعال"
                    : "لیست تگ‌های حذف‌شده"}
                </h2>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {globalFilter.trim()
                    ? "نتایج بر اساس عبارت جستجوی وارد شده فیلتر شده‌اند."
                    : tab === "active"
                      ? "می‌توانید تگ‌ها را ویرایش یا حذف کنید."
                      : "می‌توانید تگ‌های حذف‌شده را بازیابی کنید."}
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
                    افزودن تگ
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
                              ایجاد تگ جدید
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

      <CreateTagDrawer
        isOpen={isFormOpen}
        onClose={closeFormModal}
        title={drawerTitle}
        description={drawerDescription}
        closeDisabled={submitting}
      >
        <TagForm
          form={form}
          editingItem={editingItem}
          submitting={submitting}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancel={closeFormModal}
        />
      </CreateTagDrawer>
    </>
  );
}
