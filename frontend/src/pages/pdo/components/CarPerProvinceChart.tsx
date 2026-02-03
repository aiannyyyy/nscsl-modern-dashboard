import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { PieLabelRenderProps } from "recharts";
import { getCarListGroupedByProvince, getMonthDateRange } from "../../../services/carListApi";

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FFC658', '#FF6B9D', '#C23373', '#45B7D1'
];

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// ✅ NEW: Get current month
const getCurrentMonth = () => {
  const now = new Date();
  return months[now.getMonth()];
};

interface CarPerProvinceChartProps {
  refreshTrigger?: number;
}

export const CarPerProvinceChart: React.FC<CarPerProvinceChartProps> = ({ refreshTrigger = 0 }) => {
  const [status, setStatus] = useState("");
  const [month, setMonth] = useState(getCurrentMonth()); // ✅ FIXED: Use current month
  const [data, setData] = useState<{ name: string; value: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, [status, month, refreshTrigger]);

  const fetchData = async () => {
    setIsLoading(true);
    setError("");

    try {
      const currentYear = new Date().getFullYear().toString();
      const dateRange = getMonthDateRange(month, currentYear);

      const result = dateRange && month
        ? await getCarListGroupedByProvince(status || undefined, dateRange.start, dateRange.end)
        : await getCarListGroupedByProvince(status || undefined);

      const chartData = result.map(item => ({
        name: item.province,
        value: item.count
      }));

      setData(chartData);
    } catch (err) {
      console.error("Error fetching province data:", err);
      setError("Failed to load chart data");
    } finally {
      setIsLoading(false);
    }
  };

  // Properly typed label function with nice positioning outside the slice
  const renderCustomLabel = (props: PieLabelRenderProps) => {
    const { cx, cy, midAngle, outerRadius, value, name } = props;

    if (!name || value === undefined) return null;

    const RADIAN = Math.PI / 180;
    const radius = outerRadius! + 20; // distance from the pie
    const x = cx! + radius * Math.cos(-midAngle! * RADIAN);
    const y = cy! + radius * Math.sin(-midAngle! * RADIAN);

    // ✅ BONUS FIX: Dark mode support for labels
    const isDark = document.documentElement.classList.contains("dark");

    return (
      <text
        x={x}
        y={y}
        fill={isDark ? "#f3f4f6" : "#333"}  // Light text in dark mode
        textAnchor={x > cx! ? "start" : "end"}
        dominantBaseline="central"
        fontSize={12}
      >
        {`${name}: ${value}`}
      </text>
    );
  };

  const totalRecords = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-lg h-[550px]">
      {/* Header */}
      <div className="flex justify-between items-start px-5 py-4 border-b bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
        <h4 className="font-semibold text-gray-800 dark:text-gray-100">
          CAR Per Province
        </h4>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-8 px-3 text-xs rounded-full border bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="pending">Pending</option>
          </select>

          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="h-8 px-3 text-xs rounded-full border bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {months.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart Area */}
      <div className="mx-5 mt-4 h-[420px] rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 flex items-center justify-center">
        {isLoading ? (
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        ) : error ? (
          <span className="text-sm text-red-500">{error}</span>
        ) : data.length === 0 ? (
          <span className="text-sm text-gray-400 dark:text-gray-500">No data available</span>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel} // ✅ properly typed with dark mode support
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer */}
      {data.length > 0 && !isLoading && (
        <div className="text-center text-sm text-gray-400 dark:text-gray-500 pb-3">
          Total Provinces: <span className="font-semibold text-blue-600">{data.length}</span>
          {' | '}
          Total Records: <span className="font-semibold text-blue-600">{totalRecords}</span>
        </div>
      )}
    </div>
  );
};