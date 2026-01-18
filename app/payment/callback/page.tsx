import { redirect } from "next/navigation";

export default async function CallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
    const sp = await searchParams;
    const reference = sp.reference || sp.trxref
  if (!reference) {
    return <p>Invalid payment.</p>;
  }

  redirect(`/payment/verify?reference=${encodeURIComponent(reference)}`);
}
