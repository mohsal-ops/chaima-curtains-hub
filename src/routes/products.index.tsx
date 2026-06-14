import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard, ProductCardSkeleton } from "@/components/site/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocale, pickLocalized } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/products/")({
  head: () => ({
    meta: [
      { title: "المنتجات | Catalogue — Chaima Rideaux" },
      { name: "description", content: "Découvrez notre catalogue complet de rideaux, rails et accessoires." },
      { property: "og:title", content: "Catalogue — Chaima Rideaux" },
      { property: "og:description", content: "Rideaux, rails et accessoires de qualité." },
    ],
  }),
  component: CatalogPage,
});

type SortOpt = "default" | "newest" | "price_asc" | "price_desc";

function CatalogPage() {
  const { t, locale } = useLocale();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOpt>("default");

  const categoriesQ = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id,name_ar,name_fr,slug,icon,sort_order")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const productsQ = useQuery({
    queryKey: ["products", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,slug,name_ar,name_fr,description_ar,description_fr,price,created_at,category_id,categories(name_ar,name_fr),product_images(url,sort_order)")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []).map((p) => ({ ...p, category: p.categories }));
    },
  });

  const filtered = useMemo(() => {
    let list = productsQ.data ?? [];
    if (categoryId) list = list.filter((p) => p.category_id === categoryId);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name_ar.toLowerCase().includes(q) ||
          p.name_fr.toLowerCase().includes(q) ||
          (p.description_ar ?? "").toLowerCase().includes(q) ||
          (p.description_fr ?? "").toLowerCase().includes(q),
      );
    }
    switch (sort) {
      case "newest":
        list = [...list].sort((a, b) => +new Date(b.created_at!) - +new Date(a.created_at!));
        break;
      case "price_asc":
        list = [...list].sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case "price_desc":
        list = [...list].sort((a, b) => Number(b.price) - Number(a.price));
        break;
    }
    return list;
  }, [productsQ.data, categoryId, search, sort]);

  return (
    <SiteLayout>
      <section className="border-b border-border bg-gradient-to-b from-primary-light/30 to-background py-10">
        <div className="mx-auto max-w-7xl px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {t({ ar: "كل المنتجات", fr: "Tous les produits" })}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t({ ar: "اكتشف تشكيلتنا الكاملة", fr: "Découvrez notre collection complète" })}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <aside className="space-y-6">
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t({ ar: "الفئات", fr: "Catégories" })}
              </h3>
              <div className="flex flex-wrap gap-2 lg:flex-col">
                <button
                  onClick={() => setCategoryId(null)}
                  className={cn(
                    "rounded-full lg:rounded-lg px-4 py-2 text-sm font-medium text-start transition-colors",
                    categoryId === null ? "bg-primary text-primary-foreground" : "bg-card border border-border hover:border-primary",
                  )}
                >
                  {t({ ar: "الكل", fr: "Tout" })}
                </button>
                {categoriesQ.data?.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCategoryId(c.id)}
                    className={cn(
                      "rounded-full lg:rounded-lg px-4 py-2 text-sm font-medium text-start transition-colors",
                      categoryId === c.id ? "bg-primary text-primary-foreground" : "bg-card border border-border hover:border-primary",
                    )}
                  >
                    <span className="me-2">{c.icon}</span>
                    {pickLocalized(c as unknown as Record<string, unknown>, "name", locale)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t({ ar: "الترتيب", fr: "Trier" })}
              </h3>
              <div className="space-y-1">
                {([
                  ["default", t({ ar: "الافتراضي", fr: "Par défaut" })],
                  ["newest", t({ ar: "الأحدث", fr: "Plus récent" })],
                  ["price_asc", t({ ar: "السعر: من الأقل", fr: "Prix croissant" })],
                  ["price_desc", t({ ar: "السعر: من الأعلى", fr: "Prix décroissant" })],
                ] as [SortOpt, string][]).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setSort(val)}
                    className={cn(
                      "block w-full rounded-lg px-3 py-2 text-start text-sm transition-colors",
                      sort === val ? "bg-primary-light text-primary font-medium" : "text-foreground hover:bg-secondary",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main */}
          <div>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute top-1/2 start-3 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t({ ar: "ابحث عن منتج...", fr: "Rechercher un produit..." })}
                  className="ps-9 bg-card"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {filtered.length} {t({ ar: "منتج", fr: "produits" })}
              </p>
            </div>

            {productsQ.isLoading ? (
              <div className="grid gap-5 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-border bg-card p-12 text-center">
                <div className="text-6xl">🪟</div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  {t({ ar: "لا توجد منتجات مطابقة", fr: "Aucun produit trouvé" })}
                </h3>
                <Button variant="outline" className="mt-4" onClick={() => { setSearch(""); setCategoryId(null); }}>
                  {t({ ar: "مسح الفلاتر", fr: "Réinitialiser" })}
                </Button>
              </div>
            ) : (
              <div className="grid gap-5 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
