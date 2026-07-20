import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { useSettings } from "@/hooks/useSettings";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M19.6 6.3c-1.5-.1-2.7-.9-3.5-2.1V4h-3v13.1a2.6 2.6 0 1 1-2.6-2.6c.3 0 .6.1.9.2v-3.1a5.7 5.7 0 1 0 4.7 5.6V9.7c1.2.8 2.6 1.3 4.2 1.3V7.9a4.6 4.6 0 0 1-.7-.1V6.3Z" />
    </svg>
  );
}

export function Footer() {
  const { t, locale } = useLocale();
  const { get } = useSettings();

  const siteName = locale === "ar" ? get("site_name_ar", "ترينقل أكسسوار") : get("site_name_fr", "Tringle Accessoires");
  const address = locale === "ar" ? get("address_ar") : get("address_fr");

  const phones = [get("contact_phone_1"), get("contact_phone_2"), get("contact_phone_3")].filter(Boolean);
  const email = get("contact_email");
  const mapsUrl = get("google_maps_url");
  const fb = get("facebook_url");
  const ig = get("instagram_url");
  const tk = get("tiktok_url");
  const wa = get("whatsapp_number");

  return (
    <footer className="bg-primary-dark text-primary-foreground mt-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* About */}
          <div>
            <h3 className="text-lg font-bold">{siteName}</h3>
            <p className="mt-3 text-sm text-primary-foreground/80 leading-relaxed">
              {t({
                ar: "ستائر، سكك، وإكسسوارات بأجود الأقمشة. زيارة منزلية مجانية في جميع ولايات الجزائر.",
                fr: "Rideaux, rails et accessoires de qualité. Visite à domicile gratuite dans toutes les wilayas.",
              })}
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link to="/shipping" className="text-primary-foreground/85 hover:text-accent-light">{t({ ar: "الشحن والتسليم", fr: "Livraison" })}</Link></li>
              <li><span className="text-primary-foreground/85">{t({ ar: "طرق الدفع: عند الاستلام", fr: "Paiement à la livraison" })}</span></li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-accent-light">
              {t({ ar: "الشروط والسياسات", fr: "Conditions" })}
            </h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link to="/terms" className="text-primary-foreground/85 hover:text-accent-light">{t({ ar: "شروط الاستخدام", fr: "Conditions d'utilisation" })}</Link></li>
              <li><Link to="/privacy" className="text-primary-foreground/85 hover:text-accent-light">{t({ ar: "سياسة الخصوصية", fr: "Politique de confidentialité" })}</Link></li>
              <li><Link to="/returns" className="text-primary-foreground/85 hover:text-accent-light">{t({ ar: "سياسة الإرجاع", fr: "Retours & échanges" })}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-accent-light">
              {t({ ar: "تواصل معنا", fr: "Contactez-nous" })}
            </h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li><Link to="/contact" className="text-primary-foreground/85 hover:text-accent-light">{t({ ar: "اتصل بنا", fr: "Contact" })}</Link></li>
              <li><Link to="/faq" className="text-primary-foreground/85 hover:text-accent-light">FAQ</Link></li>
              {address && (
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-accent shrink-0" />
                  <span className="text-primary-foreground/85">{address}</span>
                </li>
              )}
              {mapsUrl && (
                <li>
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-accent-light hover:underline">
                    <MapPin className="h-4 w-4" />
                    {t({ ar: "على الخريطة", fr: "Sur la carte" })}
                  </a>
                </li>
              )}
              {email && (
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-accent shrink-0" />
                  <a href={`mailto:${email}`} className="hover:text-accent-light transition-colors break-all">{email}</a>
                </li>
              )}
              {phones.map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-accent shrink-0" />
                  <a href={`tel:${p.replace(/\s/g, "")}`} className="hover:text-accent-light transition-colors" dir="ltr">{p}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Follow */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-accent-light">
              {t({ ar: "تابعنا على", fr: "Suivez-nous" })}
            </h4>
            <p className="mt-4 text-sm text-primary-foreground/80">
              {t({ ar: "تابعنا لأحدث المنتجات والعروض", fr: "Nos dernières nouveautés et offres" })}
            </p>
            <div className="mt-4 flex gap-3">
              {fb && (
                <a href={fb} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                  className="grid h-10 w-10 place-items-center rounded-full bg-primary-foreground/10 hover:bg-accent hover:text-primary-dark transition-colors">
                  <Facebook className="h-4 w-4" />
                </a>
              )}
              {ig && (
                <a href={ig} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                  className="grid h-10 w-10 place-items-center rounded-full bg-primary-foreground/10 hover:bg-accent hover:text-primary-dark transition-colors">
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {tk && (
                <a href={tk} target="_blank" rel="noopener noreferrer" aria-label="TikTok"
                  className="grid h-10 w-10 place-items-center rounded-full bg-primary-foreground/10 hover:bg-accent hover:text-primary-dark transition-colors">
                  <TikTokIcon className="h-4 w-4" />
                </a>
              )}
              {wa && (
                <a href={`https://wa.me/${wa.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
                  className="grid h-10 w-10 place-items-center rounded-full bg-primary-foreground/10 hover:bg-accent hover:text-primary-dark transition-colors">
                  <Phone className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-primary-foreground/10 text-center text-xs text-primary-foreground/70">
          © {new Date().getFullYear()} {siteName}. {t({ ar: "جميع الحقوق محفوظة.", fr: "Tous droits réservés." })}
        </div>
      </div>
    </footer>
  );
}
