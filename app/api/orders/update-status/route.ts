import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const ALLOWED = new Set(["completed", "refunded"]);

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { order_id, status } = body as { order_id?: string; status?: string };

  if (!order_id || !status) {
    return NextResponse.json({ error: "Missing order_id or status" }, { status: 400 });
  }
  if (!ALLOWED.has(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Find the owner's store
  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_user_id", userData.user.id)
    .single();

  if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

  // Confirm order belongs to that store
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, status")
    .eq("id", order_id)
    .eq("store_id", store.id)
    .single();

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Simple business rules (MVP)
  if (status === "completed" && order.status !== "paid" && order.status !== "completed") {
    return NextResponse.json({ error: "Only paid orders can be completed" }, { status: 400 });
  }
  if (status === "refunded" && order.status !== "paid" && order.status !== "completed") {
    return NextResponse.json({ error: "Only paid/completed orders can be refunded" }, { status: 400 });
  }

  const updates: Record<string, any> = { status };

  if (status === "completed") updates.completed_at = new Date().toISOString();
  if (status === "refunded") updates.refunded_at = new Date().toISOString();

  await supabaseAdmin.from("orders").update(updates).eq("id", order_id);

  return NextResponse.json({ ok: true });
}
