import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, ShoppingCart, MessageCircle } from "lucide-react";
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
  variants: Variant[];
  onVariantChange: (id: string | null) => void;
  onAddToCart: () => void;
  whatsappHref: string;
  canOrder: boolean;
}

export function QuickOrderForm({
  productId, name_ar, name_fr, price, image_url,
  variantId, variant, hasVariants, variants,
  onVariantChange, onAddToCart, whatsappHref, canOrder,
}: Props) {
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
    <form onSubmit={submit} className="mt-6 rounded-2xl border-2 border-primary bg-card p-5 shadow-lg">
      <p className="text-center text-base font-semibold text-foreground mb-4">
        {t({ ar: "أضف معلوماتك في الأسفل لطلب هذا المنتج", fr: "Ajoutez vos informations ci-dessous pour commander" })}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t({ ar: "الاسم الكامل", fr: "Nom complet" })} *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11" />
        </div>
        <div className="space-y-2">
          <Label>{t({ ar: "رقم الهاتف", fr: "Téléphone" })} *</Label>
          <Input
            dir="ltr"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\s/g, ""))}
            placeholder="0555 12 34 56"
            className="h-11"
          />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Label>{t({ ar: "الولاية", fr: "Wilaya" })} *</Label>
        <select
          value={wilayaId ?? ""}
          onChange={(e) => setWilayaId(e.target.value ? Number(e.target.value) : null)}
          className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="" disabled>{t({ ar: "اختر الولاية", fr: "Choisir la wilaya" })}</option>
          {wilayasQ.data?.map((w) => (
            <option key={w.id} value={w.id}>
              {w.code} — {locale === "ar" ? w.name_ar : w.name_fr}
            </option>
          ))}
        </select>
      </div>

      {hasVariants && variants.length > 0 && (
        <div className="mt-4 space-y-2">
          <Label>{t({ ar: "اختر الطول", fr: "Choisir la longueur" })} *</Label>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const oos = v.stock != null && v.stock <= 0;
              const active = v.id === variantId;
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={oos}
                  onClick={() => onVariantChange(v.id)}
                  className={`min-w-[68px] rounded-md border-2 px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:border-primary/60"
                  } ${oos ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <Label>{t({ ar: "الكمية", fr: "Quantité" })}</Label>
        <QuantityStepper value={qty} onChange={setQty} />
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          type="button"
          onClick={onAddToCart}
          disabled={!canOrder}
          size="lg"
          variant="outline"
          className="h-14 text-base font-bold border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
        >
          <ShoppingCart className="me-2 h-5 w-5" />
          {t({ ar: "إضافة للسلة", fr: "Ajouter au panier" })}
        </Button>
        <Button
          type="submit"
          disabled={!valid || submitting}
          size="lg"
          className="h-14 text-base font-bold bg-primary hover:bg-primary/90"
        >
          {submitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
          {t({ ar: "أنقر هنا لتأكيد الطلب", fr: "Confirmer la commande" })}
        </Button>
      </div>

      <a
        href={canOrder ? whatsappHref : undefined}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => { if (!canOrder) e.preventDefault(); }}
        className={`mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-md text-base font-bold text-white transition ${
          canOrder ? "bg-[#25D366] hover:bg-[#1FB855]" : "bg-[#25D366]/50 cursor-not-allowed"
        }`}
      >
        <MessageCircle className="h-5 w-5" />
        {t({ ar: "أنقر هنا للطلب عبر الواتساب", fr: "Commander via WhatsApp" })}
      </a>

      <div className="mt-5 rounded-xl bg-primary-light/30 border border-primary/20 p-4 text-sm">
        <p className="font-bold text-foreground mb-3 text-base">
          {t({ ar: "ملخص الطلب", fr: "Récapitulatif" })}
        </p>
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            {(locale === "ar" ? name_ar : name_fr)}
            {variant ? ` — ${variant.label}` : ""} × {qty}
          </span>
          <span className="font-semibold">{formatPrice(subtotal, locale)}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-muted-foreground">
            {t({ ar: "سعر التوصيل", fr: "Livraison" })}
          </span>
          <span className="font-semibold">
            {selectedWilaya
              ? selectedWilaya.is_free_delivery
                ? t({ ar: "مجانا", fr: "Gratuit" })
                : formatPrice(fee, locale)
              : t({ ar: "إختر الولاية", fr: "Choisir la wilaya" })}
          </span>
        </div>
        <div className="flex justify-between mt-2 pt-2 border-t border-primary/20 font-bold text-lg">
          <span>{t({ ar: "السعر الإجمالي", fr: "Total" })}</span>
          <span className="text-primary">{formatPrice(total, locale)}</span>
        </div>
      </div>
    </form>
  );
}
