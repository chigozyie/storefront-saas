import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ConnectPaystackForm from "./paystack-form";

export default async function PaymentsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data: stores } = await supabase
    .from("stores")
    .select("id, name, paystack_subaccount_code")
    .eq("owner_user_id", userData.user.id)
    .limit(1);

  const store = stores?.[0];
  if (!store) return null;

  return (
    <div className="max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Connect Paystack so customers can pay on your storefront.
          </p>

          {store.paystack_subaccount_code ? (
            <p className="text-sm">
              ✅ Connected: <span className="font-mono">{store.paystack_subaccount_code}</span>
            </p>
          ) : (
            <ConnectPaystackForm storeId={store.id} businessName={store.name} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
