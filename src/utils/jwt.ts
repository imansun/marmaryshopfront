// src/utils/jwt.ts
import { jwtDecode } from "jwt-decode";
import axios from "./axios";

const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("authToken");
};

const isTokenValid = (authToken: string): boolean => {
  try {
    const decoded: { exp?: number } = jwtDecode(authToken);

    if (!decoded || !decoded.exp) {
      return false;
    }

    const currentTime = Date.now() / 1000;

    return decoded.exp > currentTime;
  } catch (error) {
    return false;
  }
};

const setSession = (authToken?: string | null): void => {
  if (authToken) {
    localStorage.setItem("authToken", authToken);

    axios.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;
  } else {
    localStorage.removeItem("authToken");

    delete axios.defaults.headers.common["Authorization"];
  }
};

export { getToken, isTokenValid, setSession };
