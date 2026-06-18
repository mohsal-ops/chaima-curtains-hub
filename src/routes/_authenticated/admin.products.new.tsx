import { createFileRoute, Link } from "@tanstack/react-router";
import { ProductForm } from "@/components/admin/ProductForm";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/products/new")({
  ssr: false,
  component: NewProductPage,
});

function NewProductPage() {
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      <div>
        <Link to="/admin/products" className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" /> Back to products
        </Link>
        <h1 className="text-2xl font-semibold mt-2">New product</h1>
      </div>
      <ProductForm />
    </div>
  );
}
