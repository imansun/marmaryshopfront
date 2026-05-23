// src\app\router\ghost.tsx
import { RouteObject } from "react-router";
import GhostGuard from "@/middleware/GhostGuard";

const ghostRoutes: RouteObject = {
  id: "ghost",
  Component: GhostGuard,
  children: [
    {
      path: "auth",
      children: [
        {
          path: "login",
          lazy: async () => ({
            Component: (await import("@/app/pages/Auth")).default,
          }),
        },
      ],
    },
  ],
};

export { ghostRoutes };
