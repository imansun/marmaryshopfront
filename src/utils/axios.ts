// src\utils\axios.ts
import axios from "axios";
import { JWT_HOST_API } from "@/configs/auth";
import { setSession } from "./jwt";

const axiosInstance = axios.create({
  baseURL: JWT_HOST_API,
});

axiosInstance.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // اگر request وجود نداشت یا قبلاً retry شده بود
    if (!originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    // هندل کردن 401 و 403
    if (
      error.response?.status === 401 ||
      error.response?.status === 403
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");

        // اگر refreshToken وجود نداشت مستقیم logout
        if (!refreshToken) {
          throw new Error("No refresh token found");
        }

        const res = await axios.post(`${JWT_HOST_API}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefresh } = res.data;

        // ست کردن accessToken جدید
        setSession(accessToken);

        // ذخیره refreshToken جدید
        localStorage.setItem("refreshToken", newRefresh);

        // اطمینان از وجود headers
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // اجرای مجدد request قبلی
        return axiosInstance(originalRequest);
      } catch (err) {
        // پاک کردن session
        setSession(null);
        localStorage.removeItem("refreshToken");

        // ریدایرکت به لاگین
        window.location.href = "/auth/login";

        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
