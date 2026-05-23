// src/app/pages/dashboards/products/rows.tsx

// Import Dependencies
import clsx from "clsx";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import { CheckIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import type { CellContext } from "@tanstack/react-table";
import invariant from "tiny-invariant";
import moment from "jalali-moment";
import type { ComponentType, SVGProps } from "react";

// Local Imports
import { Highlight } from "@/components/shared/Highlight";
import { Avatar, Tag } from "@/components/ui";
import { useLocaleContext } from "@/app/contexts/locale/context";
import { ensureString } from "@/utils/ensureString";
import { formatDollarToToman } from "@/utils";
import type { ProductItem } from "@/app/services/endpoints/products";
import { JWT_HOST_API } from "@/configs/auth";

// ----------------------------------------------------------------------

const resolveProductImageUrl = (value?: string | null) => {
  if (!value) return "";

  const trimmed = value.trim();
  if (!trimmed) return "";

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }

  if (trimmed.startsWith("/")) {
    return `${JWT_HOST_API}${trimmed}`;
  }

  return `${JWT_HOST_API}/${trimmed}`;
};

type ProductStatusOption = {
  value: boolean;
  label: string;
  color:
    | "primary"
    | "secondary"
    | "info"
    | "success"
    | "warning"
    | "error"
    | "neutral";
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
};

export const productStatusOptions: ProductStatusOption[] = [
  {
    value: true,
    label: "فعال",
    color: "success",
  },
  {
    value: false,
    label: "غیرفعال",
    color: "error",
  },
];

// ----------------------------------------------------------------------

export function ProductImageCell({
  row,
}: CellContext<ProductItem, unknown>) {
  const title = ensureString(row.original.title);
  const imageUrl = resolveProductImageUrl(row.original.imageUrl);

  return (
    <div className="flex items-center">
      <Avatar
        size={10}
        name={title}
        src={imageUrl}
        classNames={{
          display: "mask is-squircle rounded-none text-sm",
        }}
      />
    </div>
  );
}

export function ProductIdCell({
  getValue,
}: CellContext<ProductItem, unknown>) {
  return (
    <span className="text-primary-600 dark:text-primary-400 font-medium">
      {ensureString(getValue()) || "—"}
    </span>
  );
}

export function DateCell({
  getValue,
}: CellContext<ProductItem, unknown>) {
  const { locale } = useLocaleContext();
  const rawValue = getValue();
  const timestamp =
    typeof rawValue === "string" || typeof rawValue === "number"
      ? rawValue
      : undefined;

  if (!timestamp) {
    return <p className="dark:text-dark-300 text-xs text-gray-400">—</p>;
  }

  const m = moment(timestamp);
  if (!m.isValid()) {
    return <p className="dark:text-dark-300 text-xs text-gray-400">—</p>;
  }

  const date = m.locale(locale).format("DD MMM YYYY");
  const time = m.locale(locale).format("hh:mm A");

  return (
    <>
      <p className="font-medium">{date}</p>
      <p className="dark:text-dark-300 mt-0.5 text-xs text-gray-400">{time}</p>
    </>
  );
}

export function TitleCell({
  row,
  getValue,
  column,
  table,
}: CellContext<ProductItem, unknown>) {
  const globalQuery = ensureString(table.getState().globalFilter);
  const columnQuery = ensureString(column.getFilterValue());
  const title = ensureString(getValue());

  return (
    <div className="flex items-center gap-4">
      <Avatar
        size={9}
        name={title}
        src={resolveProductImageUrl(row.original.imageUrl)}
        classNames={{
          display: "mask is-squircle rounded-none text-sm",
        }}
      />

      <span className="dark:text-dark-100 font-medium text-gray-800">
        <Highlight query={[globalQuery, columnQuery]}>{title}</Highlight>
      </span>
    </div>
  );
}

export function PriceCell({
  getValue,
}: CellContext<ProductItem, unknown>) {
  const value = getValue();
  const numericValue = Number(value || 0);

  return (
    <p className="text-sm-plus dark:text-dark-100 font-medium text-gray-800">
      {formatDollarToToman(numericValue)}
    </p>
  );
}

export function BrandCell({
  getValue,
}: CellContext<ProductItem, unknown>) {
  return (
    <p className="dark:text-dark-100 text-gray-800">
      {ensureString(getValue()) || "—"}
    </p>
  );
}

export function CategoriesCell({
  getValue,
  column,
  table,
}: CellContext<ProductItem, unknown>) {
  const globalQuery = ensureString(table.getState().globalFilter);
  const columnQuery = ensureString(column.getFilterValue());
  const value = ensureString(getValue());

  return (
    <p className="text-xs-plus w-48 truncate xl:w-56 2xl:w-64">
      <Highlight query={[globalQuery, columnQuery]}>{value || "—"}</Highlight>
    </p>
  );
}

export function ProductStatusCell({
  getValue,
  row,
  column,
  table,
}: CellContext<ProductItem, unknown>) {
  const val = Boolean(getValue());

  const option = productStatusOptions.find((item) => item.value === val);

  invariant(option, "گزینه وضعیت محصول پیدا نشد");

  const handleChangeStatus = (status: boolean) => {
    const selectedOption = productStatusOptions.find(
      (item) => item.value === status,
    );

    table.options.meta?.updateData?.(row.index, column.id, status);

    toast.success(
      `وضعیت محصول به ${selectedOption?.label ?? String(status)} تغییر یافت`,
    );
  };

  return (
    <Listbox onChange={handleChangeStatus} value={val}>
      <ListboxButton
        as={Tag}
        component="button"
        color={option.color}
        className="cursor-pointer gap-1.5"
      >
        {option.icon && <option.icon className="h-4 w-4" />}
        <span>{option.label}</span>
      </ListboxButton>

      <Transition
        as={ListboxOptions}
        enter="transition ease-out"
        enterFrom="opacity-0 translate-y-2"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-2"
        anchor={{ to: "bottom start", gap: "8px" }}
        className="text-xs-plus shadow-soft dark:border-dark-500 dark:bg-dark-750 z-100 max-h-60 w-40 overflow-auto rounded-lg border border-gray-300 bg-white py-1 capitalize outline-hidden focus-visible:outline-hidden dark:shadow-none"
      >
        {productStatusOptions.map((item) => (
          <ListboxOption
            key={String(item.value)}
            value={item.value}
            className={({ focus }) =>
              clsx(
                "dark:text-dark-100 relative flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-gray-800 outline-hidden transition-colors select-none",
                focus && "dark:bg-dark-600 bg-gray-100",
              )
            }
          >
            {({ selected }) => (
              <div className="flex w-full items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {item.icon && <item.icon className="size-4.5 stroke-1" />}
                  <span className="block truncate">{item.label}</span>
                </div>

                {selected && <CheckIcon className="-mr-1 size-4.5 stroke-1" />}
              </div>
            )}
          </ListboxOption>
        ))}
      </Transition>
    </Listbox>
  );
}
