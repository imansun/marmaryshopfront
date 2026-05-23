// src/app/pages/dashboards/products/SubRowComponent.tsx

// Import Dependencies
import type { Row } from "@tanstack/react-table";

// Local Imports
import { Table, Tag, TBody, THead, Th, Tr, Td, Badge } from "@/components/ui";
import { formatDollarToToman } from "@/utils";
import type { ProductItem } from "@/app/services/endpoints/products";
import { JWT_HOST_API } from "@/configs/auth";

// ----------------------------------------------------------------------

const resolveProductImageUrl = (value?: string | null) => {
  if (!value) return "";

  const trimmed = value.trim();
  if (!trimmed) return "";

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }

  if (trimmed.startsWith("/")) {
    return `${JWT_HOST_API}${trimmed}`;
  }

  return `${JWT_HOST_API}/${trimmed}`;
};

const cols = ["عنوان", "شناسه", "برند", "دسته‌بندی", "قیمت پایه", "وضعیت"];

export function SubRowComponent({
  row,
  cardWidth,
}: {
  row: Row<ProductItem>;
  cardWidth?: number;
}) {
  const product = row.original;

  const categories =
    Array.isArray(product.categories) && product.categories.length > 0
      ? product.categories
          .map((category) => {
            if (typeof category === "string") return category;
            return category?.title ?? category?.name ?? "";
          })
          .filter(Boolean)
          .join("، ")
      : "—";

  const isActive = Boolean(product.isActive);
  const statusLabel = isActive ? "فعال" : "غیرفعال";
  const statusColor: "success" | "error" = isActive ? "success" : "error";

  const rawImageUrl =
    product.imageUrl ||
    (Array.isArray(product.images)
      ? product.images.find((image) => image?.imageUrl)?.imageUrl ?? ""
      : "");

  const imageUrl = resolveProductImageUrl(rawImageUrl);

  const title = product.title ?? "—";
  const brand =
    typeof product.brand === "string"
      ? product.brand
      : product.brand?.name ?? "—";
  const id = product.id ?? "—";
  const basePrice = Number(product.basePrice ?? 0);

  return (
    <div
      className="dark:border-b-dark-500 dark:bg-dark-750 sticky border-b border-b-gray-200 bg-gray-50 pt-3 pb-4 ltr:left-0 rtl:right-0"
      style={{ maxWidth: cardWidth }}
    >
      <p className="dark:text-dark-100 mt-1 px-4 font-medium text-gray-800 sm:px-5 lg:ltr:ml-14 rtl:rtl:mr-14">
        جزئیات محصول:
      </p>

      <div className="mt-1 overflow-x-auto overscroll-x-contain px-4 sm:px-5 lg:ltr:ml-14 rtl:rtl:mr-14">
        <Table
          hoverable
          className="text-xs-plus w-full text-left rtl:text-right [&_.table-td]:py-2"
        >
          <THead>
            <Tr className="dark:border-b-dark-500 border-y border-transparent border-b-gray-200">
              {cols.map((col, index) => (
                <Th
                  key={index}
                  className="dark:text-dark-100 py-2 font-semibold text-gray-800 uppercase first:px-0 last:px-0"
                >
                  {col}
                </Th>
              ))}
            </Tr>
          </THead>

          <TBody>
            <Tr className="dark:border-b-dark-500 border-y border-transparent border-b-gray-200">
              <Td className="px-0 font-medium ltr:rounded-l-lg rtl:rounded-r-lg">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <div className="size-8 shrink-0">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={title}
                        className="h-full w-full rounded-sm object-cover object-center"
                      />
                    ) : (
                      <div className="dark:bg-dark-600 flex h-full w-full items-center justify-center rounded-sm bg-gray-200 text-xs font-medium text-gray-500">
                        {title?.charAt(0) ?? "P"}
                      </div>
                    )}
                  </div>

                  <span className="dark:text-dark-100 text-gray-800">
                    {title}
                  </span>
                </div>
              </Td>

              <Td>{id}</Td>
              <Td>{brand}</Td>

              <Td>
                <span className="line-clamp-1 max-w-xs">{categories}</span>
              </Td>

              <Td>{formatDollarToToman(basePrice)}</Td>

              <Td className="px-0 ltr:rounded-r-lg rtl:rounded-l-lg">
                <Badge color={statusColor}>{statusLabel}</Badge>
              </Td>
            </Tr>
          </TBody>
        </Table>
      </div>

      <div className="flex justify-end px-4 sm:px-5">
        <div className="mt-4 w-full max-w-xs text-end">
          <Table className="w-full [&_.table-td]:px-0 [&_.table-td]:py-1">
            <TBody>
              <Tr>
                <Td>قیمت پایه :</Td>
                <Td>
                  <span className="dark:text-dark-100 font-medium text-gray-800">
                    {formatDollarToToman(basePrice)}
                  </span>
                </Td>
              </Tr>

              <Tr>
                <Td>برند :</Td>
                <Td>
                  <span className="dark:text-dark-100 font-medium text-gray-800">
                    {brand}
                  </span>
                </Td>
              </Tr>

              <Tr>
                <Td>دسته‌بندی :</Td>
                <Td>
                  <span className="dark:text-dark-100 font-medium text-gray-800">
                    {categories}
                  </span>
                </Td>
              </Tr>

              <Tr className="text-primary-600 dark:text-primary-400 text-lg">
                <Td>وضعیت :</Td>
                <Td>
                  <span className="font-medium">{statusLabel}</span>
                </Td>
              </Tr>
            </TBody>
          </Table>

          <div className="mt-2 flex justify-end space-x-1.5 rtl:space-x-reverse">
            <Tag component="button" className="min-w-[4rem]">
              ویرایش
            </Tag>

            <Tag component="button" color="primary" className="min-w-[4rem]">
              مشاهده
            </Tag>
          </div>
        </div>
      </div>
    </div>
  );
}
