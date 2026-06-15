import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { getOrder, updateOrderStatus, updateOrderNotes } from "@/lib/admin.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/orders/$id")({
  ssr: false,
  component: OrderDetailPage,
});

const STATUSES = ["pending", "confirmed", "in_delivery", "delivered", "cancelled"] as const;

function OrderDetailPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const get = useServerFn(getOrder);
  const updateStatus = useServerFn(updateOrderStatus);
  const updateNotes = useServerFn(updateOrderNotes);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-order", id],
    queryFn: () => get({ data: { id } }),
  });

  const [status, setStatus] = useState<string>("");
  const [statusNote, setStatusNote] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    if (data?.order) {
      setStatus(data.order.status);
      setAdminNotes(data.order.admin_notes ?? "");
    }
  }, [data]);

  const statusMut = useMutation({
    mutationFn: () => updateStatus({ data: { id, status: status as any, note: statusNote || undefined } }),
    onSuccess: () => {
      toast.success("Status updated");
      setStatusNote("");
      qc.invalidateQueries({ queryKey: ["admin-order", id] });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const notesMut = useMutation({
    mutationFn: () => updateNotes({ data: { id, admin_notes: adminNotes } }),
    onSuccess: () => {
      toast.success("Notes saved");
      qc.invalidateQueries({ queryKey: ["admin-order", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading…</div>;
  if (!data?.order) return <div className="p-8">Not found.</div>;
  const o: any = data.order;
  const snap = o.product_snapshot ?? {};

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl">
      <Link to="/admin/orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold font-mono">{o.order_number}</h1>
          <p className="text-sm text-muted-foreground">Created {new Date(o.created_at).toLocaleString()}</p>
        </div>
        <Badge variant="secondary" className="capitalize">{o.status.replace("_", " ")}</Badge>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Name" value={o.customer_name} />
            <Row label="Phone" value={o.customer_phone} mono />
            {o.customer_email && <Row label="Email" value={o.customer_email} />}
            <Row label="Delivery" value={o.delivery_type} />
            {o.wilaya?.name_fr && <Row label="Wilaya" value={o.wilaya.name_fr} />}
            {o.city?.name_fr && <Row label="City" value={o.city.name_fr} />}
            {o.address && <Row label="Address" value={o.address} />}
            {o.notes && <Row label="Customer note" value={o.notes} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Product</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Product" value={snap.name_fr || snap.name_ar || "—"} />
            <Row label="Unit price" value={`${Number(o.unit_price).toLocaleString()} DA`} />
            <Row label="Quantity" value={String(o.quantity)} />
            <Row label="Total" value={`${Number(o.total_price).toLocaleString()} DA`} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Update status</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input
              placeholder="Optional note for history"
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
            />
            <Button onClick={() => statusMut.mutate()} disabled={statusMut.isPending || status === o.status}>
              {statusMut.isPending ? "Saving…" : "Save status"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Internal notes</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Textarea rows={4} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
          <Button onClick={() => notesMut.mutate()} disabled={notesMut.isPending}>
            {notesMut.isPending ? "Saving…" : "Save notes"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Status history</CardTitle></CardHeader>
        <CardContent>
          {data.history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No history yet.</p>
          ) : (
            <ul className="space-y-3">
              {data.history.map((h: any) => (
                <li key={h.id} className="flex gap-3 text-sm border-l-2 border-primary/40 pl-3">
                  <div className="flex-1">
                    <div>
                      <span className="text-muted-foreground">{h.old_status ?? "new"}</span>
                      {" → "}
                      <span className="font-medium">{h.new_status}</span>
                    </div>
                    {h.note && <div className="text-muted-foreground mt-1">{h.note}</div>}
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">{new Date(h.created_at).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono" : ""}>{value}</span>
    </div>
  );
}
