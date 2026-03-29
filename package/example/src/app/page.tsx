import { Remediate } from "remediate";
import { Agentation } from "agentation";

const METRICS = [
  { label: "Revenue", value: "$12,480", change: "+12.5%", up: true },
  { label: "Users", value: "1,842", change: "+4.2%", up: true },
  { label: "Bounce rate", value: "32.1%", change: "-2.1%", up: false },
];

const ROWS = [
  { name: "Landing page redesign", status: "In progress", date: "Mar 14" },
  { name: "Auth flow update", status: "Review", date: "Mar 12" },
  { name: "API rate limiting", status: "Done", date: "Mar 10" },
  { name: "Email templates", status: "In progress", date: "Mar 9" },
];

const STATUS_STYLES: Record<string, string> = {
  "In progress": "bg-amber-50 text-amber-700",
  Review: "bg-blue-50 text-blue-700",
  Done: "bg-emerald-50 text-emerald-700",
};

export default function Page() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-[#111]">
      {/* Header */}
      <header className="border-b border-black/[0.06] px-6 h-14 flex items-center justify-between">
        <span className="text-[15px] font-semibold tracking-[-0.3px]">
          Acme
        </span>
        <div className="flex items-center gap-3">
          <div className="h-8 w-[72px] rounded-md bg-black/[0.04] flex items-center justify-center text-[13px] text-black/40 font-medium">
            Search
          </div>
          <div className="h-8 w-8 rounded-full bg-black/[0.06]" />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[960px] mx-auto px-6 py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-[22px] font-semibold tracking-[-0.5px] text-[#111]">
            Dashboard
          </h1>
          <p className="text-[14px] text-black/40 mt-1">
            Overview of your project metrics.
          </p>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {METRICS.map((m) => (
            <div
              key={m.label}
              className="rounded-xl border border-black/[0.06] bg-white p-5"
            >
              <p className="text-[13px] font-medium text-black/40 mb-3">
                {m.label}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-[28px] font-semibold tracking-[-1px] leading-none">
                  {m.value}
                </span>
                <span
                  className={`text-[13px] font-medium ${m.up ? "text-emerald-600" : "text-red-500"}`}
                >
                  {m.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-xl border border-black/[0.06] bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-black/[0.06]">
            <h2 className="text-[15px] font-semibold tracking-[-0.3px]">
              Recent tasks
            </h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.06]">
                <th className="text-left px-5 py-3 text-[13px] font-medium text-black/40">
                  Name
                </th>
                <th className="text-left px-5 py-3 text-[13px] font-medium text-black/40">
                  Status
                </th>
                <th className="text-right px-5 py-3 text-[13px] font-medium text-black/40">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr
                  key={row.name}
                  className="border-b border-black/[0.04] last:border-0"
                >
                  <td className="px-5 py-3.5 text-[14px] font-medium">
                    {row.name}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[12px] font-medium ${STATUS_STYLES[row.status]}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right text-[13px] text-black/40">
                    {row.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <Agentation />
      <Remediate endpoint="/api/feedback" />
    </div>
  );
}
