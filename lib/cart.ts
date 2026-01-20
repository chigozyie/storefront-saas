export type CartItem = {
  product_id: string;
  qty: number;
};

const key = (storeSlug: string) => `cart:${storeSlug}`;

export function getCart(storeSlug: string): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key(storeSlug));
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function setCart(storeSlug: string, items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key(storeSlug), JSON.stringify(items));
}

export function addToCart(storeSlug: string, product_id: string, qty = 1) {
  const cart = getCart(storeSlug);
  const existing = cart.find((x) => x.product_id === product_id);
  if (existing) existing.qty += qty;
  else cart.push({ product_id, qty });
  setCart(storeSlug, cart);
}

export function removeFromCart(storeSlug: string, product_id: string) {
  setCart(storeSlug, getCart(storeSlug).filter((x) => x.product_id !== product_id));
}

export function updateQty(storeSlug: string, product_id: string, qty: number) {
  const cart = getCart(storeSlug);
  const item = cart.find((x) => x.product_id === product_id);
  if (!item) return;
  item.qty = Math.max(1, qty);
  setCart(storeSlug, cart);
}

export function clearCart(storeSlug: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key(storeSlug));
}
