import type { ChangeEvent, FormEvent } from "react";

import { Button, Card, Input, Switch } from "@/components/ui";
import type { BrandItem } from "@/app/services/endpoints/brands";

interface BrandFormState {
  name: string;
  description: string;
  logoUrl: string;
  logo?: File;
  isActive: boolean;
  sortOrder: string;
}

interface BrandFormProps {
  form: BrandFormState;
  editingItem: BrandItem | null;
  submitting: boolean;
  onChange: (
    key: keyof BrandFormState,
    value: string | boolean | File | undefined,
  ) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function BrandForm({
  form,
  editingItem,
  submitting,
  onChange,
  onSubmit,
  onCancel,
}: BrandFormProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <Card className="p-4 sm:p-5">
      <form onSubmit={handleSubmit}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="dark:text-dark-100 text-base font-semibold text-gray-800">
            {editingItem ? "ویرایش برند" : "ایجاد برند"}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="dark:text-dark-100 text-sm font-medium text-gray-700">
              نام برند
            </label>

            <Input
              placeholder="نام برند را وارد کنید"
              value={form.name}
              disabled={submitting}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                onChange("name", e.target.value)
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="dark:text-dark-100 text-sm font-medium text-gray-700">
              ترتیب نمایش
            </label>

            <Input
              type="number"
              placeholder="0"
              value={form.sortOrder}
              disabled={submitting}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                onChange("sortOrder", e.target.value)
              }
            />
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="dark:text-dark-100 text-sm font-medium text-gray-700">
              توضیحات
            </label>

            <Input
              placeholder="توضیحات برند"
              value={form.description}
              disabled={submitting}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                onChange("description", e.target.value)
              }
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="dark:text-dark-100 text-sm font-medium text-gray-700">
              فعال
            </span>

            <Switch
              checked={form.isActive}
              disabled={submitting}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                onChange("isActive", e.target.checked)
              }
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting
              ? "در حال ذخیره..."
              : editingItem
                ? "بروزرسانی برند"
                : "ایجاد برند"}
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
