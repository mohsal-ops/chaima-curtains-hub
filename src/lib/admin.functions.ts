import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin role required");
}

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: !!data, userId: context.userId };
  });

/* ---------- ORDERS ---------- */

export const listOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { status?: string; search?: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    let q = context.supabase
      .from("orders")
      .select(
        "id, order_number, customer_name, customer_phone, total_price, status, delivery_type, created_at, wilaya_id, city_id",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    if (data.search) {
      const s = `%${data.search}%`;
      q = q.or(
        `order_number.ilike.${s},customer_name.ilike.${s},customer_phone.ilike.${s}`,
      );
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { orders: rows ?? [] };
  });

export const getOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: order, error } = await context.supabase
      .from("orders")
      .select("*, wilaya:wilayas(name_ar,name_fr), city:cities(name_ar,name_fr)")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    const { data: history } = await context.supabase
      .from("order_status_history")
      .select("*")
      .eq("order_id", data.id)
      .order("created_at", { ascending: false });
    return { order, history: history ?? [] };
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: string; note?: string }) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum([
          "pending",
          "confirmed",
          "in_delivery",
          "delivered",
          "cancelled",
        ]),
        note: z.string().max(1000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: prev } = await context.supabase
      .from("orders")
      .select("status")
      .eq("id", data.id)
      .single();
    const { error } = await context.supabase
      .from("orders")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await context.supabase.from("order_status_history").insert({
      order_id: data.id,
      old_status: prev?.status ?? null,
      new_status: data.status,
      changed_by: context.userId,
      note: data.note ?? null,
    });
    return { ok: true };
  });

export const updateOrderNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; admin_notes: string }) =>
    z.object({ id: z.string().uuid(), admin_notes: z.string().max(2000) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("orders")
      .update({ admin_notes: data.admin_notes })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- APPOINTMENTS ---------- */

export const listAppointments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { status?: string; search?: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    let q = context.supabase
      .from("appointments")
      .select(
        "id, appointment_number, customer_name, customer_phone, preferred_date, confirmed_date, status, window_count, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    if (data.search) {
      const s = `%${data.search}%`;
      q = q.or(
        `appointment_number.ilike.${s},customer_name.ilike.${s},customer_phone.ilike.${s}`,
      );
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { appointments: rows ?? [] };
  });

export const getAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: appt, error } = await context.supabase
      .from("appointments")
      .select("*, wilaya:wilayas(name_ar,name_fr), city:cities(name_ar,name_fr)")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return { appointment: appt };
  });

export const updateAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      id: string;
      status?: string;
      confirmed_date?: string | null;
      admin_notes?: string;
      travel_cost?: number | null;
    }) =>
      z
        .object({
          id: z.string().uuid(),
          status: z
            .enum(["pending", "confirmed", "completed", "cancelled"])
            .optional(),
          confirmed_date: z.string().nullable().optional(),
          admin_notes: z.string().max(2000).optional(),
          travel_cost: z.number().nullable().optional(),
        })
        .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const patch: Record<string, unknown> = {};
    if (data.status !== undefined) patch.status = data.status;
    if (data.confirmed_date !== undefined) patch.confirmed_date = data.confirmed_date;
    if (data.admin_notes !== undefined) patch.admin_notes = data.admin_notes;
    if (data.travel_cost !== undefined) patch.travel_cost = data.travel_cost;
    const { error } = await (context.supabase.from("appointments") as any)
      .update(patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- DASHBOARD STATS ---------- */

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const sb = context.supabase;
    const [pendingOrders, todayOrders, pendingAppts, upcomingAppts] = await Promise.all([
      sb.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
      sb
        .from("orders")
        .select("id", { count: "exact", head: true })
        .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
      sb
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      sb
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("status", "confirmed")
        .gte("confirmed_date", new Date().toISOString().slice(0, 10)),
    ]);
    return {
      pendingOrders: pendingOrders.count ?? 0,
      todayOrders: todayOrders.count ?? 0,
      pendingAppointments: pendingAppts.count ?? 0,
      upcomingAppointments: upcomingAppts.count ?? 0,
    };
  });
