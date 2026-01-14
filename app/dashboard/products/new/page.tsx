import Link from "next/link";
import { createProduct } from "@/lib/products/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { getStoreForUser } from "@/lib/stores/actions";

export default async function NewProductPage() {
  const store = await getStoreForUser();
  if (!store) return null

  async function onSubmit(formData: FormData) {
    "use server";
    await createProduct(formData);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Add product</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <form action={onSubmit} className="grid gap-4">
            <input type="hidden" name="store_id" value={store.id} />

            <div className="grid gap-2">
              <Label htmlFor="name">Product name</Label>
              <Input id="name" name="name" required placeholder="iPhone 13 Pro Max" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="price">Price (NGN)</Label>
              <Input id="price" name="price" required placeholder="850000" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="stock_qty">Stock quantity</Label>
              <Input id="stock_qty" name="stock_qty" type="number" min={0} defaultValue={0} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Condition, warranty, accessories..." />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_active" defaultChecked />
              Active (show on storefront)
            </label>

            <div className="flex items-center gap-3">
              <Button type="submit">Create</Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/products">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
