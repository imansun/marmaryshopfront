import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import {
  ArrowUpTrayIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Fragment } from "react";
import { CiViewTable } from "react-icons/ci";

import { Button } from "@/components/ui";

export function TagsMenuAction() {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <MenuButton
        as={Button}
        type="button"
        variant="flat"
        className="size-8 shrink-0 rounded-full p-0"
      >
        <EllipsisVerticalIcon className="size-4.5 stroke-2" />
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
            "shadow-soft dark:border-dark-500 dark:bg-dark-700",
            "z-[9999] min-w-[10rem] rounded-lg border border-gray-300 bg-white py-1",
            "shadow-gray-200/50 outline-hidden dark:shadow-none",
          )}
        >
          <MenuItem>
            {({ focus }) => (
              <button
                type="button"
                className={clsx(
                  "flex h-9 w-full items-center gap-3 px-3 tracking-wide outline-hidden transition-colors",
                  focus &&
                    "dark:bg-dark-600 dark:text-dark-100 bg-gray-100 text-gray-800",
                )}
              >
                <ArrowUpTrayIcon className="size-4.5" />
                <span>خروجی CSV</span>
              </button>
            )}
          </MenuItem>

          <MenuItem>
            {({ focus }) => (
              <button
                type="button"
                className={clsx(
                  "flex h-9 w-full items-center gap-3 px-3 tracking-wide outline-hidden transition-colors",
                  focus &&
                    "dark:bg-dark-600 dark:text-dark-100 bg-gray-100 text-gray-800",
                )}
              >
                <ArrowUpTrayIcon className="size-4.5" />
                <span>خروجی PDF</span>
              </button>
            )}
          </MenuItem>

          <MenuItem>
            {({ focus }) => (
              <button
                type="button"
                className={clsx(
                  "flex h-9 w-full items-center gap-3 px-3 tracking-wide outline-hidden transition-colors",
                  focus &&
                    "dark:bg-dark-600 dark:text-dark-100 bg-gray-100 text-gray-800",
                )}
              >
                <CiViewTable className="size-4.5" />
                <span>ذخیره به عنوان نما</span>
              </button>
            )}
          </MenuItem>
        </MenuItems>
      </Transition>
    </Menu>
  );
}

export default TagsMenuAction;
