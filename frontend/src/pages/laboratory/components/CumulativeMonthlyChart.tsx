import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface CumulativeData {
  month: string;
  [year: string]: number | string;
}

interface Props {
  expanded: boolean;
  onExpand: () => void;
}

export const CumulativeMonthlyChart: React.FC<Props> = ({ expanded, onExpand }) => {
  const [sampleType, setSampleType] = useState('Received');
  const [chartData, setChartData] = useState<CumulativeData[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  useEffect(() => {
    fetchChartData();
  }, [sampleType]);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call

      const simulatedYears = ['2020', '2021', '2022', '2023', '2024', '2025'];
      setYears(simulatedYears);

      const data = months.map((month, index) => {
        const monthData: CumulativeData = { month };
        simulatedYears.forEach((year) => {
          monthData[year] = Math.floor(Math.random() * 5000) + (index + 1) * 1000;
        });
        return monthData;
      });

      setChartData(data);
    } catch (error) {
      console.error('Error fetching cumulative monthly data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`flex flex-col rounded-2xl shadow-lg overflow-hidden
        bg-white dark:bg-gray-900
        transition-all duration-300 ease-in-out
        ${expanded ? "h-[600px]" : "h-[380px]"}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b
        bg-gray-50 dark:bg-gray-800
        border-gray-200 dark:border-gray-700"
      >
        {/* Title */}
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0l-8 8m8-8v12M5 21H3a2 2 0 01-2-2V5a2 2 0 012-2h2m4 18h8" />
          </svg>
          Cumulative Monthly
        </h3>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {expanded && (
            <select
              value={sampleType}
              onChange={(e) => setSampleType(e.target.value)}
              className="h-8 px-3 text-xs rounded-lg border
                bg-white dark:bg-gray-700
                border-gray-300 dark:border-gray-600
                text-gray-800 dark:text-gray-100
                focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Received">Received</option>
              <option value="Screened">Screened</option>
            </select>
          )}

          {/* Expand / Collapse */}
          <button
            onClick={onExpand}
            className="h-8 px-4 text-xs rounded-lg font-medium
              bg-blue-600 hover:bg-blue-700
              text-white shadow transition-colors flex items-center gap-1.5"
          >
            {expanded ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 p-5 min-h-0">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading chart...</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6b7280" />
              <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              {years.map((year, index) => (
                <Line
                  key={year}
                  type="monotone"
                  dataKey={year}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Data Table — only visible when expanded */}
      {expanded && !loading && chartData.length > 0 && (
        <div className="px-5 pb-4 overflow-x-auto">
          <table className="w-full text-center border-collapse text-sm">
            <thead>
              <tr className="bg-blue-600 dark:bg-blue-700 text-white">
                <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-semibold sticky left-0 bg-blue-600 dark:bg-blue-700">
                  Month
                </th>
                {years.map((year) => (
                  <th key={year} className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-semibold">
                    {year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chartData.map((row, index) => (
                <tr key={row.month} className="bg-gray-50 dark:bg-gray-800">
                  <td className="border border-gray-300 dark:border-gray-700 px-3 py-2 font-medium text-gray-800 dark:text-gray-100 sticky left-0 bg-gray-50 dark:bg-gray-800">
                    {row.month}
                  </td>
                  {years.map((year) => (
                    <td key={year} className="border border-gray-300 dark:border-gray-700 px-3 py-2 text-gray-800 dark:text-gray-100">
                      {typeof row[year] === 'number' ? (row[year] as number).toLocaleString() : row[year]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};