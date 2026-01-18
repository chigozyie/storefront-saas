import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { paystackRequest } from "@/lib/paystack";

type CreateSubaccountResponse = {
  status: boolean;
  message: string;
  data: { subaccount_code: string };
};

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { store_id, business_name, bank_code, account_number, percentage_charge } = body;

  if (!store_id || !business_name || !bank_code || !account_number) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Confirm the store belongs to the logged-in user
  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("id", store_id)
    .eq("owner_user_id", userData.user.id)
    .single();

  if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

  const resp = await paystackRequest<CreateSubaccountResponse>("/subaccount", {
    method: "POST",
    json: {
        business_name,
        bank_code,
        account_number,
        percentage_charge: percentage_charge ?? 0,
    },
    });


  // Save subaccount_code on the store
  const { error } = await supabase
    .from("stores")
    .update({ paystack_subaccount_code: resp.data.subaccount_code })
    .eq("id", store_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, subaccount_code: resp.data.subaccount_code });
}
