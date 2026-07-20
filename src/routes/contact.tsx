import { createFileRoute } from "@tanstack/react-router";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useLocale } from "@/lib/i18n";
import { useSettings } from "@/hooks/useSettings";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Tringle Accessoires" },
      { name: "description", content: "Contactez Tringle Accessoires par téléphone, WhatsApp ou email." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { t, locale } = useLocale();
  const { get } = useSettings();
  const phones = [get("contact_phone_1"), get("contact_phone_2"), get("contact_phone_3")].filter(Boolean);
  const email = get("contact_email");
  const address = locale === "ar" ? get("address_ar") : get("address_fr");
  const wa = get("whatsapp_number");
  const maps = get("google_maps_url");

  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-bold">{t({ ar: "اتصل بنا", fr: "Contactez-nous" })}</h1>
        <p className="mt-3 text-muted-foreground">
          {t({ ar: "نحن هنا للإجابة على استفساراتكم.", fr: "Nous sommes là pour répondre à vos questions." })}
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {phones.map((p) => (
            <a key={p} href={`tel:${p.replace(/\s/g, "")}`} className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4 hover:border-primary transition-colors" dir="ltr">
              <Phone className="h-6 w-6 text-primary" />
              <div><p className="text-xs text-muted-foreground">{t({ ar: "هاتف", fr: "Téléphone" })}</p><p className="font-semibold">{p}</p></div>
            </a>
          ))}
          {wa && (
            <a href={`https://wa.me/${wa.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4 hover:border-primary transition-colors">
              <MessageCircle className="h-6 w-6 text-[#25D366]" />
              <div><p className="text-xs text-muted-foreground">WhatsApp</p><p className="font-semibold" dir="ltr">{wa}</p></div>
            </a>
          )}
          {email && (
            <a href={`mailto:${email}`} className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4 hover:border-primary transition-colors">
              <Mail className="h-6 w-6 text-primary" />
              <div><p className="text-xs text-muted-foreground">Email</p><p className="font-semibold break-all">{email}</p></div>
            </a>
          )}
          {address && (
            <a href={maps || "#"} target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4 hover:border-primary transition-colors">
              <MapPin className="h-6 w-6 text-primary" />
              <div><p className="text-xs text-muted-foreground">{t({ ar: "العنوان", fr: "Adresse" })}</p><p className="font-semibold">{address}</p></div>
            </a>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
