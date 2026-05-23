import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { Fragment, type ReactNode, useCallback } from "react";

import { Button } from "@/components/ui";

type CreateTagDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  closeDisabled?: boolean;
};

export function CreateTagDrawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  closeDisabled = false,
}: CreateTagDrawerProps) {
  const handleClose = useCallback(() => {
    if (closeDisabled) return;
    onClose();
  }, [closeDisabled, onClose]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-100" onClose={handleClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity dark:bg-black/40" />
        </TransitionChild>

        <TransitionChild
          as={Fragment}
          enter="ease-out transform-gpu transition-transform duration-200"
          enterFrom="-translate-y-full"
          enterTo="translate-y-0"
          leave="ease-in transform-gpu transition-transform duration-200"
          leaveFrom="translate-y-0"
          leaveTo="-translate-y-full"
        >
          <DialogPanel className="fixed left-0 top-0 flex w-full transform-gpu flex-col bg-white shadow-2xl transition-transform duration-200 dark:bg-dark-700">
            <div className="flex items-start justify-between gap-4 bg-gray-200 px-4 py-3 dark:bg-dark-800 sm:px-5">
              <div className="min-w-0">
                <DialogTitle
                  as="h3"
                  className="text-base font-medium text-gray-800 dark:text-dark-100"
                >
                  {title}
                </DialogTitle>

                {description ? (
                  <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-dark-200">
                    {description}
                  </p>
                ) : null}
              </div>

              <Button
                type="button"
                onClick={handleClose}
                variant="flat"
                disabled={closeDisabled}
                aria-label="بستن"
                className="size-7 shrink-0 rounded-full p-0 ltr:-mr-1.5 rtl:-ml-1.5"
              >
                <XMarkIcon className="size-4.5" />
              </Button>
            </div>

            <div className="max-h-[85vh] overflow-y-auto p-4 sm:p-5">
              {children}
            </div>
          </DialogPanel>
        </TransitionChild>
      </Dialog>
    </Transition>
  );
}

export default CreateTagDrawer;
