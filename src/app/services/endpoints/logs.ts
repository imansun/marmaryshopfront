// src\app\services\endpoints\logs.ts
import axios from "@/utils/axios";

// -------------------------
// Log Types
// -------------------------

export interface LogItem {
  id: number;
  method: string;
  url: string;
  statusCode: number;
  responseTime?: number;
  ip?: string;
  userAgent?: string;
  userId?: string | number | null;
  requestBody?: unknown;
  responseBody?: unknown;
  query?: Record<string, unknown>;
  params?: Record<string, unknown>;
  headers?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

export interface LogsParams {
  limit?: number;
}

export interface CleanLogsResponse {
  message: string;
}

// -------------------------
// API: GET /logs
// -------------------------

export const getLogs = async (params?: LogsParams): Promise<LogItem[]> => {
  const response = await axios.get("/logs", {
    params: {
      limit: params?.limit ?? 50,
    },
  });

  return response.data;
};

// -------------------------
// API: GET /logs/{id}
// -------------------------

export const getLogById = async (id: number | string): Promise<LogItem> => {
  const response = await axios.get(`/logs/${id}`);
  return response.data;
};

// -------------------------
// API: DELETE /logs/clean
// -------------------------

export const cleanLogs = async (): Promise<CleanLogsResponse> => {
  const response = await axios.delete("/logs/clean");
  return response.data;
};
