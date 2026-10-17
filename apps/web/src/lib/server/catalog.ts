export interface CatalogOption {
  id: string;
  name: string;
  option_type: 'COLOR' | 'SIZE' | 'LENGTH' | 'SPECIFICATION' | string;
  price_delta_cents: number | string;
  lead_time_delta_days: number | string;
  requires_quote: boolean;
  sort_order: number;
  swatch_hex: string | null;
}

export interface CatalogProduct {
  id: string;
  organization_id: string;
  name: string;
  sku: string;
  description: string | null;
  base_price_cents: number | string;
  currency: 'USD' | 'EUR' | 'CNY' | 'GBP' | 'AUD';
  lead_time_days: number | string;
  options?: CatalogOption[];
}

function apiOrigin() {
  return (process.env.WUCHAN_API_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');
}

export async function fetchCatalog<T>(path: string): Promise<{ data: T | null; error: string | null }> {
  try {
    const response = await fetch(apiOrigin() + path, { cache: 'no-store' });
    const body = await response.json().catch(() => null);
    if (!response.ok || !body?.success) {
      return { data: null, error: body?.error?.message || 'The catalog could not be loaded.' };
    }
    return { data: body.data as T, error: null };
  } catch {
    return { data: null, error: 'The catalog could not be loaded.' };
  }
}
