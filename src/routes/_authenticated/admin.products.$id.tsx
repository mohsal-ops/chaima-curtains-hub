import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdminProduct } from "@/lib/admin.functions";
import { ProductForm } from "@/components/admin/ProductForm";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/products/$id")({
  ssr: false,
  component: EditProductPage,
});

function EditProductPage() {
  const { id } = Route.useParams();
  const fn = useServerFn(getAdminProduct);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-product", id],
    queryFn: () => fn({ data: { id } }),
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      <div>
        <Link to="/admin/products" className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" /> Back to products
        </Link>
        <h1 className="text-2xl font-semibold mt-2">Edit product</h1>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : error ? (
        <p className="text-sm text-destructive">{(error as Error).message}</p>
      ) : data?.product ? (
        <ProductForm initial={{ ...data.product, price: Number(data.product.price) }} />
      ) : null}
    </div>
  );
}
