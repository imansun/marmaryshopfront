import { Getter, Row } from "@tanstack/react-table";

import { Tag } from "@/components/ui";
import { TagItem } from "@/app/services/endpoints/tags";

const getTagTitle = (item: TagItem) => {
  const rawItem = item as TagItem & Record<string, unknown>;

  const possibleTitles = [rawItem.title, rawItem.name];

  const title = possibleTitles.find(
    (value) => typeof value === "string" && value.trim().length > 0,
  );

  return typeof title === "string" ? title : "";
};

const getTagDescription = (item: TagItem) => {
  const rawItem = item as TagItem & Record<string, unknown>;

  return typeof rawItem.description === "string" ? rawItem.description : "";
};

export function TitleCell({
  getValue,
  row,
}: {
  getValue: Getter<string>;
  row: Row<TagItem>;
}) {
  const description = getTagDescription(row.original);
  const title = getTagTitle(row.original);

  return (
    <div className="max-w-[260px]">
      <p className="dark:text-dark-100 font-semibold text-gray-800">
        {getValue() || title}
      </p>
      {description ? (
        <p className="mt-1 line-clamp-2 text-xs text-gray-500">
          {description}
        </p>
      ) : null}
    </div>
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
