import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const body = await req.json();
  const { store_slug, product_ids } = body as { store_slug?: string; product_ids?: string[] };

  if (!store_slug || !Array.isArray(product_ids) || product_ids.length === 0) {
    return NextResponse.json({ error: "Missing store_slug or product_ids" }, { status: 400 });
  }

  const { data: store } = await supabaseAdmin
    .from("stores")
    .select("id")
    .eq("slug", store_slug)
    .single();

  if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

  const { data: products } = await supabaseAdmin
    .from("products")
    .select("id, name, price_kobo, stock_qty, is_active")
    .eq("store_id", store.id)
    .in("id", product_ids);

  const { data: images } = await supabaseAdmin
    .from("product_images")
    .select("product_id, image_url, sort_order")
    .in("product_id", product_ids)
    .order("sort_order", { ascending: true });

  const mainImageByProduct = new Map<string, string>();
  for (const img of images ?? []) {
    if (!mainImageByProduct.has(img.product_id)) mainImageByProduct.set(img.product_id, img.image_url);
  }

  const result =
    (products ?? []).map((p) => ({
      ...p,
      image_url: mainImageByProduct.get(p.id) ?? null,
    })) ?? [];

  return NextResponse.json({ products: result });
}
