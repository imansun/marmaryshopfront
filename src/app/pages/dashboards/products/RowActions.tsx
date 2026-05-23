// src/app/pages/dashboards/products/RowActions.tsx

// Import Dependencies
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import {
  ChevronUpIcon,
  EllipsisHorizontalIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useCallback, useState } from "react";
import type { Row } from "@tanstack/react-table";

// Local Imports
import {
  ConfirmModal,
  type ConfirmMessages,
} from "@/components/shared/ConfirmModal";
import { Button } from "@/components/ui";
import type { ProductItem } from "@/app/services/endpoints/products";

// ----------------------------------------------------------------------

const confirmMessages: ConfirmMessages = {
  pending: {
    description:
      "آیا مطمئن هستید که می‌خواهید این محصول را حذف کنید؟ پس از حذف، قابل بازگردانی نخواهد بود.",
  },
  success: {
    title: "محصول با موفقیت حذف شد",
  },
};

const menuItemClassName =
  "flex h-9 w-full items-center space-x-3 px-3 tracking-wide outline-hidden transition-colors";

type RowActionsProps = {
  row: Row<ProductItem>;
  onEdit: (product: ProductItem) => void;
  onDelete: (product: ProductItem) => Promise<void> | void;
  onView?: (product: ProductItem) => void;
};

export function RowActions({
  row,
  onEdit,
  onDelete,
  onView,
}: RowActionsProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmDeleteLoading, setConfirmDeleteLoading] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  const product = row.original;

  const closeModal = () => setDeleteModalOpen(false);

  const openModal = () => {
    setDeleteModalOpen(true);
    setDeleteError(false);
    setDeleteSuccess(false);
  };

  const handleDeleteRows = useCallback(async () => {
    try {
      setConfirmDeleteLoading(true);
      setDeleteError(false);

      await onDelete(product);

      setDeleteSuccess(true);
      setConfirmDeleteLoading(false);
    } catch (error) {
      console.error("Failed to delete row:", error);
      setDeleteError(true);
      setConfirmDeleteLoading(false);
    }
  }, [onDelete, product]);

  const handleView = useCallback(() => {
    onView?.(product);
  }, [onView, product]);

  const handleEdit = useCallback(() => {
    onEdit(product);
  }, [onEdit, product]);

  const state = deleteError ? "error" : deleteSuccess ? "success" : "pending";

  return (
    <>
      <div className="flex justify-center">
        {row.getCanExpand() ? (
          <Button
            isIcon
            className="size-7 rounded-full"
            variant="flat"
            onClick={row.getToggleExpandedHandler()}
          >
            <ChevronUpIcon
              className={clsx(
                "size-4.5 transition-transform",
                row.getIsExpanded() && "rotate-180",
              )}
            />
          </Button>
        ) : null}

        <Menu as="div" className="relative inline-block text-left">
          <MenuButton
            as={Button}
            variant="flat"
            isIcon
            className="size-7 rounded-full"
            aria-label="منوی عملیات سطر"
          >
            <EllipsisHorizontalIcon className="size-4.5" />
          </MenuButton>

          <Transition
            as={MenuItems}
            anchor={{ to: "bottom end" }}
            enter="transition ease-out duration-150"
            enterFrom="opacity-0 translate-y-2 scale-95"
            enterTo="opacity-100 translate-y-0 scale-100"
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100 translate-y-0 scale-100"
            leaveTo="opacity-0 translate-y-2 scale-95"
            className="dark:border-dark-500 dark:bg-dark-750 absolute z-100 min-w-[10rem] rounded-lg border border-gray-300 bg-white py-1 shadow-lg shadow-gray-200/50 outline-hidden focus-visible:outline-hidden dark:shadow-none"
          >
            <MenuItem>
              {({ focus }) => (
                <button
                  type="button"
                  onClick={handleView}
                  className={clsx(
                    menuItemClassName,
                    focus &&
                      "dark:bg-dark-600 dark:text-dark-100 bg-gray-100 text-gray-800",
                  )}
                >
                  <EyeIcon className="size-4.5 stroke-1" />
                  <span>مشاهده</span>
                </button>
              )}
            </MenuItem>

            <MenuItem>
              {({ focus }) => (
                <button
                  type="button"
                  onClick={handleEdit}
                  className={clsx(
                    menuItemClassName,
                    focus &&
                      "dark:bg-dark-600 dark:text-dark-100 bg-gray-100 text-gray-800",
                  )}
                >
                  <PencilIcon className="size-4.5 stroke-1" />
                  <span>ویرایش</span>
                </button>
              )}
            </MenuItem>

            <MenuItem>
              {({ focus }) => (
                <button
                  type="button"
                  onClick={openModal}
                  className={clsx(
                    "text-error dark:text-error-light flex h-9 w-full items-center space-x-3 px-3 tracking-wide outline-hidden transition-colors",
                    focus && "bg-error/10 dark:bg-error-light/10",
                  )}
                >
                  <TrashIcon className="size-4.5 stroke-1" />
                  <span>حذف</span>
                </button>
              )}
            </MenuItem>
          </Transition>
        </Menu>
      </div>

      <ConfirmModal
        show={deleteModalOpen}
        onClose={closeModal}
        messages={confirmMessages}
        onOk={handleDeleteRows}
        confirmLoading={confirmDeleteLoading}
        state={state}
      />
    </>
  );
}
