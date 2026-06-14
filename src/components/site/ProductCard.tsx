import { Link } from "@tanstack/react-router";
import { useLocale, pickLocalized } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface ProductCardProduct {
  id: string;
  slug: string;
  name_ar: string;
  name_fr: string;
  price: number;
  created_at?: string | null;
  category?: { name_ar: string; name_fr: string } | null;
  product_images?: { url: string; sort_order: number }[] | null;
}

export function ProductCard({ product }: { product: ProductCardProduct }) {
  const { locale } = useLocale();
  const name = pickLocalized(product as unknown as Record<string, unknown>, "name", locale);
  const categoryName = product.category
    ? pickLocalized(product.category as unknown as Record<string, unknown>, "name", locale)
    : null;
  const cover = product.product_images?.slice().sort((a, b) => a.sort_order - b.sort_order)[0]?.url;
  const isNew = product.created_at
    ? Date.now() - new Date(product.created_at).getTime() < 14 * 24 * 60 * 60 * 1000
    : false;

  return (
    <Link
      to="/products/$slug"
      params={{ slug: product.slug }}
      className="group block overflow-hidden rounded-2xl bg-card border border-border shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {cover ? (
          <img
            src={cover}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
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
