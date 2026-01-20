import { notFound } from "next/navigation";
import CartClient from "@/components/CartUI";

function normalizeHandle(handle?: string) {
  if (!handle) return null;
  const decoded = decodeURIComponent(handle);
  return decoded.startsWith("@") ? decoded.slice(1) : decoded;
}

export default async function CartPage({
  params,
}: {
  params: Promise<{ handle?: string }>;
}) {
  const { handle } = await params;
  const storeSlug = normalizeHandle(handle);
  if (!storeSlug) return notFound();

  return <CartClient storeSlug={storeSlug} handle={handle ?? `@${storeSlug}`} />;
}
