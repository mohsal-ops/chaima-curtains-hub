import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Check, ChevronLeft, Copy, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard, ProductCardSkeleton } from "@/components/site/ProductCard";
import { OrderForm, type Variant } from "@/components/site/OrderForm";
import { Button } from "@/components/ui/button";
import { useLocale, pickLocalized } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/products/$slug")({
  component: ProductDetailPage,
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold">المنتج غير موجود / Produit introuvable</h1>
        <Button asChild className="mt-6">
          <Link to="/products">العودة للمنتجات / Retour aux produits</Link>
        </Button>
      </div>
    </SiteLayout>
  ),
  errorComponent: ({ error }) => (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center text-destructive">
        <p>{error.message}</p>
      </div>
    </SiteLayout>
  ),
});

function ProductDetailPage() {
  const { slug } = Route.useParams();
  const { t, locale } = useLocale();
  const [activeImg, setActiveImg] = useState(0);

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  const productQ = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*,categories(id,name_ar,name_fr,slug),product_images(url,sort_order),product_variants(id,label,price,original_price,stock,sort_order)")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  const relatedQ = useQuery({
    queryKey: ["related", productQ.data?.category_id, productQ.data?.id],
    enabled: !!productQ.data?.category_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,slug,name_ar,name_fr,price,created_at,categories(name_ar,name_fr),product_images(url,sort_order)")
        .eq("is_active", true)
        .eq("category_id", productQ.data!.category_id!)
        .neq("id", productQ.data!.id)
        .limit(4);
      if (error) throw error;
      return (data ?? []).map((p) => ({ ...p, category: p.categories }));
    },
  });

  if (productQ.isLoading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-6xl px-4 py-10 grid gap-10 md:grid-cols-2">
          <ProductCardSkeleton />
          <div className="space-y-4">
            <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-32 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </SiteLayout>
    );
  }

  const p = productQ.data!;
  const images = (p.product_images ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
  const name = pickLocalized(p as unknown as Record<string, unknown>, "name", locale);
  const description = pickLocalized(p as unknown as Record<string, unknown>, "description", locale);
  const categoryName = p.categories ? pickLocalized(p.categories as unknown as Record<string, unknown>, "name", locale) : null;

  const cover = images[activeImg]?.url ?? images[0]?.url ?? null;

  const rawVariants = ((p as any).product_variants ?? []) as Array<{
    id: string; label: string; price: number | string; original_price: number | string | null; stock: number | null; sort_order: number;
  }>;
  const variants: Variant[] = rawVariants
    .map((v) => ({
      id: v.id,
      label: v.label,
      price: Number(v.price),
      original_price: v.original_price != null ? Number(v.original_price) : null,
      stock: v.stock,
      sort_order: v.sort_order,
    }))
    .sort((a, b) => a.sort_order - b.sort_order);
  const hasVariants = !!(p as any).has_variants && variants.length > 0;
  const selectedVariant = hasVariants ? variants.find((v) => v.id === selectedVariantId) ?? null : null;

  const displayPrice = selectedVariant ? selectedVariant.price : Number(p.price);
  const displayOriginal = selectedVariant
    ? selectedVariant.original_price
    : (p as any).original_price != null ? Number((p as any).original_price) : null;
  const hasDiscount = displayOriginal != null && displayOriginal > displayPrice;
  const discountPct = hasDiscount ? Math.round(((displayOriginal! - displayPrice) / displayOriginal!) * 100) : 0;
  const priceRange = hasVariants && !selectedVariant
    ? {
        min: Math.min(...variants.map((v) => v.price)),
        max: Math.max(...variants.map((v) => v.price)),
      }
    : null;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">{t({ ar: "الرئيسية", fr: "Accueil" })}</Link>
          <ChevronLeft className="h-3 w-3 rtl:rotate-180" />
          <Link to="/products" className="hover:text-primary">{t({ ar: "المنتجات", fr: "Produits" })}</Link>
          {categoryName && (
            <>
              <ChevronLeft className="h-3 w-3 rtl:rotate-180" />
              <span>{categoryName}</span>
            </>
          )}
          <ChevronLeft className="h-3 w-3 rtl:rotate-180" />
          <span className="text-foreground font-medium truncate">{name}</span>
        </nav>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-16 grid gap-10 md:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            {cover ? (
              <img src={cover} alt={name} className="h-full max-h-[500px] w-full object-contain bg-white" />
            ) : (
              <div className="aspect-square grid place-items-center bg-primary-light text-6xl">🪟</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={img.url}
                  onClick={() => setActiveImg(i)}
                  className={cn(
                    "h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                    activeImg === i ? "border-primary" : "border-border",
                  )}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info + Order */}
        <div className="space-y-6">
          {categoryName && (
            <span className="inline-block rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
              {categoryName}
            </span>
          )}
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">{name}</h1>

          <div className="space-y-2">
            <div className="flex items-baseline gap-3 flex-wrap">
              {priceRange ? (
                <p className="text-3xl font-bold text-primary">
                  {formatPrice(priceRange.min, locale)}
                  {priceRange.max !== priceRange.min && <> – {formatPrice(priceRange.max, locale)}</>}
                </p>
              ) : (
                <p className="text-3xl font-bold text-primary">{formatPrice(displayPrice, locale)}</p>
              )}
              {hasDiscount && !priceRange && (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(displayOriginal!, locale)}
                  </span>
                  <span className="rounded-md bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">
                    -{discountPct}%
                  </span>
                </>
              )}
            </div>
            {hasDiscount && !priceRange && (
              <span className="inline-block rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                {t({ ar: "تخفيض!", fr: "Promo !" })}
              </span>
            )}
          </div>

          {hasVariants && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t({ ar: "اختر الطول", fr: "Choisir la longueur" })} *
              </label>
              <select
                value={selectedVariantId ?? ""}
                onChange={(e) => setSelectedVariantId(e.target.value || null)}
                className="w-full rounded-lg border-2 border-border bg-card px-3 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none"
              >
                <option value="" disabled>
                  {t({ ar: "— اختر أحد الخيارات —", fr: "— Choisir une option —" })}
                </option>
                {variants.map((v) => {
                  const outOfStock = v.stock != null && v.stock <= 0;
                  return (
                    <option key={v.id} value={v.id} disabled={outOfStock}>
                      {v.label} — {formatPrice(v.price, locale)}
                      {outOfStock ? ` (${t({ ar: "نفذ", fr: "épuisé" })})` : ""}
                    </option>
                  );
                })}
              </select>
              {!selectedVariant && (
                <p className="text-xs text-muted-foreground">
                  {t({
                    ar: "الرجاء اختيار خيار قبل إتمام الطلب",
                    fr: "Veuillez choisir une option pour continuer",
                  })}
                </p>
              )}
            </div>
          )}

          {description && (
            <div className="prose prose-sm max-w-none text-foreground/85 leading-relaxed">
              <p>{description}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success(t({ ar: "تم نسخ الرابط", fr: "Lien copié" }), { icon: <Check className="h-4 w-4" /> });
              }}
            >
              <Copy className="me-2 h-4 w-4" />
              {t({ ar: "نسخ الرابط", fr: "Copier" })}
            </Button>
            <Button asChild variant="outline" size="sm">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(name + " — " + window.location.href)}`}
                target="_blank" rel="noopener noreferrer"
              >
                <MessageCircle className="me-2 h-4 w-4" />
                WhatsApp
              </a>
            </Button>
          </div>

          <OrderForm
            product={{
              id: p.id,
              name_ar: p.name_ar,
              name_fr: p.name_fr,
              price: Number(p.price),
              cover_url: cover,
              sizes: hasVariants ? [] : ((p as any).sizes ?? []),
              has_variants: hasVariants,
              variants,
            }}
            variantId={hasVariants ? selectedVariantId : undefined}
            onVariantIdChange={hasVariants ? setSelectedVariantId : undefined}
          />
        </div>
      </div>

      {/* Related */}
      {(relatedQ.data ?? []).length > 0 && (
        <section className="bg-secondary/30 py-16">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="mb-8 text-2xl font-bold text-foreground">
              {t({ ar: "منتجات قد تعجبك", fr: "Vous aimerez aussi" })}
            </h2>
            <div className="grid gap-5 grid-cols-2 md:grid-cols-4">
              {relatedQ.data!.map((rp) => <ProductCard key={rp.id} product={rp} />)}
            </div>
          </div>
        </section>
      )}
    </SiteLayout>
  );
}
