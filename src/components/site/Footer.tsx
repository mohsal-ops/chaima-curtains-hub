import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { useSettings } from "@/hooks/useSettings";

export function Footer() {
  const { t, locale } = useLocale();
  const { get } = useSettings();

  const siteName = locale === "ar" ? get("site_name_ar", "شعيمة ريدو") : get("site_name_fr", "Chaima Rideaux");
  const address = locale === "ar" ? get("address_ar") : get("address_fr");

  const phones = [get("contact_phone_1"), get("contact_phone_2"), get("contact_phone_3")].filter(Boolean);
  const email = get("contact_email");
  const mapsUrl = get("google_maps_url");
  const fb = get("facebook_url");
  const ig = get("instagram_url");
  const wa = get("whatsapp_number");

  return (
    <footer className="bg-primary-dark text-primary-foreground mt-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <h3 className="text-lg font-bold">{siteName}</h3>
            <p className="mt-3 text-sm text-primary-foreground/80 leading-relaxed">
              {t({
                ar: "ستائر، سكك، وإكسسوارات بأجود الأقمشة. زيارة منزلية مجانية في جميع ولايات الجزائر.",
                fr: "Rideaux, rails et accessoires de qualité. Visite à domicile gratuite dans toutes les wilayas.",
              })}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-accent-light">
              {t({ ar: "روابط سريعة", fr: "Liens rapides" })}
            </h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link to="/" className="text-primary-foreground/80 hover:text-accent-light transition-colors">
                  {t({ ar: "الرئيسية", fr: "Accueil" })}
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-primary-foreground/80 hover:text-accent-light transition-colors">
                  {t({ ar: "المنتجات", fr: "Produits" })}
                </Link>
              </li>
              <li>
                <a href="/#book" className="text-primary-foreground/80 hover:text-accent-light transition-colors">
                  {t({ ar: "احجز زيارة", fr: "Réserver une visite" })}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-accent-light">
              {t({ ar: "تواصل معنا", fr: "Contactez-nous" })}
            </h4>
            <ul className="mt-4 space-y-3 text-sm">
              {address && (
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-accent shrink-0" />
                  <span className="text-primary-foreground/85">{address}</span>
                </li>
              )}
              {mapsUrl && (
                <li>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-accent-light hover:underline"
                  >
                    <MapPin className="h-4 w-4" />
                    {t({ ar: "عرض على الخريطة", fr: "Voir sur la carte" })}
                  </a>
                </li>
              )}
              {email && (
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-accent shrink-0" />
                  <a href={`mailto:${email}`} className="hover:text-accent-light transition-colors break-all">
                    {email}
                  </a>
                </li>
              )}
              {phones.map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-accent shrink-0" />
                  <a href={`tel:${p.replace(/\s/g, "")}`} className="hover:text-accent-light transition-colors" dir="ltr">
                    {p}
                  </a>
                </li>
              ))}
            </ul>

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
              {wa && (
                <a href={`https://wa.me/${wa.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
                  className="grid h-10 w-10 place-items-center rounded-full bg-primary-foreground/10 hover:bg-accent hover:text-primary-dark transition-colors">
                  <Phone className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-primary-foreground/15 pt-6 text-center text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} {siteName} — {t({ ar: "جميع الحقوق محفوظة", fr: "Tous droits réservés" })}
        </div>
      </div>
    </footer>
  );
}
