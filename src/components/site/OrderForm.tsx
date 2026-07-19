import { useState } from "react";
import { CheckCircle2, Home, Loader2, Minus, Plus, Store } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WilayaCitySelect } from "./WilayaCitySelect";
import { cn } from "@/lib/utils";

const PHONE_RE = /^(05|06|07)\d{8}$/;

export interface Variant {
  id: string;
  label: string;
  price: number;
  original_price: number | null;
  stock: number | null;
  sort_order: number;
}

interface Product {
  id: string;
  name_ar: string;
  name_fr: string;
  price: number;
  cover_url: string | null;
  sizes?: string[];
  has_variants?: boolean;
  variants?: Variant[];
}

interface State {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  quantity: number;
  size: string | null;
  variant_id: string | null;
  delivery_type: "home" | "office";
  wilaya_id: number | null;
  city_id: number | null;
  address: string;
  notes: string;
}

const initial: State = {
  customer_name: "",
  customer_phone: "",
  customer_email: "",
  quantity: 1,
  size: null,
  variant_id: null,
  delivery_type: "home",
  wilaya_id: null,
  city_id: null,
  address: "",
  notes: "",
};

export function OrderForm({
  product,
  variantId: controlledVariantId,
  onVariantIdChange,
}: {
  product: Product;
  variantId?: string | null;
  onVariantIdChange?: (id: string | null) => void;
}) {
  const { t, locale } = useLocale();
  const [form, setForm] = useState<State>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [successNumber, setSuccessNumber] = useState<string | null>(null);

  const hasVariants = !!product.has_variants && !!product.variants && product.variants.length > 0;
  const sortedVariants = hasVariants
    ? [...product.variants!].sort((a, b) => a.sort_order - b.sort_order)
    : [];
  const isControlled = controlledVariantId !== undefined && !!onVariantIdChange;
  const activeVariantId = isControlled ? controlledVariantId ?? null : form.variant_id;
  const setVariantId = (id: string | null) => {
    if (isControlled) onVariantIdChange!(id);
    else setForm({ ...form, variant_id: id });
  };
  const selectedVariant = hasVariants
    ? sortedVariants.find((v) => v.id === activeVariantId) ?? null
    : null;

  const unitPrice = selectedVariant ? selectedVariant.price : product.price;
  const total = unitPrice * form.quantity;

  if (successNumber) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-elegant animate-in fade-in duration-500">
        <CheckCircle2 className="mx-auto h-16 w-16 text-success" />
        <h3 className="mt-4 text-2xl font-bold text-foreground">
          {t({ ar: "تم تسجيل طلبك بنجاح!", fr: "Votre commande est enregistrée !" })}
        </h3>
        <p className="mt-2 text-muted-foreground">{t({ ar: "رقم الطلب", fr: "Numéro de commande" })}</p>
        <p className="mt-1 text-2xl font-mono font-bold text-primary" dir="ltr">{successNumber}</p>
        <div className="mt-4 inline-block rounded-lg bg-secondary/50 px-4 py-2 text-sm">
          {form.quantity} × {formatPrice(unitPrice, locale)} ={" "}
          <strong className="text-primary">{formatPrice(total, locale)}</strong>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {t({
            ar: "سيتواصل معك فريقنا خلال 24 ساعة لتأكيد الطلب.",
            fr: "Notre équipe vous contactera dans les 24 heures.",
          })}
        </p>
        <Button variant="outline" className="mt-6" onClick={() => { setForm(initial); setSuccessNumber(null); }}>
          {t({ ar: "طلب آخر", fr: "Nouvelle commande" })}
        </Button>
      </div>
    );
  }

  const hasSizes = !hasVariants && !!product.sizes && product.sizes.length > 0;
  const valid =
    form.customer_name.trim().length >= 2 &&
    PHONE_RE.test(form.customer_phone) &&
    (!form.customer_email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customer_email)) &&
    form.wilaya_id !== null &&
    form.city_id !== null &&
    form.quantity >= 1 &&
    (!hasSizes || !!form.size) &&
    (!hasVariants || !!selectedVariant) &&
    (form.delivery_type === "office" || form.address.trim().length > 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setSubmitting(true);
    try {
      const { data: numData, error: numErr } = await supabase.rpc("next_order_number");
      if (numErr || !numData) throw numErr ?? new Error("number");
      const orderNumber = numData as unknown as string;

      const variantLabel = selectedVariant?.label ?? form.size ?? null;
      const { error } = await supabase.from("orders").insert({
        order_number: orderNumber,
        product_id: product.id,
        product_snapshot: {
          name_ar: product.name_ar,
          name_fr: product.name_fr,
          price: unitPrice,
          image_url: product.cover_url,
          size: variantLabel,
          variant_id: selectedVariant?.id ?? null,
          variant_label: selectedVariant?.label ?? null,
        },
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone,
        customer_email: form.customer_email.trim() || null,
        quantity: form.quantity,
        unit_price: unitPrice,
        total_price: total,
        delivery_type: form.delivery_type,
        wilaya_id: form.wilaya_id,
        city_id: form.city_id,
        address: form.address.trim() || null,
        notes: [
          variantLabel ? `${t({ ar: "الخيار", fr: "Option" })}: ${variantLabel}` : null,
          form.notes.trim() || null,
        ].filter(Boolean).join(" — ") || null,
      });
      if (error) throw error;
      setSuccessNumber(orderNumber);
    } catch (err) {
      console.error(err);
      toast.error(t({ ar: "فشل إرسال الطلب. حاول مرة أخرى.", fr: "Échec de l'envoi. Réessayez." }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-elegant">
      <h3 className="text-lg font-bold">{t({ ar: "طلب المنتج", fr: "Commander ce produit" })}</h3>

      {hasVariants && !isControlled && (
        <div className="space-y-2">
          <Label>{t({ ar: "اختر أحد الخيارات", fr: "Choisir une option" })} *</Label>
          <select
            value={activeVariantId ?? ""}
            onChange={(e) => setVariantId(e.target.value || null)}
            className="w-full rounded-lg border-2 border-border bg-card px-3 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none"
            required
          >
            <option value="" disabled>
              {t({ ar: "— اختر —", fr: "— Sélectionner —" })}
            </option>
            {sortedVariants.map((v) => {
              const outOfStock = v.stock != null && v.stock <= 0;
              return (
                <option key={v.id} value={v.id} disabled={outOfStock}>
                  {v.label} — {formatPrice(v.price, locale)}
                  {outOfStock ? ` (${t({ ar: "نفذ", fr: "épuisé" })})` : ""}
                </option>
              );
            })}
          </select>
        </div>
      )}

      {hasSizes && (
        <div className="space-y-2">
          <Label>{t({ ar: "اختر الطول", fr: "Choisir la longueur" })} *</Label>
          <div className="flex flex-wrap gap-2">
            {product.sizes!.map((s) => {
              const selected = form.size === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm({ ...form, size: s })}
                  className={cn(
                    "min-w-[64px] rounded-lg border-2 px-3 py-2 text-sm font-semibold transition-colors",
                    selected
                      ? "border-primary bg-primary text-primary-foreground shadow-soft"
                      : "border-border bg-card hover:border-primary/50",
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}




      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t({ ar: "الاسم", fr: "Nom" })} *</Label>
          <Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>{t({ ar: "الهاتف", fr: "Téléphone" })} *</Label>
          <Input
            dir="ltr"
            inputMode="tel"
            value={form.customer_phone}
            onChange={(e) => setForm({ ...form, customer_phone: e.target.value.replace(/\s/g, "") })}
            placeholder="0555 12 34 56"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>{t({ ar: "البريد (اختياري)", fr: "Email (optionnel)" })}</Label>
        <Input type="email" dir="ltr" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} />
      </div>

      <div className="space-y-2">
        <Label>{t({ ar: "الكمية", fr: "Quantité" })} *</Label>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="icon" onClick={() => setForm({ ...form, quantity: Math.max(1, form.quantity - 1) })}>
            <Minus className="h-4 w-4" />
          </Button>
          <span className="grid h-10 w-16 place-items-center rounded-md border border-border bg-card text-lg font-bold">
            {form.quantity}
          </span>
          <Button type="button" variant="outline" size="icon" onClick={() => setForm({ ...form, quantity: Math.min(99, form.quantity + 1) })}>
            <Plus className="h-4 w-4" />
          </Button>
          <div className="ms-auto rounded-lg bg-primary-light px-4 py-2 text-sm">
            <span className="text-muted-foreground">{form.quantity} × {formatPrice(unitPrice, locale)} = </span>
            <strong className="text-primary text-base">{formatPrice(total, locale)}</strong>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t({ ar: "نوع التوصيل", fr: "Mode de livraison" })} *</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["home", "office"] as const).map((opt) => {
            const Icon = opt === "home" ? Home : Store;
            const label = opt === "home"
              ? t({ ar: "توصيل للمنزل", fr: "Livraison à domicile" })
              : t({ ar: "استلام من المكتب", fr: "Retrait au bureau" });
            const selected = form.delivery_type === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setForm({ ...form, delivery_type: opt })}
                className={cn(
                  "flex items-center gap-3 rounded-xl border-2 p-4 text-start transition-all",
                  selected ? "border-primary bg-primary-light shadow-soft" : "border-border bg-card hover:border-primary/40",
                )}
              >
                <Icon className={cn("h-5 w-5", selected ? "text-primary" : "text-muted-foreground")} />
                <span className="font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <WilayaCitySelect
        wilayaId={form.wilaya_id}
        cityId={form.city_id}
        onWilayaChange={(id) => setForm({ ...form, wilaya_id: id, city_id: null })}
        onCityChange={(id) => setForm({ ...form, city_id: id })}
        required
      />

      <div className="space-y-2">
        <Label>
          {form.delivery_type === "home"
            ? t({ ar: "العنوان التفصيلي", fr: "Adresse détaillée" })
            : t({ ar: "اسم المكتب أو العنوان", fr: "Bureau ou adresse" })}{" "}
          {form.delivery_type === "home" && "*"}
        </Label>
        <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} />
      </div>

      <div className="space-y-2">
        <Label>{t({ ar: "ملاحظات", fr: "Notes" })}</Label>
        <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
      </div>

      <Button type="submit" disabled={!valid || submitting} size="lg" className="w-full text-base">
        {submitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
        {t({ ar: "أطلب الآن", fr: "Commander maintenant" })}
      </Button>
    </form>
  );
}
