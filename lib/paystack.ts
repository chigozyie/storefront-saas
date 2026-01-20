type PaystackOptions = Omit<RequestInit, "body"> & {
  json?: unknown;
  timeoutMs?: number;
  retries?: number;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function paystackRequest<T>(path: string, options: PaystackOptions = {}): Promise<T> {
  const { json, headers, timeoutMs = 30000, retries = 2, ...rest } = options;

  let lastErr: any;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`https://api.paystack.co${path}`, {
        ...rest,
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
          ...(headers || {}),
        },
        body: json ? JSON.stringify(json) : undefined,
        cache: "no-store",
        signal: controller.signal,
      });

      const data = await res.json();

      if (!res.ok || data?.status === false) {
        throw new Error(data?.message || `Paystack error (${res.status})`);
      }

      return data as T;
    } catch (e: any) {
      lastErr = e;
      // small backoff then retry
      if (attempt < retries) await sleep(500 * (attempt + 1));
    } finally {
      clearTimeout(t);
    }
  }

  throw lastErr;
}
