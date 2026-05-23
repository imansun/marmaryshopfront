import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import {
  ArrowPathIcon,
  EllipsisHorizontalIcon,
  PencilIcon,
  TrashIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Fragment, useState } from "react";
import type { Row } from "@tanstack/react-table";

import { Button } from "@/components/ui";
import {
  ConfirmMessages,
  ConfirmModal,
} from "@/components/shared/ConfirmModal";
import type { AttributeItem } from "@/app/services/endpoints/attributes";

type TabType = "active" | "deleted";
type ActionType = "delete" | "restore" | "hardDelete";

export function AttributeRowActions({
  row,
  tab,
  onEdit,
  onDelete,
  onRestore,
  onHardDelete,
}: {
  row: Row<AttributeItem>;
  tab: TabType;
  onEdit: (row: AttributeItem) => void;
  onDelete: (row: AttributeItem) => Promise<void>;
  onRestore: (row: AttributeItem) => Promise<void>;
  onHardDelete: (row: AttributeItem) => Promise<void>;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [actionType, setActionType] = useState<ActionType>("delete");
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  const current = row.original;

  const openModal = (type: ActionType) => {
    setActionType(type);
    setModalOpen(true);
    setSuccess(false);
    setError(false);
  };

  const closeModal = () => {
    if (confirmLoading) return;

    setModalOpen(false);
  };

  const confirmMessagesMap: Record<ActionType, ConfirmMessages> = {
    delete: {
      pending: {
        description: "آیا از حذف این ویژگی مطمئن هستید؟",
      },
      success: {
        title: "ویژگی با موفقیت حذف شد",
      },
    },
    restore: {
      pending: {
        description: "آیا از بازیابی این ویژگی مطمئن هستید؟",
      },
      success: {
        title: "ویژگی با موفقیت بازیابی شد",
      },
    },
    hardDelete: {
      pending: {
        description: "آیا از حذف دائمی این ویژگی مطمئن هستید؟ این عملیات غیرقابل بازگشت است.",
      },
      success: {
        title: "ویژگی به صورت دائمی حذف شد",
      },
    },
  };

  const handleConfirm = async () => {
    try {
      setConfirmLoading(true);
      setSuccess(false);
      setError(false);

      if (actionType === "delete") {
        await onDelete(current);
      }

      if (actionType === "restore") {
        await onRestore(current);
      }

      if (actionType === "hardDelete") {
        await onHardDelete(current);
      }

      setSuccess(true);
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setConfirmLoading(false);
    }
  };

  const state = error ? "error" : success ? "success" : "pending";

  return (
    <>
      <div className="flex justify-center overflow-visible">
        <Menu as="div" className="relative inline-block text-left">
          <MenuButton
            as={Button}
            type="button"
            variant="flat"
            isIcon
            className="size-7 rounded-full"
          >
            <EllipsisHorizontalIcon className="size-4.5" />
          </MenuButton>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="opacity-0 translate-y-2"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-75"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-2"
          >
            <MenuItems
              portal
              anchor={{ to: "bottom end", gap: 8, padding: 8 }}
              className={clsx(
                "dark:border-dark-500 dark:bg-dark-750",
                "z-[9999] min-w-[10rem] rounded-lg border border-gray-300 bg-white py-1",
                "shadow-lg shadow-gray-200/50 outline-hidden dark:shadow-none",
              )}
            >
              {tab === "active" ? (
                <>
                  <MenuItem>
                    {({ focus }) => (
                      <button
                        type="button"
                        onClick={() => onEdit(current)}
                        className={clsx(
                          "flex h-9 w-full items-center gap-3 px-3 tracking-wide outline-hidden transition-colors",
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
                        onClick={() => openModal("delete")}
                        className={clsx(
                          "this:error text-this dark:text-this-light flex h-9 w-full items-center gap-3 px-3 tracking-wide outline-hidden transition-colors",
                          focus && "bg-this/10 dark:bg-this-light/10",
                        )}
                      >
                        <TrashIcon className="size-4.5 stroke-1" />
                        <span>حذف</span>
                      </button>
                    )}
                  </MenuItem>
                </>
              ) : (
                <>
                  <MenuItem>
                    {({ focus }) => (
                      <button
                        type="button"
                        onClick={() => openModal("restore")}
                        className={clsx(
                          "flex h-9 w-full items-center gap-3 px-3 tracking-wide outline-hidden transition-colors text-emerald-600 dark:text-emerald-400",
                          focus && "bg-emerald-50 dark:bg-emerald-500/10",
                        )}
                      >
                        <ArrowPathIcon className="size-4.5 stroke-1" />
                        <span>بازیابی</span>
                      </button>
                    )}
                  </MenuItem>

                  <MenuItem>
                    {({ focus }) => (
                      <button
                        type="button"
                        onClick={() => openModal("hardDelete")}
                        className={clsx(
                          "this:error text-this dark:text-this-light flex h-9 w-full items-center gap-3 px-3 tracking-wide outline-hidden transition-colors",
                          focus && "bg-this/10 dark:bg-this-light/10",
                        )}
                      >
                        <XCircleIcon className="size-4.5 stroke-1" />
                        <span>حذف دائمی</span>
                      </button>
                    )}
                  </MenuItem>
                </>
              )}
            </MenuItems>
          </Transition>
        </Menu>
      </div>

      <ConfirmModal
        show={modalOpen}
        onClose={closeModal}
        messages={confirmMessagesMap[actionType]}
        onOk={handleConfirm}
        confirmLoading={confirmLoading}
        state={state}
      />
    </>
  );
}
