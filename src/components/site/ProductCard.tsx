import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useLocale, pickLocalized } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface ProductCardProduct {
  id: string;
  slug: string;
  name_ar: string;
  name_fr: string;
  price: number;
  original_price?: number | null;
  has_variants?: boolean;
  created_at?: string | null;
  category?: { name_ar: string; name_fr: string } | null;
  product_images?: { url: string; sort_order: number }[] | null;
  product_variants?: { price: number | string; original_price: number | string | null }[] | null;
}

export function ProductCard({ product }: { product: ProductCardProduct }) {
  const { locale } = useLocale();
  const name = pickLocalized(product as unknown as Record<string, unknown>, "name", locale);
  const categoryName = product.category
    ? pickLocalized(product.category as unknown as Record<string, unknown>, "name", locale)
    : null;
  const images = useMemo(
    () =>
      (product.product_images ?? [])
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((i) => i.url),
    [product.product_images],
  );
  const [idx, setIdx] = useState(0);
  const [hover, setHover] = useState(false);
  useEffect(() => {
    if (images.length < 2) return;
    if (!hover) return; // only auto-cycle on hover so the grid isn't chaotic
    const t = setInterval(() => setIdx((i) => (i + 1) % images.length), 1200);
    return () => clearInterval(t);
  }, [images.length, hover]);

  const isNew = product.created_at
    ? Date.now() - new Date(product.created_at).getTime() < 14 * 24 * 60 * 60 * 1000
    : false;

  return (
    <Link
      to="/products/$slug"
      params={{ slug: product.slug }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setIdx(0); }}
      className="group block overflow-hidden rounded-2xl bg-card border border-border shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {images.length > 0 ? (
          <div
            className="flex h-full w-full transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${idx * 100}%)` }}
          >
            {images.map((url, i) => (
              <img
                key={url + i}
                src={url}
                alt={name}
                loading="lazy"
                className="h-full w-full flex-shrink-0 object-cover"
                style={{ width: "100%" }}
              />
            ))}
          </div>
        ) : (
          <div className="grid h-full w-full place-items-center bg-primary-light text-4xl">🪟</div>
        )}
        {isNew && (
          <span className="absolute top-3 end-3 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground shadow-soft">
            {locale === "ar" ? "جديد" : "Nouveau"}
          </span>
        )}
        {categoryName && (
          <span className="absolute bottom-3 start-3 rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-primary backdrop-blur">
            {categoryName}
          </span>
        )}
        {images.length > 1 && (
          <div className="absolute bottom-3 end-3 flex gap-1">
            {images.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === idx ? "w-4 bg-primary" : "w-1.5 bg-white/70",
                )}
              />
            ))}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className={cn("font-semibold text-foreground line-clamp-2 min-h-[2.5rem]")}>{name}</h3>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-bold text-primary">{formatPrice(product.price, locale)}</span>
          <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
            {locale === "ar" ? "عرض ←" : "Voir →"}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-card border border-border">
      <div className="aspect-square animate-pulse bg-muted" />
      <div className="p-4 space-y-3">
        <div className="h-4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-6 w-1/2 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
