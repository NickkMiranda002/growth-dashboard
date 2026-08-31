import { Order, OrderLine, RawCart, RawCartsResponse, RawProduct, RawProductsResponse } from "./types";

const BASE = "https://dummyjson.com";

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    // Cache for 5 minutes: mock data doesn't change, and we avoid
    // hammering a free public API on every page view.
    next: { revalidate: 300 },
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`${path} responded with ${res.status}`);
  }
  return res.json() as Promise<T>;
}

function toOrder(cart: RawCart, catalog: Map<number, RawProduct>): Order {
  const lines: OrderLine[] = cart.products.map((item) => ({
    productId: item.id,
    title: item.title,
    category: catalog.get(item.id)?.category ?? "uncategorized",
    unitPrice: item.price,
    quantity: item.quantity,
    lineRevenue: item.discountedTotal,
  }));

  // discountedTotal is what the customer actually paid; it's the honest
  // revenue number, not the pre-discount list total.
  return {
    id: cart.id,
    customerId: cart.userId,
    lines,
    total: cart.discountedTotal,
  };
}

export async function fetchOrders(): Promise<Order[]> {
  const [cartsRes, productsRes] = await Promise.all([
    getJson<RawCartsResponse>("/carts?limit=0"),
    getJson<RawProductsResponse>("/products?limit=0&select=id,category"),
  ]);

  const catalog = new Map(productsRes.products.map((p) => [p.id, p]));
  return cartsRes.carts.map((cart) => toOrder(cart, catalog));
}
