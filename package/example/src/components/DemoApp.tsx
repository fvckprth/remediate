"use client";

const STATS = [
  { label: "Total Revenue", value: "$45,231.89", change: "+20.1%", up: true },
  { label: "Subscriptions", value: "+2,350", change: "+180.1%", up: true },
  { label: "Active Users", value: "+12,234", change: "+19%", up: true },
  { label: "Churn Rate", value: "2.4%", change: "-4.5%", up: false },
];

const ORDERS = [
  { id: "ORD-7892", customer: "Olivia Martin", email: "olivia@email.com", status: "Completed", amount: "$1,999.00", date: "Feb 18, 2026" },
  { id: "ORD-7891", customer: "Jackson Lee", email: "jackson@email.com", status: "Processing", amount: "$39.00", date: "Feb 17, 2026" },
  { id: "ORD-7890", customer: "Isabella Nguyen", email: "isabella@email.com", status: "Completed", amount: "$299.00", date: "Feb 17, 2026" },
  { id: "ORD-7889", customer: "William Kim", email: "will@email.com", status: "Failed", amount: "$99.00", date: "Feb 16, 2026" },
  { id: "ORD-7888", customer: "Sofia Davis", email: "sofia@email.com", status: "Completed", amount: "$2,500.00", date: "Feb 15, 2026" },
];

const NAV_ITEMS = ["Dashboard", "Orders", "Products", "Customers", "Settings"];

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Processing: "bg-amber-50 text-amber-700 border-amber-200",
    Failed: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${colors[status] ?? "bg-zinc-50 text-zinc-600 border-zinc-200"}`}>
      {status}
    </span>
  );
}

export function DemoApp() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-zinc-900 flex items-center justify-center">
                <span className="text-white text-xs font-bold">A</span>
              </div>
              <span className="font-semibold text-zinc-900 text-sm tracking-tight">Acme Inc</span>
            </div>
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    item === "Dashboard"
                      ? "bg-zinc-100 text-zinc-900 font-medium"
                      : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                  }`}
                >
                  {item}
                </button>
              ))}
            </nav>
          </div>
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-600 flex items-center justify-center">
            <span className="text-white text-xs font-medium">PP</span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Dashboard</h1>
              <p className="text-sm text-zinc-500 mt-0.5">Welcome back, here is what is happening today.</p>
            </div>
            <button className="px-3 py-1.5 text-sm bg-zinc-900 text-white rounded-md hover:bg-zinc-800 transition-colors">
              Add Order
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-zinc-200 bg-white p-5">
                <p className="text-sm text-zinc-500">{stat.label}</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <p className="text-2xl font-semibold text-zinc-900 tabular-nums">{stat.value}</p>
                  <span className={`text-xs font-medium ${stat.up ? "text-emerald-600" : "text-red-600"}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white">
            <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900">Recent Orders</h2>
              <button className="text-xs text-zinc-500 hover:text-zinc-700 transition-colors">View all</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100">
                    <th className="text-left py-3 px-5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Order</th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Customer</th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Amount</th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {ORDERS.map((order) => (
                    <tr key={order.id} className="border-b border-zinc-50 hover:bg-zinc-25 transition-colors">
                      <td className="py-3 px-5 font-medium text-zinc-900">{order.id}</td>
                      <td className="py-3 px-5">
                        <div>
                          <p className="text-zinc-900">{order.customer}</p>
                          <p className="text-xs text-zinc-400">{order.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-5"><StatusBadge status={order.status} /></td>
                      <td className="py-3 px-5 text-zinc-900 tabular-nums">{order.amount}</td>
                      <td className="py-3 px-5 text-zinc-500">{order.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <footer className="border-t border-zinc-200 pt-6 pb-8 flex items-center justify-between text-xs text-zinc-400">
            <p>&copy; 2026 Acme Inc. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-zinc-600 transition-colors">Privacy</a>
              <a href="#" className="hover:text-zinc-600 transition-colors">Terms</a>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
