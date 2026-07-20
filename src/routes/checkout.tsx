import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createCustomerOrder } from "@/lib/orders.functions";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useCart, cartSubtotal } from "@/lib/cart";
import { useLocale } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const PHONE_RE = /^(\+?213|0)?(5|6|7)\d{8}$/;

export const Route = createFileRoute("/checkout")({
  ssr: false,
  component: CheckoutPage,
});

function CheckoutPage() {
  const { t, locale } = useLocale();
  const navigate = useNavigate();
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const createOrder = useServerFn(createCustomerOrder);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [wilayaId, setWilayaId] = useState<number | null>(null);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const wilayasQ = useQuery({
    queryKey: ["wilayas-fees"],
    queryFn: async () => {
      const { data, error } = await supabase.from("wilayas").select("id,code,name_ar,name_fr,delivery_fee_home,is_free_delivery").order("code");
      if (error) throw error;
      return data;
    },
  });

  const w = useMemo(() => wilayasQ.data?.find((x) => x.id === wilayaId) ?? null, [wilayasQ.data, wilayaId]);
  const subtotal = cartSubtotal(items);
  const fee = w ? (w.is_free_delivery ? 0 : Number(w.delivery_fee_home)) : 0;
  const total = subtotal + fee;

  const valid = items.length > 0 && name.trim().length >= 2 && PHONE_RE.test(phone.replace(/\s/g, "")) && wilayaId !== null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setSubmitting(true);
    try {
      const res = await createOrder({
        data: {
          customer_name: name,
          customer_phone: phone,
          wilaya_id: wilayaId!,
          address: address || null,
          notes: notes || null,
          delivery_type: "home",
          items: items.map((i) => ({
            product_id: i.product_id,
            variant_id: i.variant_id,
            variant_label: i.variant_label,
            name_ar: i.name_ar,
            name_fr: i.name_fr,
            price: i.price,
            image_url: i.image_url,
            qty: i.qty,
          })),
        },
      });
      clear();
      toast.success(t({ ar: "تم استلام طلبك!", fr: "Commande enregistrée !" }), { icon: <CheckCircle2 className="h-4 w-4" /> });
      navigate({ to: "/order-confirmation/$number", params: { number: res.order_number } });
    } catch (err) {
      console.error(err);
      toast.error(t({ ar: "فشل الإرسال", fr: "Échec de l'envoi" }));
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <p className="text-muted-foreground">{t({ ar: "السلة فارغة", fr: "Panier vide" })}</p>
          <Button asChild className="mt-4"><Link to="/products">{t({ ar: "تسوق", fr: "Voir les produits" })}</Link></Button>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl font-bold">{t({ ar: "إتمام الطلب", fr: "Finaliser la commande" })}</h1>
        <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-5 rounded-2xl border border-border bg-card p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t({ ar: "الاسم الكامل", fr: "Nom complet" })} *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t({ ar: "الهاتف", fr: "Téléphone" })} *</Label>
                <Input dir="ltr" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\s/g, ""))} placeholder="0555 12 34 56" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t({ ar: "الولاية", fr: "Wilaya" })} *</Label>
              <select value={wilayaId ?? ""} onChange={(e) => setWilayaId(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="" disabled>{t({ ar: "اختر", fr: "Choisir" })}</option>
                {wilayasQ.data?.map((x) => (
                  <option key={x.id} value={x.id}>{x.code} — {locale === "ar" ? x.name_ar : x.name_fr}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>{t({ ar: "العنوان", fr: "Adresse" })}</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t({ ar: "ملاحظات (اختياري)", fr: "Notes (optionnel)" })}</Label>
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="rounded-lg border border-border bg-primary-light/40 p-4 text-sm">
              <p className="font-semibold">{t({ ar: "طريقة الدفع", fr: "Mode de paiement" })}</p>
              <p className="text-muted-foreground mt-1">{t({ ar: "الدفع عند الاستلام", fr: "Paiement à la livraison (COD)" })}</p>
            </div>
          </div>

          <aside className="h-fit rounded-2xl border border-border bg-card p-5 space-y-3">
            <h2 className="font-semibold">{t({ ar: "طلبك", fr: "Votre commande" })}</h2>
            <ul className="divide-y divide-border text-sm">
              {items.map((i) => (
                <li key={i.id} className="py-2 flex justify-between gap-3">
                  <span className="truncate">
                    {(locale === "ar" ? i.name_ar : i.name_fr)}
                    {i.variant_label ? ` — ${i.variant_label}` : ""} × {i.qty}
                  </span>
                  <span>{formatPrice(i.price * i.qty, locale)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between text-sm pt-3 border-t border-border">
              <span>{t({ ar: "المجموع الفرعي", fr: "Sous-total" })}</span>
              <span>{formatPrice(subtotal, locale)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>{t({ ar: "التوصيل", fr: "Livraison" })}</span>
              <span>{w ? (w.is_free_delivery ? t({ ar: "مجانا", fr: "Gratuit" }) : formatPrice(fee, locale)) : "—"}</span>
            </div>
            <div className="flex justify-between font-bold pt-2 border-t border-border">
              <span>{t({ ar: "المجموع", fr: "Total" })}</span>
              <span className="text-primary">{formatPrice(total, locale)}</span>
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={!valid || submitting}>
              {submitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t({ ar: "تأكيد الطلب", fr: "Confirmer la commande" })}
            </Button>
          </aside>
        </form>
      </div>
    </SiteLayout>
  );
}
