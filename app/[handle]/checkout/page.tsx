import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import CheckoutClient from "@/components/Checkout";

function normalizeHandle(handle?: string) {
  if (!handle) return null;
  const decoded = decodeURIComponent(handle);
  return decoded.startsWith("@") ? decoded.slice(1) : decoded;
}

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle?: string }>;
  searchParams: Promise<{ product?: string }>;
}) {
  const { handle } = await params;
  const sp = await searchParams;

  const storeSlug = normalizeHandle(handle);
  const productId = sp.product;

  if (!storeSlug || !productId) return notFound();

  const supabase = await createServerSupabaseClient();

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, slug")
    .eq("slug", storeSlug)
    .single();

  if (!store) return notFound();

  const { data: product } = await supabase
    .from("products")
    .select("id, name, price_kobo, stock_qty, is_active")
    .eq("id", productId)
    .eq("store_id", store.id)
    .eq("is_active", true)
    .single();

  if (!product) return notFound();

  const { data: images } = await supabase
    .from("product_images")
    .select("image_url, sort_order")
    .eq("product_id", product.id)
    .order("sort_order", { ascending: true });

  const mainImage = images?.[0]?.image_url ?? null;

  return (
    <CheckoutClient
      store={{ name: store.name, slug: store.slug }}
      product={{
        id: product.id,
        name: product.name,
        price_kobo: product.price_kobo,
        stock_qty: product.stock_qty,
        image_url: mainImage,
      }}
    />
  );
}
