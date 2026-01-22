import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AutoDisableToggle from "@/components/AutoDisableToggle";

function formatNaira(priceKobo: number) {
  const naira = priceKobo / 100;
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(naira);
}

export default async function ProductsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return (
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader><CardTitle>Please login</CardTitle></CardHeader>
          <CardContent><Button asChild><Link href="/login">Login</Link></Button></CardContent>
        </Card>
      </div>
    );
  }

  const { data: stores } = await supabase
    .from("stores")
    .select("id, name, slug")
    .eq("owner_user_id", userData.user.id)
    .limit(1);

  const store = stores?.[0];
  if (!store) {
    return (
      <Card>
        <CardHeader><CardTitle>No store found</CardTitle></CardHeader>
        <CardContent>
          <Button asChild><Link href="/dashboard/create-store">Create store</Link></Button>
        </CardContent>
      </Card>
    );
  }

  const { data: products } = await supabase
    .from("products")
    .select("id, name, price_kobo, stock_qty, is_active, auto_disable_on_oos, created_at, product_images(image_url, sort_order)")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage products for <span className="font-medium">{store.name}</span>
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/products/new">Add product</Link>
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Product list</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Auto-disable</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products?.length ? (
                products.map((p) => {
                  const firstImage =
                    (p as any).product_images
                      ?.sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))?.[0]
                      ?.image_url ?? null;

                  return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="h-10 w-10 overflow-hidden rounded-md border bg-muted">
                        {firstImage ? (
                          <img
                            src={firstImage}
                            alt=""
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{formatNaira(p.price_kobo)}</TableCell>
                    <TableCell>{p.stock_qty}</TableCell>
                    <TableCell>{p.is_active ? "Active" : "Hidden"}</TableCell>

                    <TableCell>
                      <AutoDisableToggle
                        productId={p.id}
                        initial={(p as any).auto_disable_on_oos ?? false}
                      />
                    </TableCell>

                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/products/${p.id}/edit`}>Edit</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground">
                    No products yet. Click “Add product”.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
