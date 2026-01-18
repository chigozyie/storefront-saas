"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function formatNaira(kobo: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(kobo / 100);
}

export default function CheckoutClient({
  store,
  product,
}: {
  store: { name: string; slug: string };
  product: { id: string; name: string; price_kobo: number; stock_qty: number; image_url: string | null };
}) {
  const [qty, setQty] = useState(1);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const totalKobo = useMemo(() => product.price_kobo * qty, [product.price_kobo, qty]);

  async function pay() {
    setMsg(null);
    setLoading(true);
    try {
      if (!email.trim()) throw new Error("Email is required.");
      if (!Number.isInteger(qty) || qty < 1) throw new Error("Invalid quantity.");
      if (qty > product.stock_qty) throw new Error("Quantity exceeds stock.");

      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          quantity: qty,
          customer_email: email.trim(),
          customer_name: name.trim() || "Customer",
          customer_phone: phone.trim() || "",
          customer_address: address.trim() || "",
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to initialize payment");

      window.location.href = json.authorization_url;
    } catch (e: any) {
      setMsg(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/@${store.slug}`}>← Back</Link>
          </Button>
          <div className="text-sm text-muted-foreground">{store.name}</div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <div className="aspect-square bg-muted">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
              ) : null}
            </div>
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">{product.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {formatNaira(product.price_kobo)} • {product.stock_qty} in stock
              </p>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="qty">Quantity</Label>
                <Input
                  id="qty"
                  type="number"
                  min={1}
                  max={product.stock_qty}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Math.min(product.stock_qty, Number(e.target.value))))}
                  className="w-28"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium">{formatNaira(totalKobo)}</span>
              </div>
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

              <Button onClick={pay} disabled={loading} className="w-full">
                {loading ? "Redirecting..." : "Pay with Paystack"}
              </Button>

              <p className="text-xs text-muted-foreground">
                After payment, you’ll be redirected back to confirm your order.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
