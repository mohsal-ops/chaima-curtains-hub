import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createCustomerOrder } from "@/lib/orders.functions";
import { useLocale } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QuantityStepper } from "./QuantityStepper";
import type { Variant } from "@/components/site/OrderForm";

const PHONE_RE = /^(\+?213|0)?(5|6|7)\d{8}$/;

interface Props {
  productId: string;
  name_ar: string;
  name_fr: string;
  price: number;
  image_url: string | null;
  variantId: string | null;
  variant: Variant | null;
  hasVariants: boolean;
}

export function QuickOrderForm({ productId, name_ar, name_fr, price, image_url, variantId, variant, hasVariants }: Props) {
  const { t, locale } = useLocale();
  const navigate = useNavigate();
  const createOrder = useServerFn(createCustomerOrder);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [wilayaId, setWilayaId] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const wilayasQ = useQuery({
    queryKey: ["wilayas-fees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wilayas")
        .select("id,code,name_ar,name_fr,delivery_fee_home,is_free_delivery")
        .order("code");
      if (error) throw error;
      return data;
    },
    staleTime: 24 * 60 * 60 * 1000,
  });

  const selectedWilaya = useMemo(
    () => wilayasQ.data?.find((w) => w.id === wilayaId) ?? null,
    [wilayasQ.data, wilayaId],
  );

  const unitPrice = variant ? variant.price : price;
  const subtotal = unitPrice * qty;
  const fee = selectedWilaya ? (selectedWilaya.is_free_delivery ? 0 : Number(selectedWilaya.delivery_fee_home)) : 0;
  const total = subtotal + fee;

  const valid =
    name.trim().length >= 2 &&
    PHONE_RE.test(phone.replace(/\s/g, "")) &&
    wilayaId !== null &&
    (!hasVariants || !!variant);

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
          delivery_type: "home",
          items: [
            {
              product_id: productId,
              variant_id: variantId,
              variant_label: variant?.label ?? null,
              name_ar,
              name_fr,
              price: unitPrice,
              image_url,
              qty,
            },
          ],
        },
      });
      toast.success(t({ ar: "تم تسجيل طلبك!", fr: "Commande enregistrée !" }), {
        icon: <CheckCircle2 className="h-4 w-4" />,
      });
      navigate({ to: "/order-confirmation/$number", params: { number: res.order_number } });
    } catch (err) {
      console.error(err);
      toast.error(t({ ar: "فشل الإرسال. حاول مجددا.", fr: "Échec de l'envoi. Réessayez." }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 rounded-2xl border-2 border-primary/30 bg-primary-light/20 p-5 shadow-soft">
      <h3 className="text-lg font-bold text-primary">
        {t({ ar: "طلب سريع", fr: "Commande rapide" })}
      </h3>
      <p className="text-xs text-muted-foreground">
        {t({ ar: "أطلب الآن دون إنشاء حساب — الدفع عند الاستلام", fr: "Sans compte — paiement à la livraison" })}
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t({ ar: "الاسم الكامل", fr: "Nom complet" })} *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>{t({ ar: "الهاتف", fr: "Téléphone" })} *</Label>
          <Input
            dir="ltr"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\s/g, ""))}
            placeholder="0555 12 34 56"
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t({ ar: "الولاية", fr: "Wilaya" })} *</Label>
          <select
            value={wilayaId ?? ""}
            onChange={(e) => setWilayaId(e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="" disabled>{t({ ar: "اختر الولاية", fr: "Choisir la wilaya" })}</option>
            {wilayasQ.data?.map((w) => (
              <option key={w.id} value={w.id}>
                {w.code} — {locale === "ar" ? w.name_ar : w.name_fr}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>{t({ ar: "الكمية", fr: "Quantité" })} *</Label>
          <QuantityStepper value={qty} onChange={setQty} />
        </div>
      </div>

      <div className="mt-5 rounded-xl bg-card border border-border p-4 text-sm">
        <p className="font-semibold text-foreground mb-2">
          {t({ ar: "ملخص الطلب", fr: "Récapitulatif" })}
        </p>
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            {(locale === "ar" ? name_ar : name_fr)}
            {variant ? ` — ${variant.label}` : ""} × {qty}
          </span>
          <span>{formatPrice(subtotal, locale)}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-muted-foreground">
            {t({ ar: "التوصيل", fr: "Livraison" })}
            {selectedWilaya ? ` — ${locale === "ar" ? selectedWilaya.name_ar : selectedWilaya.name_fr}` : ""}
          </span>
          <span>
            {selectedWilaya
              ? selectedWilaya.is_free_delivery
                ? t({ ar: "مجانا", fr: "Gratuit" })
                : formatPrice(fee, locale)
              : "—"}
          </span>
        </div>
        <div className="flex justify-between mt-2 pt-2 border-t border-border font-bold text-base">
          <span>{t({ ar: "المجموع", fr: "Total" })}</span>
          <span className="text-primary">{formatPrice(total, locale)}</span>
        </div>
      </div>

      <Button type="submit" disabled={!valid || submitting} size="lg" className="mt-4 w-full">
        {submitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
        {t({ ar: "تأكيد الطلب", fr: "Confirmer la commande" })}
      </Button>
    </form>
  );
}
