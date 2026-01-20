"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function CancelOrderButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);

  async function cancel() {
    setLoading(true);
    try {
      const res = await fetch("/api/orders/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to cancel");

      window.location.reload();
    } catch (e: any) {
      alert(e?.message ?? "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      onClick={cancel}
      disabled={loading}
    >
      {loading ? "Cancelling..." : "Cancel"}
    </Button>
  );
}
