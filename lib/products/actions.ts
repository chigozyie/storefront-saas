"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils/slug";

function toKobo(nairaString: string) {
  const clean = nairaString.replace(/,/g, "").trim();
  const value = Number(clean);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

export async function createProduct(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, message: "Please log in again." };

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const priceNaira = String(formData.get("price") || "").trim();
  const stockQty = Number(String(formData.get("stock_qty") || "0"));
  const isActive = formData.get("is_active") === "on";

  const storeId = String(formData.get("store_id") || "").trim();
  if (!storeId) return { ok: false, message: "Missing store." };
  if (!name) return { ok: false, message: "Product name is required." };

  const priceKobo = toKobo(priceNaira);
  if (priceKobo === null) return { ok: false, message: "Enter a valid price." };
  if (!Number.isInteger(stockQty) || stockQty < 0) return { ok: false, message: "Stock must be 0 or more." };

  const slug = slugify(name);

  const { data, error } = await supabase
    .from("products")
    .insert({
      store_id: storeId,
      name,
      slug,
      description,
      price_kobo: priceKobo,
      stock_qty: stockQty,
      is_active: isActive,
    })
    .select("id")
    .single();

  if (error) return { ok: false, message: error.message };

  redirect(`/dashboard/products/${data.id}/edit`);
}

export async function updateProduct(productId: string, formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, message: "Please log in again." };

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const priceNaira = String(formData.get("price") || "").trim();
  const stockQty = Number(String(formData.get("stock_qty") || "0"));
  const isActive = formData.get("is_active") === "on";

  const priceKobo = toKobo(priceNaira);
  if (priceKobo === null) return { ok: false, message: "Enter a valid price." };
  if (!Number.isInteger(stockQty) || stockQty < 0) return { ok: false, message: "Stock must be 0 or more." };
  if (!name) return { ok: false, message: "Product name is required." };

  const slug = slugify(name);

  const { error } = await supabase
    .from("products")
    .update({
      name,
      slug,
      description,
      price_kobo: priceKobo,
      stock_qty: stockQty,
      is_active: isActive,
    })
    .eq("id", productId);

  if (error) return { ok: false, message: error.message };

  return { ok: true, message: "Saved." };
}
