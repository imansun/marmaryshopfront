import { useEffect, useMemo, useRef, useState } from "react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { PlusIcon } from "@heroicons/react/24/outline";
import invariant from "tiny-invariant";

import { CategoryItem } from "@/app/services/endpoints/categories";
import { JWT_HOST_API } from "@/configs/auth";
import { Button, Upload } from "@/components/ui";
import { FileItemSquare } from "@/components/shared/form/FileItemSquare";
import { ActiveStatusCell, ParentCell, TitleCell } from "./rows";
import { CategoryRowActions } from "./RowActions";

type TabType = "active" | "deleted";
type CategoryColumnDef = ColumnDef<CategoryItem, unknown>;

const columnHelper = createColumnHelper<CategoryItem>();

const DEBUG_CATEGORY_IMAGE_COLUMN = true;

const resolveCategoryImageUrl = (value?: string | null) => {
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

const getStringField = (
  source: Record<string, unknown>,
  key: string,
): string => {
  const value = source[key];

  return typeof value === "string" && value.trim().length > 0 ? value : "";
};

const extractCategoryImage = (row: CategoryItem) => {
  const extendedRow = row as unknown as CategoryItem & Record<string, unknown>;

  const originalImageUrl =
    getStringField(extendedRow, "imageSource") ||
    getStringField(extendedRow, "imageUrl") ||
    getStringField(extendedRow, "image") ||
    getStringField(extendedRow, "thumbnailUrl") ||
    getStringField(extendedRow, "thumbnail") ||
    getStringField(extendedRow, "icon") ||
    getStringField(extendedRow, "cover");

  return {
    originalImageUrl,
    resolvedImageUrl: resolveCategoryImageUrl(originalImageUrl),
  };
};

type InlineImageUploadCellProps = {
  row: CategoryItem;
  onImageUpload?: (row: CategoryItem, file: File) => Promise<void> | void;
};

const InlineImageUploadCell = ({
  row,
  onImageUpload,
}: InlineImageUploadCellProps) => {
  const uploadRef = useRef<HTMLInputElement>(null);
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { originalImageUrl, resolvedImageUrl } = useMemo(
    () => extractCategoryImage(row),
    [row],
  );

  useEffect(() => {
    if (resolvedImageUrl) {
      setLocalFile(null);
    }
  }, [resolvedImageUrl]);

  const handleChange = async (files: File[]) => {
    const selectedFile = files?.[0];
    if (!selectedFile) return;

    setLocalFile(selectedFile);

    if (!onImageUpload) return;

    try {
      setIsUploading(true);
      await onImageUpload(row, selectedFile);
    } catch (error) {
      console.error("[Category Image Upload Error]", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = (e: Event) => {
    invariant(uploadRef.current, "Can't access to input file");
    e.stopPropagation();
    uploadRef.current.value = "";
    setLocalFile(null);
  };

  if (DEBUG_CATEGORY_IMAGE_COLUMN) {
    const debugRow = row as unknown as CategoryItem & Record<string, unknown>;

    console.groupCollapsed(
      "%c[Category Image Column Debug]",
      "color:#2563eb;font-weight:bold;",
      {
        id: row.id,
        title: row.title,
      },
    );

    console.log("Base URL:", JWT_HOST_API);
    console.log("Original image fields:", {
      imageSource: debugRow.imageSource,
      imageUrl: debugRow.imageUrl,
      image: debugRow.image,
      thumbnailUrl: debugRow.thumbnailUrl,
      thumbnail: debugRow.thumbnail,
      icon: debugRow.icon,
      cover: debugRow.cover,
    });
    console.log("Resolved image info:", {
      originalImageUrl,
      resolvedImageUrl,
      isAbsolute:
        resolvedImageUrl.startsWith("http://") ||
        resolvedImageUrl.startsWith("https://") ||
        resolvedImageUrl.startsWith("data:"),
    });
    console.log("Local file:", localFile);
    console.log("Uploading:", isUploading);
    console.log("Raw row:", row);

    if (!originalImageUrl) {
      console.warn(
        "[Category Image Column Debug] No image field found for this row.",
      );
    }

    console.groupEnd();
  }

  if (localFile) {
    return (
      <div className="flex justify-center">
        <Upload onChange={handleChange} ref={uploadRef} accept="image/*">
          {(props) => (
            <div className="relative">
              <FileItemSquare
                handleRemove={handleRemove}
                file={localFile}
                {...props}
              />
              {isUploading ? (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 text-xs font-medium text-white">
                  در حال آپلود...
                </div>
              ) : null}
            </div>
          )}
        </Upload>
      </div>
    );
  }

  if (resolvedImageUrl) {
    return (
      <div className="flex justify-center">
        <Upload onChange={handleChange} ref={uploadRef} accept="image/*">
          {(props) => (
            <button
              type="button"
              className="hover:border-primary-500 dark:border-dark-500 dark:bg-dark-700 relative overflow-hidden rounded-lg border border-gray-200 bg-white transition"
              {...props}
            >
              <img
                src={resolvedImageUrl}
                alt={row.title}
                className="size-12 object-contain"
              />
              {isUploading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-[10px] font-medium text-white">
                  آپلود...
                </div>
              ) : null}
            </button>
          )}
        </Upload>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <Upload onChange={handleChange} ref={uploadRef} accept="image/*">
        {(props) => (
          <Button
            unstyled
            className="hover:text-primary-600 dark:text-dark-450 dark:hover:text-primary-500 relative size-12 shrink-0 space-x-2 rounded-lg border-2 border-dashed border-current p-0 text-gray-300"
            {...props}
          >
            <PlusIcon className="size-5 stroke-2" />
            {isUploading ? (
              <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 text-[10px] text-white">
                ...
              </span>
            ) : null}
          </Button>
        )}
      </Upload>
    </div>
  );
};

export const columns = ({
  tab,
  onEdit,
  onDelete,
  onRestore,
  onHardDelete,
  onImageUpload,
}: {
  tab: TabType;
  onEdit: (row: CategoryItem) => void;
  onDelete: (row: CategoryItem) => Promise<void>;
  onRestore: (row: CategoryItem) => Promise<void>;
  onHardDelete: (row: CategoryItem) => Promise<void>;
  onImageUpload?: (row: CategoryItem, file: File) => Promise<void> | void;
}): CategoryColumnDef[] =>
  [
    columnHelper.accessor((row) => row.id, {
      id: "id",
      header: "شناسه",
      cell: (info) => <span>{info.getValue()}</span>,
    }),
    columnHelper.display({
      id: "image",
      header: "تصویر",
      cell: (info) => (
        <InlineImageUploadCell
          row={info.row.original}
          onImageUpload={onImageUpload}
        />
      ),
    }),
    columnHelper.accessor((row) => row.title, {
      id: "title",
      header: "عنوان",
      cell: TitleCell,
    }),
    columnHelper.accessor((row) => row.slug, {
      id: "slug",
      header: "اسلاگ",
      cell: (info) => <span>{info.getValue() || "-"}</span>,
    }),
    columnHelper.accessor((row) => row.parentId, {
      id: "parentId",
      header: "والد",
      cell: ParentCell,
    }),
    columnHelper.accessor((row) => row.sortOrder, {
      id: "sortOrder",
      header: "ترتیب",
      cell: (info) => <span>{info.getValue() ?? 0}</span>,
    }),
    columnHelper.accessor((row) => row.isActive, {
      id: "isActive",
      header: "وضعیت",
      cell: ActiveStatusCell,
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (props) => (
        <CategoryRowActions
          row={props.row}
          tab={tab}
          onEdit={onEdit}
          onDelete={onDelete}
          onRestore={onRestore}
          onHardDelete={onHardDelete}
        />
      ),
    }),
  ] as unknown as CategoryColumnDef[];
