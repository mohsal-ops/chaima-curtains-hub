import { Link } from "@tanstack/react-router";
import { ShoppingCart, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart, cartCount, cartSubtotal } from "@/lib/cart";
import { useLocale } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function CartIcon() {
  const { t, locale } = useLocale();
  const items = useCart((s) => s.items);
  const remove = useCart((s) => s.remove);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const count = mounted ? cartCount(items) : 0;
  const subtotal = cartSubtotal(items);
  const pickName = (i: typeof items[number]) => (locale === "ar" ? i.name_ar : i.name_fr);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-foreground hover:border-primary hover:text-primary transition-colors"
          aria-label={t({ ar: "السلة", fr: "Panier" })}
        >
          <ShoppingCart className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -top-1 -end-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b border-border">
          <h4 className="font-semibold">{t({ ar: "سلة التسوق", fr: "Votre panier" })}</h4>
        </div>
        {items.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            {t({ ar: "السلة فارغة", fr: "Aucun article pour le moment" })}
          </div>
        ) : (
          <>
            <ul className="max-h-72 overflow-auto divide-y divide-border">
              {items.map((i) => (
                <li key={i.id} className="p-3 flex gap-3">
                  {i.image_url ? (
                    <img src={i.image_url} alt="" className="h-14 w-14 rounded object-cover border border-border shrink-0" />
                  ) : (
                    <div className="h-14 w-14 rounded bg-muted shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{pickName(i)}</p>
                    {i.variant_label && <p className="text-xs text-muted-foreground">{i.variant_label}</p>}
                    <p className="text-xs mt-0.5">
                      {i.qty} × <strong className="text-primary">{formatPrice(i.price, locale)}</strong>
                    </p>
                  </div>
                  <button
                    onClick={() => remove(i.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="p-3 border-t border-border space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t({ ar: "المجموع الفرعي", fr: "Sous-total" })}</span>
                <strong className="text-primary">{formatPrice(subtotal, locale)}</strong>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to="/cart">{t({ ar: "السلة", fr: "Panier" })}</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/checkout">{t({ ar: "الدفع", fr: "Commander" })}</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
