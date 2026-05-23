// src\app\contexts\auth\context.ts
import { User } from "@/@types/user";
import { createSafeContext } from "@/utils/createSafeContext";

// ----------------------------------------------------------------------

export interface SendOtpResponse {
  code: number;
  message: string;
  messageId: number;
  raw: number;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  errorMessage: string | null;

  user: User | null;

  // legacy login (در صورت استفاده در بخش‌های دیگر اپ)
  login: (credentials: {
    username: string;
    password: string;
  }) => Promise<void>;

  // OTP Auth
  sendOtp: (phone: string) => Promise<SendOtpResponse>;
  verifyOtp: (phone: string, otp: string) => Promise<void>;

  logout: () => Promise<void>;
}

// ----------------------------------------------------------------------

export const [AuthProvider, useAuthContext] =
  createSafeContext<AuthContextType>(
    "useAuthContext must be used within AuthProvider",
  );

// alias برای سازگاری با بخش‌هایی که از useAuth استفاده می‌کنند
export const useAuth = useAuthContext;
