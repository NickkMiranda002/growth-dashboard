import { Order, OrderLine, RawCart, RawCartItem, RawProduct } from "./types";

const BASE = "https://fakestoreapi.com";

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    // Cache for 5 minutes: mock data barely changes, and we avoid
    // hammering a free public API on every page view.
    next: { revalidate: 300 },
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`${path} responded with ${res.status}`);
  }
  return res.json() as Promise<T>;
}

function isEmbedded(item: RawCartItem): item is Extract<RawCartItem, { id: number }> {
  return "id" in item && typeof (item as { price?: unknown }).price === "number";
}

function normalizeLine(
  item: RawCartItem,
  catalog: Map<number, RawProduct>
): OrderLine | null {
  const quantity = Math.max(1, Number((item as { quantity?: number }).quantity ?? 1));

  if (isEmbedded(item)) {
    return {
      productId: item.id,
      title: item.title ?? `Product ${item.id}`,
      category: item.category ?? "uncategorized",
      unitPrice: item.price ?? 0,
      quantity,
    };
  }

  const ref = item as { productId?: number };
  if (typeof ref.productId !== "number") return null;
  const product = catalog.get(ref.productId);
  if (!product) return null;

  return {
    productId: product.id,
    title: product.title,
    category: product.category,
    unitPrice: product.price,
    quantity,
  };
}

export async function fetchOrders(): Promise<Order[]> {
  const [carts, products] = await Promise.all([
    getJson<RawCart[]>("/carts"),
    getJson<RawProduct[]>("/products"),
  ]);

  const catalog = new Map(products.map((p) => [p.id, p]));

  return carts.map((cart) => {
    const lines = cart.products
      .map((item) => normalizeLine(item, catalog))
      .filter((l): l is OrderLine => l !== null);

    const total = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

    const parsed = cart.date ? new Date(cart.date) : null;
    const date = parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;

    return { id: cart.id, customerId: cart.userId, date, lines, total };
  });
}
