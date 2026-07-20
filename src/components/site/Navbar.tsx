import { Link } from "@tanstack/react-router";
import { Menu, X, Languages } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n";
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/lib/utils";
import { CartIcon } from "./CartIcon";

export function Navbar() {
  const { t, locale, toggle } = useLocale();
  const { get } = useSettings();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const siteName = locale === "ar" ? get("site_name_ar", "ترينقل أكسسوار") : get("site_name_fr", "Tringle Accessoires");
  const rawLogoUrl = get("site_logo_url");
  const logoUrl = rawLogoUrl && !rawLogoUrl.includes("/__l5e/assets-v1/") ? rawLogoUrl : "/tringle-logo.jpg";


  const navLinks: Array<{ to: string; label: string }> = [
    { to: "/", label: t({ ar: "الرئيسية", fr: "Accueil" }) },
    { to: "/products", label: t({ ar: "المنتجات", fr: "Produits" }) },
    { to: "/shipping", label: t({ ar: "الشحن والتسليم", fr: "Livraison" }) },
    { to: "/contact", label: t({ ar: "اتصل بنا", fr: "Contact" }) },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all duration-300",
        scrolled ? "bg-background/85 backdrop-blur-md shadow-soft" : "bg-background",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <Link to="/" className="flex items-center gap-3 group">
          {logoUrl ? (
            <img src={logoUrl} alt={siteName} className="h-12 w-12 rounded-full object-cover border border-border bg-white" />
          ) : (
            <span className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground font-bold text-lg shadow-soft">
              TA
            </span>
          )}
          <span className="text-base md:text-lg font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
            {siteName}
          </span>
        </Link>


        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary transition-colors relative"
              activeProps={{ className: "text-primary" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
          <a
            href="/#book"
            className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
          >
            {t({ ar: "احجز زيارة", fr: "Réserver une visite" })}
          </a>
          <button
            onClick={toggle}
            className="ms-2 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
            aria-label="Change language"
          >
            <Languages className="h-4 w-4" />
            {locale === "ar" ? "FR" : "AR"}
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <CartIcon />
          <button
            className="md:hidden grid place-items-center h-10 w-10 rounded-md border border-border text-foreground"
            onClick={() => setOpen((v) => !v)}
            aria-label="Open menu"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>



      {open && (
        <div className="md:hidden border-t border-border bg-background animate-in slide-in-from-top duration-200">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 p-4">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-4 py-3 text-sm font-medium text-foreground hover:bg-primary-light"
                activeProps={{ className: "bg-primary-light text-primary" }}
                activeOptions={{ exact: l.to === "/" }}
              >
                {l.label}
              </Link>
            ))}
            <a
              href="/#book"
              onClick={() => setOpen(false)}
              className="rounded-md px-4 py-3 text-sm font-medium text-foreground hover:bg-primary-light"
            >
              {t({ ar: "احجز زيارة", fr: "Réserver une visite" })}
            </a>
            <button
              onClick={() => {
                toggle();
                setOpen(false);
              }}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
            >
              <Languages className="h-4 w-4" />
              {locale === "ar" ? "Français" : "العربية"}
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
