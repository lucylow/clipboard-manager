import { Platform } from "react-native";
import { getApiBaseUrl } from "@/constants/oauth";
import * as Auth from "./auth";
import { getApiErrorMessage, parseApiTextPayload } from "@/lib/api-error-utils";
import { withTimeout } from "@/lib/with-timeout";

const REQUEST_TIMEOUT_MS = 15_000;

type OAuthUser = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  lastSignedIn: string | Date;
};

function buildApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl && Platform.OS !== "web") {
    throw new Error("The production API endpoint is not configured.");
  }

  const cleanBaseUrl = baseUrl.replace(/\/$/, "");
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return baseUrl ? `${cleanBaseUrl}${cleanEndpoint}` : cleanEndpoint;
}

export async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (Platform.OS !== "web") {
    const sessionToken = await Auth.getSessionToken();
    if (sessionToken) headers.Authorization = `Bearer ${sessionToken}`;
  }

  try {
    const response = await withTimeout(
      fetch(buildApiUrl(endpoint), {
        ...options,
        headers,
        credentials: "include",
      }),
      REQUEST_TIMEOUT_MS,
      "The network request timed out. Please check your connection and try again.",
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = errorText;
      try {
        const errorJson = JSON.parse(errorText) as { error?: string; message?: string };
        errorMessage = errorJson.error || errorJson.message || errorText;
      } catch {
        // Keep the server text as a fallback for non-JSON responses.
      }
      throw new Error(errorMessage || `API call failed: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return (await response.json()) as T;
    }

    return parseApiTextPayload<T>(await response.text(), contentType);
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function exchangeOAuthCode(
  code: string,
  state: string,
): Promise<{ sessionToken: string; user: OAuthUser | null }> {
  const params = new URLSearchParams({ code, state });
  const result = await apiCall<{ app_session_id: string; user: OAuthUser | null }>(
    `/api/oauth/mobile?${params.toString()}`,
  );

  return {
    sessionToken: result.app_session_id,
    user: result.user,
  };
}

export async function logout(): Promise<void> {
  await apiCall<void>("/api/auth/logout", { method: "POST" });
}

export async function getMe(): Promise<{
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  lastSignedIn: string;
} | null> {
  try {
    const result = await apiCall<{ user: any }>("/api/auth/me");
    return result.user || null;
  } catch {
    return null;
  }
}

export async function establishSession(token: string): Promise<boolean> {
  try {
    const response = await withTimeout(
      fetch(buildApiUrl("/api/auth/session"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      }),
      REQUEST_TIMEOUT_MS,
      "The session request timed out. Please check your connection and try again.",
    );
    return response.ok;
  } catch {
    return false;
  }
}
