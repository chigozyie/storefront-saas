"use client";

import { Button } from "@/components/ui/button";
import { addToCart } from "@/lib/cart";

export default function AddToCartButton({
  storeSlug,
  productId,
  disabled,
}: {
  storeSlug: string;
  productId: string;
  disabled: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        if (disabled) return;
        addToCart(storeSlug, productId, 1);
        alert("Added to cart");
      }}
    >
      Add to cart
    </Button>
  );
}
