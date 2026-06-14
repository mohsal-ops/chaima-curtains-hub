import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SettingsMap = Record<string, string>;

async function fetchSettings(): Promise<SettingsMap> {
  const { data, error } = await supabase.from("settings").select("key,value");
  if (error) throw error;
  const map: SettingsMap = {};
  for (const row of data ?? []) {
    map[row.key] = row.value ?? "";
  }
  return map;
}

export function useSettings() {
  const q = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
    staleTime: 5 * 60 * 1000,
  });
  const get = (key: string, fallback = "") => q.data?.[key] ?? fallback;
  return { ...q, get };
}
