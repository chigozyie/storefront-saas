import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";

function normalizeHandle(handle?: string) {
  if (!handle) return null;

  // decode %40 -> @ and any other encoded characters
  const decoded = decodeURIComponent(handle);

  return decoded.startsWith("@") ? decoded.slice(1) : decoded;
}

function formatNaira(priceKobo: number) {
  const naira = priceKobo / 100;
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(naira);
}

export default async function StorefrontPage({ 
    params,
}: { 
    params: Promise<{ handle?: string }>;
}) {
    const { handle } = await params;

  const supabase = await createServerSupabaseClient();
  const slug = normalizeHandle(handle);
  if (!slug) return notFound();

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, slug, description, whatsapp, address")
    .eq("slug", slug)
    .single();

  if (!store) return notFound();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, price_kobo, stock_qty, is_active, product_images(image_url, sort_order)")
    .eq("store_id", store.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-background">
      <header className=" border-b">
        <div className="relative mx-auto max-w-5xl px-4 py-6 space-y-1">
          <h1 className="text-2xl font-semibold">{store.name}</h1>
          <p className="text-sm text-muted-foreground">@{store.slug}</p>

          {store.description ? (
            <p className="text-sm text-muted-foreground">{store.description}</p>
          ) : null}

          <div className="text-sm text-muted-foreground">
            {store.address ? <span>{store.address}</span> : null}
            {store.address && store.whatsapp ? <span> • </span> : null}
            {store.whatsapp ? <span>WhatsApp: {store.whatsapp}</span> : null}
          </div>

          <div className="absolute top-6 right-4">
            <Button asChild variant="outline" size="sm">
              <Link href={`/@${store.slug}/cart`}
                className="flex items-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="sr-only">Cart</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {!products?.length ? (
          <Card>
            <CardHeader>
              <CardTitle>No products yet</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              This store hasn’t added products yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p: any) => {
              const firstImage =
                p.product_images
                  ?.sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))?.[0]
                  ?.image_url ?? null;

              return (
                <Card key={p.id} className="overflow-hidden">
                  <div className="aspect-square bg-muted">
                    {firstImage ? (
                      <img
                        src={firstImage}
                        alt={p.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : null}
                  </div>

                  <CardHeader className="space-y-1">
                    <CardTitle className="text-base">{p.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{formatNaira(p.price_kobo)}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.stock_qty > 0 ? `${p.stock_qty} in stock` : "Out of stock"}
                    </p>
                  </CardHeader>

                  <CardContent className="flex items-center justify-between">
                    <Button asChild size="sm">
                      <Link href={`/@${store.slug}/products/${p.slug}`}>View</Link>
                    </Button>

                    {store.whatsapp ? (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                      >
                        <a
                          href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                            `Hi ${store.name}, I’m interested in: ${p.name}`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          WhatsApp
                        </a>
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
