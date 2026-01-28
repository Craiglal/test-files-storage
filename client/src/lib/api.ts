const AUTH_COOKIE_KEY = 'access_token=';
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

type ApiErrorPayload = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

function decodeJwtPayload(token: string): any {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  try {
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  return document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(AUTH_COOKIE_KEY))
    ?.slice(AUTH_COOKIE_KEY.length) ?? null;
}

export function clearAccessTokenCookie() {
  document.cookie = `${AUTH_COOKIE_KEY}; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export function getOwnerId(): string {
  const token = getAccessToken();
  const payload = token ? decodeJwtPayload(token) : null;
  const ownerId = payload?.sub;
  if (!ownerId) {
    throw new Error('Missing or invalid auth token');
  }
  return ownerId as string;
}

export function apiUrl(path: string) {
  return `${API_BASE}${path}`;
}

export async function getApiErrorMessage(response: Response, fallback = 'Request failed'): Promise<string> {
  const clone = response.clone();

  try {
    const data = (await clone.json()) as ApiErrorPayload;
    const fromMessage = Array.isArray(data.message) ? data.message.join('; ') : data.message;
    if (fromMessage) return fromMessage;
    if (data.error) return data.error;
  } catch {
    // no-op: fall through to text handling
  }

  try {
    const text = await clone.text();
    if (text) return text;
  } catch {
    // ignore text parsing failures
  }

  const suffix = response.status ? ` (${response.status})` : '';
  return `${fallback}${suffix}`;
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof Error) return error.message || fallback;
  if (typeof error === 'string') return error;
  return fallback;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes)) return '0 B';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const idx = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / 1024 ** idx;
  return `${value.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`;
}
