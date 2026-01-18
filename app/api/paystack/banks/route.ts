import { NextResponse } from "next/server";
import { paystackRequest } from "@/lib/paystack";

type BanksResponse = {
  status: boolean;
  message: string;
  data: Array<{
    name: string;
    slug: string;
    code: string;
    currency: string;
    type: string;
  }>;
};

export async function GET() {
  // For Nigeria NGN banks: ?country=nigeria&currency=NGN
  const resp = await paystackRequest<BanksResponse>("/bank?country=nigeria&currency=NGN", {
    method: "GET",
  });

  // Return only what we need (smaller payload)
  const banks = resp.data
    .filter((b) => b.currency === "NGN")
    .map((b) => ({ name: b.name, code: b.code }));

  return NextResponse.json({ banks });
}
