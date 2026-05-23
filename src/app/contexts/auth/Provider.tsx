import { useEffect, useReducer, ReactNode } from "react";

import axios from "@/utils/axios";
import { isTokenValid, setSession, getToken } from "@/utils/jwt";
import {
  AuthProvider as AuthContext,
  AuthContextType,
  SendOtpResponse,
} from "./context";
import { User } from "@/@types/user";

interface AuthAction {
  type:
    | "INITIALIZE"
    | "LOGIN_REQUEST"
    | "LOGIN_SUCCESS"
    | "LOGIN_ERROR"
    | "OTP_SENT"
    | "LOGOUT";
  payload?: Partial<AuthContextType> & {
    errorMessage?: string;
  };
}

const initialState: AuthContextType = {
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  errorMessage: null,
  user: null,
  login: async () => {},
  sendOtp: async (_phone: string): Promise<SendOtpResponse> => ({
    code: 0,
    message: "",
    messageId: 0,
    raw: 0,
  }),
  verifyOtp: async () => {},
  logout: async () => {},
};

const reducerHandlers: Record<
  AuthAction["type"],
  (state: AuthContextType, action: AuthAction) => AuthContextType
> = {
  INITIALIZE: (state, action) => {
    return {
      ...state,
      isAuthenticated: action.payload?.isAuthenticated ?? false,
      isInitialized: true,
      user: action.payload?.user ?? null,
    };
  },

  LOGIN_REQUEST: (state) => {
    return {
      ...state,
      isLoading: true,
      errorMessage: null,
    };
  },

  LOGIN_SUCCESS: (state, action) => {
    return {
      ...state,
      isAuthenticated: true,
      isLoading: false,
      user: action.payload?.user ?? null,
      errorMessage: null,
    };
  },

  OTP_SENT: (state) => {
    return {
      ...state,
      isLoading: false,
      errorMessage: null,
    };
  },

  LOGIN_ERROR: (state, action) => {
    return {
      ...state,
      errorMessage:
        action.payload?.errorMessage !== undefined
          ? action.payload.errorMessage
          : "خطا در احراز هویت",
      isLoading: false,
    };
  },

  LOGOUT: (state) => {
    return {
      ...state,
      isAuthenticated: false,
      user: null,
    };
  },
};

const reducer = (
  state: AuthContextType,
  action: AuthAction,
): AuthContextType => {
  const handler = reducerHandlers[action.type];
  return handler ? handler(state, action) : state;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const init = async () => {
      try {
        const authToken = getToken();

        if (authToken && isTokenValid(authToken)) {
          setSession(authToken);

          const response = await axios.get<User>("/users/me");
          const user = response.data;

          dispatch({
            type: "INITIALIZE",
            payload: {
              isAuthenticated: true,
              user,
            },
          });
        } else {
          setSession(null);

          if (typeof window !== "undefined") {
            localStorage.removeItem("refreshToken");
          }

          dispatch({
            type: "INITIALIZE",
            payload: {
              isAuthenticated: false,
              user: null,
            },
          });
        }
      } catch {
        setSession(null);

        if (typeof window !== "undefined") {
          localStorage.removeItem("refreshToken");
        }

        dispatch({
          type: "INITIALIZE",
          payload: {
            isAuthenticated: false,
            user: null,
          },
        });
      }
    };

    init();
  }, []);

  const sendOtp = async (phone: string): Promise<SendOtpResponse> => {
    dispatch({ type: "LOGIN_REQUEST" });

    try {
      const response = await axios.post<SendOtpResponse>("/auth/send-otp", {
        phone,
      });

      if (response.status === 201) {
        dispatch({
          type: "OTP_SENT",
        });

        return response.data;
      }

      throw new Error("Unexpected response status");
    } catch (err: any) {
      let message = "خطا در ارسال کد تایید";

      if (err?.response?.status === 400) {
        message = "شماره موبایل نامعتبر است";
      }

      if (err?.response?.status === 429) {
        message = "لطفاً دو دقیقه دیگر دوباره تلاش کنید";
      }

      if (err?.response?.status === 500) {
        message = "خطا در ارسال پیامک، دوباره تلاش کنید";
      }

      dispatch({
        type: "LOGIN_ERROR",
        payload: {
          errorMessage: err?.response?.data?.message || message,
        },
      });

      throw err;
    }
  };

  const verifyOtp = async (phone: string, otp: string) => {
    dispatch({ type: "LOGIN_REQUEST" });

    try {
      const response = await axios.post<{
        accessToken: string;
        refreshToken: string;
      }>("/auth/verify-otp", { phone, otp });

      const { accessToken, refreshToken } = response.data;

      setSession(accessToken);

      if (typeof window !== "undefined") {
        localStorage.setItem("refreshToken", refreshToken);
      }

      const userResponse = await axios.get<User>("/users/me");
      const user = userResponse.data;

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { user },
      });
    } catch (err: any) {
      let message = "کد تأیید معتبر نیست";

      if (err?.response?.status === 400) {
        message = "کد تأیید اشتباه است";
      }

      if (err?.response?.status === 401) {
        message = "کد تأیید منقضی شده است";
      }

      if (err?.response?.status === 404) {
        message = "کاربر یافت نشد";
      }

      if (err?.response?.status === 429) {
        message = "تعداد تلاش‌ها زیاد است، کمی بعد دوباره امتحان کنید";
      }

      dispatch({
        type: "LOGIN_ERROR",
        payload: {
          errorMessage: err?.response?.data?.message || message,
        },
      });
    }
  };

  const login = async (credentials: { username: string; password: string }) => {
    dispatch({ type: "LOGIN_REQUEST" });

    try {
      const response = await axios.post<{
        accessToken: string;
        refreshToken: string;
        user: User;
      }>("/login", credentials);

      const { accessToken, refreshToken, user } = response.data;

      setSession(accessToken);

      if (typeof window !== "undefined") {
        localStorage.setItem("refreshToken", refreshToken);
      }

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { user },
      });
    } catch (err: any) {
      dispatch({
        type: "LOGIN_ERROR",
        payload: {
          errorMessage: err?.response?.data?.message || "ورود ناموفق بود",
        },
      });
    }
  };

  const logout = async () => {
    setSession(null);

    if (typeof window !== "undefined") {
      localStorage.removeItem("refreshToken");
    }

    dispatch({ type: "LOGOUT" });
  };

  if (!children) return null;

  return (
    <AuthContext
      value={{
        ...state,
        login,
        sendOtp,
        verifyOtp,
        logout,
      }}
    >
      {children}
    </AuthContext>
  );
}
