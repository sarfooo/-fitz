export interface BrowseItem {
  listing_id: string;
  item_name: string;
  price: number | null;
  size: string | null;
  image: string | null;
  photos: string[];
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
  render_id: string | null;
  angles: RenderAngle[];
}

export interface ClosetResponse {
  items: ClosetItem[];
}

export interface SavedOutfitsResponse {
  outfits: SavedOutfit[];
}

export interface CommunityOutfit extends SavedOutfit {
  username: string;
  display_name: string | null;
}

export interface CommunityOutfitsResponse {
  outfits: CommunityOutfit[];
}

export interface AddSavedOutfitRequest {
  name: string;
  closet_item_ids: string[];
  cover_image?: string | null;
  render_id?: string | null;
}

export interface AddSavedOutfitResponse {
  success: boolean;
  outfit: SavedOutfit;
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

export interface DeleteClosetItemResponse {
  success: boolean;
  closet_item_id: string;
}

function getBackendBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

  return baseUrl.replace(/\/$/, "");
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    let message = text;
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object" && "detail" in parsed) {
        message = typeof parsed.detail === "string" ? parsed.detail : JSON.stringify(parsed.detail);
      }
    } catch {
      // not JSON — keep raw text
    }
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

export async function fetchBrowseListing(itemId: string) {
  const baseUrl = getBackendBaseUrl();
  const response = await fetch(`${baseUrl}/browse/listing/${itemId}`, {
    cache: "no-store",
  });

  return parseJson<BrowseItem>(response);
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

export async function fetchCommunityOutfits(accessToken: string) {
  const baseUrl = getBackendBaseUrl();
  const response = await fetch(`${baseUrl}/outfits/community`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  return parseJson<CommunityOutfitsResponse>(response);
}

export async function addOutfit(accessToken: string, payload: AddSavedOutfitRequest) {
  const baseUrl = getBackendBaseUrl();
  const response = await fetch(`${baseUrl}/outfits`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseJson<AddSavedOutfitResponse>(response);
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

export async function deleteClosetItem(accessToken: string, closetItemId: string) {
  const baseUrl = getBackendBaseUrl();
  const response = await fetch(`${baseUrl}/closet/${closetItemId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return parseJson<DeleteClosetItemResponse>(response);
}

export interface FitGarmentInput {
  image_url: string;
  name?: string | null;
}

export interface FitRequestPayload {
  garments: FitGarmentInput[];
  fit_preference?: "fitted" | "regular" | "oversized" | "baggy";
}

export interface GeneratedImage {
  url: string | null;
  b64_json: string | null;
  revised_prompt: string | null;
  storage_path: string | null;
  bucket: string | null;
  signed_url: string | null;
}

export interface TryOnResponse {
  success: boolean;
  render_id: string | null;
  image: GeneratedImage | null;
  prompt_used: string | null;
  credits_remaining: number | null;
  error: string | null;
}

export type RenderStatus = "pending" | "ready" | "failed";

export interface FitStartResponse {
  render_id: string;
  status: RenderStatus;
}

export interface RenderAngle {
  angle: string;
  image_url: string | null;
  storage_path: string | null;
  bucket: string | null;
}

export interface FitStatusResponse {
  render_id: string;
  status: RenderStatus;
  image: GeneratedImage | null;
  angles: RenderAngle[];
  error: string | null;
  credits_remaining: number | null;
}

export interface GenerateAnglesResponse {
  success: boolean;
  angles: RenderAngle[];
  error: string | null;
}

export async function generateFit(
  accessToken: string,
  payload: FitRequestPayload,
) {
  const baseUrl = getBackendBaseUrl();
  const response = await fetch(`${baseUrl}/tryon/fit`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseJson<FitStartResponse>(response);
}

export async function getRenderStatus(accessToken: string, renderId: string) {
  const baseUrl = getBackendBaseUrl();
  const response = await fetch(`${baseUrl}/tryon/render/${renderId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  return parseJson<FitStatusResponse>(response);
}

export async function generateMoreAngles(accessToken: string, renderId: string) {
  const baseUrl = getBackendBaseUrl();
  const response = await fetch(`${baseUrl}/tryon/render/${renderId}/angles`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return parseJson<GenerateAnglesResponse>(response);
}

export interface LookbookFit {
  render_id: string;
  name: string | null;
  image_url: string | null;
  created_at: string;
}

export interface LookbookResponse {
  fits: LookbookFit[];
}

export interface SaveFitResponse {
  success: boolean;
  fit: LookbookFit | null;
  error: string | null;
}

export async function fetchLookbook(accessToken: string) {
  const baseUrl = getBackendBaseUrl();
  const response = await fetch(`${baseUrl}/tryon/lookbook`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  return parseJson<LookbookResponse>(response);
}

export async function saveRenderToLookbook(
  accessToken: string,
  renderId: string,
  name?: string | null,
) {
  const baseUrl = getBackendBaseUrl();
  const response = await fetch(`${baseUrl}/tryon/render/${renderId}/save`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: name ?? null }),
  });
  return parseJson<SaveFitResponse>(response);
}

export interface AvatarIdentity {
  avatar_id: string;
  identity_description: string;
  image_url: string | null;
}

export interface CurrentAvatarResponse {
  avatar: AvatarIdentity | null;
}

export interface CaptureIdentityResponse {
  success: boolean;
  avatar: AvatarIdentity | null;
  error: string | null;
}

export async function fetchCurrentAvatar(accessToken: string) {
  const baseUrl = getBackendBaseUrl();
  const response = await fetch(`${baseUrl}/tryon/avatar/current`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  return parseJson<CurrentAvatarResponse>(response);
}

export async function captureAvatarIdentity(accessToken: string, files: File[]) {
  const baseUrl = getBackendBaseUrl();
  const form = new FormData();
  for (const file of files) {
    form.append("references", file, file.name);
  }
  const response = await fetch(`${baseUrl}/tryon/avatar/identity`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });
  return parseJson<CaptureIdentityResponse>(response);
}
