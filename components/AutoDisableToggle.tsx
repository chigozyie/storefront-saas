"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";

export default function AutoDisableToggle({
  productId,
  initial,
}: {
  productId: string;
  initial: boolean;
}) {
  const [checked, setChecked] = useState(initial);
  const [loading, setLoading] = useState(false);

  async function save(next: boolean) {
    setLoading(true);
    try {
      const res = await fetch("/api/products/auto-disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, auto_disable_on_oos: next }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed");
      setChecked(next);
    } catch (e: any) {
      alert(e?.message ?? "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Checkbox
        checked={checked}
        disabled={loading}
        onCheckedChange={(v) => save(Boolean(v))}
      />
      <span className="text-xs text-muted-foreground">Auto-disable when OOS</span>
    </div>
  );
}
