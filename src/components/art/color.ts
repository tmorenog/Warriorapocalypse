// Lighten (amount > 0) or darken (amount < 0) a hex color. Shared by art components.
export function shade(hex: string, amount: number): string {
  const c = hex.replace("#", "");
  if (c.length !== 6) return hex;
  const num = parseInt(c, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  const adj = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v + (amount > 0 ? (255 - v) * amount : v * amount))));
  r = adj(r);
  g = adj(g);
  b = adj(b);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function hashId(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}
