import type { Locale } from "./i18n";

export function formatPrice(amount: number | string, locale: Locale = "ar"): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(n)) return "—";
  const loc = locale === "ar" ? "ar-DZ" : "fr-DZ";
  const num = new Intl.NumberFormat(loc, { maximumFractionDigits: 0 }).format(n);
  return locale === "ar" ? `${num} دج` : `${num} DA`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
