// src\app\pages\dashboards\attributes\index.tsx
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

import { Button, Card, Table, TBody, Td, THead, Th, Tr } from "@/components/ui";
import { CollapsibleSearch } from "@/components/shared/CollapsibleSearch";
import { PaginationSection } from "@/components/shared/table/PaginationSection";
import { TableSortIcon } from "@/components/shared/table/TableSortIcon";

import {
  type AttributeItem,
  createAttribute,
  deleteAttribute,
  getAttributes,
  updateAttribute,
  type CreateAttributePayload,
  type UpdateAttributePayload,
} from "@/app/services/endpoints/attributes";

import { fuzzyFilter } from "@/utils/react-table/fuzzyFilter";
import { columns } from "./table/columns";
import { AttributeForm } from "./table/AttributeForm";
import { MenuActions } from "./table/MenuActions";
import { CreateAttributeDrawer } from "./table/CreateAttributeDrawer";
import AttributeValuesPanel from "./table/AttributeValuesPanel";

// ----------------------------------------------------------------------

interface AttributeFormState {
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: string;
}

const initialFormState: AttributeFormState = {
  name: "",
  slug: "",
  isActive: true,
  sortOrder: "0",
};

const normalizeAttributeItems = (response: unknown): AttributeItem[] => {
  if (Array.isArray(response)) {
    return response as AttributeItem[];
  }

  if (!response || typeof response !== "object") {
    return [];
  }

  const rawResponse = response as unknown as Record<string, unknown>;

  const possibleItems = [
    rawResponse.data,
    rawResponse.items,
    rawResponse.attributes,
    rawResponse.results,
    rawResponse.docs,
  ];

  const items = possibleItems.find((value) => Array.isArray(value));

  return Array.isArray(items) ? (items as AttributeItem[]) : [];
};

// ----------------------------------------------------------------------

export default function AttributesPage() {
  const [items, setItems] = useState<AttributeItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const [editingItem, setEditingItem] = useState<AttributeItem | null>(null);
  const [form, setForm] = useState<AttributeFormState>(initialFormState);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [selectedAttribute, setSelectedAttribute] =
    useState<AttributeItem | null>(null);
  const [valuesPanelOpen, setValuesPanelOpen] = useState(false);

  // ----------------------------------------------------------------------

  const resetForm = useCallback(() => {
    setForm(initialFormState);
    setEditingItem(null);
  }, []);

  const openCreateModal = useCallback(() => {
    console.log("[ATTRIBUTES] open create drawer");

    resetForm();
    setIsFormOpen(true);
  }, [resetForm]);

  const closeFormModal = useCallback(() => {
    if (submitting) return;

    console.log("[ATTRIBUTES] close drawer");

    setIsFormOpen(false);
    resetForm();
  }, [resetForm, submitting]);

  const handleOpenValues = useCallback((item: AttributeItem) => {
    console.log("[ATTRIBUTES] open values panel for item:", item);

    setSelectedAttribute(item);
    setValuesPanelOpen(true);
  }, []);

  const handleCloseValues = useCallback(() => {
    console.log("[ATTRIBUTES] close values panel");

    setValuesPanelOpen(false);
    setSelectedAttribute(null);
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);

      console.log("[ATTRIBUTES] fetchItems started");
      console.log("[ATTRIBUTES] fetchItems params:", {
        page: 1,
        limit: 100,
      });

      const response = await getAttributes({
        page: 1,
        limit: 100,
      });

      console.log("[ATTRIBUTES] raw response:", response);
      console.log("[ATTRIBUTES] is array response:", Array.isArray(response));

      if (response && typeof response === "object") {
        const rawResponse = response as unknown as Record<string, unknown>;

        console.log("[ATTRIBUTES] response.data:", rawResponse.data);
        console.log("[ATTRIBUTES] response.items:", rawResponse.items);
        console.log(
          "[ATTRIBUTES] response.attributes:",
          rawResponse.attributes,
        );
      }

      const normalizedItems = normalizeAttributeItems(response);

      console.log("[ATTRIBUTES] normalized items:", normalizedItems);
      console.log("[ATTRIBUTES] items count:", normalizedItems.length);

      setItems(normalizedItems);
    } catch (error) {
      console.error("[ATTRIBUTES] fetchItems error:", error);

      setItems([]);
      toast.error("خطا در دریافت لیست ویژگی‌ها");
    } finally {
      console.log("[ATTRIBUTES] fetchItems finished");

      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log("[ATTRIBUTES] useEffect fetchItems triggered");

    void fetchItems();
  }, [fetchItems]);

  // ----------------------------------------------------------------------

  const handleChange = useCallback(
    (
      key: keyof AttributeFormState,
      value: string | boolean | File | undefined,
    ) => {
      console.log("[ATTRIBUTES] form change:", {
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

  const handleEdit = useCallback((item: AttributeItem) => {
    console.log("[ATTRIBUTES] edit item:", item);

    setEditingItem(item);

    setForm({
      name: item.name || "",
      slug: item.slug || "",
      isActive: Boolean(item.isActive),
      sortOrder: String(item.sortOrder ?? 0),
    });

    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (row: AttributeItem) => {
      try {
        console.log("[ATTRIBUTES] delete started:", row);
        console.log("[ATTRIBUTES] delete id:", row.id);

        const response = await deleteAttribute(row.id);

        console.log("[ATTRIBUTES] delete response:", response);

        toast.success("ویژگی با موفقیت حذف شد");

        console.log("[ATTRIBUTES] delete finished. refetch items");

        await fetchItems();
      } catch (error) {
        console.error("[ATTRIBUTES] delete error:", error);

        toast.error("خطا در حذف ویژگی");
      }
    },
    [fetchItems],
  );

  const handleRestore = useCallback(async (row: AttributeItem) => {
    console.log("[ATTRIBUTES] restore requested:", row);

    toast.info("امکان بازیابی برای این صفحه هنوز فعال نشده است");
  }, []);

  const handleHardDelete = useCallback(async (row: AttributeItem) => {
    console.log("[ATTRIBUTES] hard delete requested:", row);

    toast.info("امکان حذف دائمی برای این صفحه هنوز فعال نشده است");
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      const trimmedName = form.name.trim();
      const trimmedSlug = form.slug.trim();

      console.log("[ATTRIBUTES] submit started");
      console.log("[ATTRIBUTES] submit mode:", editingItem ? "edit" : "create");
      console.log("[ATTRIBUTES] submit editing item:", editingItem);
      console.log("[ATTRIBUTES] submit form:", form);

      if (!trimmedName) {
        console.warn("[ATTRIBUTES] submit stopped. name is empty");

        toast.warning("نام ویژگی الزامی است");
        return;
      }

      setSubmitting(true);

      if (editingItem) {
        const payload: UpdateAttributePayload = {
          name: trimmedName || undefined,
          slug: trimmedSlug || undefined,
          isActive: form.isActive,
          sortOrder: Number(form.sortOrder || 0),
        };

        console.log("[ATTRIBUTES] updateAttribute payload:", payload);

        const response = await updateAttribute(editingItem.id, payload);

        console.log("[ATTRIBUTES] updateAttribute response:", response);

        toast.success("ویژگی با موفقیت ویرایش شد");
      } else {
        const payload: CreateAttributePayload = {
          name: trimmedName,
          slug: trimmedSlug || undefined,
          isActive: form.isActive,
          sortOrder: Number(form.sortOrder || 0),
        };

        console.log("[ATTRIBUTES] createAttribute payload:", payload);

        const response = await createAttribute(payload);

        console.log("[ATTRIBUTES] createAttribute response:", response);

        toast.success("ویژگی جدید با موفقیت ایجاد شد");
      }

      setIsFormOpen(false);
      resetForm();

      console.log("[ATTRIBUTES] submit finished. refetch items");

      await fetchItems();
    } catch (error) {
      console.error("[ATTRIBUTES] submit error:", error);

      toast.error("خطا در ثبت اطلاعات ویژگی");
    } finally {
      setSubmitting(false);
    }
  }, [editingItem, fetchItems, form, resetForm]);

  // ----------------------------------------------------------------------

  const tableColumns = useMemo<ColumnDef<AttributeItem>[]>(
    () =>
      columns({
        tab: "active",
        onEdit: handleEdit,
        onDelete: handleDelete,
        onRestore: handleRestore,
        onHardDelete: handleHardDelete,
        onManageValues: handleOpenValues,
      }) as ColumnDef<AttributeItem>[],
    [
      handleEdit,
      handleDelete,
      handleRestore,
      handleHardDelete,
      handleOpenValues,
    ],
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
  }, [globalFilter, table]);

  const filteredRowsCount = table.getFilteredRowModel().rows.length;
  const hasRows = filteredRowsCount > 0;
  const isBusy = loading;

  const tableStatusText = useMemo(() => {
    if (isBusy) {
      return "در حال بارگذاری اطلاعات ویژگی‌ها...";
    }

    if (globalFilter.trim()) {
      return `${filteredRowsCount} نتیجه برای جستجوی شما پیدا شد`;
    }

    return `${items.length} ویژگی ثبت‌شده`;
  }, [filteredRowsCount, globalFilter, isBusy, items.length]);

  const pageDescription = useMemo(() => {
    return "مدیریت ویژگی‌ها، ایجاد، ویرایش و حذف آیتم‌ها";
  }, []);

  const emptyStateTitle = useMemo(() => {
    if (globalFilter.trim()) {
      return "نتیجه‌ای برای جستجوی شما پیدا نشد";
    }

    return "هنوز ویژگی‌ای ثبت نشده است";
  }, [globalFilter]);

  const emptyStateDescription = useMemo(() => {
    if (globalFilter.trim()) {
      return "عبارت جستجو را تغییر دهید یا فیلترها را پاک کنید و دوباره تلاش کنید.";
    }

    return "برای شروع، یک ویژگی جدید ایجاد کنید.";
  }, [globalFilter]);

  const drawerTitle = editingItem ? "ویرایش ویژگی" : "ایجاد ویژگی جدید";

  const drawerDescription = editingItem
    ? "اطلاعات ویژگی را ویرایش و ذخیره کنید."
    : "اطلاعات ویژگی جدید را وارد و ثبت کنید.";

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
                      مدیریت ویژگی‌ها
                    </span>

                    <span className="dark:bg-dark-600 dark:text-dark-100 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600">
                      بخش لیست
                    </span>
                  </div>

                  <div>
                    <h1 className="dark:text-dark-100 text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
                      ویژگی‌ها
                    </h1>
                    <p className="dark:text-dark-200 mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                      {pageDescription}
                    </p>
                  </div>
                </div>
              </div>

              <div className="dark:border-dark-500 dark:bg-dark-700/70 flex flex-col gap-3 rounded-2xl border border-gray-200/80 bg-white/80 p-3 backdrop-blur-sm lg:flex-row lg:items-center lg:justify-between">
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

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <CollapsibleSearch
                    placeholder="جستجو در ویژگی‌ها..."
                    value={globalFilter ?? ""}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                  />

                  <div className="flex shrink-0 justify-end">
                    <MenuActions
                      loading={loading}
                      onCreate={openCreateModal}
                      onRefresh={() => {
                        void fetchItems();
                      }}
                    />
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
                  لیست ویژگی‌ها
                </h2>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {globalFilter.trim()
                    ? "نتایج بر اساس عبارت جستجوی وارد شده فیلتر شده‌اند."
                    : "می‌توانید ویژگی‌ها را ویرایش، حذف یا مقادیر آن‌ها را مدیریت کنید."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="dark:bg-dark-700 dark:text-dark-100 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
                  {hasRows ? `${filteredRowsCount} ردیف` : "بدون ردیف"}
                </span>

                {/* <Button
                  color="primary"
                  className="min-w-[140px] shadow-sm"
                  onClick={openCreateModal}
                >
                  افزودن ویژگی
                </Button> */}
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
                        ) : (
                          <div className="mt-4">
                            <Button color="primary" onClick={openCreateModal}>
                              ایجاد ویژگی جدید
                            </Button>
                          </div>
                        )}
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

        <AttributeValuesPanel
          attribute={selectedAttribute}
          open={valuesPanelOpen}
          onClose={handleCloseValues}
        />
      </div>

      <CreateAttributeDrawer
        isOpen={isFormOpen}
        onClose={closeFormModal}
        title={drawerTitle}
        description={drawerDescription}
        closeDisabled={submitting}
      >
        <AttributeForm
          form={form}
          editingItem={editingItem}
          submitting={submitting}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancel={closeFormModal}
        />
      </CreateAttributeDrawer>
    </>
  );
}
