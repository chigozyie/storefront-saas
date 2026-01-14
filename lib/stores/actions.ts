"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils/slug";

export async function createStore(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const whatsapp = String(formData.get("whatsapp") || "").trim();
  const address = String(formData.get("address") || "").trim();

  const supabase = await createServerSupabaseClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) return { ok: false, message: "Please log in again." };

  const baseSlug = slugify(name);
  if (!baseSlug) return { ok: false, message: "Store name is required." };

  // Try slug, if taken append a short suffix
  let slug = baseSlug;
  for (let i = 0; i < 5; i++) {
    const attempt = i === 0 ? baseSlug : `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

    const { error } = await supabase.from("stores").insert({
      owner_user_id: userData.user.id,
      name,
      slug: attempt,
      whatsapp,
      address,
      currency: "NGN",
    });

    if (!error) {
      slug = attempt;
      redirect(`/dashboard`);
    }

    // if not unique violation, stop
    if (!String(error.message).toLowerCase().includes("duplicate")) {
      return { ok: false, message: error.message };
    }
  }

  return { ok: false, message: "That store slug is taken. Try a different name." };
}

export async function getStoreForUser() {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data: stores } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_user_id", userData.user.id)
    .limit(1);

  return stores?.[0] || null;
}