"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getCart, clearCart, CartItem } from "@/lib/cart";

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

export default function CartCheckoutClient({
  storeSlug,
  handle,
}: {
  storeSlug: string;
  handle?: string;
}) {
  const handlePath = handle ?? `@${storeSlug}`;

  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    return getCart(storeSlug);
  });

  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [loadingPay, setLoadingPay] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setCart(getCart(storeSlug));
  }, [storeSlug]);

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
        setMsg(e?.message ?? "Could not load products");
      } finally {
        setLoadingProducts(false);
      }
    })();
  }, [cart, storeSlug]);

  const items = useMemo(() => {
    return cart.map((c) => {
      const p = products[c.product_id];
      const subtotal = p ? p.price_kobo * c.qty : 0;
      const valid = !!p && p.is_active && c.qty >= 1 && c.qty <= p.stock_qty;
      return { ...c, product: p ?? null, subtotal_kobo: subtotal, valid };
    });
  }, [cart, products]);

  const totalKobo = useMemo(() => items.reduce((s, it) => s + it.subtotal_kobo, 0), [items]);
  const hasInvalid = items.some((it) => !it.valid);
  const empty = cart.length === 0;

  async function pay() {
    setMsg(null);
    setLoadingPay(true);
    try {
      const fresh = getCart(storeSlug);
      if (!fresh.length) throw new Error("Cart is empty.");
      if (!email.trim()) throw new Error("Email is required.");

      // Revalidate with latest product data (simple safety)
      const resCheck = await fetch("/api/storefront/cart-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store_slug: storeSlug, product_ids: fresh.map((x) => x.product_id) }),
      });
      const checkJson = await resCheck.json();
      if (!resCheck.ok) throw new Error(checkJson?.error || "Could not validate cart");

      const checkMap: Record<string, Product> = {};
      for (const p of checkJson.products as Product[]) checkMap[p.id] = p;

      for (const it of fresh) {
        const p = checkMap[it.product_id];
        if (!p) throw new Error("A product in your cart no longer exists.");
        if (!p.is_active) throw new Error(`${p.name} is unavailable.`);
        if (it.qty > p.stock_qty) throw new Error(`${p.name}: quantity exceeds stock.`);
      }

      const res = await fetch("/api/paystack/initialize-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_slug: storeSlug,
          items: fresh,
          customer_email: email.trim(),
          customer_name: name.trim() || "Customer",
          customer_phone: phone.trim() || "",
          customer_address: address.trim() || "",
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to initialize payment");

      clearCart(storeSlug);
      window.location.href = json.authorization_url;
    } catch (e: any) {
      setMsg(e?.message ?? "Error");
    } finally {
      setLoadingPay(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Checkout</h1>
        <Button asChild variant="outline">
          <Link href={`/${handlePath}/cart`}>← Back to cart</Link>
        </Button>
      </div>

      {empty ? (
        <Card>
          <CardHeader>
            <CardTitle>Your cart is empty</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Add products to cart before checkout.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Order summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingProducts ? (
                <p className="text-sm text-muted-foreground">Loading items…</p>
              ) : null}

              {items.map((it) => (
                <div key={it.product_id} className="flex items-center justify-between gap-3 border-b pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 overflow-hidden rounded-md border bg-muted">
                      {it.product?.image_url ? (
                        <img src={it.product.image_url} alt={it.product.name} className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{it.product?.name ?? "Unknown product"}</div>
                      <div className="text-xs text-muted-foreground">
                        {it.product ? `${formatNaira(it.product.price_kobo)} × ${it.qty}` : "—"}
                      </div>
                      {!it.valid ? (
                        <div className="text-xs text-destructive mt-1">
                          {it.product
                            ? it.qty > it.product.stock_qty
                              ? "Qty exceeds stock"
                              : !it.product.is_active
                              ? "Unavailable"
                              : "Invalid"
                            : "Missing product"}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="text-sm font-medium">{formatNaira(it.subtotal_kobo)}</div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-lg font-semibold">{formatNaira(totalKobo)}</span>
              </div>

              {hasInvalid ? (
                <p className="text-sm text-destructive">Fix invalid items in cart before checkout.</p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
              </div>

              <div className="grid gap-2">
                <Label>Name (optional)</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>

              <div className="grid gap-2">
                <Label>Phone (optional)</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234..." />
              </div>

              <div className="grid gap-2">
                <Label>Delivery address (optional)</Label>
                <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, city, landmark..." />
              </div>

              {msg ? <p className="text-sm text-destructive">{msg}</p> : null}

              <Button
                onClick={pay}
                disabled={loadingPay || loadingProducts || hasInvalid}
                className="w-full"
              >
                {loadingPay ? "Redirecting..." : "Pay with Paystack"}
              </Button>

              <p className="text-xs text-muted-foreground">
                You’ll be redirected to Paystack to complete payment.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
