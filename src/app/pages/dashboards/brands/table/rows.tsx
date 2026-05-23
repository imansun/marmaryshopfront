import { Getter, Row } from "@tanstack/react-table";

import { Avatar, Tag } from "@/components/ui";
import { BrandItem } from "@/app/services/endpoints/brands";
import { JWT_HOST_API } from "@/configs/auth";

const resolveBrandLogoUrl = (value?: string | null) => {
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

export function LogoCell({ row }: { row: Row<BrandItem> }) {
  const logo = resolveBrandLogoUrl(row.original.logoUrl);

  if (!logo) {
    return (
      <Avatar
        size={9}
        name={row.original.name}
        initialColor="auto"
      />
    );
  }

  return (
    <div className="size-10 overflow-hidden rounded-lg bg-white dark:bg-dark-700">
      <img
        src={logo}
        alt={row.original.name}
        className="h-full w-full object-contain"
      />
    </div>
  );
}

export function NameCell({
  getValue,
  row,
}: {
  getValue: Getter<string>;
  row: Row<BrandItem>;
}) {
  return (
    <div className="max-w-[260px]">
      <p className="dark:text-dark-100 font-semibold text-gray-800">
        {getValue()}
      </p>

      {row.original.description ? (
        <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-dark-300">
          {row.original.description}
        </p>
      ) : null}
    </div>
  );
}

export function DescriptionCell({
  getValue,
}: {
  getValue: Getter<string | null | undefined>;
}) {
  const description = getValue();

  if (!description) {
    return <span className="text-gray-400 dark:text-dark-300">-</span>;
  }

  return (
    <p className="max-w-[320px] line-clamp-2 text-sm text-gray-600 dark:text-dark-200">
      {description}
    </p>
  );
}

export function ActiveStatusCell({
  getValue,
}: {
  getValue: Getter<boolean>;
}) {
  const isActive = getValue();

  return (
    <Tag color={isActive ? "success" : "error"} variant="soft">
      {isActive ? "فعال" : "غیرفعال"}
    </Tag>
  );
}
