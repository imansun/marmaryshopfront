// Import Dependencies
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { rankItem } from "@tanstack/match-sorter-utils";
import {
  ColumnDef,
  FilterFn,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";

// Local Imports
import { CollapsibleSearch } from "@/components/shared/CollapsibleSearch";
import { PaginationSection } from "@/components/shared/table/PaginationSection";
import { TableSortIcon } from "@/components/shared/table/TableSortIcon";
import {
  Button,
  Card,
  Table,
  TBody,
  Td,
  THead,
  Th,
  Tr,
  Switch,
} from "@/components/ui";
import {
  activateUser,
  deactivateUser,
  getUsers,
  UserItem,
} from "@/app/services/endpoints/users";

// ----------------------------------------------------------------------

const fuzzyFilter: FilterFn<UserItem> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(String(row.getValue(columnId) ?? ""), value);

  addMeta({
    itemRank,
  });

  return itemRank.passed;
};

const formatDate = (value?: string) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("fa-IR");
};

const getRoleLabel = (role?: string) => {
  switch (role) {
    case "admin":
      return "مدیر";
    case "customer":
      return "مشتری";
    default:
      return role || "-";
  }
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return "خطا در دریافت اطلاعات کاربران";
};

function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [updatingUserIds, setUpdatingUserIds] = useState<string[]>([]);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const deferredGlobalFilter = useDeferredValue(globalFilter);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const data = await getUsers();

      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      setUsers([]);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleUserStatus = useCallback(async (user: UserItem) => {
    try {
      setErrorMessage("");
      setUpdatingUserIds((prev) => [...prev, user.id]);

      if (user.isActive) {
        await deactivateUser(user.id);
      } else {
        await activateUser(user.id);
      }

      setUsers((prevUsers) =>
        prevUsers.map((item) =>
          item.id === user.id
            ? {
                ...item,
                isActive: !user.isActive,
              }
            : item,
        ),
      );
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setUpdatingUserIds((prev) => prev.filter((id) => id !== user.id));
    }
  }, []);

  const columns = useMemo<ColumnDef<UserItem>[]>(
    () => [
      {
        accessorKey: "id",
        id: "id",
        header: "شناسه",
        cell: ({ getValue }) => (
          <span className="font-medium text-gray-800 dark:text-dark-100">
            {String(getValue() ?? "-")}
          </span>
        ),
      },
      {
        accessorKey: "name",
        id: "name",
        header: "نام",
        cell: ({ getValue }) => (
          <span className="font-medium text-gray-800 dark:text-dark-100">
            {String(getValue() ?? "-")}
          </span>
        ),
      },
      {
        accessorKey: "phone",
        id: "phone",
        header: "شماره موبایل",
        cell: ({ getValue }) => (
          <span dir="ltr" className="inline-block">
            {String(getValue() ?? "-")}
          </span>
        ),
      },
      {
        accessorKey: "email",
        id: "email",
        header: "ایمیل",
        cell: ({ getValue }) => (
          <span dir="ltr" className="inline-block">
            {String(getValue() ?? "-")}
          </span>
        ),
      },
      {
        accessorKey: "role",
        id: "role",
        header: "نقش",
        cell: ({ getValue }) => (
          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-dark-700 dark:text-dark-100">
            {getRoleLabel(String(getValue() ?? ""))}
          </span>
        ),
      },
      {
        accessorKey: "isActive",
        id: "isActive",
        header: "وضعیت",
        cell: ({ row }) => {
          const user = row.original;
          const isUpdating = updatingUserIds.includes(user.id);

          return (
            <div className="flex items-center gap-3">
              <Switch
                checked={Boolean(user.isActive)}
                onChange={() => handleToggleUserStatus(user)}
                disabled={isUpdating}
              />

              <span
                className={
                  user.isActive
                    ? "rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-500/10 dark:text-green-400"
                    : "rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400"
                }
              >
                {isUpdating
                  ? "در حال انجام..."
                  : user.isActive
                    ? "فعال"
                    : "غیرفعال"}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "createdAt",
        id: "createdAt",
        header: "تاریخ ایجاد",
        cell: ({ getValue }) => formatDate(String(getValue() ?? "")),
      },
    ],
    [handleToggleUserStatus, updatingUserIds],
  );

  const table = useReactTable({
    data: users,
    columns,
    state: {
      sorting,
      globalFilter: deferredGlobalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    globalFilterFn: fuzzyFilter,
    getSortedRowModel: getSortedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleRefresh = () => {
    setGlobalFilter("");
    table.resetSorting();
    table.resetPagination();
    fetchUsers();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="dark:text-dark-100 truncate text-base font-medium tracking-wide text-gray-800">
          کاربران
        </h2>

        <div className="flex items-center gap-2">
          <CollapsibleSearch
            placeholder="اینجا جستجو کنید..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />

          <Button
            onClick={handleRefresh}
            variant="flat"
            isIcon
            className="size-8 rounded-full"
            disabled={isLoading}
          >
            <ArrowPathIcon
              className={isLoading ? "size-4.5 animate-spin" : "size-4.5"}
            />
          </Button>
        </div>
      </div>

      <Card className="mt-3">
        {errorMessage && (
          <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
            {errorMessage}
          </div>
        )}

        <div className="min-w-full overflow-x-auto">
          <Table hoverable className="w-full text-left rtl:text-right">
            <THead>
              {table.getHeaderGroups().map((headerGroup) => (
                <Tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <Th
                      key={header.id}
                      className="dark:bg-dark-800 dark:text-dark-100 bg-gray-200 font-semibold text-gray-800 uppercase first:ltr:rounded-tl-lg last:ltr:rounded-tr-lg first:rtl:rounded-tr-lg last:rtl:rounded-tl-lg"
                    >
                      {header.column.getCanSort() ? (
                        <div
                          className="flex cursor-pointer items-center space-x-2 select-none rtl:space-x-reverse"
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

                          <TableSortIcon sorted={header.column.getIsSorted()} />
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
              {isLoading ? (
                <Tr>
                  <Td colSpan={columns.length} className="py-8 text-center">
                    در حال دریافت اطلاعات کاربران...
                  </Td>
                </Tr>
              ) : table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <Tr
                    key={row.id}
                    className="dark:border-b-dark-500 border-y border-transparent border-b-gray-200"
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
                  <Td colSpan={columns.length} className="py-8 text-center">
                    کاربری یافت نشد
                  </Td>
                </Tr>
              )}
            </TBody>
          </Table>
        </div>

        {!isLoading && table.getFilteredRowModel().rows.length > 0 && (
          <div className="p-4 sm:px-5">
            <PaginationSection table={table} />
          </div>
        )}
      </Card>
    </div>
  );
}

export default UsersPage;
