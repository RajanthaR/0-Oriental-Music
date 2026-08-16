/** Dependency-free normalization shared by public search and identity validation. */
export function normalizeSinhalaText(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFC")
    .toLowerCase()
    .trim()
    .replace(/[ශෂ]/g, "ස")
    .replace(/ණ/g, "න")
    .replace(/ළ/g, "ල")
    .replace(/ඥ/g, "ඤ")
    .replace(/ද්‍ර/g, "දර")
    .replace(/ද්ර/g, "දර")
    .replace(/[\u061C\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, "");
}
