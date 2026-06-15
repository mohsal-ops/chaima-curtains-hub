import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { listOrders } from "@/lib/admin.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const ORDER_STATUSES = ["all", "pending", "confirmed", "in_delivery", "delivered", "cancelled"] as const;

export const Route = createFileRoute("/_authenticated/admin/orders/")({
  ssr: false,
  validateSearch: z.object({
    status: z.enum(ORDER_STATUSES).optional().default("all"),
    q: z.string().optional().default(""),
  }),
  component: OrdersListPage,
});

const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-900",
  confirmed: "bg-blue-100 text-blue-900",
  in_delivery: "bg-purple-100 text-purple-900",
  delivered: "bg-green-100 text-green-900",
  cancelled: "bg-red-100 text-red-900",
};

function OrdersListPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const fn = useServerFn(listOrders);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", search.status, search.q],
    queryFn: () => fn({ data: { status: search.status, search: search.q || undefined } }),
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Orders</h1>
        <p className="text-sm text-muted-foreground">{data?.orders.length ?? 0} results</p>
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
                  navigate({ to: "/admin/orders", search: (p) => ({ ...p, q: (e.target as HTMLInputElement).value }) });
                }
              }}
            />
            <Select
              value={search.status}
              onValueChange={(v) => navigate({ to: "/admin/orders", search: (p) => ({ ...p, status: v as any }) })}
            >
              <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s === "all" ? "All statuses" : s.replace("_", " ")}</SelectItem>
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
                <TableHead>Total</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>
              )}
              {!isLoading && (data?.orders.length ?? 0) === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No orders.</TableCell></TableRow>
              )}
              {data?.orders.map((o: any) => (
                <TableRow key={o.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-mono text-xs">
                    <Link to="/admin/orders/$id" params={{ id: o.id }} className="text-primary hover:underline">
                      {o.order_number}
                    </Link>
                  </TableCell>
                  <TableCell>{o.customer_name}</TableCell>
                  <TableCell className="font-mono text-xs">{o.customer_phone}</TableCell>
                  <TableCell>{Number(o.total_price).toLocaleString()} DA</TableCell>
                  <TableCell className="capitalize">{o.delivery_type}</TableCell>
                  <TableCell>
                    <Badge className={statusColor[o.status] || ""} variant="secondary">{o.status.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
