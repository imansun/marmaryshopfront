export const APP_NAME = "Tailux";
export const APP_KEY = "tailux";

// Redirect Paths
export const REDIRECT_URL_KEY = "redirect";

// مسیر اصلی اپ (صفحه بعد از لاگین)
export const HOME_PATH = "/";

// مسیر ورودی برای کاربران غیرلاگین
export const GHOST_ENTRY_PATH = "/auth/login";

// Navigation Types
export type NavigationType = "root" | "group" | "collapse" | "item" | "divider";

export const COLORS = [
  "neutral",
  "primary",
  "secondary",
  "info",
  "success",
  "warning",
  "error",
] as const;

export type ColorType = (typeof COLORS)[number];
