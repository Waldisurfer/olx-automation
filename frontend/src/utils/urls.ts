const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export function uploadUrl(fileId: string): string {
  return `${BASE}/uploads/${fileId}.jpg`;
}
