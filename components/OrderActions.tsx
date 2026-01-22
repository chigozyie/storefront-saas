"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function OrderActions({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function setStatus(status: "completed" | "refunded") {
    setLoading(status);

    // show a loading toast and update it later
    const toastId = toast.loading(
      status === "completed" ? "Marking order as completed…" : "Marking order as refunded…"
    );

    try {
      const res = await fetch("/api/orders/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed");
    //   window.location.reload();
    
    toast.success(
      status === "completed" ? "Order marked as completed" : "Order marked as refunded",
      { id: toastId }
    );
      router.refresh();

    } catch (e: any) {
      alert(e?.message ?? "Error");
    } finally {
      setLoading(null);
    }
  }

  const canComplete = currentStatus === "paid" ;
//   || currentStatus === "completed";
  const canRefund = currentStatus === "paid" || currentStatus === "completed";

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        disabled={!canComplete || loading !== null}
        onClick={() => setStatus("completed")}
      >
        {loading === "completed" ? "Marking…" : "Mark completed"}
      </Button>

      <Button
        size="sm"
        variant="destructive"
        disabled={!canRefund || loading !== null}
        onClick={() => setStatus("refunded")}
      >
        {loading === "refunded" ? "Marking…" : "Mark refunded"}
      </Button>
    </div>
  );
}
