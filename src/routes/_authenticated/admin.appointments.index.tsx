import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { listAppointments } from "@/lib/admin.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const STATUSES = ["all", "pending", "confirmed", "completed", "cancelled"] as const;

export const Route = createFileRoute("/_authenticated/admin/appointments/")({
  ssr: false,
  validateSearch: z.object({
    status: z.enum(STATUSES).optional().default("all"),
    q: z.string().optional().default(""),
  }),
  component: AppointmentsListPage,
});

const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-900",
  confirmed: "bg-blue-100 text-blue-900",
  completed: "bg-green-100 text-green-900",
  cancelled: "bg-red-100 text-red-900",
};

function AppointmentsListPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const fn = useServerFn(listAppointments);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-appts", search.status, search.q],
    queryFn: () => fn({ data: { status: search.status, search: search.q || undefined } }),
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Appointments</h1>
        <p className="text-sm text-muted-foreground">{data?.appointments.length ?? 0} results</p>
      </header>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <CardTitle className="text-base">Filter</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              placeholder="Search number, name, phone…"
              defaultValue={search.q}
              className="sm:w-64"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  navigate({ to: "/admin/appointments", search: (p) => ({ ...p, q: (e.target as HTMLInputElement).value }) });
                }
              }}
            />
            <Select
              value={search.status}
              onValueChange={(v) => navigate({ to: "/admin/appointments", search: (p) => ({ ...p, status: v as any }) })}
            >
              <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s === "all" ? "All statuses" : s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Windows</TableHead>
                <TableHead>Preferred date</TableHead>
                <TableHead>Confirmed</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>
              )}
              {!isLoading && (data?.appointments.length ?? 0) === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No appointments.</TableCell></TableRow>
              )}
              {data?.appointments.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-xs">
                    <Link to="/admin/appointments/$id" params={{ id: a.id }} className="text-primary hover:underline">
                      {a.appointment_number}
                    </Link>
                  </TableCell>
                  <TableCell>{a.customer_name}</TableCell>
                  <TableCell className="font-mono text-xs">{a.customer_phone}</TableCell>
                  <TableCell>{a.window_count}</TableCell>
                  <TableCell className="text-xs">{a.preferred_date}</TableCell>
                  <TableCell className="text-xs">{a.confirmed_date ?? "—"}</TableCell>
                  <TableCell>
                    <Badge className={statusColor[a.status] || ""} variant="secondary">{a.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
