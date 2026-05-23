import { Getter, Row } from "@tanstack/react-table";
import { Avatar, Tag } from "@/components/ui";
import { CollectionItem } from "@/app/services/endpoints/collections";

const getCollectionImageSource = (item: CollectionItem) => {
  const rawItem = item as CollectionItem & Record<string, unknown>;

  const possibleSources = [
    rawItem.imageUrl,
    rawItem.image,
    rawItem.imageSource,
    rawItem.thumbnailUrl,
    rawItem.thumbnail,
    rawItem.icon,
    rawItem.cover,
    rawItem.banner,
  ];

  const source = possibleSources.find(
    (value) => typeof value === "string" && value.trim().length > 0,
  );

  return typeof source === "string" ? source : "";
};

const getCollectionTitle = (item: CollectionItem) => {
  const rawItem = item as CollectionItem & Record<string, unknown>;

  const possibleTitles = [rawItem.title, rawItem.name];

  const title = possibleTitles.find(
    (value) => typeof value === "string" && value.trim().length > 0,
  );

  return typeof title === "string" ? title : "";
};

const getCollectionDescription = (item: CollectionItem) => {
  const rawItem = item as CollectionItem & Record<string, unknown>;

  return typeof rawItem.description === "string" ? rawItem.description : "";
};

export function ImageCell({ row }: { row: Row<CollectionItem> }) {
  const image = getCollectionImageSource(row.original);
  const title = getCollectionTitle(row.original);

  if (!image) {
    return <Avatar size={9} name={title} initialColor="auto" />;
  }

  return (
    <div className="size-10 overflow-hidden rounded-lg">
      <img src={image} alt={title} className="h-full w-full object-cover" />
    </div>
  );
}

export function TitleCell({
  getValue,
  row,
}: {
  getValue: Getter<string>;
  row: Row<CollectionItem>;
}) {
  const description = getCollectionDescription(row.original);

  return (
    <div className="max-w-[260px]">
      <p className="dark:text-dark-100 font-semibold text-gray-800">
        {getValue()}
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
