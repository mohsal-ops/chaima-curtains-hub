import { useSettings } from "@/hooks/useSettings";
import { useLocale } from "@/lib/i18n";

export function TickerBar() {
  const { locale } = useLocale();
  const { get } = useSettings();
  const raw =
    locale === "ar"
      ? get("ticker_messages_ar", "توصيل سريع لجميع الولايات|الدفع عند الاستلام|زيارة منزلية مجانية|ضمان الجودة على جميع منتجاتنا")
      : get("ticker_messages_fr", "Livraison rapide dans toutes les wilayas|Paiement à la livraison|Visite à domicile gratuite|Garantie qualité sur tous nos produits");
  const messages = raw.split("|").map((s) => s.trim()).filter(Boolean);
  if (messages.length === 0) return null;
  // duplicate for seamless loop
  const loop = [...messages, ...messages];
  return (
    <div className="bg-primary text-primary-foreground text-xs md:text-sm overflow-hidden">
      <div className="ticker-track flex whitespace-nowrap py-2 gap-12">
        {loop.map((m, i) => (
          <span key={i} className="inline-flex items-center gap-2 px-4">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-light" />
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}
