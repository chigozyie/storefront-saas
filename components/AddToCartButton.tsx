"use client";

import { Button } from "@/components/ui/button";
import { addToCart } from "@/lib/cart";

export default function AddToCartButton({
  storeSlug,
  productId,
}: {
  storeSlug: string;
  productId: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        addToCart(storeSlug, productId, 1);
        alert("Added to cart");
      }}
    >
      Add to cart
    </Button>
  );
}
