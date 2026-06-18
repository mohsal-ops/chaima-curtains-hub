import { MessageCircle } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useLocale } from "@/lib/i18n";

export function FloatingWhatsApp() {
  const { get } = useSettings();
  const { t } = useLocale();
  const wa = get("whatsapp_number");
  if (!wa) return null;
  const waDigits = wa.replace(/\D/g, "");

  return (
    <a
      href={`https://wa.me/${waDigits}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t({ ar: "تواصل معنا على واتساب", fr: "Contactez-nous sur WhatsApp" })}
      className="fixed bottom-6 end-6 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-elegant transition-transform hover:scale-110 focus-visible:scale-110"
    >
      <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-60 animate-ping" aria-hidden="true" />
      <MessageCircle className="relative h-6 w-6" />
    </a>
  );
}
