import { ApiResponse } from '@wuchan/contracts';

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
  const response = await fetch('/api/wuchan' + normalizedEndpoint, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    cache: options.cache || 'no-store',
  });

  const data = (await response.json()) as ApiResponse<T>;
  if (!response.ok || data.success === false) {
    throw new Error(data.error?.message || 'WUCHAN API request failed (' + response.status + ')');
  }
  return data;
}
