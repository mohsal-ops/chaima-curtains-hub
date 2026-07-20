import { useSettings } from "@/hooks/useSettings";
import { useLocale } from "@/lib/i18n";

function normalize(number: string) {
  return number.replace(/[^\d]/g, "");
}

export function FloatingWhatsApp() {
  const { get } = useSettings();
  const { t } = useLocale();
  const raw = get("whatsapp_number", "+213561238016");
  const num = normalize(raw);
  if (!num) return null;
  const msg = encodeURIComponent(t({ ar: "مرحبا، أريد الاستفسار عن منتجاتكم", fr: "Bonjour, je voudrais des informations sur vos produits" }));
  const href = `https://wa.me/${num}?text=${msg}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      className="fixed bottom-6 end-6 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg hover:scale-105 active:scale-95 transition-transform"
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7" fill="currentColor" aria-hidden="true">
        <path d="M16.003 3C9.374 3 4 8.375 4 15c0 2.383.699 4.6 1.902 6.469L4 29l7.727-1.867A11.94 11.94 0 0 0 16.003 29C22.625 29 28 23.625 28 17S22.625 3 16.003 3Zm0 21.75c-1.867 0-3.594-.528-5.055-1.438l-.36-.222-4.586 1.11 1.148-4.469-.242-.375A9.71 9.71 0 0 1 6.25 15c0-5.383 4.375-9.75 9.754-9.75 5.383 0 9.75 4.367 9.75 9.75s-4.367 9.75-9.75 9.75Zm5.375-7.297c-.297-.148-1.75-.86-2.023-.96-.273-.102-.469-.148-.664.148-.196.297-.766.96-.938 1.156-.172.196-.344.226-.64.078-.297-.149-1.25-.461-2.383-1.469-.883-.789-1.477-1.766-1.649-2.062-.171-.297-.019-.457.129-.605.132-.133.297-.344.445-.516.148-.171.196-.297.297-.492.101-.196.05-.367-.024-.516-.078-.148-.664-1.602-.914-2.195-.239-.578-.484-.5-.664-.507-.171-.008-.367-.008-.562-.008-.196 0-.516.074-.786.367-.273.297-1.031 1.008-1.031 2.461s1.055 2.855 1.203 3.055c.148.195 2.078 3.171 5.031 4.445.703.305 1.25.484 1.68.617.703.226 1.343.195 1.851.117.563-.086 1.75-.715 2-1.406.25-.688.25-1.281.176-1.406-.078-.125-.273-.196-.57-.344Z"/>
      </svg>
    </a>
  );
}
