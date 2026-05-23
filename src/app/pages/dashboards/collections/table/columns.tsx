import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";

import { CollectionItem } from "@/app/services/endpoints/collections";
import { ActiveStatusCell, TitleCell } from "./rows";
import { CollectionsRowActions } from "./RowActions";

type TabType = "active" | "deleted";
type CollectionColumnDef = ColumnDef<CollectionItem, unknown>;

const columnHelper = createColumnHelper<CollectionItem>();

export const columns = ({
  tab,
  onEdit,
  onDelete,
  onRestore,
  onHardDelete,
}: {
  tab: TabType;
  onEdit: (row: CollectionItem) => void;
  onDelete: (row: CollectionItem) => Promise<void>;
  onRestore: (row: CollectionItem) => Promise<void>;
  onHardDelete: (row: CollectionItem) => Promise<void>;
}): CollectionColumnDef[] =>
  [
    columnHelper.accessor((row) => row.id, {
      id: "id",
      header: "شناسه",
      cell: (info) => <span>{info.getValue()}</span>,
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
        <CollectionsRowActions
          row={props.row}
          tab={tab}
          onEdit={onEdit}
          onDelete={onDelete}
          onRestore={onRestore}
          onHardDelete={onHardDelete}
        />
      ),
    }),
  ] as CollectionColumnDef[];
