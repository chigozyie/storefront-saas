import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { updateProduct } from "@/lib/products/actions";
import ProductImageManager from "@/components/products/ProductImageManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

function koboToNairaString(kobo: number) {
  return String(kobo / 100);
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("id, store_id, name, description, price_kobo, stock_qty, is_active")
    .eq("id", id)
    .single();

  if (error || !product) {
    return (
      <Card>
        <CardHeader><CardTitle>Not found</CardTitle></CardHeader>
        <CardContent><Button asChild variant="outline"><Link href="/dashboard/products">Back</Link></Button></CardContent>
      </Card>
    );
  }
  const { data: images } = await supabase
    .from("product_images")
    .select("id, image_url, sort_order")
    .eq("product_id", product.id)
    .order("sort_order", { ascending: true });

  const productId = product.id;

  async function onSave(formData: FormData) {
    "use server";
    const result = await updateProduct(productId, formData);
    if (result.ok) {
      redirect("/dashboard/products");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Edit product</h1>
          <p className="text-sm text-muted-foreground">Update details and images.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/products">Back</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={onSave} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Product name</Label>
                <Input id="name" name="name" defaultValue={product.name} required />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="price">Price (NGN)</Label>
                <Input id="price" name="price" defaultValue={koboToNairaString(product.price_kobo)} required />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="stock_qty">Stock quantity</Label>
                <Input
                  id="stock_qty"
                  name="stock_qty"
                  type="number"
                  min={0}
                  defaultValue={product.stock_qty}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={product.description ?? ""} />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="is_active" defaultChecked={product.is_active} />
                Active (show on storefront)
              </label>

              <Button type="submit">Save</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductImageManager productId={product.id} initialImages={images ?? []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
