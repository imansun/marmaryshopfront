import { Navigate, RouteObject } from "react-router";

import AuthGuard from "@/middleware/AuthGuard";
import { DynamicLayout } from "../layouts/DynamicLayout";
import { AppLayout } from "../layouts/AppLayout";

/**
 * Protected routes configuration
 * These routes require authentication to access
 * Uses AuthGuard middleware to verify user authentication
 */
const protectedRoutes: RouteObject = {
  id: "protected",
  Component: AuthGuard,
  children: [
    // The dynamic layout supports both the main layout and the sideblock.
    {
      Component: DynamicLayout,
      children: [
        {
          index: true,
          element: <Navigate to="/dashboards/home" />,
        },
        {
          path: "dashboards",
          children: [
            {
              index: true,
              element: <Navigate to="/dashboards/home" />,
            },
            {
              path: "home",
              lazy: async () => ({
                Component: (await import("@/app/pages/dashboards/home"))
                  .default,
              }),
            },

            // ✅ Users page
            {
              path: "users",
              lazy: async () => ({
                Component: (await import("@/app/pages/dashboards/users"))
                  .default,
              }),
            },

            // ✅ Logs page
            {
              path: "logs",
              lazy: async () => ({
                Component: (await import("@/app/pages/dashboards/logs"))
                  .default,
              }),
            },

            // ✅ Categories page
            {
              path: "categories",
              lazy: async () => ({
                Component: (await import("@/app/pages/dashboards/categories"))
                  .default,
              }),
            },

            // ✅ Brands page
            {
              path: "brands",
              lazy: async () => ({
                Component: (await import("@/app/pages/dashboards/brands"))
                  .default,
              }),
            },

            // ✅ Attributes page
            {
              path: "attributes",
              lazy: async () => ({
                Component: (await import("@/app/pages/dashboards/attributes"))
                  .default,
              }),
            },

            // ✅ Collections page
            {
              path: "collections",
              lazy: async () => ({
                Component: (await import("@/app/pages/dashboards/collections"))
                  .default,
              }),
            },

            // ✅ Tags page
            {
              path: "tags",
              lazy: async () => ({
                Component: (await import("@/app/pages/dashboards/tags")).default,
              }),
            },

            // ✅ Products page
            {
              path: "products",
              lazy: async () => ({
                Component: (await import("@/app/pages/dashboards/products"))
                  .default,
              }),
            },
          ],
        },
      ],
    },

    // The app layout supports only the main layout. Avoid using it for other layouts.
    {
      Component: AppLayout,
      children: [
        {
          path: "settings",
          lazy: async () => ({
            Component: (await import("@/app/pages/settings/Layout")).default,
          }),
          children: [
            {
              index: true,
              element: <Navigate to="/settings/general" />,
            },
            {
              path: "general",
              lazy: async () => ({
                Component: (
                  await import("@/app/pages/settings/sections/General")
                ).default,
              }),
            },
            {
              path: "appearance",
              lazy: async () => ({
                Component: (
                  await import("@/app/pages/settings/sections/Appearance")
                ).default,
              }),
            },
          ],
        },
      ],
    },
  ],
};

export { protectedRoutes };
