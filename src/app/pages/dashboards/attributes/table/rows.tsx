import { Getter, Row } from "@tanstack/react-table";

import { Tag } from "@/components/ui";
import { AttributeItem } from "@/app/services/endpoints/attributes";

export function NameCell({
  getValue,
  row,
}: {
  getValue: Getter<string | null | undefined>;
  row: Row<AttributeItem>;
}) {
  const name = getValue();

  return (
    <div className="max-w-[260px]">
      <p className="dark:text-dark-100 font-semibold text-gray-800">
        {name || "-"}
      </p>

      {row.original.slug ? (
        <p className="mt-1 line-clamp-1 text-xs text-gray-500 dark:text-dark-300">
          {row.original.slug}
        </p>
      ) : null}
    </div>
  );
}

export function SlugCell({
  getValue,
}: {
  getValue: Getter<string | null | undefined>;
}) {
  const slug = getValue();

  if (!slug) {
    return <span className="text-gray-400 dark:text-dark-300">-</span>;
  }

  return (
    <span className="inline-flex max-w-[220px] items-center rounded-lg bg-gray-100 px-2.5 py-1 font-mono text-xs font-medium text-gray-700 dark:bg-dark-700 dark:text-dark-100">
      <span className="truncate">{slug}</span>
    </span>
  );
}

export function SortOrderCell({
  getValue,
}: {
  getValue: Getter<number | string | null | undefined>;
}) {
  const sortOrder = getValue();

  if (sortOrder === null || sortOrder === undefined || sortOrder === "") {
    return <span className="text-gray-400 dark:text-dark-300">-</span>;
  }

  return (
    <span className="inline-flex min-w-10 items-center justify-center rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:bg-dark-700 dark:text-dark-100">
      {sortOrder}
    </span>
  );
}

export function ActiveStatusCell({
  getValue,
}: {
  getValue: Getter<boolean | null | undefined>;
}) {
  const isActive = Boolean(getValue());

  return (
    <Tag color={isActive ? "success" : "error"} variant="soft">
      {isActive ? "فعال" : "غیرفعال"}
    </Tag>
  );
}

export function CreatedAtCell({
  getValue,
}: {
  getValue: Getter<string | Date | null | undefined>;
}) {
  const value = getValue();

  if (!value) {
    return <span className="text-gray-400 dark:text-dark-300">-</span>;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return <span className="text-gray-400 dark:text-dark-300">-</span>;
  }

  return (
    <span className="text-sm text-gray-600 dark:text-dark-200">
      {date.toLocaleDateString("fa-IR")}
    </span>
  );
}

export function UpdatedAtCell({
  getValue,
}: {
  getValue: Getter<string | Date | null | undefined>;
}) {
  const value = getValue();

  if (!value) {
    return <span className="text-gray-400 dark:text-dark-300">-</span>;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return <span className="text-gray-400 dark:text-dark-300">-</span>;
  }

  return (
    <span className="text-sm text-gray-600 dark:text-dark-200">
      {date.toLocaleDateString("fa-IR")}
    </span>
  );
}
