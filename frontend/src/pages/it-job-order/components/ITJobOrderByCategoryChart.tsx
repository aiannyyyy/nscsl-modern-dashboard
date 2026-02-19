import React, { useState, useMemo } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Sector,
} from "recharts";
import { Download, ChevronDown, Loader2 } from "lucide-react";
import { useJobOrders } from "../../../hooks/ITHooks/useJobOrderHooks";
import { downloadChart } from "../../../utils/chartDownloadUtils";

// ─── Constants ───────────────────────────────────────────────────────────────

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const COLORS = ["#6366f1","#f97316","#22c55e","#ef4444","#eab308","#3b82f6","#a855f7","#06b6d4","#ec4899","#84cc16"];

const CHART_ID = "job-order-by-category-chart";

// ─── Active Shape ─────────────────────────────────────────────────────────────

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  return (
    <g>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 12}
        startAngle={startAngle} endAngle={endAngle} fill={fill}
        style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.2))" }}
      />
      <Sector cx={cx} cy={cy} innerRadius={innerRadius - 4} outerRadius={innerRadius}
        startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.3}
      />
      <text x={cx} y={cy - 16} textAnchor="middle" fill={fill} fontSize={11} fontWeight="bold">
        {payload.category}
      </text>
      <text x={cx} y={cy + 6} textAnchor="middle" fill="#666" fontSize={13}>{value}</text>
      <text x={cx} y={cy + 24} textAnchor="middle" fill="#999" fontSize={11}>
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    </g>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

export const ITJobOrderByCategoryChart: React.FC = () => {
  const currentDate = new Date();
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [exportOpen, setExportOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const { data, isLoading, isError } = useJobOrders({ limit: 1000 });

  const chartData = useMemo(() => {
    if (!data?.data) return [];

    const filtered = data.data.filter((jo) => {
      const d = new Date(jo.created_at);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });

    const counts: Record<string, number> = {};
    for (const jo of filtered) {
      const cat = jo.category || "Uncategorized";
      counts[cat] = (counts[cat] ?? 0) + 1;
    }

    return Object.entries(counts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }, [data, year, month]);

  const total = chartData.reduce((s, d) => s + d.count, 0);
  const years = Array.from({ length: 10 }, (_, i) => currentDate.getFullYear() - i);

  const exportData = chartData.map((d, i) => ({
    Rank: i + 1,
    Category: d.category,
    Count: d.count,
    Percentage: `${total > 0 ? ((d.count / total) * 100).toFixed(1) : 0}%`,
  }));

  const handleExport = async (format: "png" | "svg" | "excel") => {
    setExportOpen(false);
    await downloadChart({
      elementId: CHART_ID,
      filename: `JobOrders_ByCategory_${year}-${String(month).padStart(2, "0")}`,
      format,
      data: format === "excel" ? exportData : undefined,
      sheetName: "By Category",
      backgroundColor: document.documentElement.classList.contains("dark") ? "#111827" : "#ffffff",
      scale: 2,
    });
  };

  return (
    <div className="flex flex-col rounded-2xl shadow-lg overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 h-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">Job Orders by Category</h3>
          <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
            {MONTHS[month - 1]} {year} • {total} total
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}
            className="h-8 px-3 text-xs rounded-lg border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>

          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
            className="h-8 px-3 text-xs rounded-lg border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {MONTHS.map((m, idx) => <option key={m} value={idx + 1}>{m}</option>)}
          </select>

          <div className="relative">
            <button
              onClick={() => setExportOpen(!exportOpen)}
              disabled={isLoading || chartData.length === 0}
              className="h-8 px-3 text-xs rounded-lg border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Download size={14} />Export<ChevronDown size={12} />
            </button>

            {exportOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                <div className="absolute right-0 mt-1 w-44 rounded-lg shadow-lg border z-20 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  {(["png", "svg", "excel"] as const).map((f) => (
                    <button key={f} onClick={() => handleExport(f)}
                      className="w-full px-4 py-2.5 text-left text-xs hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 first:rounded-t-lg last:rounded-b-lg">
                      Export as {f.toUpperCase()}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Chart — id here so html2canvas captures just the chart area */}
      <div id={CHART_ID} className="flex-1 min-h-0 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading data...</p>
            </div>
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-red-500">Failed to load data.</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-500 dark:text-gray-400">No data for {MONTHS[month - 1]} {year}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: document.documentElement.classList.contains("dark") ? "#1f2937" : "#ffffff",
                  border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "12px",
                }}
                formatter={(value: any, _: any, entry: any) => [value, entry.payload.category]}
              />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "11px" }}
                formatter={(_: any, entry: any) => entry.payload.category}
              />
              <Pie
                data={chartData} dataKey="count" nameKey="category"
                innerRadius={70} outerRadius={110} paddingAngle={4}
                activeIndex={activeIndex} activeShape={renderActiveShape}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(undefined)}
                label={activeIndex === undefined ? ({ percent }) => `${(percent * 100).toFixed(0)}%` : false}
                labelLine={activeIndex === undefined}
              >
                {chartData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]}
                    style={{ opacity: activeIndex === undefined || activeIndex === index ? 1 : 0.5, transition: "opacity 0.2s ease", cursor: "pointer" }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};