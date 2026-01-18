import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

function formatNaira(kobo: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(kobo / 100);
}

export default async function OrdersPage() {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data: stores } = await supabase
    .from("stores")
    .select("id, name, slug")
    .eq("owner_user_id", userData.user.id)
    .limit(1);

  const store = stores?.[0];
  if (!store) return null;

  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, total_kobo, customer_name, customer_phone, customer_email, created_at")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Orders</h1>
          <p className="text-sm text-muted-foreground">
            Latest orders for <span className="font-medium">{store.name}</span>
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/@${store.slug}`}>View storefront</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Contact</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {orders?.length ? (
                orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(o.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium">{o.customer_name}</TableCell>
                    <TableCell>{o.status}</TableCell>
                    <TableCell>{formatNaira(o.total_kobo)}</TableCell>
                    <TableCell className="text-sm">
                      {o.customer_phone ? <div>{o.customer_phone}</div> : null}
                      {o.customer_email ? <div className="text-muted-foreground">{o.customer_email}</div> : null}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No orders yet.
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
