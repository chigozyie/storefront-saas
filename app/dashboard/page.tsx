import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return (
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>You’re not logged in</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Please sign in to continue.</p>
            <Button asChild className="w-full">
              <Link href="/login">Go to login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: stores } = await supabase
    .from("stores")
    .select("id, name, slug")
    .eq("owner_user_id", userData.user.id);

  const hasStore = (stores?.length || 0) > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Manage your store, products, and orders.</p>
      </div>

      {!hasStore ? (
        <Card>
          <CardHeader>
            <CardTitle>Create your store</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You haven’t created a store yet. Create one to start listing products.
            </p>
            <Button asChild>
              <Link href="/dashboard/create-store">Create store</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your store</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-2">
              {stores!.map((s) => (
                <li key={s.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-sm text-muted-foreground">@{s.slug}</div>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href={`/@${s.slug}`}>View storefront</Link>
                  </Button>
                </li>
              ))}
            </ul>

            <div className="pt-2">
              <Button asChild>
                <Link href="/dashboard/products">Manage products</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/orders">View orders</Link>
              </Button>

            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
