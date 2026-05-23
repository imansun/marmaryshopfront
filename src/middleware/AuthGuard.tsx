// src\middleware\AuthGuard.tsx
import { Navigate, useLocation, useOutlet } from "react-router";

// Local Imports
import { useAuthContext } from "@/app/contexts/auth/context";
import { GHOST_ENTRY_PATH, REDIRECT_URL_KEY } from "@/constants/app";

// ----------------------------------------------------------------------

export default function AuthGuard() {
  const outlet = useOutlet();
  const { isAuthenticated } = useAuthContext();
  const location = useLocation();

  // ✅ اگر داخل صفحات auth هستیم redirect نکن
  if (location.pathname.startsWith("/auth")) {
    return <>{outlet}</>;
  }

  // ✅ فقط اگر خارج از auth بود و لاگین نبود redirect کن
  if (!isAuthenticated) {
    return (
      <Navigate
        to={`${GHOST_ENTRY_PATH}?${REDIRECT_URL_KEY}=${location.pathname}`}
        replace
      />
    );
  }

  return <>{outlet}</>;
}
