import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const PHONE_RE = /^(\+?213|0)?(5|6|7)\d{8}$/;

const lineItemSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().nullable().optional(),
  variant_label: z.string().nullable().optional(),
  name_ar: z.string(),
  name_fr: z.string(),
  price: z.number().positive(),
  image_url: z.string().nullable().optional(),
  qty: z.number().int().min(1).max(99),
});

const inputSchema = z.object({
  customer_name: z.string().trim().min(2).max(120),
  customer_phone: z.string().trim().refine((v) => PHONE_RE.test(v.replace(/\s/g, "")), "invalid phone"),
  customer_email: z.string().email().optional().nullable(),
  wilaya_id: z.number().int(),
  city_id: z.number().int().nullable().optional(),
  address: z.string().max(500).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  delivery_type: z.enum(["home", "office"]).default("home"),
  items: z.array(lineItemSchema).min(1).max(20),
});

function serverClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const createCustomerOrder = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => inputSchema.parse(raw))
  .handler(async ({ data }) => {
    const supabase = serverClient();

    // Delivery fee from wilaya
    const { data: wilaya, error: wilErr } = await supabase
      .from("wilayas")
      .select("id, delivery_fee_home, delivery_fee_office, is_free_delivery, name_fr, name_ar")
      .eq("id", data.wilaya_id)
      .maybeSingle();
    if (wilErr || !wilaya) throw new Error("Wilaya introuvable");

    const subtotal = data.items.reduce((s, i) => s + i.price * i.qty, 0);
    const feeBase = data.delivery_type === "office" ? Number(wilaya.delivery_fee_office) : Number(wilaya.delivery_fee_home);
    const delivery_fee = wilaya.is_free_delivery ? 0 : feeBase;
    const total = subtotal + delivery_fee;

    // Order number
    const { data: numData, error: numErr } = await supabase.rpc("next_order_number");
    if (numErr || !numData) throw new Error("Numéro de commande indisponible");
    const order_number = numData as unknown as string;

    // First item drives the legacy top-level product columns
    const first = data.items[0];
    const totalQty = data.items.reduce((s, i) => s + i.qty, 0);

    const snapshot = {
      version: 2,
      items: data.items,
      wilaya: { id: wilaya.id, name_fr: wilaya.name_fr, name_ar: wilaya.name_ar },
      subtotal,
      delivery_fee,
      total,
    };

    const { error: insErr } = await supabase.from("orders").insert({
      order_number,
      product_id: first.product_id,
      product_snapshot: snapshot,
      customer_name: data.customer_name.trim(),
      customer_phone: data.customer_phone.replace(/\s/g, ""),
      customer_email: data.customer_email ?? null,
      quantity: totalQty,
      unit_price: first.price,
      total_price: total,
      delivery_type: data.delivery_type,
      wilaya_id: data.wilaya_id,
      city_id: data.city_id ?? null,
      address: data.address ?? null,
      notes: data.notes ?? null,
    });
    if (insErr) throw new Error(insErr.message);

    return { order_number, subtotal, delivery_fee, total };
  });
