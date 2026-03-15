type ApiErrorPayload = {
  message?: string;
  error?: string;
};

const rawBase = "https://students-campus-connect.onrender.com";

export const API_BASE_URL = rawBase.replace(/\/$/, "");

function joinUrl(base: string, path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!base) return p;
  return `${base}${p}`;
}

async function safeJson(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { headers?: Record<string, string> } = {}
): Promise<T> {
  const res = await fetch(joinUrl(API_BASE_URL, path), {
    ...init,
    headers: {
      ...(init.headers ?? {}),
    },
  });

  const body = await safeJson(res);
  if (!res.ok) {
    const payload = (body && typeof body === "object" ? (body as ApiErrorPayload) : undefined) ?? undefined;
    const message =
      payload?.message ??
      payload?.error ??
      (typeof body === "string" ? body : null) ??
      `Request failed (${res.status})`;
    throw new Error(message);
  }

  return body as T;
}

export function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Downloads a file from a data URL or regular URL
 * @param fileUrl - The file URL (data URL or regular URL)
 * @param fileName - The filename for download
 */
export function downloadFile(fileUrl: string, fileName: string) {
  try {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Download failed:", error);
    // Fallback: open in new tab if download fails
    window.open(fileUrl, "_blank");
  }
}

