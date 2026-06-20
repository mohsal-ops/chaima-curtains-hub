import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, Hammer, Home as HomeIcon, Palette } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard, ProductCardSkeleton } from "@/components/site/ProductCard";
import { AppointmentForm } from "@/components/site/AppointmentForm";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";
import { useSettings } from "@/hooks/useSettings";
import hero0 from "@/assets/hero-0.webp.asset.json";
import hero1 from "@/assets/hero-1.webp.asset.json";
import hero2 from "@/assets/hero-2.webp.asset.json";
import hero3 from "@/assets/hero-3.webp.asset.json";
import hero4 from "@/assets/hero-4.webp.asset.json";

const DEFAULT_HERO_IMAGES = [hero0.url, hero1.url, hero2.url, hero3.url, hero4.url];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tringle Accessoires — ترينقل أكسسوار | ستائر وديكور في الجزائر" },
      {
        name: "description",
        content:
          "تشكيلة واسعة من الستائر، السكك والإكسسوارات. زيارة منزلية مجانية وتركيب احترافي في جميع ولايات الجزائر.",
      },
      { property: "og:title", content: "Tringle Accessoires — ستائر وديكور في الجزائر" },
      { property: "og:description", content: "زيارة منزلية مجانية وتركيب احترافي." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { t, locale } = useLocale();
  const { get } = useSettings();

  const heroTitle = locale === "ar" ? get("hero_title_ar", "ستائر تليق ببيتك") : get("hero_title_fr", "Des rideaux à la hauteur de votre intérieur");
  const heroSubtitle = locale === "ar" ? get("hero_subtitle_ar") : get("hero_subtitle_fr");

  const heroImages = useMemo(() => {
    const raw = get("hero_images") || get("hero_image_url") || "";
    const list = raw.split(",").map((s) => s.trim()).filter(Boolean);
    return list.length ? list : DEFAULT_HERO_IMAGES;
  }, [get]);

  const [slide, setSlide] = useState(0);
  useEffect(() => {
    if (heroImages.length < 2) return;
    const id = setInterval(() => setSlide((s) => (s + 1) % heroImages.length), 3000);
    return () => clearInterval(id);
  }, [heroImages.length]);

  const featured = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,slug,name_ar,name_fr,price,created_at,categories(name_ar,name_fr),product_images(url,sort_order)")
        .eq("is_active", true)
        .eq("is_featured", true)
        .order("sort_order")
        .limit(6);
      if (error) throw error;
      return (data ?? []).map((p) => ({
        ...p,
        category: p.categories,
        product_images: p.product_images,
      }));
    },
  });

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative isolate min-h-[70vh] md:min-h-[85vh] overflow-hidden">
        {heroImages.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            className={`absolute inset-0 -z-10 h-full w-full object-cover transition-opacity duration-[1200ms] ease-in-out ${i === slide ? "opacity-100" : "opacity-0"}`}
            width={1920}
            height={1080}
          />
        ))}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/40 via-black/55 to-black/75" />
        <div className="relative mx-auto flex min-h-[70vh] md:min-h-[85vh] max-w-7xl flex-col items-center justify-center px-4 py-20 text-center text-white">
          <h1 className="max-w-3xl text-4xl md:text-6xl font-bold leading-tight drop-shadow">{heroTitle}</h1>
          {heroSubtitle && (
            <p className="mt-6 max-w-2xl text-base md:text-xl text-white/90 leading-relaxed">{heroSubtitle}</p>
          )}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="group relative h-14 px-8 text-base md:text-lg font-bold bg-primary text-primary-foreground hover:bg-primary-dark shadow-elegant ring-4 ring-primary/30 hover:ring-primary/50 transition-all hover:scale-105 animate-pulse-slow"
            >
              <a href="#book" className="inline-flex items-center gap-2">
                <CalendarCheck className="h-5 w-5" />
                {t({ ar: "احجز زيارة منزلية مجانية", fr: "Réserver une visite gratuite" })}
                <span aria-hidden className="inline-block transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1">→</span>
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 px-6 bg-transparent text-white border-white/80 hover:bg-white hover:text-primary">
              <Link to="/products">{t({ ar: "تصفح المنتجات", fr: "Voir les produits" })}</Link>
            </Button>
          </div>
          {heroImages.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {heroImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlide(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${i === slide ? "w-8 bg-primary" : "w-2 bg-white/60"}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto -mt-12 max-w-6xl px-4 relative z-10">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: HomeIcon, title: t({ ar: "زيارة منزلية مجانية", fr: "Visite à domicile gratuite" }),
              sub: t({ ar: "في جميع ولايات الجزائر", fr: "Dans toutes les wilayas" }) },
            { icon: Palette, title: t({ ar: "تشكيلة واسعة", fr: "Large choix de tissus" }),
              sub: t({ ar: "أجود الأقمشة والألوان", fr: "Qualité et couleurs variées" }) },
            { icon: Hammer, title: t({ ar: "تركيب احترافي", fr: "Installation pro" }),
              sub: t({ ar: "بأيدي فنيين متخصصين", fr: "Par des techniciens qualifiés" }) },
          ].map(({ icon: Icon, title, sub }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-light text-primary">
                <Icon className="h-7 w-7" />
              </div>
              <h3 className="mt-4 font-bold text-foreground">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="mb-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            {t({ ar: "منتجاتنا المميزة", fr: "Nos produits vedettes" })}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {t({ ar: "اختيارات مختارة بعناية لكل ذوق", fr: "Une sélection soignée pour chaque style" })}
          </p>
        </div>

        {featured.isLoading ? (
          <div className="grid gap-5 grid-cols-2 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : (featured.data ?? []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
            {t({ ar: "لا توجد منتجات مميزة حالياً", fr: "Aucun produit vedette pour le moment" })}
          </div>
        ) : (
          <div className="grid gap-5 grid-cols-2 md:grid-cols-3">
            {featured.data!.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}

        <div className="mt-10 text-center">
          <Button asChild variant="outline" size="lg">
            <Link to="/products">
              {t({ ar: "عرض جميع المنتجات", fr: "Voir tous les produits" })} →
            </Link>
          </Button>
        </div>
      </section>

      {/* APPOINTMENT */}
      <section id="book" className="bg-gradient-to-b from-primary-light/50 to-background py-20">
        <div className="mx-auto max-w-3xl px-4">
          <div className="mb-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              {t({ ar: "احجز زيارة منزلية", fr: "Réservez une visite à domicile" })}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {t({
                ar: "ملاحظة: تكلفة التنقل 3,000 دج تُخصم من الفاتورة النهائية عند الشراء.",
                fr: "Frais de déplacement 3 000 DA, déduits de la facture finale en cas d'achat.",
              })}
            </p>
          </div>
          <AppointmentForm />
        </div>
      </section>
    </SiteLayout>
  );
}
