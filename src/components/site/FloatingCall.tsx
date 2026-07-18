import { Phone } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useLocale } from "@/lib/i18n";

export function FloatingCall() {
  const { get } = useSettings();
  const { t } = useLocale();
  // Prefer the dedicated "call" number (contact_phone_2 = +213 7 98 71 97 76),
  // fall back to contact_phone_1 if empty.
  const raw = get("contact_phone_2") || get("contact_phone_1");
  if (!raw) return null;
  const tel = raw.replace(/[^\d+]/g, "");

  return (
    <a
      href={`tel:${tel}`}
      aria-label={t({ ar: "اتصل بنا الآن", fr: "Appelez-nous" })}
      className="fixed bottom-6 start-6 z-50 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-elegant animate-wiggle hover:scale-110 focus-visible:scale-110 transition-transform"
    >
      <span className="absolute inset-0 rounded-full bg-primary opacity-50 animate-ping" aria-hidden="true" />
      <Phone className="relative h-6 w-6" />
    </a>
  );
}
