// Raw shapes from Fake Store API.
// The API has drifted over time: older docs return carts with
// { productId, quantity } pairs, newer docs show full product objects
// embedded in the cart. We accept both and normalize into one model,
// because in production tracking data drifts exactly like this.

export interface RawProduct {
  id: number;
  title: string;
  price: number;
  category: string;
}

// Cart line item, legacy shape: reference + quantity
interface RawCartItemRef {
  productId: number;
  quantity?: number;
}

// Cart line item, newer shape: embedded product
interface RawCartItemEmbedded {
  id: number;
  title?: string;
  price?: number;
  category?: string;
  quantity?: number;
}

export type RawCartItem = RawCartItemRef | RawCartItemEmbedded;

export interface RawCart {
  id: number;
  userId: number;
  date?: string;
  products: RawCartItem[];
}

// Normalized domain model the dashboard actually consumes

export interface OrderLine {
  productId: number;
  title: string;
  category: string;
  unitPrice: number;
  quantity: number;
}

export interface Order {
  id: number;
  customerId: number;
  date: Date | null;
  lines: OrderLine[];
  total: number;
}

export interface Metrics {
  revenue: number;
  orderCount: number;
  avgOrderValue: number;
  customerCount: number;
  returningCustomers: number;
  returningShare: number; // 0..1
  revenueByCategory: { category: string; revenue: number }[];
  ordersByMonth: { month: string; count: number }[];
}
