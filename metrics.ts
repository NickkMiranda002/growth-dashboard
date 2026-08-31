import { Metrics, Order } from "./types";

// Pure functions: no fetching, no framework. Easy to unit test and
// easy to move server-side (a cron job, an API route) later.

export function computeMetrics(orders: Order[]): Metrics {
  const revenue = orders.reduce((sum, o) => sum + o.total, 0);
  const orderCount = orders.length;
  const avgOrderValue = orderCount > 0 ? revenue / orderCount : 0;

  // Recurrence: customers with more than one order.
  // In a subscription DTC business this is the metric that pays the bills.
  const ordersPerCustomer = new Map<number, number>();
  for (const o of orders) {
    ordersPerCustomer.set(o.customerId, (ordersPerCustomer.get(o.customerId) ?? 0) + 1);
  }
  const customerCount = ordersPerCustomer.size;
  const returningCustomers = [...ordersPerCustomer.values()].filter((n) => n > 1).length;
  const returningShare = customerCount > 0 ? returningCustomers / customerCount : 0;

  // Revenue by category, sorted descending. Uses lineRevenue (post-discount)
  // so this always sums to the same total shown in the revenue stat.
  const byCategory = new Map<string, number>();
  for (const o of orders) {
    for (const line of o.lines) {
      byCategory.set(
        line.category,
        (byCategory.get(line.category) ?? 0) + line.lineRevenue
      );
    }
  }
  const revenueByCategory = [...byCategory.entries()]
    .map(([category, rev]) => ({ category, revenue: rev }))
    .sort((a, b) => b.revenue - a.revenue);

  // Top products by revenue across all orders
  const byProduct = new Map<string, { revenue: number; quantity: number }>();
  for (const o of orders) {
    for (const line of o.lines) {
      const entry = byProduct.get(line.title) ?? { revenue: 0, quantity: 0 };
      entry.revenue += line.lineRevenue;
      entry.quantity += line.quantity;
      byProduct.set(line.title, entry);
    }
  }
  const topProducts = [...byProduct.entries()]
    .map(([title, v]) => ({ title, revenue: v.revenue, quantity: v.quantity }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  return {
    revenue,
    orderCount,
    avgOrderValue,
    customerCount,
    returningCustomers,
    returningShare,
    revenueByCategory,
    topProducts,
  };
}

export function formatUsd(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  });
}

export function formatPercent(share: number): string {
  return `${Math.round(share * 100)}%`;
}
