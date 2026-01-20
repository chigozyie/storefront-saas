"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ReleaseExpiredButton() {
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const res = await fetch("/api/orders/release-expired", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed");

      alert(`Released ${json.released} expired order(s).`);
      window.location.reload();
    } catch (e: any) {
      alert(e?.message ?? "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" onClick={run} disabled={loading}>
      {loading ? "Releasing..." : "Release expired"}
    </Button>
  );
}
