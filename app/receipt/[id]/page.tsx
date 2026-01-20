import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

function formatNaira(kobo: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(kobo / 100);
}

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id?: string }>;
}) {
  const { id } = await params;
  if (!id) return notFound();

  const supabase = await createServerSupabaseClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, total_kobo, customer_name, created_at, paid_at, store_id")
    .eq("id", id)
    .single();

  if (!order) return notFound();
  if (order.status !== "paid" && order.status !== "completed") return notFound();

  const { data: store } = await supabase
    .from("stores")
    .select("name, slug, whatsapp")
    .eq("id", order.store_id)
    .single();

  if (!store) return notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("id, product_name, quantity, price_each_kobo")
    .eq("order_id", order.id);

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-2xl px-4 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Receipt</h1>
            <p className="text-sm text-muted-foreground">
              From <span className="font-medium">{store.name}</span>
            </p>
          </div>

          <Button asChild variant="outline">
            <Link href={`/@${store.slug}`}>Back to store</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Order summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Order ID:</span> <span className="font-mono">{order.id}</span></div>
            <div><span className="text-muted-foreground">Customer:</span> {order.customer_name || "Customer"}</div>
            <div><span className="text-muted-foreground">Paid:</span> {order.paid_at ? new Date(order.paid_at).toLocaleString() : "—"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items?.length ? (
                  items.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell className="font-medium">{it.product_name}</TableCell>
                      <TableCell>{it.quantity}</TableCell>
                      <TableCell>{formatNaira(it.price_each_kobo)}</TableCell>
                      <TableCell className="text-right">
                        {formatNaira(it.price_each_kobo * it.quantity)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      No items.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="mt-4 flex justify-end text-sm">
              <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-10">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-semibold">{formatNaira(order.total_kobo)}</span>
                </div>
              </div>
            </div>

            {store.whatsapp ? (
              <div className="mt-4">
                <Button asChild className="w-full">
                  <a
                    href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                      `Hi ${store.name}, I’ve paid for order ${order.id}.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Contact store on WhatsApp
                  </a>
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center">
          Keep this receipt for your records.
        </p>
      </main>
    </div>
  );
}
