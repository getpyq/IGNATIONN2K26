export const FINAL_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwGzdph4W1UDEyRettY7ZRuGy92VFmFd3Dwp0bQiXTElBLVjo-aOAJrifqpGYmYwL2Ibg/exec';

interface AppsScriptEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: string;
  status?: number;
}

export function getAppsScriptUrl(): string {
  return FINAL_APPS_SCRIPT_URL;
}

export function isGoogleSheetsConfigured(): boolean {
  return true;
}

export class AppsScriptError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

export async function callAppsScript<T>(
  action: string,
  payload: Record<string, unknown> = {}
): Promise<T> {
  const url = getAppsScriptUrl();

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({
      action,
      payload,
    }),
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new AppsScriptError(
      `Apps Script request failed with HTTP ${response.status}.`,
      502
    );
  }

  const rawText = await response.text();
  let json: AppsScriptEnvelope<T>;
  try {
    json = JSON.parse(rawText) as AppsScriptEnvelope<T>;
  } catch {
    throw new AppsScriptError(
      'Google Apps Script returned an invalid response. Please verify the deployment permissions.',
      502
    );
  }

  if (!json.ok) {
    throw new AppsScriptError(
      json.error || 'Google Sheets Apps Script error.',
      json.status || 400
    );
  }

  return json.data as T;
}
