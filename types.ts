// Raw shapes from DummyJSON (dummyjson.com/docs/carts, /docs/products).
// Carts embed product title/price/quantity/total directly; category is
// not included on the cart line, so it's joined from /products by id.
// Carts carry no order date in this API.

export interface RawProduct {
  id: number;
  title: string;
  price: number;
  category: string;
}

export interface RawProductsResponse {
  products: RawProduct[];
  total: number;
  skip: number;
  limit: number;
}

export interface RawCartItem {
  id: number;
  title: string;
  price: number;
  quantity: number;
  total: number;
  discountedTotal: number;
}

export interface RawCart {
  id: number;
  userId: number;
  products: RawCartItem[];
  total: number;
  discountedTotal: number;
  totalProducts: number;
  totalQuantity: number;
}

export interface RawCartsResponse {
  carts: RawCart[];
  total: number;
  skip: number;
  limit: number;
}

// Normalized domain model the dashboard actually consumes

export interface OrderLine {
  productId: number;
  title: string;
  category: string;
  unitPrice: number;
  quantity: number;
  lineRevenue: number; // discounted total for this line - what was actually paid
}

export interface Order {
  id: number;
  customerId: number;
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
  topProducts: { title: string; revenue: number; quantity: number }[];
}
