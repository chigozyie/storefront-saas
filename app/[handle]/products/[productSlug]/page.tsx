import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AddToCartButton from "@/components/AddToCartButton";

function normalizeHandle(handle?: string) {
  if (!handle) return null;
  const decoded = decodeURIComponent(handle);
  return decoded.startsWith("@") ? decoded.slice(1) : decoded;
}


function formatNaira(priceKobo: number) {
  const naira = priceKobo / 100;
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(naira);
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ handle?: string; productSlug?: string }>;
}) {
  const { handle, productSlug } = await params;
  const supabase = await createServerSupabaseClient();
  const storeSlug = normalizeHandle(handle);
  if (!storeSlug || !productSlug) return notFound();

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, slug, whatsapp")
    .eq("slug", storeSlug)
    .single();

  if (!store) return notFound();

  const { data: product } = await supabase
    .from("products")
    .select("id, name, slug, description, price_kobo, stock_qty, is_active")
    .eq("store_id", store.id)
    .eq("slug", productSlug)
    .eq("is_active", true)
    .single();

  if (!product) return notFound();

  const { data: images } = await supabase
    .from("product_images")
    .select("id, image_url, sort_order")
    .eq("product_id", product.id)
    .order("sort_order", { ascending: true });

  const mainImage = images?.[0]?.image_url ?? null;
  const outOfStock = product.stock_qty <= 0;


  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/@${store.slug}`}>← Back to store</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <div className="aspect-square bg-muted">
              {mainImage ? (
                <img src={mainImage} alt={product.name} className="h-full w-full object-cover" />
              ) : null}
            </div>
            {images?.length ? (
              <CardContent className="grid grid-cols-4 gap-2 p-4">
                {images.slice(0, 8).map((img) => (
                  <div key={img.id} className="aspect-square overflow-hidden rounded-md border bg-muted">
                    <img src={img.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </div>
                ))}
              </CardContent>
            ) : null}
          </Card>

          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-semibold">{product.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{formatNaira(product.price_kobo)}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {product.stock_qty > 0 ? `${product.stock_qty} in stock` : "Out of stock"}
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground whitespace-pre-wrap">
                {product.description || "No description provided."}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              {outOfStock && (
                <div className="text-sm text-destructive font-medium">Out of stock</div>
              )}
              <AddToCartButton storeSlug={store.slug} productId={product.id} disabled={outOfStock} />

              {outOfStock ? (
                <Button disabled>
                  Buy now
                </Button>
              ) : (
                <Button asChild>
                  <Link href={`/${handle}/checkout?product=${product.id}`}>Buy now</Link>
                </Button>
              )}

              <Button variant="outline" asChild>
                <Link href={`/@${store.slug}`}>Continue shopping</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
