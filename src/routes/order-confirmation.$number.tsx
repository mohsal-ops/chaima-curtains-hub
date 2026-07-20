import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Phone } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/order-confirmation/$number")({
  ssr: false,
  component: ConfirmationPage,
});

function ConfirmationPage() {
  const { number } = Route.useParams();
  const { t } = useLocale();
  return (
    <SiteLayout>
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-primary" />
        <h1 className="mt-4 text-3xl font-bold">{t({ ar: "شكرا لك!", fr: "Merci pour votre commande !" })}</h1>
        <p className="mt-2 text-muted-foreground">
          {t({ ar: "تم استلام طلبك بنجاح.", fr: "Votre commande a bien été reçue." })}
        </p>
        <div className="mt-6 rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">{t({ ar: "رقم الطلب", fr: "Numéro de commande" })}</p>
          <p className="mt-1 text-2xl font-bold text-primary tracking-wide">{number}</p>
        </div>
        <p className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-foreground">
          <Phone className="h-4 w-4" />
          {t({ ar: "سنتصل بكم قريبا لتأكيد الطلب", fr: "Nous vous appellerons pour confirmer" })}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild><Link to="/products">{t({ ar: "متابعة التسوق", fr: "Continuer les achats" })}</Link></Button>
          <Button asChild variant="outline"><Link to="/">{t({ ar: "الرئيسية", fr: "Accueil" })}</Link></Button>
        </div>
      </div>
    </SiteLayout>
  );
}
