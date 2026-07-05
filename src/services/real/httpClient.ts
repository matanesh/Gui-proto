import { API_BASE_URL } from "@/config/api";
import { ApiError } from "../apiClient";

/** Thin fetch wrapper for the real BFF; maps the contract error model to ApiError. */
export async function httpGet<T>(path: string): Promise<T> {
  return request<T>("GET", path);
}

export async function httpPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>("POST", path, body);
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("NETWORK_ERROR", 0, "Cannot reach the BFF. Is it running?");
  }

  if (!res.ok) {
    let code = "INTERNAL_ERROR";
    let message = `Request failed (${res.status}).`;
    try {
      const data = (await res.json()) as { error?: { code?: string; message?: string } };
      if (data.error) {
        code = data.error.code ?? code;
        message = data.error.message ?? message;
      }
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(code, res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
