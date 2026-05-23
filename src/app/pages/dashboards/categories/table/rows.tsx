import { Getter, Row } from "@tanstack/react-table";
import { Avatar, Tag } from "@/components/ui";
import { CategoryItem } from "@/app/services/endpoints/categories";

export function ImageCell({ row }: { row: Row<CategoryItem> }) {
  const image = row.original.imageUrl;

  if (!image) {
    return (
      <Avatar
        size={9}
        name={row.original.title}
        initialColor="auto"
      />
    );
  }

  return (
    <div className="size-10 overflow-hidden rounded-lg">
      <img
        src={image}
        alt={row.original.title}
        className="h-full w-full object-cover"
      />
    </div>
  );
}

export function TitleCell({
  getValue,
  row,
}: {
  getValue: Getter<string>;
  row: Row<CategoryItem>;
}) {
  return (
    <div className="max-w-[260px]">
      <p className="dark:text-dark-100 font-semibold text-gray-800">
        {getValue()}
      </p>
      {row.original.description ? (
        <p className="mt-1 line-clamp-2 text-xs text-gray-500">
          {row.original.description}
        </p>
      ) : null}
    </div>
  );
}

export function ParentCell({ getValue }: { getValue: Getter<number | null> }) {
  const val = getValue();
  return <span>{val ?? "بدون والد"}</span>;
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
