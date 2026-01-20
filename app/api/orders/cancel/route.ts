import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { order_id } = await req.json();
  if (!order_id) return NextResponse.json({ error: "Missing order_id" }, { status: 400 });

  // Ensure this order belongs to the logged-in user's store
  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_user_id", userData.user.id)
    .single();

  if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, status")
    .eq("id", order_id)
    .eq("store_id", store.id)
    .single();

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status !== "pending") {
    return NextResponse.json({ error: "Only pending orders can be cancelled" }, { status: 400 });
  }

  // Get items then release stock
  const { data: items } = await supabaseAdmin
    .from("order_items")
    .select("product_id, quantity")
    .eq("order_id", order.id);

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

  // Mark cancelled
  await supabaseAdmin.from("orders").update({ status: "cancelled" }).eq("id", order.id);

  return NextResponse.json({ ok: true });
}
