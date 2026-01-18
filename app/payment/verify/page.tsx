import { notFound } from "next/navigation";
import { paystackRequest } from "@/lib/paystack";
import { supabaseAdmin } from "@/lib/supabase/admin";

type VerifyResponse = {
  status: boolean;
  data: {
    status: string;
    reference: string;
    metadata: { order_id: string };
  };
};

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
    const sp = await searchParams
  const reference = sp.reference;
  if (!reference) return notFound();

  const resp = await paystackRequest<VerifyResponse>(
    `/transaction/verify/${reference}`,
    { method: "GET" }
  );

  if (resp.data.status !== "success") {
    return <p>Payment failed.</p>;
  }

  const orderId = resp.data.metadata.order_id;

  const { data: existingOrder } = await supabaseAdmin
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .single();

    if (!existingOrder) return notFound();

    // If already paid/completed, don’t reduce stock again
    if (existingOrder.status === "paid" || existingOrder.status === "completed") {
    return (
        <div className="mx-auto max-w-md py-20 text-center space-y-4">
        <h1 className="text-2xl font-semibold">Payment successful 🎉</h1>
        <p>Your order is already confirmed.</p>
        </div>
    );
  }

  // Mark order paid
  await supabaseAdmin
    .from("orders")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", orderId);

  // Reduce stock
  const { data: items } = await supabaseAdmin
    .from("order_items")
    .select("product_id, quantity")
    .eq("order_id", orderId);

  if (items) {
    for (const item of items) {
      await supabaseAdmin.rpc("decrement_stock", {
        p_product_id: item.product_id,
        p_qty: item.quantity,
      });
    }
  }

  return (
    <div className="mx-auto max-w-md py-20 text-center space-y-4">
      <h1 className="text-2xl font-semibold">Payment successful 🎉</h1>
      <p>Your order has been confirmed.</p>
    </div>
  );
}
