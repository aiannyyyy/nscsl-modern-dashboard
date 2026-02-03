import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { getCarListGrouped, getMonthDateRange } from "../../../services/carListApi";

const COLORS = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
  '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF9F40'
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

interface CorrectiveActionReportChartProps {
  refreshTrigger?: number;
}

export const CorrectiveActionReportChart: React.FC<CorrectiveActionReportChartProps> = ({ 
  refreshTrigger = 0 
}) => {
  const [month, setMonth] = useState(getCurrentMonth()); // ✅ FIXED: Use current month
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => (currentYear - i).toString());

  useEffect(() => {
    fetchData();
  }, [month, year, refreshTrigger]);

  const fetchData = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const dateRange = getMonthDateRange(month, year);
      
      if (dateRange) {
        const result = await getCarListGrouped(dateRange.start, dateRange.end);
        
        // Transform data for Recharts
        const chartData = result
          .filter(item => item.sub_code1)
          .map(item => ({
            name: item.sub_code1,
            value: item.count
          }));

        setData(chartData);
      }
    } catch (err) {
      console.error("Error fetching CAR data:", err);
      setError("Failed to load chart data");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ FIXED: Add dark mode support to labels
  const renderCustomLabel = ({ percent }: any) => {
    return `${(percent * 100).toFixed(0)}%`;
  };

  const totalRecords = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-lg h-[550px]">
      {/* Header */}
      <div className="flex justify-between items-start px-5 py-4 border-b bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
        <h4 className="font-semibold text-gray-800 dark:text-gray-100">
          Corrective Action Reports
        </h4>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Month */}
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="h-8 px-3 text-xs rounded-full border bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {months.map((m) => (
              <option key={m} value={m} className="dark:bg-gray-700">
                {m}
              </option>
            ))}
          </select>
          
          {/* Year */}
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="h-8 px-3 text-xs rounded-full border bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {years.map((y) => (
              <option key={y} value={y} className="dark:bg-gray-700">
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart Area */}
      <div className="mx-5 mt-4 h-[400px] rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-sm text-red-500">{error}</span>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-sm text-gray-400 dark:text-gray-500">
              No data available for selected period
            </span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={renderCustomLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number | undefined) => {
                  return value !== undefined ? [`${value} records`, 'Count'] : ['0 records', 'Count'];
                }}
                contentStyle={{
                  backgroundColor: 'var(--tooltip-bg, white)',
                  border: '1px solid var(--tooltip-border, #e5e7eb)',
                  borderRadius: '0.5rem'
                }}
              />
              <Legend 
                layout="vertical" 
                align="right"
                verticalAlign="middle"
                wrapperStyle={{ fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-400 dark:text-gray-500 mt-3">
        Total Records: <span className="font-semibold text-blue-600">{totalRecords}</span>
      </div>
    </div>
  );
};