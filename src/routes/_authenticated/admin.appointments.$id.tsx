import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { getAppointment, updateAppointment } from "@/lib/admin.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/appointments/$id")({
  ssr: false,
  component: AppointmentDetailPage,
});

const STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const;

function AppointmentDetailPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const get = useServerFn(getAppointment);
  const update = useServerFn(updateAppointment);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-appt", id],
    queryFn: () => get({ data: { id } }),
  });

  const [status, setStatus] = useState("");
  const [confirmedDate, setConfirmedDate] = useState("");
  const [travelCost, setTravelCost] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (data?.appointment) {
      const a: any = data.appointment;
      setStatus(a.status);
      setConfirmedDate(a.confirmed_date ?? "");
      setTravelCost(a.travel_cost?.toString() ?? "");
      setNotes(a.admin_notes ?? "");
    }
  }, [data]);

  const mut = useMutation({
    mutationFn: () =>
      update({
        data: {
          id,
          status: status as any,
          confirmed_date: confirmedDate || null,
          admin_notes: notes,
          travel_cost: travelCost === "" ? null : Number(travelCost),
        },
      }),
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin-appt", id] });
      qc.invalidateQueries({ queryKey: ["admin-appts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading…</div>;
  if (!data?.appointment) return <div className="p-8">Not found.</div>;
  const a: any = data.appointment;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      <Link to="/admin/appointments" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to appointments
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold font-mono">{a.appointment_number}</h1>
          <p className="text-sm text-muted-foreground">Created {new Date(a.created_at).toLocaleString()}</p>
        </div>
        <Badge variant="secondary" className="capitalize">{a.status}</Badge>
      </header>

      <Card>
        <CardHeader><CardTitle>Customer & request</CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <Row label="Name" value={a.customer_name} />
          <Row label="Phone" value={a.customer_phone} mono />
          {a.customer_email && <Row label="Email" value={a.customer_email} />}
          <Row label="Windows" value={String(a.window_count)} />
          <Row label="Preferred date" value={a.preferred_date} />
          {a.wilaya?.name_fr && <Row label="Wilaya" value={a.wilaya.name_fr} />}
          {a.city?.name_fr && <Row label="City" value={a.city.name_fr} />}
          {a.description && (
            <div className="sm:col-span-2">
              <div className="text-muted-foreground mb-1">Description</div>
              <div className="rounded border bg-muted/30 p-3 whitespace-pre-wrap">{a.description}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Manage</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Confirmed date</Label>
              <Input type="date" value={confirmedDate} onChange={(e) => setConfirmedDate(e.target.value)} />
            </div>
            <div>
              <Label>Travel cost (DA)</Label>
              <Input type="number" min="0" value={travelCost} onChange={(e) => setTravelCost(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Internal notes</Label>
            <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
            {mut.isPending ? "Saving…" : "Save changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className={mono ? "font-mono" : ""}>{value}</div>
    </div>
  );
}
