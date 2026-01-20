import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST() {
  // Only store owners can trigger (simple auth gate)
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get owner's store
  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_user_id", userData.user.id)
    .single();

  if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

  // Find expired pending orders for this store
  const now = new Date().toISOString();

  const { data: expiredOrders, error } = await supabaseAdmin
    .from("orders")
    .select("id")
    .eq("store_id", store.id)
    .eq("status", "pending")
    .lt("reserved_until", now);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  let released = 0;

  for (const o of expiredOrders ?? []) {
    const { data: items } = await supabaseAdmin
      .from("order_items")
      .select("product_id, quantity")
      .eq("order_id", o.id);

    if (items) {
      for (const item of items) {
        if (item.product_id) {
          await supabaseAdmin.rpc("release_stock", {
            p_product_id: item.product_id,
            p_qty: item.quantity,
          });
        }
      }
    }

    await supabaseAdmin.from("orders").update({ status: "expired" }).eq("id", o.id);
    released++;
  }

  return NextResponse.json({ ok: true, released });
}
