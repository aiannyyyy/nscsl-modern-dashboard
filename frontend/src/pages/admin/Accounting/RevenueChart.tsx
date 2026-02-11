import React, { useState } from 'react';

interface MonthlyRevenue {
  month: string;
  amount: number;
}

type PeriodType = '6months' | '12months' | 'all';

const RevenueChart: React.FC = () => {
  const [period, setPeriod] = useState<PeriodType>('6months');

  // Mock data - replace with actual API data
  const monthlyRevenue: MonthlyRevenue[] = [
    { month: 'Jan', amount: 98000 },
    { month: 'Feb', amount: 105000 },
    { month: 'Mar', amount: 112000 },
    { month: 'Apr', amount: 108000 },
    { month: 'May', amount: 125000 },
    { month: 'Jun', amount: 130000 },
  ];

  const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.amount));
  const avgRevenue = Math.round(
    monthlyRevenue.reduce((sum, m) => sum + m.amount, 0) / monthlyRevenue.length
  );
  const ytdTotal = monthlyRevenue.reduce((sum, m) => sum + m.amount, 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-200">
          Revenue Trend
        </h2>
        <select
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
          value={period}
          onChange={(e) => setPeriod(e.target.value as PeriodType)}
        >
          <option value="6months">Last 6 Months</option>
          <option value="12months">Last Year</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Bar Chart */}
      <div className="mb-6">
        <div className="flex items-end justify-between space-x-2 h-64">
          {monthlyRevenue.map((data, index) => {
            const heightPercentage = (data.amount / maxRevenue) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col items-center justify-end h-full">
                  <div
                    className="w-full bg-indigo-500 dark:bg-indigo-400 rounded-t-lg hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-colors cursor-pointer relative group"
                    style={{ height: `${heightPercentage}%` }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      ${data.amount.toLocaleString()}
                    </div>
                    <span className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs font-medium text-white">
                      ${(data.amount / 1000).toFixed(0)}k
                    </span>
                  </div>
                </div>
                <span className="mt-2 text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">
                  {data.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div>
          <span className="block text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">
            Average Monthly
          </span>
          <span className="block text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-200">
            ${avgRevenue.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="block text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">
            YTD Total
          </span>
          <span className="block text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-200">
            ${ytdTotal.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RevenueChart;