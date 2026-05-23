// src/app/pages/dashboards/attributes/table/AttributeForm.tsx

import type { ChangeEvent, FormEvent } from "react";

import type { AttributeItem } from "@/app/services/endpoints/attributes";
import { Button, Card, Input, Switch } from "@/components/ui";
import { stringToSlug } from "@/utils/stringToSlug";

export interface AttributeFormState {
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: string;
}

interface AttributeFormProps {
  form: AttributeFormState;
  editingItem: AttributeItem | null;
  submitting: boolean;
  onChange: (key: keyof AttributeFormState, value: string | boolean) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function AttributeForm({
  form,
  editingItem,
  submitting,
  onChange,
  onSubmit,
  onCancel,
}: AttributeFormProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    onSubmit();
  };

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    onChange("name", value);

    if (!editingItem) {
      onChange("slug", stringToSlug(value));
    }
  };

  const handleSlugChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange("slug", event.target.value);
  };

  const handleSortOrderChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange("sortOrder", event.target.value);
  };

  const handleActiveChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange("isActive", event.target.checked);
  };

  return (
    <Card className="p-4 sm:p-5">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <h2 className="dark:text-dark-100 text-base font-semibold text-gray-800">
            {editingItem ? "ویرایش ویژگی" : "ایجاد ویژگی"}
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {editingItem
              ? "اطلاعات ویژگی انتخاب‌شده را ویرایش کنید."
              : "یک ویژگی جدید مانند رنگ، سایز یا جنس ایجاد کنید."}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="attribute-name"
              className="dark:text-dark-100 text-sm font-medium text-gray-700"
            >
              نام ویژگی
              <span className="ms-1 text-red-500">*</span>
            </label>

            <Input
              id="attribute-name"
              name="name"
              type="text"
              placeholder="مثلاً Color یا Size"
              value={form.name}
              disabled={submitting}
              autoComplete="off"
              onChange={handleNameChange}
            />

            <p className="text-xs text-gray-400 dark:text-gray-500">
              نام نمایشی ویژگی که در پنل و محصول استفاده می‌شود.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="attribute-slug"
              className="dark:text-dark-100 text-sm font-medium text-gray-700"
            >
              اسلاگ
            </label>

            <Input
              id="attribute-slug"
              name="slug"
              type="text"
              placeholder="مثلاً color یا size"
              value={form.slug}
              disabled={submitting}
              autoComplete="off"
              dir="ltr"
              onChange={handleSlugChange}
            />

            <p className="text-xs text-gray-400 dark:text-gray-500">
              {editingItem
                ? "در حالت ویرایش، اسلاگ را می‌توانید به‌صورت دستی تغییر دهید."
                : "در هنگام ایجاد، اسلاگ به‌صورت خودکار از روی نام ویژگی ساخته می‌شود."}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="attribute-sort-order"
              className="dark:text-dark-100 text-sm font-medium text-gray-700"
            >
              ترتیب نمایش
            </label>

            <Input
              id="attribute-sort-order"
              name="sortOrder"
              type="number"
              placeholder="0"
              value={form.sortOrder}
              disabled={submitting}
              min={0}
              onChange={handleSortOrderChange}
            />

            <p className="text-xs text-gray-400 dark:text-gray-500">
              عدد کمتر معمولاً زودتر نمایش داده می‌شود.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 p-3 dark:border-dark-500">
            <div className="flex items-center justify-between gap-3">
              <div>
                <label
                  htmlFor="attribute-is-active"
                  className="dark:text-dark-100 text-sm font-medium text-gray-700"
                >
                  وضعیت ویژگی
                </label>

                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  اگر فعال باشد، این ویژگی در بخش‌های مربوطه قابل استفاده است.
                </p>
              </div>

              <Switch
                id="attribute-is-active"
                checked={form.isActive}
                disabled={submitting}
                onChange={handleActiveChange}
              />
            </div>

            <div className="mt-2">
              {form.isActive ? (
                <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  فعال
                </span>
              ) : (
                <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  غیرفعال
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-gray-200 pt-4 dark:border-dark-500">
          <Button type="submit" disabled={submitting}>
            {submitting
              ? "در حال ذخیره..."
              : editingItem
                ? "بروزرسانی ویژگی"
                : "ایجاد ویژگی"}
          </Button>

          <Button
            type="button"
            variant="outlined"
            onClick={onCancel}
            disabled={submitting}
          >
            انصراف
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default AttributeForm;
