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

// ─────────────────────────────────────────────
// CumulativeAnnualChart
// ─────────────────────────────────────────────

interface AnnualProps {
  expanded: boolean;
  onExpand: () => void;
}

export const CumulativeAnnualChart: React.FC<AnnualProps> = ({ expanded, onExpand }) => {
  const [monthRange, setMonthRange] = useState('January');
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const monthRanges = [
    'January', 'January-February', 'January-March', 'January-April',
    'January-May', 'January-June', 'January-July', 'January-August',
    'January-September', 'January-October', 'January-November', 'January-December'
  ];

  useEffect(() => {
    setLoading(true);
    // TODO: Replace with actual API call

    const years = Array.from({ length: 10 }, (_, i) => (2025 - i).toString());
    const data = years.map((year) => ({
      year,
      value: Math.floor(Math.random() * 50000) + 10000
    }));

    setChartData(data);
    setLoading(false);
  }, [monthRange]);

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
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Cumulative Annual
        </h3>

        <div className="flex items-center gap-2 flex-wrap">
          {expanded && (
            <select
              value={monthRange}
              onChange={(e) => setMonthRange(e.target.value)}
              className="h-8 px-3 text-xs rounded-lg border
                bg-white dark:bg-gray-700
                border-gray-300 dark:border-gray-600
                text-gray-800 dark:text-gray-100
                focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {monthRanges.map((range) => (
                <option key={range} value={range}>{range}</option>
              ))}
            </select>
          )}

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
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} stroke="#6b7280" />
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
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Samples" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// UnsatRateChart
// ─────────────────────────────────────────────

interface UnsatProps {
  expanded: boolean;
  onExpand: () => void;
}

export const UnsatRateChart: React.FC<UnsatProps> = ({ expanded, onExpand }) => {
  const [year1, setYear1] = useState('2024');
  const [year2, setYear2] = useState('2025');

  const years = Array.from({ length: 12 }, (_, i) => (2025 - i).toString());

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
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Unsat Rate
        </h3>

        <div className="flex items-center gap-2 flex-wrap">
          {expanded && (
            <>
              <select
                value={year1}
                onChange={(e) => setYear1(e.target.value)}
                className="h-8 px-3 text-xs rounded-lg border
                  bg-white dark:bg-gray-700
                  border-gray-300 dark:border-gray-600
                  text-gray-800 dark:text-gray-100
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>

              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">VS</span>

              <select
                value={year2}
                onChange={(e) => setYear2(e.target.value)}
                className="h-8 px-3 text-xs rounded-lg border
                  bg-white dark:bg-gray-700
                  border-gray-300 dark:border-gray-600
                  text-gray-800 dark:text-gray-100
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </>
          )}

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

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-5">
        <p className="text-gray-500 dark:text-gray-400 text-sm">Unsat Rate Chart — Coming Soon</p>
      </div>
    </div>
  );
};