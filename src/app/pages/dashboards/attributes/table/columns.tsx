import { Button as HeadlessButton } from "@headlessui/react";
import { createColumnHelper } from "@tanstack/react-table";
import { Fragment } from "react";

import { Button } from "@/components/ui";
import type { AttributeItem } from "@/app/services/endpoints/attributes";
import { ActiveStatusCell, NameCell, SlugCell } from "./rows";
import { AttributeRowActions } from "./RowActions";

type TabType = "active" | "deleted";

const columnHelper = createColumnHelper<AttributeItem>();

export const columns = ({
  tab,
  onEdit,
  onDelete,
  onRestore,
  onHardDelete,
  onManageValues,
}: {
  tab: TabType;
  onEdit: (row: AttributeItem) => void;
  onDelete: (row: AttributeItem) => Promise<void>;
  onRestore: (row: AttributeItem) => Promise<void>;
  onHardDelete: (row: AttributeItem) => Promise<void>;
  onManageValues: (row: AttributeItem) => void;
}) => [
  columnHelper.accessor((row) => row.id, {
    id: "id",
    header: "شناسه",
    cell: (info) => <span>{info.getValue()}</span>,
  }),

  columnHelper.accessor((row) => row.name, {
    id: "name",
    header: "نام ویژگی",
    cell: NameCell,
  }),

  columnHelper.accessor((row) => row.slug, {
    id: "slug",
    header: "اسلاگ",
    cell: SlugCell,
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
    id: "values",
    header: "مقادیر",
    enableSorting: false,
    cell: (props) => (
      <HeadlessButton as={Fragment}>
        {({ hover, active }) => (
          <Button
            type="button"
            color="secondary"
            isGlow={hover && !active}
            onClick={() => onManageValues(props.row.original)}
            className="min-w-[120px] px-3 py-1.5 text-xs"
          >
            مدیریت مقادیر
          </Button>
        )}
      </HeadlessButton>
    ),
  }),

  columnHelper.display({
    id: "actions",
    header: "",
    enableSorting: false,
    cell: (props) => (
      <AttributeRowActions
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
