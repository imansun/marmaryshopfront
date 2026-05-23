// src/app/pages/dashboards/products/Toolbar.tsx

// Import Dependencies
import clsx from "clsx";
import type { Table } from "@tanstack/react-table";

// Local Imports
import { TableConfig } from "./TableConfig";
import { CollapsibleSearch } from "@/components/shared/CollapsibleSearch";
import { MenuActions } from "./MenuActions";
import type { ProductItem } from "@/app/services/endpoints/products";

// ----------------------------------------------------------------------

export function Toolbar({ table }: { table: Table<ProductItem> }) {
  const isFullScreenEnabled = table.getState().tableSettings?.enableFullScreen;

  return (
    <div
      className={clsx(
        "flex items-center justify-between",
        isFullScreenEnabled && "px-4 sm:px-5",
      )}
    >
      <h2 className="dark:text-dark-100 truncate text-base font-medium tracking-wide text-gray-800">
        جدول محصولات
      </h2>

      <div
        className={clsx("flex", isFullScreenEnabled && "ltr:-mr-2 rtl:-ml-2")}
      >
        <CollapsibleSearch
          placeholder="اینجا جستجو کنید..."
          value={table.getState().globalFilter}
          onChange={(e) => table.setGlobalFilter(e.target.value)}
        />

        <TableConfig table={table} />

        <MenuActions />
      </div>
    </div>
  );
}
