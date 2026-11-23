let inMemoryToken: string | null = null;

if (typeof window !== 'undefined') {
  try {
    window.localStorage.removeItem('ignition_apps_script_url');
  } catch {
    // ignore storage cleanup errors
  }
}

export function setInMemoryAuthToken(token: string | null) {
  inMemoryToken = token;
}

export function getInMemoryAuthToken(): string | null {
  return inMemoryToken;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('X-Requested-With', 'IGNITION-Admin');

  if (inMemoryToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${inMemoryToken}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message =
      (data as { error?: string } | null)?.error ||
      `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }

  if (data === null || data === undefined) {
    throw new ApiError('Server returned an empty or invalid JSON response.', 502);
  }

  return data as T;
}
