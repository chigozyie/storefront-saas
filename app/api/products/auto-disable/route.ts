import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { product_id, auto_disable_on_oos } = body as {
    product_id?: string;
    auto_disable_on_oos?: boolean;
  };

  if (!product_id || typeof auto_disable_on_oos !== "boolean") {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Owner store
  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_user_id", userData.user.id)
    .single();

  if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

  // Ensure product belongs to store
  const { data: product } = await supabaseAdmin
    .from("products")
    .select("id")
    .eq("id", product_id)
    .eq("store_id", store.id)
    .single();

  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  await supabaseAdmin
    .from("products")
    .update({ auto_disable_on_oos })
    .eq("id", product_id);

  return NextResponse.json({ ok: true });
}
