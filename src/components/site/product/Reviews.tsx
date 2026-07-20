import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function useProductReviews(productId: string) {
  return useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id,customer_name,rating,review_text,photo_url,created_at")
        .eq("product_id", productId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });
}

export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          style={{ width: size, height: size }}
          className={cn(n <= Math.round(value) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40")}
        />
      ))}
    </span>
  );
}

export function ReviewsSection({ productId }: { productId: string }) {
  const { t, locale } = useLocale();
  const q = useProductReviews(productId);
  const reviews = q.data ?? [];
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2 || rating < 1) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("reviews").insert({
        product_id: productId,
        customer_name: name.trim(),
        rating,
        review_text: text.trim() || null,
      });
      if (error) throw error;
      toast.success(t({ ar: "شكرا لك على تقييمك!", fr: "Merci pour votre avis !" }));
      setName("");
      setRating(0);
      setText("");
      q.refetch();
    } catch (err) {
      console.error(err);
      toast.error(t({ ar: "فشل إرسال التقييم", fr: "Échec de l'envoi de l'avis" }));
    } finally {
      setSubmitting(false);
    }
  }

  const df = useMemo(() => new Intl.DateTimeFormat(locale === "ar" ? "ar-DZ" : "fr-FR", { dateStyle: "medium" }), [locale]);

  return (
    <section id="reviews" className="mx-auto max-w-6xl px-4 py-12 border-t border-border">
      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="flex items-baseline gap-3">
            <h2 className="text-2xl font-bold">{t({ ar: "التقييمات", fr: "Avis clients" })}</h2>
            {reviews.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {avg.toFixed(1)} / 5 · {reviews.length} {t({ ar: "تقييم", fr: "avis" })}
              </span>
            )}
          </div>

          {reviews.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              {t({ ar: "لا توجد تقييمات بعد. كن أول من يقيّم!", fr: "Aucun avis pour le moment. Soyez le premier !" })}
            </p>
          ) : (
            <ul className="mt-6 space-y-6">
              {reviews.map((r) => (
                <li key={r.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{r.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{df.format(new Date(r.created_at))}</p>
                    </div>
                    <Stars value={r.rating} />
                  </div>
                  {r.review_text && <p className="mt-3 text-sm text-foreground/85 whitespace-pre-wrap">{r.review_text}</p>}
                  {r.photo_url && <img src={r.photo_url} alt="" className="mt-3 max-h-40 rounded border border-border" />}
                </li>
              ))}
            </ul>
          )}
        </div>

        <form onSubmit={submit} className="h-fit space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h3 className="text-lg font-semibold">{t({ ar: "اكتب تقييما", fr: "Laisser un avis" })}</h3>
          <div className="space-y-2">
            <Label>{t({ ar: "الاسم", fr: "Nom" })} *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          </div>
          <div className="space-y-2">
            <Label>{t({ ar: "التقييم", fr: "Note" })} *</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  aria-label={`${n} stars`}
                  className="p-1"
                >
                  <Star className={cn("h-6 w-6", n <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40")} />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t({ ar: "التعليق (اختياري)", fr: "Commentaire (optionnel)" })}</Label>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={1000} />
          </div>
          <Button type="submit" disabled={submitting || name.trim().length < 2 || rating < 1} className="w-full">
            {submitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {t({ ar: "إرسال", fr: "Envoyer" })}
          </Button>
        </form>
      </div>
    </section>
  );
}
