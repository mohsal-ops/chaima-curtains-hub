import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocale, pickLocalized } from "@/lib/i18n";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Props {
  wilayaId: number | null;
  cityId: number | null;
  onWilayaChange: (id: number | null) => void;
  onCityChange: (id: number | null) => void;
  required?: boolean;
}

export function WilayaCitySelect({ wilayaId, cityId, onWilayaChange, onCityChange, required }: Props) {
  const { t, locale } = useLocale();

  const wilayasQ = useQuery({
    queryKey: ["wilayas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("wilayas").select("id,code,name_ar,name_fr").order("code");
      if (error) throw error;
      return data;
    },
    staleTime: 24 * 60 * 60 * 1000,
  });

  const citiesQ = useQuery({
    queryKey: ["cities", wilayaId],
    queryFn: async () => {
      if (!wilayaId) return [];
      const { data, error } = await supabase
        .from("cities")
        .select("id,name_ar,name_fr")
        .eq("wilaya_id", wilayaId)
        .order("name_fr");
      if (error) throw error;
      return data;
    },
    enabled: !!wilayaId,
    staleTime: 24 * 60 * 60 * 1000,
  });

  // Clear city when wilaya changes
  useEffect(() => {
    if (wilayaId && cityId) {
      const list = citiesQ.data ?? [];
      if (list.length > 0 && !list.some((c) => c.id === cityId)) {
        onCityChange(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wilayaId, citiesQ.data]);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label>
          {t({ ar: "الولاية", fr: "Wilaya" })} {required && <span className="text-destructive">*</span>}
        </Label>
        <Select
          value={wilayaId ? String(wilayaId) : ""}
          onValueChange={(v) => onWilayaChange(v ? Number(v) : null)}
        >
          <SelectTrigger className="bg-card">
            <SelectValue placeholder={t({ ar: "اختر الولاية", fr: "Choisir la wilaya" })} />
          </SelectTrigger>
          <SelectContent className="max-h-80">
            {wilayasQ.data?.map((w) => (
              <SelectItem key={w.id} value={String(w.id)}>
                {w.code} — {pickLocalized(w as unknown as Record<string, unknown>, "name", locale)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>
          {t({ ar: "المدينة", fr: "Ville" })} {required && <span className="text-destructive">*</span>}
        </Label>
        <Select
          value={cityId ? String(cityId) : ""}
          onValueChange={(v) => onCityChange(v ? Number(v) : null)}
          disabled={!wilayaId}
        >
          <SelectTrigger className="bg-card">
            <SelectValue
              placeholder={
                wilayaId
                  ? t({ ar: "اختر المدينة", fr: "Choisir la ville" })
                  : t({ ar: "اختر الولاية أولاً", fr: "Choisissez d'abord la wilaya" })
              }
            />
          </SelectTrigger>
          <SelectContent className="max-h-80">
            {citiesQ.data?.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {pickLocalized(c as unknown as Record<string, unknown>, "name", locale)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
