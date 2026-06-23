/** Mevcut query string'i patch'leyip yeni bir href döndürür (filtre linkleri için). */
export function patchQuery(
  current: string,
  patch: Record<string, string | string[] | null>,
): string {
  const p = new URLSearchParams(current);
  for (const [key, value] of Object.entries(patch)) {
    p.delete(key);
    if (value == null) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => v && p.append(key, v));
    } else if (value !== "") {
      p.set(key, value);
    }
  }
  const s = p.toString();
  return s ? `?${s}` : "?";
}
