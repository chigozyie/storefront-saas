type PaystackOptions = Omit<RequestInit, "body"> & {
  json?: unknown;
};

export async function paystackRequest<T>(path: string, options: PaystackOptions = {}): Promise<T> {
  const { json, headers, ...rest } = options;

  const res = await fetch(`https://api.paystack.co${path}`, {
    ...rest,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...(headers || {}),
    },
    body: json ? JSON.stringify(json) : undefined,
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok || data?.status === false) {
    throw new Error(data?.message || `Paystack error (${res.status})`);
  }

  return data as T;
}
