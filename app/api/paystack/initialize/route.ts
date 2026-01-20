import { NextResponse } from "next/server";
import { paystackRequest } from "@/lib/paystack";
import { supabaseAdmin } from "@/lib/supabase/admin";

type InitResponse = {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

export async function POST(req: Request) {
  const body = await req.json();
  const { product_id, quantity, customer_email, customer_name, customer_phone, customer_address } = body;

  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 1) {
    return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
  }

  if (!product_id || !qty || !customer_email) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // 1) Load product + store
  const { data: product } = await supabaseAdmin
    .from("products")
    .select("id, name, price_kobo, stock_qty, store_id")
    .eq("id", product_id)
    .single();

  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  
  const { data: store } = await supabaseAdmin
    .from("stores")
    .select("id, name, paystack_subaccount_code")
    .eq("id", product.store_id)
    .single();

  if (!store?.paystack_subaccount_code) {
    return NextResponse.json({ error: "Store not ready for payments" }, { status: 400 });
  }

  const total = product.price_kobo * qty;

  // 2) Create order (PENDING)
  const { data: order, error } = await supabaseAdmin
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

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await supabaseAdmin.from("order_items").insert({
    order_id: order.id,
    product_id: product.id,
    product_name: product.name,
    quantity: qty,
    price_each_kobo: product.price_kobo,
  });

  // Reserve stock atomically
  const { error: reserveErr } = await supabaseAdmin.rpc("reserve_stock", {
    p_product_id: product.id,
    p_qty: qty,
  });

  if (reserveErr) {
    // Mark order failed and stop
    await supabaseAdmin.from("orders").update({ status: "failed" }).eq("id", order.id);
    return NextResponse.json({ error: reserveErr.message }, { status: 400 });
  }

  // 3) Initialize Paystack
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

    // Save reference (nice)
    await supabaseAdmin
      .from("orders")
      .update({ paystack_reference: paystack.data.reference })
      .eq("id", order.id);

    return NextResponse.json({ authorization_url: paystack.data.authorization_url });
  } catch (e: any) {
    // Release stock if payment init fails
    await supabaseAdmin.rpc("release_stock", { p_product_id: product.id, p_qty: qty });
    await supabaseAdmin.from("orders").update({ status: "failed" }).eq("id", order.id);

    return NextResponse.json({ error: e?.message ?? "Payment init failed" }, { status: 400 });
  }
}