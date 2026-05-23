// src/app/pages/dashboards/products/columns.tsx

// Import Dependencies
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/20/solid";

// Local Imports
import {
  SelectCell,
  SelectHeader,
} from "@/components/shared/table/SelectCheckbox";
import type { ProductItem } from "@/app/services/endpoints/products";

import { RowActions } from "./RowActions";
import {
  BrandCell,
  CategoriesCell,
  DateCell,
  ProductIdCell,
  ProductImageCell,
  ProductStatusCell,
  PriceCell,
  TitleCell,
} from "./rows";

// ----------------------------------------------------------------------

const productStatusOptions: { value: boolean; label: string }[] = [
  {
    value: true,
    label: "فعال",
  },
  {
    value: false,
    label: "غیرفعال",
  },
];

type ProductColumnsParams = {
  onEdit: (row: ProductItem) => void;
  onDelete: (row: ProductItem) => Promise<void> | void;
};

export const columns = ({
  onEdit,
  onDelete,
}: ProductColumnsParams): ColumnDef<ProductItem>[] => [
  {
    id: "expand",
    label: "نمایش جزئیات",
    header: "",
    enableSorting: false,
    enableColumnFilter: false,
    cell: ({ row }) => (
      <button
        type="button"
        onClick={row.getToggleExpandedHandler()}
        className="flex size-8 items-center justify-center rounded-md hover:bg-gray-200 dark:hover:bg-dark-600"
        aria-label={row.getIsExpanded() ? "بستن جزئیات" : "نمایش جزئیات"}
      >
        {row.getIsExpanded() ? (
          <ChevronDownIcon className="size-5" />
        ) : (
          <ChevronRightIcon className="size-5" />
        )}
      </button>
    ),
  },
  {
    id: "select",
    label: "انتخاب سطر",
    header: SelectHeader,
    cell: SelectCell,
    enableSorting: false,
    enableColumnFilter: false,
  },
  {
    id: "image",
    accessorKey: "imageUrl",
    label: "تصویر",
    header: "تصویر",
    cell: ProductImageCell,
    enableSorting: false,
    enableColumnFilter: false,
  },
  {
    id: "id",
    accessorKey: "id",
    label: "شناسه محصول",
    header: "شناسه",
    cell: ProductIdCell,
  },
  {
    id: "title",
    accessorKey: "title",
    label: "عنوان محصول",
    header: "محصول",
    cell: TitleCell,
  },
  {
    id: "basePrice",
    accessorKey: "basePrice",
    label: "قیمت پایه",
    header: "قیمت",
    cell: PriceCell,
    filterColumn: "numberRange",
    filterFn: "inNumberRange",
  },
  {
    id: "brand",
    accessorFn: (row) =>
      typeof row.brand === "string" ? row.brand : row.brand?.name ?? "—",
    label: "برند",
    header: "برند",
    cell: BrandCell,
  },
  {
    id: "categories",
    accessorFn: (row) =>
      row.categories && row.categories.length > 0
        ? row.categories
            .map((category) =>
              typeof category === "string"
                ? category
                : category?.title ?? category?.name ?? "",
            )
            .filter(Boolean)
            .join("، ")
        : "—",
    label: "دسته‌بندی‌ها",
    header: "دسته‌بندی‌ها",
    cell: CategoriesCell,
  },
  {
    id: "isActive",
    accessorKey: "isActive",
    label: "وضعیت",
    header: "وضعیت",
    cell: ProductStatusCell,
    filterColumn: "select",
    filterFn: "equals",
    options: productStatusOptions,
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    label: "تاریخ ایجاد",
    header: "تاریخ",
    cell: DateCell,
    filterColumn: "dateRange",
  },
  {
    id: "actions",
    label: "عملیات سطر",
    header: "عملیات",
    enableSorting: false,
    enableColumnFilter: false,
    cell: ({ row }) => (
      <RowActions row={row} onEdit={onEdit} onDelete={onDelete} />
    ),
  },
];
