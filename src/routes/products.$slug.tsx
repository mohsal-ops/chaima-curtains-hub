import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronLeft, ShoppingCart, MessageCircle, Truck, ShieldCheck, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard } from "@/components/site/ProductCard";
import { ProductGallery } from "@/components/site/product/ProductGallery";
import { QuantityStepper } from "@/components/site/product/QuantityStepper";
import { QuickOrderForm } from "@/components/site/product/QuickOrderForm";
import { ReviewsSection, useProductReviews, Stars } from "@/components/site/product/Reviews";
import { Button } from "@/components/ui/button";
import { useLocale, pickLocalized } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { useSettings } from "@/hooks/useSettings";
import type { Variant } from "@/components/site/OrderForm";

export const Route = createFileRoute("/products/$slug")({
  component: ProductDetailPage,
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold">المنتج غير موجود / Produit introuvable</h1>
        <Button asChild className="mt-6"><Link to="/products">Retour</Link></Button>
      </div>
    </SiteLayout>
  ),
  errorComponent: ({ error }) => (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center text-destructive"><p>{error.message}</p></div>
    </SiteLayout>
  ),
});

function ProductDetailPage() {
  const { slug } = Route.useParams();
  const { t, locale } = useLocale();
  const addToCart = useCart((s) => s.add);
  const { get } = useSettings();
  const wa = get("whatsapp_number", "+213561238016").replace(/\D/g, "");

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

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
        .select("id,slug,name_ar,name_fr,price,created_at,categories(name_ar,name_fr),product_images(url,sort_order),product_variants(id,label,price,original_price,stock,sort_order),has_variants,original_price")
        .eq("is_active", true)
        .eq("category_id", productQ.data!.category_id!)
        .neq("id", productQ.data!.id)
        .limit(4);
      if (error) throw error;
      return (data ?? []).map((p) => ({ ...p, category: p.categories }));
    },
  });

  const reviewsQ = useProductReviews(productQ.data?.id ?? "");

  if (productQ.isLoading || !productQ.data) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid gap-10 md:grid-cols-2">
            <div className="aspect-square animate-pulse rounded-2xl bg-muted" />
            <div className="space-y-4">
              <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
              <div className="h-32 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
      </SiteLayout>
    );
  }

  const p = productQ.data;
  const images = (p.product_images ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
  const name = pickLocalized(p as unknown as Record<string, unknown>, "name", locale);
  const description = pickLocalized(p as unknown as Record<string, unknown>, "description", locale);
  const categoryName = p.categories ? pickLocalized(p.categories as unknown as Record<string, unknown>, "name", locale) : null;

  const rawVariants = ((p as any).product_variants ?? []) as Array<{
    id: string; label: string; price: number | string; original_price: number | string | null; stock: number | null; sort_order: number;
  }>;
  const variants: Variant[] = rawVariants
    .map((v) => ({
      id: v.id, label: v.label, price: Number(v.price),
      original_price: v.original_price != null ? Number(v.original_price) : null,
      stock: v.stock, sort_order: v.sort_order,
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
    ? { min: Math.min(...variants.map((v) => v.price)), max: Math.max(...variants.map((v) => v.price)) }
    : null;

  const cover = images[0]?.url ?? null;
  const reviews = reviewsQ.data ?? [];
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const canOrder = !hasVariants || !!selectedVariant;

  const handleAddToCart = () => {
    if (!canOrder) {
      toast.error(t({ ar: "الرجاء اختيار خيار أولا", fr: "Veuillez choisir une option" }));
      return;
    }
    addToCart({
      id: `${p.id}:${selectedVariant?.id ?? "default"}`,
      product_id: p.id,
      variant_id: selectedVariant?.id ?? null,
      variant_label: selectedVariant?.label ?? null,
      slug: p.slug,
      name_ar: p.name_ar,
      name_fr: p.name_fr,
      price: displayPrice,
      image_url: cover,
      qty,
    });
    toast.success(t({ ar: "تمت الإضافة إلى السلة", fr: "Ajouté au panier" }));
  };

  const whatsappHref = () => {
    const line = `${name}${selectedVariant ? ` — ${selectedVariant.label}` : ""} × ${qty}`;
    const total = displayPrice * qty;
    const body = t({
      ar: `مرحبا، أريد طلب:\n${line}\nالمجموع: ${formatPrice(total, "ar")}\nالرابط: ${typeof window !== "undefined" ? window.location.href : ""}`,
      fr: `Bonjour, je souhaite commander :\n${line}\nTotal : ${formatPrice(total, "fr")}\nLien : ${typeof window !== "undefined" ? window.location.href : ""}`,
    });
    return `https://wa.me/${wa}?text=${encodeURIComponent(body)}`;
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">{t({ ar: "الرئيسية", fr: "Accueil" })}</Link>
          <ChevronLeft className="h-3 w-3 rtl:rotate-180" />
          <Link to="/products" className="hover:text-primary">{t({ ar: "المنتجات", fr: "Produits" })}</Link>
          {categoryName && (<><ChevronLeft className="h-3 w-3 rtl:rotate-180" /><span>{categoryName}</span></>)}
          <ChevronLeft className="h-3 w-3 rtl:rotate-180" />
          <span className="text-foreground font-medium truncate">{name}</span>
        </nav>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-10 grid gap-10 md:grid-cols-2">
        <ProductGallery images={images.map((i) => ({ url: i.url }))} alt={name} />

        <div className="space-y-5">
          {categoryName && (
            <span className="inline-block rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">{categoryName}</span>
          )}
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">{name}</h1>

          <div className="flex items-center gap-3">
            <Stars value={avgRating} />
            <a href="#reviews" className="text-sm text-muted-foreground hover:text-primary">
              ({reviews.length} {t({ ar: "تقييم", fr: "avis" })})
            </a>
          </div>

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
                  <span className="text-lg text-muted-foreground line-through">{formatPrice(displayOriginal!, locale)}</span>
                  <span className="rounded-md bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">-{discountPct}%</span>
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
              <label className="text-sm font-medium">{t({ ar: "اختر الطول", fr: "Choisir la longueur" })} *</label>
              <select
                value={selectedVariantId ?? ""}
                onChange={(e) => setSelectedVariantId(e.target.value || null)}
                className="w-full rounded-lg border-2 border-border bg-card px-3 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none"
              >
                <option value="" disabled>{t({ ar: "— اختر أحد الخيارات —", fr: "— Choisir une option —" })}</option>
                {variants.map((v) => {
                  const oos = v.stock != null && v.stock <= 0;
                  return (
                    <option key={v.id} value={v.id} disabled={oos}>
                      {v.label} — {formatPrice(v.price, locale)}{oos ? ` (${t({ ar: "نفذ", fr: "épuisé" })})` : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">{t({ ar: "الكمية", fr: "Quantité" })}</label>
            <QuantityStepper value={qty} onChange={setQty} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Button size="lg" onClick={handleAddToCart} disabled={!canOrder}>
              <ShoppingCart className="me-2 h-5 w-5" />
              {t({ ar: "إضافة إلى السلة", fr: "Ajouter au panier" })}
            </Button>
            <Button asChild size="lg" variant="outline" className="border-[#25D366] text-[#128C7E] hover:bg-[#25D366]/10">
              <a href={canOrder ? whatsappHref() : undefined} target="_blank" rel="noopener noreferrer" onClick={(e) => { if (!canOrder) e.preventDefault(); }}>
                <MessageCircle className="me-2 h-5 w-5" />
                {t({ ar: "اطلب عبر واتساب", fr: "Commander via WhatsApp" })}
              </a>
            </Button>
          </div>

          <ul className="grid gap-2 text-sm pt-2">
            <li className="flex items-center gap-2 text-muted-foreground"><Truck className="h-4 w-4 text-primary" /> {t({ ar: "توصيل لجميع الولايات", fr: "Livraison dans toutes les wilayas" })}</li>
            <li className="flex items-center gap-2 text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary" /> {t({ ar: "الدفع عند الاستلام", fr: "Paiement à la livraison" })}</li>
            <li className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4 text-primary" /> {t({ ar: "خدمة عملاء متاحة", fr: "Service client disponible" })}</li>
          </ul>

          <QuickOrderForm
            productId={p.id}
            name_ar={p.name_ar}
            name_fr={p.name_fr}
            price={Number(p.price)}
            image_url={cover}
            variantId={selectedVariantId}
            variant={selectedVariant}
            hasVariants={hasVariants}
          />
        </div>
      </div>

      {description && (
        <section className="mx-auto max-w-6xl px-4 py-8 border-t border-border">
          <h2 className="text-2xl font-bold">{t({ ar: "الوصف", fr: "Description" })}</h2>
          <div className="prose prose-sm max-w-none mt-4 text-foreground/85 leading-relaxed whitespace-pre-wrap">
            {description}
          </div>
        </section>
      )}

      <ReviewsSection productId={p.id} />

      {(relatedQ.data ?? []).length > 0 && (
        <section className="bg-secondary/30 py-16">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="mb-8 text-2xl font-bold text-foreground">{t({ ar: "قد يعجبك أيضا", fr: "Vous aimerez aussi" })}</h2>
            <div className="grid gap-5 grid-cols-2 md:grid-cols-4">
              {relatedQ.data!.map((rp) => <ProductCard key={rp.id} product={rp as any} />)}
            </div>
          </div>
        </section>
      )}
    </SiteLayout>
  );
}
