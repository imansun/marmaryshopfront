// src\app\pages\dashboards\products\index.tsx
"use client";

import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedMinMaxValues,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnFiltersState,
  type ColumnPinningState,
  type Row,
  type RowSelectionState,
  type SortingState,
  type TableMeta,
  type VisibilityState,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PlusIcon } from "@heroicons/react/20/solid";

import { TableSortIcon } from "@/components/shared/table/TableSortIcon";
import { ColumnFilter } from "@/components/shared/table/ColumnFilter";
import { PaginationSection } from "@/components/shared/table/PaginationSection";
import type { TableSettings } from "@/components/shared/table/TableSettings";
import { Button, Card, Table, THead, TBody, Th, Tr, Td } from "@/components/ui";
import {
  useBoxSize,
  useLockScrollbar,
  useLocalStorage,
  useDidUpdate,
  useDisclosure,
} from "@/hooks";
import { fuzzyFilter } from "@/utils/react-table/fuzzyFilter";
import { useSkipper } from "@/utils/react-table/useSkipper";
import { useThemeContext } from "@/app/contexts/theme/context";
import { getUserAgentBrowser } from "@/utils/dom/getUserAgentBrowser";

import { columns } from "./columns";
import { SelectedRowsActions } from "./SelectedRowsActions";
import { SubRowComponent } from "./SubRowComponent";
import { Toolbar } from "./Toolbar";
import { CreateProductDrawer } from "./CreateProductDrawer";
import { EditProductDrawer } from "./EditProductDrawer";

import {
  deleteProduct,
  getProducts,
  updateProduct,
  restoreProduct,
  type ProductItem,
} from "@/app/services/endpoints/products";

const isSafari = getUserAgentBrowser() === "Safari";

export default function ProductsDatatableV2() {
  const { cardSkin } = useThemeContext();
  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();
  const [isMounted, setIsMounted] = useState(false);

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const [isCreateProductOpen, createProductDrawerActions] =
    useDisclosure(false);

  const [isEditProductOpen, editProductDrawerActions] =
    useDisclosure(false);

  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  const [tableSettings, setTableSettings] = useLocalStorage<TableSettings>(
    "products-table-settings",
    {
      enableSorting: true,
      enableColumnFilters: true,
      enableFullScreen: false,
      enableRowDense: false,
    },
  );

  const [columnVisibility, setColumnVisibility] =
    useLocalStorage<VisibilityState>("products-table-column-visibility", {});

  const [columnPinning, setColumnPinning] =
    useLocalStorage<ColumnPinningState>("products-table-column-pinning", {});

  const cardRef = useRef<HTMLDivElement>(null);
  const { width: cardWidth } = useBoxSize({ ref: cardRef });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setGlobalFilter("");
    setSorting([]);
    setColumnFilters([]);
    setRowSelection({});
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await getProducts();

      if (Array.isArray(response)) {
        setProducts(response);
        return;
      }

      const payload = (response as any)?.data ?? response;

      if (Array.isArray(payload)) {
        setProducts(payload);
        return;
      }

      if (Array.isArray(payload?.data)) {
        setProducts(payload.data);
        return;
      }

      if (Array.isArray(payload?.items)) {
        setProducts(payload.items);
        return;
      }

      if (Array.isArray(payload?.result)) {
        setProducts(payload.result);
        return;
      }

      if (Array.isArray(payload?.result?.data)) {
        setProducts(payload.result.data);
        return;
      }

      if (Array.isArray(payload?.result?.items)) {
        setProducts(payload.result.items);
        return;
      }

      if (Array.isArray((response as any)?.data?.items)) {
        setProducts((response as any).data.items);
        return;
      }

      if (Array.isArray((response as any)?.data?.result?.items)) {
        setProducts((response as any).data.result.items);
        return;
      }

      if (Array.isArray((response as any)?.data?.result?.data)) {
        setProducts((response as any).data.result.data);
        return;
      }

      setProducts([]);
    } catch {
      setErrorMessage("دریافت لیست محصولات با خطا مواجه شد.");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleProductCreated = useCallback(
    (product: ProductItem) => {
      skipAutoResetPageIndex();

      setProducts((old) => {
        const exists = old.some((item) => item.id === product.id);

        if (exists) {
          return old.map((item) => (item.id === product.id ? product : item));
        }

        return [product, ...old];
      });

      setRowSelection({});
    },
    [skipAutoResetPageIndex],
  );

  const handleProductUpdated = useCallback(
    (product: ProductItem) => {
      skipAutoResetPageIndex();

      setProducts((old) => {
        return old.map((item) => (item.id === product.id ? product : item));
      });

      setRowSelection({});
    },
    [skipAutoResetPageIndex],
  );

  const handleDeleteProduct = useCallback(
    async (product: ProductItem) => {
      try {
        await deleteProduct(product.id);
        skipAutoResetPageIndex();
        setProducts((old) => old.filter((item) => item.id !== product.id));
      } catch {}
    },
    [skipAutoResetPageIndex],
  );

  const handleRestoreProduct = useCallback(
    async (product: ProductItem) => {
      try {
        await restoreProduct(product.id);
        skipAutoResetPageIndex();
        setProducts((old) =>
          old.map((item) =>
            item.id === product.id ? { ...item, deletedAt: null } : item,
          ),
        );
      } catch {}
    },
    [skipAutoResetPageIndex],
  );

  const handleEditProduct = useCallback((product: ProductItem) => {
    setEditingProduct(product);
    editProductDrawerActions.open();
  }, [editProductDrawerActions]);

  const handleDeleteSelectedProducts = useCallback(
    async (productsToDelete: ProductItem[]) => {
      try {
        await Promise.all(
          productsToDelete.map((product) => deleteProduct(product.id)),
        );

        skipAutoResetPageIndex();
        const ids = productsToDelete.map((product) => product.id);
        setProducts((old) => old.filter((item) => !ids.includes(item.id)));
      } catch {}
    },
    [skipAutoResetPageIndex],
  );

  const meta = useMemo<TableMeta<ProductItem>>(
    () => ({
      tableSettings,
      setTableSettings,

      updateData: (rowIndex: number, columnId: string, value: unknown) => {
        skipAutoResetPageIndex();

        setProducts((old) =>
          old.map((row, index) =>
            index === rowIndex ? { ...row, [columnId]: value } : row,
          ),
        );
      },

      deleteRow: (row: Row<ProductItem>) => {
        skipAutoResetPageIndex();
        setProducts((old) =>
          old.filter((oldRow) => oldRow.id !== row.original.id),
        );
      },

      deleteRows: (rows: Row<ProductItem>[]) => {
        skipAutoResetPageIndex();
        const rowIds = rows.map((row) => row.original.id);
        setProducts((old) => old.filter((row) => !rowIds.includes(row.id)));
      },
    }),
    [skipAutoResetPageIndex, tableSettings, setTableSettings],
  );

  const tableColumns = useMemo(() => {
    return columns({
      onEdit: handleEditProduct,
      onDelete: handleDeleteProduct,
    });
  }, [handleDeleteProduct, handleEditProduct]);

  const table = useReactTable({
    data: products,
    columns: tableColumns,
    state: {
      globalFilter,
      sorting,
      columnFilters,
      rowSelection,
      columnVisibility,
      columnPinning,
      tableSettings,
    },
    meta,
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    enableSorting: Boolean(tableSettings.enableSorting),
    enableColumnFilters: Boolean(tableSettings.enableColumnFilters),
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: (updater) => {
      const nextValue =
        typeof updater === "function" ? updater(columnFilters) : updater;

      setColumnFilters(nextValue);
    },
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    globalFilterFn: fuzzyFilter,
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
    getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    autoResetPageIndex: isMounted ? autoResetPageIndex : false,
  });

  useDidUpdate(() => {
    table.resetRowSelection();
  }, [products]);

  useLockScrollbar(Boolean(tableSettings.enableFullScreen));

  const stats = useMemo(
    () => [
      { label: "کل محصولات", value: products.length },
      { label: "فعال", value: products.filter((p) => p.isActive).length },
      { label: "غیرفعال", value: products.filter((p) => !p.isActive).length },
      { label: "موجودی کم", value: 0 },
      { label: "پرفروش", value: 0 },
      { label: "تخفیف‌دار", value: 0 },
    ],
    [products],
  );

  return (
    <>
      <div className="transition-content grid grid-cols-1 grid-rows-[auto_auto_1fr] px-(--margin-x) py-4">
        <div className="flex items-center justify-between space-x-4">
          <div className="min-w-0">
            <h2 className="dark:text-dark-50 truncate text-xl font-medium tracking-wide text-gray-800">
              محصولات
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Button
              className="h-8 rounded-md px-3 text-xs"
              color="warning"
              onClick={() => {
                setGlobalFilter("");
                setSorting([]);
                setColumnFilters([]);
                table.resetColumnFilters();
                table.resetGlobalFilter();
                table.resetSorting();
              }}
            >
              پاک کردن فیلترها
            </Button>

            <Button
              className="h-8 space-x-1.5 rounded-md px-3 text-xs"
              color="primary"
              onClick={createProductDrawerActions.open}
            >
              <PlusIcon className="size-5" />
              <span>محصول جدید</span>
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6 2xl:gap-6">
          {stats.map((item) => (
            <div
              key={item.label}
              className="bg-gray-150 dark:bg-dark-700 rounded-lg p-3 2xl:p-4"
            >
              <p className="text-xs-plus mt-1">{item.label}</p>
              <p className="dark:text-dark-100 mt-2 text-2xl font-semibold text-gray-800">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div
          className={clsx(
            "flex flex-col pt-4",
            tableSettings.enableFullScreen &&
              "dark:bg-dark-900 fixed inset-0 z-61 h-full w-full bg-white pt-3",
          )}
        >
          <Toolbar table={table} />

          <Card
            className={clsx(
              "relative mt-3 flex grow flex-col",
              tableSettings.enableFullScreen && "overflow-hidden",
            )}
            ref={cardRef}
          >
            <div className="table-wrapper min-w-full grow overflow-x-auto">
              <Table
                hoverable
                dense={Boolean(tableSettings.enableRowDense)}
                sticky={Boolean(tableSettings.enableFullScreen)}
                className="w-full text-left rtl:text-right"
              >
                <THead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <Tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <Th
                          key={header.id}
                          className={clsx(
                            "dark:bg-dark-800 dark:text-dark-100 bg-gray-200 font-semibold text-gray-800 uppercase first:ltr:rounded-tl-lg last:ltr:rounded-tr-lg first:rtl:rounded-tr-lg last:rtl:rounded-tl-lg",
                            header.column.getCanPin() && [
                              header.column.getIsPinned() === "left" &&
                                "sticky z-2 ltr:left-0 rtl:right-0",
                              header.column.getIsPinned() === "right" &&
                                "sticky z-2 ltr:right-0 rtl:left-0",
                            ],
                          )}
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

                          {header.column.getCanFilter() ? (
                            <ColumnFilter column={header.column} />
                          ) : null}
                        </Th>
                      ))}
                    </Tr>
                  ))}
                </THead>

                <TBody>
                  {isLoading ? (
                    <Tr>
                      <Td
                        colSpan={table.getAllLeafColumns().length}
                        className="py-10 text-center"
                      >
                        در حال دریافت اطلاعات...
                      </Td>
                    </Tr>
                  ) : errorMessage ? (
                    <Tr>
                      <Td
                        colSpan={table.getAllLeafColumns().length}
                        className="text-error-600 py-10 text-center"
                      >
                        {errorMessage}
                      </Td>
                    </Tr>
                  ) : table.getRowModel().rows.length ? (
                    table.getRowModel().rows.map((row) => (
                      <Fragment key={row.id}>
                        <Tr
                          className={clsx(
                            "dark:border-b-dark-500 relative border-y border-transparent border-b-gray-200",
                            row.getIsExpanded() && "border-dashed",
                            row.getIsSelected() &&
                              !isSafari &&
                              "row-selected after:bg-primary-500/10 ltr:after:border-l-primary-500 rtl:after:border-r-primary-500 after:pointer-events-none after:absolute after:inset-0 after:z-2 after:h-full after:w-full after:border-3 after:border-transparent",
                          )}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <Td
                              key={cell.id}
                              className={clsx(
                                "relative",
                                cardSkin === "shadow"
                                  ? "dark:bg-dark-700"
                                  : "dark:bg-dark-900",
                                cell.column.getCanPin() && [
                                  cell.column.getIsPinned() === "left" &&
                                    "sticky z-2 ltr:left-0 rtl:right-0",
                                  cell.column.getIsPinned() === "right" &&
                                    "sticky z-2 ltr:right-0 rtl:left-0",
                                ],
                              )}
                            >
                              {cell.column.getIsPinned() && (
                                <div
                                  className={clsx(
                                    "dark:border-dark-500 pointer-events-none absolute inset-0 border-gray-200",
                                    cell.column.getIsPinned() === "left"
                                      ? "ltr:border-r rtl:border-l"
                                      : "ltr:border-l rtl:border-r",
                                  )}
                                />
                              )}
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </Td>
                          ))}
                        </Tr>

                        {row.getIsExpanded() && (
                          <tr>
                            <td
                              colSpan={row.getVisibleCells().length}
                              className="p-0"
                            >
                              <SubRowComponent
                                row={row}
                                cardWidth={cardWidth}
                              />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))
                  ) : (
                    <Tr>
                      <Td
                        colSpan={table.getAllLeafColumns().length}
                        className="py-10 text-center"
                      >
                        محصولی برای نمایش وجود ندارد.
                      </Td>
                    </Tr>
                  )}
                </TBody>
              </Table>
            </div>

            <SelectedRowsActions
              table={table}
              onDeleteSelected={handleDeleteSelectedProducts}
            />

            {table.getCoreRowModel().rows.length ? (
              <div
                className={clsx(
                  "px-4 pb-4 sm:px-5 sm:pt-4",
                  tableSettings.enableFullScreen &&
                    "dark:bg-dark-800 bg-gray-50",
                  !(
                    table.getIsSomeRowsSelected() || table.getIsAllRowsSelected()
                  ) && "pt-4",
                )}
              >
                <PaginationSection table={table} />
              </div>
            ) : null}
          </Card>
        </div>
      </div>

      <CreateProductDrawer
        isOpen={isCreateProductOpen}
        onClose={createProductDrawerActions.close}
        onCreated={handleProductCreated}
      />

      <EditProductDrawer
        isOpen={isEditProductOpen}
        onClose={editProductDrawerActions.close}
        product={editingProduct}
        onUpdated={handleProductUpdated}
      />
    </>
  );
}
