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

  // Revenue by category, sorted descending
  const byCategory = new Map<string, number>();
  for (const o of orders) {
    for (const line of o.lines) {
      byCategory.set(
        line.category,
        (byCategory.get(line.category) ?? 0) + line.unitPrice * line.quantity
      );
    }
  }
  const revenueByCategory = [...byCategory.entries()]
    .map(([category, rev]) => ({ category, revenue: rev }))
    .sort((a, b) => b.revenue - a.revenue);

  // Orders by month, only for orders that actually carry a date
  const byMonth = new Map<string, number>();
  for (const o of orders) {
    if (!o.date) continue;
    const key = `${o.date.getUTCFullYear()}-${String(o.date.getUTCMonth() + 1).padStart(2, "0")}`;
    byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
  }
  const ordersByMonth = [...byMonth.entries()]
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    revenue,
    orderCount,
    avgOrderValue,
    customerCount,
    returningCustomers,
    returningShare,
    revenueByCategory,
    ordersByMonth,
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
