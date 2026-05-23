import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";

import { TagItem } from "@/app/services/endpoints/tags";
import { ActiveStatusCell, TitleCell } from "./rows";
import { TagsRowActions } from "./RowActions";

type TabType = "active" | "deleted";
type TagColumnDef = ColumnDef<TagItem, unknown>;

const columnHelper = createColumnHelper<TagItem>();

export const columns = ({
  tab,
  onEdit,
  onDelete,
  onRestore,
  onHardDelete,
}: {
  tab: TabType;
  onEdit: (row: TagItem) => void;
  onDelete: (row: TagItem) => Promise<void>;
  onRestore: (row: TagItem) => Promise<void>;
  onHardDelete: (row: TagItem) => Promise<void>;
}): TagColumnDef[] =>
  [
    columnHelper.accessor((row) => row.id, {
      id: "id",
      header: "شناسه",
      cell: (info) => <span>{info.getValue()}</span>,
    }),
    columnHelper.accessor((row) => row.name, {
      id: "name",
      header: "نام",
      cell: TitleCell,
    }),
    columnHelper.accessor((row) => row.slug, {
      id: "slug",
      header: "اسلاگ",
      cell: (info) => <span>{info.getValue() || "-"}</span>,
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
        <TagsRowActions
          row={props.row}
          tab={tab}
          onEdit={onEdit}
          onDelete={onDelete}
          onRestore={onRestore}
          onHardDelete={onHardDelete}
        />
      ),
    }),
  ] as TagColumnDef[];
