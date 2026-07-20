import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2, ShoppingBag } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useCart, cartSubtotal } from "@/lib/cart";
import { useLocale } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/site/product/QuantityStepper";

export const Route = createFileRoute("/cart")({
  ssr: false,
  component: CartPage,
});

function CartPage() {
  const { t, locale } = useLocale();
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);
  const subtotal = cartSubtotal(items);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl font-bold">{t({ ar: "سلة التسوق", fr: "Panier" })}</h1>
        {items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-border bg-card p-10 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">{t({ ar: "السلة فارغة", fr: "Votre panier est vide" })}</p>
            <Button asChild className="mt-6"><Link to="/products">{t({ ar: "تسوق الآن", fr: "Voir les produits" })}</Link></Button>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
            <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
              {items.map((i) => (
                <li key={i.id} className="p-4 flex gap-4 items-center">
                  {i.image_url ? (
                    <img src={i.image_url} alt="" className="h-20 w-20 rounded object-cover border border-border" />
                  ) : (
                    <div className="h-20 w-20 rounded bg-muted" />
                  )}
                  <div className="flex-1 min-w-0">
                    <Link to="/products/$slug" params={{ slug: i.slug }} className="font-medium hover:text-primary">
                      {locale === "ar" ? i.name_ar : i.name_fr}
                    </Link>
                    {i.variant_label && <p className="text-xs text-muted-foreground">{i.variant_label}</p>}
                    <p className="mt-1 text-sm text-primary font-semibold">{formatPrice(i.price, locale)}</p>
                  </div>
                  <QuantityStepper value={i.qty} onChange={(v) => setQty(i.id, v)} />
                  <button onClick={() => remove(i.id)} className="text-muted-foreground hover:text-destructive" aria-label="remove">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            <aside className="h-fit rounded-2xl border border-border bg-card p-5 space-y-4">
              <h2 className="font-semibold">{t({ ar: "الملخص", fr: "Résumé" })}</h2>
              <div className="flex justify-between text-sm">
                <span>{t({ ar: "المجموع الفرعي", fr: "Sous-total" })}</span>
                <strong>{formatPrice(subtotal, locale)}</strong>
              </div>
              <p className="text-xs text-muted-foreground">
                {t({ ar: "رسوم التوصيل تُحسب عند الدفع", fr: "La livraison est calculée à la commande" })}
              </p>
              <Button asChild className="w-full" size="lg"><Link to="/checkout">{t({ ar: "متابعة الدفع", fr: "Passer à la caisse" })}</Link></Button>
              <Button variant="ghost" className="w-full" onClick={clear}>{t({ ar: "إفراغ السلة", fr: "Vider le panier" })}</Button>
            </aside>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
