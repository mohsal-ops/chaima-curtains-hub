import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { upsertProduct, listCategories } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, GripVertical } from "lucide-react";

type Image = { url: string; sort_order: number };

interface Props {
  initial?: {
    id?: string;
    name_fr?: string;
    name_ar?: string;
    slug?: string;
    description_fr?: string | null;
    description_ar?: string | null;
    price?: number;
    category_id?: string | null;
    is_active?: boolean;
    is_featured?: boolean;
    sort_order?: number;
    images?: { url: string; sort_order: number }[];
  };
}

function slugify(s: string) {
  return s.toLowerCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

export function ProductForm({ initial }: Props) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const upsert = useServerFn(upsertProduct);
  const catsFn = useServerFn(listCategories);
  const { data: catData } = useQuery({ queryKey: ["admin-categories"], queryFn: () => catsFn() });

  const [nameFr, setNameFr] = useState(initial?.name_fr ?? "");
  const [nameAr, setNameAr] = useState(initial?.name_ar ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!initial?.slug);
  const [descFr, setDescFr] = useState(initial?.description_fr ?? "");
  const [descAr, setDescAr] = useState(initial?.description_ar ?? "");
  const [price, setPrice] = useState<string>(initial?.price?.toString() ?? "0");
  const [categoryId, setCategoryId] = useState<string>(initial?.category_id ?? "");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [isFeatured, setIsFeatured] = useState(initial?.is_featured ?? false);
  const [sortOrder, setSortOrder] = useState<string>((initial?.sort_order ?? 0).toString());
  const [images, setImages] = useState<Image[]>(initial?.images?.sort((a, b) => a.sort_order - b.sort_order) ?? []);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(nameFr));
  }, [nameFr, slugTouched]);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const next: Image[] = [...images];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("product-images").upload(path, file, {
          contentType: file.type, upsert: false,
        });
        if (error) throw error;
        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        next.push({ url: data.publicUrl, sort_order: next.length });
      }
      setImages(next);
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function removeImage(idx: number) {
    setImages(images.filter((_, i) => i !== idx).map((img, i) => ({ ...img, sort_order: i })));
  }

  function move(idx: number, dir: -1 | 1) {
    const j = idx + dir;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[idx], next[j]] = [next[j], next[idx]];
    setImages(next.map((img, i) => ({ ...img, sort_order: i })));
  }

  const mut = useMutation({
    mutationFn: () => upsert({
      data: {
        id: initial?.id,
        name_fr: nameFr, name_ar: nameAr, slug,
        description_fr: descFr || null, description_ar: descAr || null,
        price: Number(price) || 0,
        category_id: categoryId || null,
        is_active: isActive, is_featured: isFeatured,
        sort_order: Number(sortOrder) || 0,
        images,
      } as any,
    }),
    onSuccess: () => {
      toast.success(initial?.id ? "Product updated" : "Product created");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      navigate({ to: "/admin/products" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Name (Français) *</Label>
                <Input value={nameFr} onChange={(e) => setNameFr(e.target.value)} required maxLength={200} />
              </div>
              <div className="space-y-1.5">
                <Label>Name (العربية) *</Label>
                <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} required maxLength={200} dir="rtl" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Slug *</Label>
              <Input value={slug} onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }} required pattern="[a-z0-9-]+" />
              <p className="text-xs text-muted-foreground">Used in the URL. Lowercase letters, numbers and dashes only.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Description (Français)</Label>
                <Textarea rows={4} value={descFr} onChange={(e) => setDescFr(e.target.value)} maxLength={5000} />
              </div>
              <div className="space-y-1.5">
                <Label>Description (العربية)</Label>
                <Textarea rows={4} value={descAr} onChange={(e) => setDescAr(e.target.value)} maxLength={5000} dir="rtl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Price (DA) *</Label>
              <Input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={categoryId || "none"} onValueChange={(v) => setCategoryId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {catData?.categories.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name_fr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Sort order</Label>
              <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
            </div>
            <div className="flex items-center justify-between pt-2">
              <Label htmlFor="active" className="flex flex-col">
                <span>Active</span>
                <span className="text-xs text-muted-foreground font-normal">Visible on storefront</span>
              </Label>
              <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="featured" className="flex flex-col">
                <span>Featured</span>
                <span className="text-xs text-muted-foreground font-normal">Highlight on home</span>
              </Label>
              <Switch id="featured" checked={isFeatured} onCheckedChange={setIsFeatured} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Images</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-md px-4 py-8 cursor-pointer hover:bg-muted/50 transition">
            <Upload className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {uploading ? "Uploading…" : "Click to upload images (you can pick multiple)"}
            </span>
            <input
              type="file" accept="image/*" multiple className="hidden"
              disabled={uploading}
              onChange={(e) => { handleUpload(e.target.files); e.target.value = ""; }}
            />
          </label>
          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {images.map((img, i) => (
                <div key={img.url} className="relative group border rounded-md overflow-hidden bg-muted">
                  <img src={img.url} alt="" className="w-full aspect-square object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <div className="absolute bottom-1 left-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button type="button" onClick={() => move(i, -1)} className="flex-1 bg-black/60 text-white text-xs rounded px-1">←</button>
                    <span className="bg-black/60 text-white text-xs rounded px-2 flex items-center"><GripVertical className="h-3 w-3" />{i + 1}</span>
                    <button type="button" onClick={() => move(i, 1)} className="flex-1 bg-black/60 text-white text-xs rounded px-1">→</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={() => navigate({ to: "/admin/products" })}>Cancel</Button>
        <Button type="submit" disabled={mut.isPending || uploading}>
          {mut.isPending ? "Saving…" : initial?.id ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}
