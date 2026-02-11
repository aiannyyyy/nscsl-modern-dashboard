import React, { useState } from 'react';

interface CashFlowData {
  month: string;
  inflow: number;
  outflow: number;
  netFlow: number;
}

type PeriodType = '6months' | '12months' | 'ytd';

const CashFlow: React.FC = () => {
  const [period, setPeriod] = useState<PeriodType>('6months');

  // Mock data - replace with actual API calls
  const cashFlowData: CashFlowData[] = [
    { month: 'Jan', inflow: 98000, outflow: 72000, netFlow: 26000 },
    { month: 'Feb', inflow: 105000, outflow: 75000, netFlow: 30000 },
    { month: 'Mar', inflow: 112000, outflow: 78000, netFlow: 34000 },
    { month: 'Apr', inflow: 108000, outflow: 76000, netFlow: 32000 },
    { month: 'May', inflow: 125000, outflow: 78000, netFlow: 47000 },
    { month: 'Jun', inflow: 130000, outflow: 80000, netFlow: 50000 },
  ];

  const maxValue = Math.max(...cashFlowData.map((d) => Math.max(d.inflow, d.outflow)));
  const totalInflow = cashFlowData.reduce((sum, d) => sum + d.inflow, 0);
  const totalOutflow = cashFlowData.reduce((sum, d) => sum + d.outflow, 0);
  const netCashFlow = totalInflow - totalOutflow;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-200">
          Cash Flow Analysis
        </h2>
        <select
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
          value={period}
          onChange={(e) => setPeriod(e.target.value as PeriodType)}
        >
          <option value="6months">Last 6 Months</option>
          <option value="12months">Last 12 Months</option>
          <option value="ytd">Year to Date</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800 transition-colors duration-200">
          <span className="block text-sm text-green-700 dark:text-green-400 font-medium transition-colors duration-200">
            Total Inflow
          </span>
          <span className="block text-2xl font-bold text-green-900 dark:text-green-300 mt-1 transition-colors duration-200">
            ${totalInflow.toLocaleString()}
          </span>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800 transition-colors duration-200">
          <span className="block text-sm text-red-700 dark:text-red-400 font-medium transition-colors duration-200">
            Total Outflow
          </span>
          <span className="block text-2xl font-bold text-red-900 dark:text-red-300 mt-1 transition-colors duration-200">
            ${totalOutflow.toLocaleString()}
          </span>
        </div>
        <div
          className={`rounded-lg p-4 border transition-colors duration-200 ${
            netCashFlow >= 0
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
              : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
          }`}
        >
          <span
            className={`block text-sm font-medium transition-colors duration-200 ${
              netCashFlow >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-orange-700 dark:text-orange-400'
            }`}
          >
            Net Cash Flow
          </span>
          <span
            className={`block text-2xl font-bold mt-1 transition-colors duration-200 ${
              netCashFlow >= 0 ? 'text-blue-900 dark:text-blue-300' : 'text-orange-900 dark:text-orange-300'
            }`}
          >
            ${netCashFlow.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 mb-6">
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 bg-green-500 dark:bg-green-400 rounded transition-colors duration-200" />
          <span className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">Inflow</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 bg-red-500 dark:bg-red-400 rounded transition-colors duration-200" />
          <span className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">Outflow</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded transition-colors duration-200" />
          <span className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">Net Flow</span>
        </div>
      </div>

      {/* Grouped Bar Chart */}
      <div className="mb-6">
        <div className="flex items-end justify-between space-x-4">
          {cashFlowData.map((data, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full flex justify-center items-end space-x-1 h-48 mb-2">
                {/* Inflow Bar */}
                <div
                  className="w-full bg-green-500 dark:bg-green-400 rounded-t hover:bg-green-600 dark:hover:bg-green-500 transition-colors cursor-pointer relative group"
                  style={{ height: `${(data.inflow / maxValue) * 100}%` }}
                >
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    ${data.inflow.toLocaleString()}
                  </div>
                  <span className="absolute top-1 left-1/2 transform -translate-x-1/2 text-xs font-medium text-white">
                    ${(data.inflow / 1000).toFixed(0)}k
                  </span>
                </div>
                {/* Outflow Bar */}
                <div
                  className="w-full bg-red-500 dark:bg-red-400 rounded-t hover:bg-red-600 dark:hover:bg-red-500 transition-colors cursor-pointer relative group"
                  style={{ height: `${(data.outflow / maxValue) * 100}%` }}
                >
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    ${data.outflow.toLocaleString()}
                  </div>
                  <span className="absolute top-1 left-1/2 transform -translate-x-1/2 text-xs font-medium text-white">
                    ${(data.outflow / 1000).toFixed(0)}k
                  </span>
                </div>
              </div>
              {/* Net Indicator */}
              <div
                className={`text-xs font-semibold mb-1 transition-colors duration-200 ${
                  data.netFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {data.netFlow >= 0 ? '↑' : '↓'} $
                {Math.abs(data.netFlow / 1000).toFixed(0)}k
              </div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">
                {data.month}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600 transition-colors duration-200">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 transition-colors duration-200">
          Key Insights
        </h3>
        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300 transition-colors duration-200">
          <li className="flex items-start">
            <span className="text-green-500 dark:text-green-400 mr-2">•</span>
            <span>Consistent positive cash flow over the last 6 months</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 dark:text-green-400 mr-2">•</span>
            <span>Revenue growth trend of 15% month-over-month</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-500 dark:text-blue-400 mr-2">•</span>
            <span>Expenses remain stable at ~62% of revenue</span>
          </li>
          <li className="flex items-start">
            <span className="text-indigo-500 dark:text-indigo-400 mr-2">•</span>
            <span>Strongest performance in May and June</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default CashFlow;