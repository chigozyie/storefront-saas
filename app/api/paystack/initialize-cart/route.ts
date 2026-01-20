import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { paystackRequest } from "@/lib/paystack";

type InitResponse = {
  status: boolean;
  message: string;
  data: { authorization_url: string; reference: string };
};

export async function POST(req: Request) {
  const body = await req.json();
  const { store_slug, items, customer_email, customer_name, customer_phone, customer_address } = body;

  if (!store_slug || !Array.isArray(items) || !items.length || !customer_email) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Load store
  const { data: store } = await supabaseAdmin
    .from("stores")
    .select("id, name, paystack_subaccount_code")
    .eq("slug", store_slug)
    .single();

  if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });
  if (!store.paystack_subaccount_code) {
    return NextResponse.json({ error: "Store not ready for payments" }, { status: 400 });
  }

  // Validate & load products
  const productIds = items.map((i: any) => i.product_id);
  const { data: products } = await supabaseAdmin
    .from("products")
    .select("id, name, price_kobo, store_id, stock_qty")
    .in("id", productIds)
    .eq("store_id", store.id);

  if (!products || products.length !== productIds.length) {
    return NextResponse.json({ error: "One or more products not found" }, { status: 400 });
  }

  // Compute total and build order items
  let total = 0;
  const orderItems = items.map((i: any) => {
    const qty = Number(i.qty);
    if (!Number.isInteger(qty) || qty < 1) throw new Error("Invalid quantity");
    const p = products.find((x) => x.id === i.product_id)!;
    total += p.price_kobo * qty;
    return {
      product_id: p.id,
      product_name: p.name,
      quantity: qty,
      price_each_kobo: p.price_kobo,
    };
  });

  // Create order pending + reserved_until
  const { data: order, error: orderErr } = await supabaseAdmin
    .from("orders")
    .insert({
      store_id: store.id,
      customer_name,
      customer_phone,
      customer_email,
      customer_address,
      total_kobo: total,
      status: "pending",
      reserved_until: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    })
    .select("id")
    .single();

  if (orderErr) return NextResponse.json({ error: orderErr.message }, { status: 400 });

  // Insert order items
  await supabaseAdmin.from("order_items").insert(orderItems.map((x) => ({ ...x, order_id: order.id })));

  // Reserve stock for each item; if any fails, release what we reserved and cancel
  const reserved: Array<{ product_id: string; qty: number }> = [];
  try {
    for (const it of orderItems) {
      const { error } = await supabaseAdmin.rpc("reserve_stock", {
        p_product_id: it.product_id,
        p_qty: it.quantity,
      });
      if (error) throw error;
      reserved.push({ product_id: it.product_id, qty: it.quantity });
    }
  } catch (e: any) {
    for (const r of reserved) {
      await supabaseAdmin.rpc("release_stock", { p_product_id: r.product_id, p_qty: r.qty });
    }
    await supabaseAdmin.from("orders").update({ status: "cancelled" }).eq("id", order.id);
    return NextResponse.json({ error: e?.message || "Insufficient stock" }, { status: 400 });
  }

  // Initialize Paystack
  try {
    const paystack = await paystackRequest<InitResponse>("/transaction/initialize", {
      method: "POST",
      json: {
        email: customer_email,
        amount: total,
        reference: `order_${order.id}`,
        subaccount: store.paystack_subaccount_code,
        metadata: { order_id: order.id },
        callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/callback`,
      },
    });

    await supabaseAdmin
      .from("orders")
      .update({ paystack_reference: paystack.data.reference })
      .eq("id", order.id);

    return NextResponse.json({ authorization_url: paystack.data.authorization_url });
  } catch (e: any) {
    // Paystack init failed -> release reserved stock
    for (const r of reserved) {
      await supabaseAdmin.rpc("release_stock", { p_product_id: r.product_id, p_qty: r.qty });
    }
    await supabaseAdmin.from("orders").update({ status: "failed" }).eq("id", order.id);

    return NextResponse.json({ error: e?.message || "Payment init failed" }, { status: 400 });
  }
}
