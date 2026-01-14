import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { updateProduct } from "@/lib/products/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

function koboToNairaString(kobo: number) {
  return String(kobo / 100);
}

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("id, store_id, name, description, price_kobo, stock_qty, is_active")
    .eq("id", params.id)
    .single();

  if (error || !product) {
    return (
      <Card>
        <CardHeader><CardTitle>Not found</CardTitle></CardHeader>
        <CardContent><Button asChild variant="outline"><Link href="/dashboard/products">Back</Link></Button></CardContent>
      </Card>
    );
  }

  const productId = product.id;

  async function onSave(formData: FormData) {
    "use server";
    await updateProduct(productId, formData);
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
            <p className="text-sm text-muted-foreground">
              Next step: we’ll add upload + preview here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
