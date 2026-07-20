import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Truck, MapPin, CreditCard, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useLocale } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: "Livraison — Tringle Accessoires" },
      { name: "description", content: "Frais et délais de livraison dans toutes les wilayas d'Algérie." },
    ],
  }),
  component: ShippingPage,
});

function ShippingPage() {
  const { t, locale } = useLocale();
  const q = useQuery({
    queryKey: ["wilayas-full"],
    queryFn: async () => {
      const { data, error } = await supabase.from("wilayas").select("code,name_ar,name_fr,delivery_fee_home,delivery_fee_office,is_free_delivery").order("code");
      if (error) throw error;
      return data;
    },
  });
  return (
    <SiteLayout>
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-bold">{t({ ar: "الشحن والتسليم", fr: "Livraison" })}</h1>
        <p className="mt-3 text-muted-foreground max-w-2xl">
          {t({ ar: "نقوم بالتوصيل إلى جميع ولايات الجزائر مع الدفع عند الاستلام.", fr: "Nous livrons dans toutes les wilayas d'Algérie avec paiement à la livraison." })}
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Truck, ar: "توصيل سريع", fr: "Livraison rapide" },
            { icon: MapPin, ar: "58 ولاية", fr: "58 wilayas" },
            { icon: CreditCard, ar: "الدفع عند الاستلام", fr: "Paiement à la livraison" },
            { icon: Clock, ar: "2 إلى 7 أيام", fr: "2 à 7 jours" },
          ].map((f, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 text-center">
              <f.icon className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-2 font-semibold">{t({ ar: f.ar, fr: f.fr })}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-primary-light/40">
              <tr>
                <th className="text-start p-3">#</th>
                <th className="text-start p-3">{t({ ar: "الولاية", fr: "Wilaya" })}</th>
                <th className="text-end p-3">{t({ ar: "التوصيل للمنزل", fr: "À domicile" })}</th>
                <th className="text-end p-3">{t({ ar: "المكتب", fr: "Bureau" })}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {q.data?.map((w) => (
                <tr key={w.code}>
                  <td className="p-3 text-muted-foreground">{w.code}</td>
                  <td className="p-3 font-medium">{locale === "ar" ? w.name_ar : w.name_fr}</td>
                  <td className="p-3 text-end">{w.is_free_delivery ? t({ ar: "مجانا", fr: "Gratuit" }) : formatPrice(Number(w.delivery_fee_home), locale)}</td>
                  <td className="p-3 text-end">{w.is_free_delivery ? t({ ar: "مجانا", fr: "Gratuit" }) : formatPrice(Number(w.delivery_fee_office), locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SiteLayout>
  );
}
