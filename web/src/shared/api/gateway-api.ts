const baseUrl =
  import.meta.env.VITE_GATEWAY_API_BASE_URL?.trim() ||
  "http://127.0.0.1:5657/api/v1";

export class GatewayApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function gatewayRequest<T>(
  path: string,
  accessToken?: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let payload: { code?: string; message?: string } = {};
    try {
      payload = (await response.json()) as typeof payload;
    } catch {
      // Fall back to HTTP semantics.
    }
    throw new GatewayApiError(
      response.status,
      payload.code || "REQUEST_FAILED",
      payload.message || `Request failed (${response.status})`,
    );
  }
  return (await response.json()) as T;
}

export async function downloadGatewayFile(
  path: string,
  accessToken: string,
): Promise<Blob> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new GatewayApiError(response.status, "DOWNLOAD_FAILED", "Download failed");
  }
  return response.blob();
}
