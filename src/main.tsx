// src\main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

import "./i18n/config";

import "simplebar-react/dist/simplebar.min.css";

import "./styles/index.css";
import "./styles/global.scss";

import { getToken, setSession, isTokenValid } from "./utils/jwt";

// فعال کردن session اگر توکن معتبر وجود داشت
const token = getToken();

if (token && isTokenValid(token)) {
  setSession(token);
} else {
  setSession(null);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
