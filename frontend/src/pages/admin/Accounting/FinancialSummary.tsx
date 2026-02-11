import React from 'react';

interface SummaryCardProps {
  title: string;
  amount: number;
  change: number;
  icon: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, amount, change, icon }) => {
  const isPositive = change >= 0;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 flex items-start space-x-4 hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-gray-700">
      <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-2xl transition-colors duration-200">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate transition-colors duration-200">
          {title}
        </h3>
        <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-200">
          ${amount.toLocaleString()}
        </p>
        <span
          className={`inline-flex items-center mt-2 text-sm font-medium ${
            isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          } transition-colors duration-200`}
        >
          {isPositive ? '↑' : '↓'} {Math.abs(change)}%
          <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">vs last month</span>
        </span>
      </div>
    </div>
  );
};

const FinancialSummary: React.FC = () => {
  // Mock data - replace with actual API calls
  const summaryData: SummaryCardProps[] = [
    { title: 'Total Revenue', amount: 125000, change: 12.5, icon: '💰' },
    { title: 'Total Expenses', amount: 78000, change: -5.2, icon: '💸' },
    { title: 'Net Profit', amount: 47000, change: 18.3, icon: '📈' },
    { title: 'Cash Balance', amount: 215000, change: 8.7, icon: '💵' },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 transition-colors duration-200">
        Financial Summary
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryData.map((item, index) => (
          <SummaryCard key={index} {...item} />
        ))}
      </div>
    </div>
  );
};

export default FinancialSummary;