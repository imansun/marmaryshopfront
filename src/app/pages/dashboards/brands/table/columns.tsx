import { useEffect, useMemo, useRef, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { PlusIcon } from "@heroicons/react/24/outline";
import invariant from "tiny-invariant";

import { BrandItem } from "@/app/services/endpoints/brands";
import { JWT_HOST_API } from "@/configs/auth";
import { Button, Upload } from "@/components/ui";
import { FileItemSquare } from "@/components/shared/form/FileItemSquare";
import { ActiveStatusCell, DescriptionCell, NameCell } from "./rows";
import { BrandRowActions } from "./RowActions";

type TabType = "active" | "deleted";

const columnHelper = createColumnHelper<BrandItem>();

const DEBUG_BRAND_LOGO_COLUMN = true;

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

const extractBrandLogo = (row: BrandItem) => {
  const extendedRow = row as BrandItem & Record<string, unknown>;

  const originalLogoUrl =
    typeof extendedRow.logoSource === "string" &&
    extendedRow.logoSource.trim().length > 0
      ? extendedRow.logoSource
      : typeof row.logoUrl === "string" && row.logoUrl.trim().length > 0
        ? row.logoUrl
        : typeof extendedRow.logo === "string" &&
            extendedRow.logo.trim().length > 0
          ? extendedRow.logo
          : typeof extendedRow.imageUrl === "string" &&
              extendedRow.imageUrl.trim().length > 0
            ? extendedRow.imageUrl
            : typeof extendedRow.image === "string" &&
                extendedRow.image.trim().length > 0
              ? extendedRow.image
              : typeof extendedRow.thumbnailUrl === "string" &&
                  extendedRow.thumbnailUrl.trim().length > 0
                ? extendedRow.thumbnailUrl
                : typeof extendedRow.thumbnail === "string" &&
                    extendedRow.thumbnail.trim().length > 0
                  ? extendedRow.thumbnail
                  : typeof extendedRow.icon === "string" &&
                      extendedRow.icon.trim().length > 0
                    ? extendedRow.icon
                    : typeof extendedRow.cover === "string" &&
                        extendedRow.cover.trim().length > 0
                      ? extendedRow.cover
                      : "";

  return {
    originalLogoUrl,
    resolvedLogoUrl: resolveBrandLogoUrl(originalLogoUrl),
  };
};

type InlineLogoUploadCellProps = {
  row: BrandItem;
  onLogoUpload?: (row: BrandItem, file: File) => Promise<void> | void;
};

const InlineLogoUploadCell = ({
  row,
  onLogoUpload,
}: InlineLogoUploadCellProps) => {
  const uploadRef = useRef<HTMLInputElement>(null);
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { originalLogoUrl, resolvedLogoUrl } = useMemo(
    () => extractBrandLogo(row),
    [row],
  );

  useEffect(() => {
    if (resolvedLogoUrl) {
      setLocalFile(null);
    }
  }, [resolvedLogoUrl]);

  const handleChange = async (files: File[]) => {
    const selectedFile = files?.[0];
    if (!selectedFile) return;

    setLocalFile(selectedFile);

    if (!onLogoUpload) return;

    try {
      setIsUploading(true);
      await onLogoUpload(row, selectedFile);
    } catch (error) {
      console.error("[Brand Logo Upload Error]", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = (e: Event) => {
    invariant(uploadRef?.current, "Can't access to input file");
    e.stopPropagation();
    uploadRef.current.value = "";
    setLocalFile(null);
  };

  if (DEBUG_BRAND_LOGO_COLUMN) {
    console.groupCollapsed(
      "%c[Brand Logo Column Debug]",
      "color:#2563eb;font-weight:bold;",
      {
        id: row.id,
        name: row.name,
      },
    );

    console.log("Base URL:", JWT_HOST_API);
    console.log("Original logo fields:", {
      logoSource: (row as BrandItem & Record<string, unknown>).logoSource,
      logoUrl: row.logoUrl,
      logo: (row as BrandItem & Record<string, unknown>).logo,
      imageUrl: (row as BrandItem & Record<string, unknown>).imageUrl,
      image: (row as BrandItem & Record<string, unknown>).image,
      thumbnailUrl: (row as BrandItem & Record<string, unknown>).thumbnailUrl,
      thumbnail: (row as BrandItem & Record<string, unknown>).thumbnail,
      icon: (row as BrandItem & Record<string, unknown>).icon,
      cover: (row as BrandItem & Record<string, unknown>).cover,
    });
    console.log("Resolved logo info:", {
      originalLogoUrl,
      resolvedLogoUrl,
      isAbsolute:
        resolvedLogoUrl.startsWith("http://") ||
        resolvedLogoUrl.startsWith("https://") ||
        resolvedLogoUrl.startsWith("data:"),
    });
    console.log("Local file:", localFile);
    console.log("Uploading:", isUploading);
    console.log("Raw row:", row);

    if (!originalLogoUrl) {
      console.warn("[Brand Logo Column Debug] No logo field found for this row.");
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

  if (resolvedLogoUrl) {
    return (
      <div className="flex justify-center">
        <Upload onChange={handleChange} ref={uploadRef} accept="image/*">
          {(props) => (
            <button
              type="button"
              className="relative overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:border-primary-500 dark:border-dark-500 dark:bg-dark-700"
              {...props}
            >
              <img
                src={resolvedLogoUrl}
                alt={row.name}
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
  onLogoUpload,
}: {
  tab: TabType;
  onEdit: (row: BrandItem) => void;
  onDelete: (row: BrandItem) => Promise<void>;
  onRestore: (row: BrandItem) => Promise<void>;
  onHardDelete: (row: BrandItem) => Promise<void>;
  onLogoUpload?: (row: BrandItem, file: File) => Promise<void> | void;
}) => [
  columnHelper.accessor((row) => row.id, {
    id: "id",
    header: "شناسه",
    cell: (info) => <span>{info.getValue()}</span>,
  }),
  columnHelper.display({
    id: "logo",
    header: "لوگو",
    cell: (info) => (
      <InlineLogoUploadCell
        row={info.row.original}
        onLogoUpload={onLogoUpload}
      />
    ),
  }),
  columnHelper.accessor((row) => row.name, {
    id: "name",
    header: "نام برند",
    cell: NameCell,
  }),
  columnHelper.accessor((row) => row.description, {
    id: "description",
    header: "توضیحات",
    cell: DescriptionCell,
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
      <BrandRowActions
        row={props.row}
        tab={tab}
        onEdit={onEdit}
        onDelete={onDelete}
        onRestore={onRestore}
        onHardDelete={onHardDelete}
      />
    ),
  }),
];
