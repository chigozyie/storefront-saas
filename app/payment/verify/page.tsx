import { notFound } from "next/navigation";
import { paystackRequest } from "@/lib/paystack";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

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

  let resp;
  try {
    resp = await paystackRequest<VerifyResponse>(`/transaction/verify/${reference}`, {
      method: "GET",
      timeoutMs: 30000,
      retries: 2,
    });
  } catch (e: any) {
    return (
      <div className="mx-auto max-w-md py-20 text-center space-y-4">
        <h1 className="text-2xl font-semibold">Verifying payment…</h1>
        <p className="text-muted-foreground">
          Paystack is taking longer than expected. Please click retry.
        </p>
        <a
          className="underline"
          href={`/payment/verify?reference=${encodeURIComponent(reference)}`}
        >
          Retry verification
        </a>
      </div>
    );
  }


  const orderId = resp.data.metadata.order_id;

  if (resp.data.status !== "success") {
    // Mark order as failed
    await supabaseAdmin
      .from("orders")
      .update({ status: "failed" })
      .eq("id", orderId);

    // Release reserved stock
    const { data: items } = await supabaseAdmin
      .from("order_items")
      .select("product_id, quantity")
      .eq("order_id", orderId);

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

    return <p>Payment failed.</p>;
  }

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
  redirect(`/receipt/${orderId}`);
  return (
    <div className="mx-auto max-w-md py-20 text-center space-y-4">
      <h1 className="text-2xl font-semibold">Payment successful 🎉</h1>
      <p>Your order has been confirmed.</p>
    </div>
  );
}
