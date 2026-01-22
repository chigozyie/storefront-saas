import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import OrderActions from "@/components/OrderActions";

function formatNaira(kobo: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(kobo / 100);
}

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id?: string }>;
}) {
  const { id } = await params;
  if (!id) return notFound();

  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return notFound();

  // Ensure the order belongs to this user's store
  const { data: store } = await supabase
    .from("stores")
    .select("id, name, slug")
    .eq("owner_user_id", userData.user.id)
    .single();

  if (!store) return notFound();

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, status, total_kobo, customer_name, customer_phone, customer_email, customer_address, created_at, paid_at, paystack_reference, reserved_until, completed_at, refunded_at"
    )
    .eq("id", id)
    .eq("store_id", store.id)
    .single();

  if (!order) return notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("id, product_name, quantity, price_each_kobo, product_id")
    .eq("order_id", order.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Order</h1>
          <p className="text-sm text-muted-foreground">
            Store: <span className="font-medium">{store.name}</span>
          </p>
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/orders">← Back</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/@${store.slug}`}>Storefront</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Name:</span> {order.customer_name || "—"}</div>
            <div><span className="text-muted-foreground">Email:</span> {order.customer_email || "—"}</div>
            <div><span className="text-muted-foreground">Phone:</span> {order.customer_phone || "—"}</div>
            <div>
              <span className="text-muted-foreground">Address:</span>{" "}
              <span className="whitespace-pre-wrap">{order.customer_address || "—"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="pt-3">
              <OrderActions orderId={order.id} currentStatus={order.status} />
            </div>

            <div><span className="text-muted-foreground">Status:</span> {order.status}</div>
            <div><span className="text-muted-foreground">Total:</span> {formatNaira(order.total_kobo)}</div>
            <div><span className="text-muted-foreground">Created:</span> {new Date(order.created_at).toLocaleString()}</div>
            <div>
              <span className="text-muted-foreground">Paid:</span>{" "}
              {order.paid_at ? new Date(order.paid_at).toLocaleString() : "—"}
            </div>

            <div>
              <span className="text-muted-foreground">Completed:</span>{" "}
              {order.completed_at ? new Date(order.completed_at).toLocaleString() : "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Refunded:</span>{" "}
              {order.refunded_at ? new Date(order.refunded_at).toLocaleString() : "—"}
            </div>

            <div>
              <span className="text-muted-foreground">Paystack ref:</span>{" "}
              {order.paystack_reference ? <span className="font-mono">{order.paystack_reference}</span> : "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Reserved until:</span>{" "}
              {order.reserved_until ? new Date(order.reserved_until).toLocaleString() : "—"}
            </div>
          </CardContent>
        </Card>
      </div>

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
        </CardContent>
      </Card>
    </div>
  );
}
