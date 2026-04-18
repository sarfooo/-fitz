export interface BrowseItem {
  listing_id: string;
  item_name: string;
  price: number | null;
  size: string | null;
  image: string | null;
  category: string | null;
  source: string;
  product_url: string | null;
}

export interface BrowseResponse {
  query: string;
  page: number;
  items: BrowseItem[];
}

export interface ClosetItem {
  id: string;
  user_id: string;
  listing_id: string;
  item_name: string;
  price: number | null;
  size: string | null;
  image: string | null;
  category: string | null;
  source: string;
  product_url: string | null;
  created_at: string;
}

export interface SavedOutfit {
  id: string;
  user_id: string;
  name: string;
  item_count: number;
  cover_image: string | null;
  created_at: string;
  items: ClosetItem[];
}

export interface ClosetResponse {
  items: ClosetItem[];
}

export interface SavedOutfitsResponse {
  outfits: SavedOutfit[];
}

export interface AddClosetItemRequest {
  listing_id: string;
  item_name: string;
  price?: number | null;
  size?: string | null;
  image?: string | null;
  category?: string | null;
  source?: string;
  product_url?: string | null;
}

export interface AddClosetItemResponse {
  success: boolean;
  item: ClosetItem;
}

function getBackendBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

  return baseUrl.replace(/\/$/, "");
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchBrowseItems(query: string, page = 0) {
  const baseUrl = getBackendBaseUrl();
  const params = new URLSearchParams({ query, page: String(page) });
  const response = await fetch(`${baseUrl}/browse?${params.toString()}`, {
    cache: "no-store",
  });

  return parseJson<BrowseResponse>(response);
}

export async function fetchClosetItems(accessToken: string) {
  const baseUrl = getBackendBaseUrl();
  const response = await fetch(`${baseUrl}/closet`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  return parseJson<ClosetResponse>(response);
}

export async function fetchOutfits(accessToken: string) {
  const baseUrl = getBackendBaseUrl();
  const response = await fetch(`${baseUrl}/outfits`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  return parseJson<SavedOutfitsResponse>(response);
}

export async function addClosetItem(accessToken: string, payload: AddClosetItemRequest) {
  const baseUrl = getBackendBaseUrl();
  const response = await fetch(`${baseUrl}/closet`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseJson<AddClosetItemResponse>(response);
}
