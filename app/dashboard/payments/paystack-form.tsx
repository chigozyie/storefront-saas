"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Bank = { name: string; code: string };

export default function ConnectPaystackForm({
  storeId,
  businessName,
}: {
  storeId: string;
  businessName: string;
}) {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankCode, setBankCode] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState("");
  const [feePercent, setFeePercent] = useState("0");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/paystack/banks");
        const json = await res.json();
        setBanks(json.banks || []);
      } catch {
        setMsg("Could not load bank list. Refresh and try again.");
      }
    })();
  }, []);

  async function submit() {
    setMsg(null);
    setLoading(true);
    try {
      if (!bankCode) throw new Error("Please select a bank.");
      if (accountNumber.trim().length !== 10) throw new Error("Account number must be 10 digits.");

      const res = await fetch("/api/paystack/subaccount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id: storeId,
          business_name: businessName,
          bank_code: bankCode,
          account_number: accountNumber.trim(),
          percentage_charge: Number(feePercent),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to connect");

      setMsg("Connected! Refreshing...");
      window.location.reload();
    } catch (e: any) {
      setMsg(e?.message ?? "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label>Bank</Label>
        <Select value={bankCode} onValueChange={setBankCode}>
          <SelectTrigger>
            <SelectValue placeholder={banks.length ? "Select a bank" : "Loading banks..."} />
          </SelectTrigger>
          <SelectContent>
            {banks.map((b) => (
              <SelectItem key={b.code} value={b.code}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label>Account number</Label>
        <Input
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder="0123456789"
          inputMode="numeric"
        />
      </div>

      <div className="grid gap-2">
        <Label>Your platform fee (%)</Label>
        <Input value={feePercent} onChange={(e) => setFeePercent(e.target.value)} placeholder="0" />
      </div>

      {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}

      <Button onClick={submit} disabled={loading}>
        {loading ? "Connecting..." : "Connect Paystack"}
      </Button>
    </div>
  );
}
