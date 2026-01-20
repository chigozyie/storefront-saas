"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCart, removeFromCart, updateQty, clearCart, CartItem } from "@/lib/cart";

type Product = {
  id: string;
  name: string;
  price_kobo: number;
  stock_qty: number;
  is_active: boolean;
  image_url: string | null;
};

function formatNaira(kobo: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(kobo / 100);
}

export default function CartClient({
  storeSlug,
  handle,
}: {
  storeSlug: string;
  handle?: string;
}) {
  const handlePath = handle ?? `@${storeSlug}`;

  const [cart, setCartState] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    return getCart(storeSlug);
  });

  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // reload cart from localStorage (good for back/forward)
  useEffect(() => {
    setCartState(getCart(storeSlug));
  }, [storeSlug]);

  // fetch product details for cart items
  useEffect(() => {
    (async () => {
      setMsg(null);
      const ids = cart.map((c) => c.product_id);
      if (!ids.length) {
        setProducts({});
        return;
      }

      setLoadingProducts(true);
      try {
        const res = await fetch("/api/storefront/cart-products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ store_slug: storeSlug, product_ids: ids }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load products");

        const map: Record<string, Product> = {};
        for (const p of json.products as Product[]) map[p.id] = p;
        setProducts(map);
      } catch (e: any) {
        setMsg(e?.message ?? "Could not load cart products");
      } finally {
        setLoadingProducts(false);
      }
    })();
  }, [cart, storeSlug]);

  const enrichedItems = useMemo(() => {
    return cart.map((c) => {
      const p = products[c.product_id];
      return {
        ...c,
        product: p ?? null,
        subtotal_kobo: p ? p.price_kobo * c.qty : 0,
        valid:
          !!p && p.is_active && c.qty >= 1 && c.qty <= p.stock_qty,
      };
    });
  }, [cart, products]);

  const grandTotalKobo = useMemo(
    () => enrichedItems.reduce((sum, it) => sum + it.subtotal_kobo, 0),
    [enrichedItems]
  );

  const hasItems = cart.length > 0;
  const hasInvalid = enrichedItems.some((it) => !it.valid);
  
  const checkoutDisabled = loadingProducts || hasInvalid || !hasItems;

  return (
    <div className="mx-auto max-w-3xl py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cart</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/${handlePath}`}>Back to store</Link>
          </Button>
          {hasItems ? (
            <Button
              variant="outline"
              onClick={() => {
                clearCart(storeSlug);
                setCartState([]);
              }}
            >
              Clear cart
            </Button>
          ) : null}
        </div>
      </div>

      {!hasItems ? (
        <Card>
          <CardHeader>
            <CardTitle>Your cart is empty</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Add products to cart to checkout.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-3">
            {msg ? (
              <Card>
                <CardContent className="py-4 text-sm text-destructive">{msg}</CardContent>
              </Card>
            ) : null}

            {loadingProducts ? (
              <Card>
                <CardContent className="py-6 text-sm text-muted-foreground">
                  Loading cart items…
                </CardContent>
              </Card>
            ) : null}

            {enrichedItems.map((it) => {
              const p = it.product;

              return (
                <Card key={it.product_id}>
                  <CardContent className="py-4">
                    <div className="flex gap-4">
                      <div className="h-20 w-20 overflow-hidden rounded-md border bg-muted shrink-0">
                        {p?.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : null}
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium">
                              {p ? p.name : "Product not found"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {p ? formatNaira(p.price_kobo) : "—"}
                            </div>
                          </div>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              removeFromCart(storeSlug, it.product_id);
                              setCartState(getCart(storeSlug));
                            }}
                          >
                            Remove
                          </Button>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Qty</span>
                            <Input
                              type="number"
                              className="w-24"
                              min={1}
                              max={p?.stock_qty}
                              value={it.qty}
                              onChange={(e) => {
                                const value = Number(e.target.value || 1);
                                const min = 1;
                                const max = p?.stock_qty ?? Infinity;

                                const clamped = Math.min(max, Math.max(min, value));

                                updateQty(storeSlug, it.product_id, clamped);
                                setCartState(getCart(storeSlug));
                              }}
                            />

                            {p ? (
                              <span className="text-xs text-muted-foreground">
                                {p.stock_qty} in stock
                              </span>
                            ) : null}
                          </div>
                          
                          {p && it.qty === p.stock_qty && (
                            <span className="text-xs text-muted-foreground">
                              Max available quantity reached
                            </span>
                          )}

                          <div className="text-sm">
                            <span className="text-muted-foreground">Subtotal: </span>
                            <span className="font-medium">{formatNaira(it.subtotal_kobo)}</span>
                          </div>
                        </div>

                        {!it.valid ? (
                          <p className="text-sm text-destructive pt-2">
                            {p
                              ? it.qty > p.stock_qty
                                ? "Quantity exceeds available stock."
                                : !p.is_active
                                ? "This product is unavailable."
                                : "Item invalid."
                              : "This product no longer exists."}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="space-y-3">
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Items</span>
                  <span className="font-medium">{cart.length}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-semibold">{formatNaira(grandTotalKobo)}</span>
                </div>

                {checkoutDisabled ? (
                  <Button className="w-full" disabled>
                    Checkout
                  </Button>
                ) : (
                  <Button asChild className="w-full">
                    <Link href={`/${handlePath}/checkout/cart`}>
                      Checkout
                    </Link>
                  </Button>
                )}

                {hasInvalid ? (
                  <p className="text-xs text-destructive">
                    Fix invalid items before checkout.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    You’ll confirm delivery details on the next page.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
