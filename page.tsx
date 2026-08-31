import { fetchOrders } from "@/lib/api";
import { computeMetrics, formatPercent, formatUsd } from "@/lib/metrics";
import { Order } from "@/lib/types";

export const revalidate = 300;

function monthLabel(key: string): string {
  const [year, month] = key.split("-");
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${names[Number(month) - 1]} ${year.slice(2)}`;
}

function ErrorState({ message }: { message: string }) {
  return (
    <main className="page">
      <div className="masthead">
        <h1>Growth Dashboard</h1>
      </div>
      <div className="error-box">
        <h2>Data source is unreachable</h2>
        <p>
          The request to fakestoreapi.com failed, so there are no numbers to show.
          This page fails loudly on purpose: a dashboard that silently renders
          zeros is worse than one that says it is broken.
        </p>
        <p style={{ marginTop: 8 }}>
          Detail: <code>{message}</code>. Reload in a minute; the source is a free
          public mock API and occasionally rate-limits.
        </p>
      </div>
    </main>
  );
}

export default async function Page() {
  let orders: Order[];
  try {
    orders = await fetchOrders();
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "unknown error"} />;
  }

  const m = computeMetrics(orders);
  const maxCategoryRevenue = m.revenueByCategory[0]?.revenue ?? 1;
  const maxMonthCount = Math.max(1, ...m.ordersByMonth.map((x) => x.count));
  const repeatCustomerIds = new Set(
    orders
      .map((o) => o.customerId)
      .filter((id, _, all) => all.filter((x) => x === id).length > 1)
  );

  return (
    <main className="page">
      <div className="masthead">
        <h1>Growth Dashboard</h1>
        <span className="source-note">
          Live data from <a href="https://fakestoreapi.com">fakestoreapi.com</a>, cached 5 min
        </span>
      </div>
      <p className="lede">
        Carts from the mock API are treated as paid orders of a small DTC store.
        The point of this page is the metric a recurring-revenue business lives
        on: how many customers come back.
      </p>

      <div className="retention">
        <div className="retention-head">
          <span className="retention-number">{formatPercent(m.returningShare)}</span>
          <div>
            <div className="retention-title">of customers placed more than one order</div>
            <div className="retention-sub">
              {m.returningCustomers} of {m.customerCount} customers in the dataset
            </div>
          </div>
        </div>
        <div className="retention-bar" role="img" aria-label={`${m.returningCustomers} returning customers out of ${m.customerCount}`}>
          <div
            className="seg-returning"
            style={{ width: `${Math.max(2, m.returningShare * 100)}%` }}
          />
          <div className="seg-once" style={{ flex: 1 }} />
        </div>
        <div className="retention-legend">
          <span>
            <span className="legend-swatch" style={{ background: "var(--green)" }} />
            Returning ({m.returningCustomers})
          </span>
          <span>
            <span className="legend-swatch" style={{ background: "var(--hairline)" }} />
            One order only ({m.customerCount - m.returningCustomers})
          </span>
        </div>
      </div>

      <dl className="stats">
        <div className="stat">
          <dt>Revenue</dt>
          <dd>{formatUsd(m.revenue)}</dd>
        </div>
        <div className="stat">
          <dt>Orders</dt>
          <dd>{m.orderCount}</dd>
        </div>
        <div className="stat">
          <dt>Average order value</dt>
          <dd>{formatUsd(m.avgOrderValue)}</dd>
        </div>
        <div className="stat">
          <dt>Customers</dt>
          <dd>{m.customerCount}</dd>
        </div>
      </dl>

      <div className="two-col">
        <section>
          <h2>Revenue by category</h2>
          <p className="section-sub">Where the money in these orders actually comes from</p>
          {m.revenueByCategory.map((c) => (
            <div className="cat-row" key={c.category}>
              <span>{c.category}</span>
              <div className="cat-track">
                <div
                  className="cat-fill"
                  style={{ width: `${(c.revenue / maxCategoryRevenue) * 100}%` }}
                />
              </div>
              <span className="cat-value">{formatUsd(c.revenue)}</span>
            </div>
          ))}
        </section>

        <section>
          <h2>Orders per month</h2>
          <p className="section-sub">
            {m.ordersByMonth.length > 0
              ? "Only orders that carry a date in the source data"
              : "The current API response carries no order dates"}
          </p>
          {m.ordersByMonth.length > 0 ? (
            <div className="months">
              {m.ordersByMonth.map((x) => (
                <div className="month" key={x.month}>
                  <span className="month-count">{x.count}</span>
                  <div
                    className="month-bar"
                    style={{ height: `${(x.count / maxMonthCount) * 100}px` }}
                  />
                  <span className="month-label">{monthLabel(x.month)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="section-sub">
              Nothing hidden, nothing faked: when a chart has no data, it says so.
            </p>
          )}
        </section>
      </div>

      <section>
        <h2>Orders</h2>
        <p className="section-sub">Every cart in the dataset, priced against the product catalog</p>
        <table className="orders">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Items</th>
              <th className="num">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders
              .slice()
              .sort((a, b) => b.total - a.total)
              .map((o) => (
                <tr key={o.id}>
                  <td>#{o.id}</td>
                  <td>
                    {o.customerId}{" "}
                    {repeatCustomerIds.has(o.customerId) && (
                      <span className="badge-returning">returning</span>
                    )}
                  </td>
                  <td>{o.date ? o.date.toISOString().slice(0, 10) : "no date"}</td>
                  <td>{o.lines.reduce((n, l) => n + l.quantity, 0)}</td>
                  <td className="num">{formatUsd(o.total)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </section>

      <footer>
        Built as a hiring challenge. Cart and product data are joined and
        normalized server-side; metric logic lives in pure functions so it can
        move to a job or API route untouched. See the README for the reasoning
        and what changes with real data.
      </footer>
    </main>
  );
}
