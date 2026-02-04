import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface ChartData {
  day: string;
  year1: number;
  year2: number;
}

interface Props {
  expanded: boolean;
  onExpand: () => void;
}

export const DailyComparisonChart: React.FC<Props> = ({ expanded, onExpand }) => {
  const [year1, setYear1] = useState('2024');
  const [year2, setYear2] = useState('2025');
  const [month, setMonth] = useState('January');
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(false);

  const years = Array.from({ length: 12 }, (_, i) => (2025 - i).toString());
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetchChartData();
  }, [year1, year2, month]);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/laboratory/daily-comparison?year1=${year1}&year2=${year2}&month=${month}`);
      // const result = await response.json();

      // Simulated data
      const daysInMonth = 31;
      const data = Array.from({ length: daysInMonth }, (_, i) => ({
        day: (i + 1).toString(),
        year1: Math.floor(Math.random() * 100) + 50,
        year2: Math.floor(Math.random() * 100) + 50
      }));

      setChartData(data);
    } catch (error) {
      console.error('Error fetching chart data:', error);
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Daily Received Samples
        </h3>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {expanded && (
            <>
              {/* Year 1 */}
              <select
                value={year1}
                onChange={(e) => setYear1(e.target.value)}
                className="h-8 px-3 text-xs rounded-lg border
                  bg-white dark:bg-gray-700
                  border-gray-300 dark:border-gray-600
                  text-gray-800 dark:text-gray-100
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">VS</span>

              {/* Year 2 */}
              <select
                value={year2}
                onChange={(e) => setYear2(e.target.value)}
                className="h-8 px-3 text-xs rounded-lg border
                  bg-white dark:bg-gray-700
                  border-gray-300 dark:border-gray-600
                  text-gray-800 dark:text-gray-100
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              {/* Month */}
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="h-8 px-3 text-xs rounded-lg border
                  bg-white dark:bg-gray-700
                  border-gray-300 dark:border-gray-600
                  text-gray-800 dark:text-gray-100
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {months.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </>
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
      <div className="flex-1 p-5">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading chart...</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: expanded ? 60 : 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="day"
                angle={-45}
                textAnchor="end"
                height={expanded ? 80 : 60}
                tick={{ fontSize: expanded ? 12 : 10 }}
                stroke="#6b7280"
              />
              <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                iconType="circle"
              />
              <Bar dataKey="year1" fill="#3b82f6" name={year1} radius={[4, 4, 0, 0]} />
              <Bar dataKey="year2" fill="#ec4899" name={year2} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};