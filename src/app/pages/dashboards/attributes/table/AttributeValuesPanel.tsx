"use client";

import {
  Fragment,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/solid";

import {
  createAttributeValue,
  deleteAttributeValue,
  getAttributeValues,
  type AttributeItem,
  type AttributeValueItem,
  updateAttributeValue,
} from "@/app/services/endpoints/attributes";
import { Button, Input, Switch } from "@/components/ui";
import { stringToSlug } from "@/utils/stringToSlug";

interface AttributeValuesPanelProps {
  attribute: AttributeItem | null;
  open: boolean;
  onClose: () => void;
}

interface AttributeValueFormState {
  value: string;
  slug: string;
  isActive: boolean;
  sortOrder: string;
}

const initialForm: AttributeValueFormState = {
  value: "",
  slug: "",
  isActive: true,
  sortOrder: "0",
};

const normalizeAttributeValueItems = (
  response: unknown,
): AttributeValueItem[] => {
  if (Array.isArray(response)) {
    return response as AttributeValueItem[];
  }

  if (!response || typeof response !== "object") {
    return [];
  }

  const rawResponse = response as unknown as Record<string, unknown>;

  const possibleItems = [
    rawResponse.data,
    rawResponse.items,
    rawResponse.values,
    rawResponse.results,
    rawResponse.docs,
  ];

  const items = possibleItems.find((value) => Array.isArray(value));

  return Array.isArray(items) ? (items as AttributeValueItem[]) : [];
};

export default function AttributeValuesPanel({
  attribute,
  open,
  onClose,
}: AttributeValuesPanelProps) {
  const [items, setItems] = useState<AttributeValueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<AttributeValueItem | null>(
    null,
  );
  const [form, setForm] = useState<AttributeValueFormState>(initialForm);

  const resetForm = () => {
    setEditingItem(null);
    setForm(initialForm);
  };

  const fetchValues = async () => {
    if (!attribute?.id) return;

    try {
      setLoading(true);

      const response = await getAttributeValues(attribute.id, {
        page: 1,
        limit: 100,
      });

      const normalizedItems = normalizeAttributeValueItems(response);
      setItems(normalizedItems);
    } catch (error) {
      console.error("Failed to fetch attribute values:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && attribute?.id) {
      void fetchValues();
      resetForm();
    }
  }, [open, attribute?.id]);

  const handleClose = () => {
    if (submitting) return;

    resetForm();
    onClose();
  };

  const handleValueChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    setForm((prev) => ({
      ...prev,
      value,
      slug: editingItem ? prev.slug : stringToSlug(value),
    }));
  };

  const handleSlugChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    setForm((prev) => ({
      ...prev,
      slug: value,
    }));
  };

  const handleSortOrderChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    setForm((prev) => ({
      ...prev,
      sortOrder: value,
    }));
  };

  const handleActiveChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      isActive: event.target.checked,
    }));
  };

  const handleEdit = (item: AttributeValueItem) => {
    setEditingItem(item);
    setForm({
      value: item.value ?? "",
      slug: item.slug ?? "",
      isActive: Boolean(item.isActive),
      sortOrder: String(item.sortOrder ?? 0),
    });
  };

  const handleDelete = async (item: AttributeValueItem) => {
    const confirmed = window.confirm(`مقدار "${item.value}" حذف شود؟`);
    if (!confirmed) return;

    try {
      await deleteAttributeValue(item.id);
      await fetchValues();

      if (editingItem?.id === item.id) {
        resetForm();
      }
    } catch (error) {
      console.error("Failed to delete attribute value:", error);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!attribute?.id || !form.value.trim()) return;

    try {
      setSubmitting(true);

      const payload = {
        attributeId: attribute.id,
        value: form.value.trim(),
        slug: form.slug.trim() || undefined,
        isActive: form.isActive,
        sortOrder: Number(form.sortOrder || 0),
      };

      if (editingItem) {
        await updateAttributeValue(editingItem.id, payload);
      } else {
        await createAttributeValue(payload);
      }

      resetForm();
      await fetchValues();
    } catch (error) {
      console.error("Failed to submit attribute value:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Transition appear show={open} as={Fragment}>
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
          enterFrom="translate-x-full"
          enterTo="translate-x-0"
          leave="ease-in transform-gpu transition-transform duration-200"
          leaveFrom="translate-x-0"
          leaveTo="translate-x-full"
        >
          <DialogPanel className="dark:bg-dark-700 fixed top-0 right-0 flex h-full w-full max-w-2xl transform-gpu flex-col bg-white transition-transform duration-200">
            <div className="dark:border-dark-500 flex items-center justify-between border-b border-gray-200 px-4 py-4 sm:px-5">
              <div className="min-w-0">
                <h3 className="dark:text-dark-100 truncate text-base font-semibold text-gray-800">
                  مدیریت مقادیر ویژگی: {attribute?.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  برای این ویژگی، مقدارهای مختلف مثل رنگ‌ها یا سایزها را مدیریت
                  کنید.
                </p>
              </div>

              <Button
                type="button"
                onClick={handleClose}
                variant="flat"
                isIcon
                disabled={submitting}
                className="size-9 rounded-full"
              >
                <XMarkIcon className="size-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
              <form
                onSubmit={handleSubmit}
                className="dark:border-dark-500 grid grid-cols-1 gap-4 border-b border-gray-200 pb-5"
              >
                <div className="flex flex-col gap-2">
                  <label className="dark:text-dark-100 text-sm font-medium text-gray-700">
                    مقدار
                  </label>
                  <Input
                    value={form.value}
                    onChange={handleValueChange}
                    placeholder="مثلاً Red یا XL"
                    disabled={submitting}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="dark:text-dark-100 text-sm font-medium text-gray-700">
                    اسلاگ
                  </label>
                  <Input
                    value={form.slug}
                    onChange={handleSlugChange}
                    placeholder="مثلاً red یا xl"
                    disabled={submitting}
                    dir="ltr"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="dark:text-dark-100 text-sm font-medium text-gray-700">
                    ترتیب نمایش
                  </label>
                  <Input
                    type="number"
                    value={form.sortOrder}
                    onChange={handleSortOrderChange}
                    placeholder="0"
                    disabled={submitting}
                  />
                </div>

                <div className="dark:border-dark-500 flex items-center justify-between rounded-lg border border-gray-200 p-3">
                  <div>
                    <p className="dark:text-dark-100 text-sm font-medium text-gray-700">
                      وضعیت
                    </p>
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                      در صورت فعال بودن، این مقدار در بخش‌های مربوطه قابل
                      استفاده است.
                    </p>
                  </div>

                  <Switch
                    checked={form.isActive}
                    onChange={handleActiveChange}
                    disabled={submitting}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting
                      ? "در حال ذخیره..."
                      : editingItem
                        ? "بروزرسانی مقدار"
                        : "ایجاد مقدار"}
                  </Button>

                  {editingItem ? (
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={resetForm}
                      disabled={submitting}
                    >
                      انصراف از ویرایش
                    </Button>
                  ) : null}
                </div>
              </form>

              <div className="mt-5">
                {loading ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    در حال دریافت مقادیر...
                  </p>
                ) : items.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    هنوز مقداری برای این ویژگی ثبت نشده است.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="dark:border-dark-500 flex flex-col gap-3 rounded-lg border border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="dark:text-dark-100 font-medium text-gray-800">
                            {item.value}
                          </p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            slug: {item.slug || "-"} | sort:{" "}
                            {item.sortOrder ?? 0}
                          </p>
                          <p className="mt-1 text-xs">
                            {item.isActive ? (
                              <span className="text-green-600 dark:text-green-400">
                                فعال
                              </span>
                            ) : (
                              <span className="text-red-600 dark:text-red-400">
                                غیرفعال
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outlined"
                            onClick={() => handleEdit(item)}
                          >
                            ویرایش
                          </Button>

                          <Button
                            type="button"
                            variant="outlined"
                            onClick={() => handleDelete(item)}
                          >
                            حذف
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="dark:border-dark-500 border-t border-gray-200 px-4 py-4 sm:px-5">
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outlined"
                  onClick={handleClose}
                  disabled={submitting}
                >
                  بستن
                </Button>
              </div>
            </div>
          </DialogPanel>
        </TransitionChild>
      </Dialog>
    </Transition>
  );
}
