import { useState } from "react";
import { addDays, format } from "date-fns";
import { CalendarIcon, CheckCircle2, ChevronLeft, ChevronRight, Loader2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/lib/i18n";
import { useSettings } from "@/hooks/useSettings";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { WilayaCitySelect } from "./WilayaCitySelect";
import { cn } from "@/lib/utils";

const PHONE_RE = /^(05|06|07)\d{8}$/;
const COOLDOWN_MS = 20 * 60 * 1000;

interface Form {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  wilaya_id: number | null;
  city_id: number | null;
  preferred_date: Date | null;
  window_count: number;
  description: string;
}

const initial: Form = {
  customer_name: "",
  customer_phone: "",
  customer_email: "",
  wilaya_id: null,
  city_id: null,
  preferred_date: null,
  window_count: 1,
  description: "",
};

export function AppointmentForm() {
  const { t, locale } = useLocale();
  const { get } = useSettings();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Form>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [successNumber, setSuccessNumber] = useState<string | null>(null);

  const enabled = get("appointment_booking_enabled", "true") === "true";
  const travelCost = Number(get("travel_cost", "3000"));
  const minAdvance = Number(get("appointment_advance_days", "1")) || 1;
  const minDate = addDays(new Date(), minAdvance);

  if (!enabled) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-soft">
        <p className="text-lg font-medium text-muted-foreground">
          {t({ ar: "الحجز غير متاح حالياً", fr: "Les réservations sont indisponibles pour le moment" })}
        </p>
      </div>
    );
  }

  if (successNumber) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-elegant animate-in fade-in duration-500">
        <CheckCircle2 className="mx-auto h-16 w-16 text-success" />
        <h3 className="mt-4 text-2xl font-bold text-foreground">
          {t({ ar: "تم تسجيل موعدك بنجاح!", fr: "Votre rendez-vous est enregistré !" })}
        </h3>
        <p className="mt-2 text-muted-foreground">
          {t({ ar: "رقم الموعد", fr: "Numéro de rendez-vous" })}
        </p>
        <p className="mt-1 text-2xl font-mono font-bold text-primary" dir="ltr">
          {successNumber}
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          {t({
            ar: "سيتواصل معك فريقنا خلال 24 ساعة لتأكيد الموعد.",
            fr: "Notre équipe vous contactera dans les 24 heures pour confirmer.",
          })}
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => {
            setForm(initial);
            setStep(1);
            setSuccessNumber(null);
          }}
        >
          {t({ ar: "حجز موعد آخر", fr: "Réserver un autre rendez-vous" })}
        </Button>
      </div>
    );
  }

  const step1Valid =
    form.customer_name.trim().length >= 2 &&
    PHONE_RE.test(form.customer_phone) &&
    (!form.customer_email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customer_email));

  const step2Valid =
    form.wilaya_id !== null &&
    form.city_id !== null &&
    form.preferred_date !== null &&
    form.window_count >= 1 &&
    form.window_count <= 50;

  async function handleSubmit() {
    if (!step1Valid || !step2Valid) return;
    const last = Number(localStorage.getItem("appointment_last_submit") || "0");
    if (Date.now() - last < COOLDOWN_MS) {
      toast.error(t({ ar: "يرجى الانتظار قبل إرسال طلب آخر", fr: "Veuillez patienter avant un nouvel envoi" }));
      return;
    }

    setSubmitting(true);
    try {
      const { data: numData, error: numErr } = await supabase.rpc("next_appointment_number");
      if (numErr || !numData) throw numErr ?? new Error("number");
      const apptNumber = numData as unknown as string;

      const { error } = await supabase.from("appointments").insert({
        appointment_number: apptNumber,
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone,
        customer_email: form.customer_email.trim() || null,
        wilaya_id: form.wilaya_id,
        city_id: form.city_id,
        preferred_date: format(form.preferred_date!, "yyyy-MM-dd"),
        window_count: form.window_count,
        description: form.description.trim() || null,
        travel_cost: travelCost,
      });
      if (error) throw error;

      localStorage.setItem("appointment_last_submit", String(Date.now()));
      setSuccessNumber(apptNumber);
    } catch (e) {
      console.error(e);
      toast.error(t({ ar: "فشل إرسال الحجز. حاول مرة أخرى.", fr: "Échec de l'envoi. Réessayez." }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-elegant">
      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold transition-colors",
                step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {s}
            </div>
            {s < 3 && <div className={cn("h-0.5 flex-1 rounded", step > s ? "bg-primary" : "bg-muted")} />}
          </div>
        ))}
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        {t({ ar: `الخطوة ${step} من 3`, fr: `Étape ${step} sur 3` })}
      </p>

      {step === 1 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="space-y-2">
            <Label>
              {t({ ar: "الاسم الكامل", fr: "Nom complet" })} <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.customer_name}
              onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
              placeholder={t({ ar: "أدخل اسمك الكامل", fr: "Votre nom complet" })}
            />
          </div>
          <div className="space-y-2">
            <Label>
              {t({ ar: "رقم الهاتف", fr: "Téléphone" })} <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.customer_phone}
              onChange={(e) => setForm({ ...form, customer_phone: e.target.value.replace(/\s/g, "") })}
              placeholder="0555 12 34 56"
              dir="ltr"
              inputMode="tel"
            />
            {form.customer_phone && !PHONE_RE.test(form.customer_phone) && (
              <p className="text-xs text-destructive">
                {t({
                  ar: "يجب أن يكون رقم جزائري (يبدأ بـ 05 أو 06 أو 07)",
                  fr: "Numéro algérien requis (commence par 05, 06 ou 07)",
                })}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>{t({ ar: "البريد الإلكتروني (اختياري)", fr: "Email (optionnel)" })}</Label>
            <Input
              type="email"
              value={form.customer_email}
              onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
              placeholder="email@example.com"
              dir="ltr"
            />
          </div>
          <Button
            onClick={() => setStep(2)}
            disabled={!step1Valid}
            className="w-full"
            size="lg"
          >
            {t({ ar: "التالي", fr: "Suivant" })}
            <ChevronRight className="ms-2 h-4 w-4 rtl:rotate-180" />
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <WilayaCitySelect
            wilayaId={form.wilaya_id}
            cityId={form.city_id}
            onWilayaChange={(id) => setForm({ ...form, wilaya_id: id, city_id: null })}
            onCityChange={(id) => setForm({ ...form, city_id: id })}
            required
          />

          <div className="space-y-2">
            <Label>
              {t({ ar: "التاريخ المفضل", fr: "Date souhaitée" })} <span className="text-destructive">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start bg-card", !form.preferred_date && "text-muted-foreground")}
                >
                  <CalendarIcon className="me-2 h-4 w-4" />
                  {form.preferred_date
                    ? format(form.preferred_date, "PPP")
                    : t({ ar: "اختر التاريخ", fr: "Choisir une date" })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.preferred_date ?? undefined}
                  onSelect={(d) => setForm({ ...form, preferred_date: d ?? null })}
                  disabled={(d) => d < minDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>
              {t({ ar: "عدد النوافذ", fr: "Nombre de fenêtres" })} <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setForm({ ...form, window_count: Math.max(1, form.window_count - 1) })}
                aria-label="decrement"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="grid h-10 w-16 place-items-center rounded-md border border-border bg-card text-lg font-bold">
                {form.window_count}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setForm({ ...form, window_count: Math.min(50, form.window_count + 1) })}
                aria-label="increment"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
              <ChevronLeft className="me-2 h-4 w-4 rtl:rotate-180" />
              {t({ ar: "السابق", fr: "Précédent" })}
            </Button>
            <Button onClick={() => setStep(3)} disabled={!step2Valid} className="flex-1">
              {t({ ar: "التالي", fr: "Suivant" })}
              <ChevronRight className="ms-2 h-4 w-4 rtl:rotate-180" />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="space-y-2">
            <Label>{t({ ar: "ملاحظات إضافية", fr: "Notes complémentaires" })}</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value.slice(0, 500) })}
              placeholder={t({
                ar: "أخبرنا المزيد عن مشروعك (اختياري)",
                fr: "Détaillez votre projet (optionnel)",
              })}
              rows={4}
            />
            <p className="text-xs text-muted-foreground text-end">{form.description.length}/500</p>
          </div>

          <div className="rounded-xl border border-border bg-secondary/40 p-4 text-sm space-y-2">
            <p><strong>{t({ ar: "الاسم:", fr: "Nom :" })}</strong> {form.customer_name}</p>
            <p><strong>{t({ ar: "الهاتف:", fr: "Téléphone :" })}</strong> <span dir="ltr">{form.customer_phone}</span></p>
            <p>
              <strong>{t({ ar: "التاريخ:", fr: "Date :" })}</strong>{" "}
              {form.preferred_date ? format(form.preferred_date, "PPP") : "—"}
            </p>
            <p><strong>{t({ ar: "النوافذ:", fr: "Fenêtres :" })}</strong> {form.window_count}</p>
          </div>

          <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-foreground">
            ⚠️{" "}
            {t({
              ar: `تكلفة التنقل ${formatPrice(travelCost, locale)} تُخصم من الفاتورة النهائية عند الشراء.`,
              fr: `Frais de déplacement ${formatPrice(travelCost, locale)} déduits de la facture finale en cas d'achat.`,
            })}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)} disabled={submitting} className="flex-1">
              <ChevronLeft className="me-2 h-4 w-4 rtl:rotate-180" />
              {t({ ar: "السابق", fr: "Précédent" })}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting} className="flex-1" size="lg">
              {submitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t({ ar: "تأكيد الحجز", fr: "Confirmer la réservation" })}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
