import React from 'react';

interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  darkColor: string;
}

const ExpenseBreakdown: React.FC = () => {
  // Mock data - replace with actual API calls
  const expenses: ExpenseCategory[] = [
    { category: 'Salaries', amount: 45000, percentage: 57.7, color: '#4F46E5', darkColor: '#818CF8' },
    { category: 'Operations', amount: 15000, percentage: 19.2, color: '#10B981', darkColor: '#34D399' },
    { category: 'Marketing', amount: 8000, percentage: 10.3, color: '#F59E0B', darkColor: '#FCD34D' },
    { category: 'Technology', amount: 6000, percentage: 7.7, color: '#EF4444', darkColor: '#F87171' },
    { category: 'Other', amount: 4000, percentage: 5.1, color: '#8B5CF6', darkColor: '#A78BFA' },
  ];

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Calculate donut chart segments
  const radius = 70;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-200">
          Expense Breakdown
        </h2>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">
          Total: <span className="text-gray-900 dark:text-white">${totalExpenses.toLocaleString()}</span>
        </span>
      </div>

      {/* Donut Chart */}
      <div className="flex justify-center mb-6">
        <div className="relative w-48 h-48">
          <svg viewBox="0 0 200 200" className="transform -rotate-90">
            {expenses.map((expense, index) => {
              const previousPercentages = expenses
                .slice(0, index)
                .reduce((sum, exp) => sum + exp.percentage, 0);
              const offset = (previousPercentages / 100) * circumference;
              const dashArray = (expense.percentage / 100) * circumference;

              return (
                <circle
                  key={index}
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke={expense.color}
                  strokeWidth="30"
                  strokeDasharray={`${dashArray} ${circumference}`}
                  strokeDashoffset={-offset}
                  className="transition-all duration-300 hover:opacity-80 cursor-pointer dark:hidden"
                />
              );
            })}
            {expenses.map((expense, index) => {
              const previousPercentages = expenses
                .slice(0, index)
                .reduce((sum, exp) => sum + exp.percentage, 0);
              const offset = (previousPercentages / 100) * circumference;
              const dashArray = (expense.percentage / 100) * circumference;

              return (
                <circle
                  key={`dark-${index}`}
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke={expense.darkColor}
                  strokeWidth="30"
                  strokeDasharray={`${dashArray} ${circumference}`}
                  strokeDashoffset={-offset}
                  className="transition-all duration-300 hover:opacity-80 cursor-pointer hidden dark:block"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">
              Total
            </span>
            <span className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-200">
              ${(totalExpenses / 1000).toFixed(0)}k
            </span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-3">
        {expenses.map((expense, index) => (
          <div
            key={index}
            className="flex items-center justify-between py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg px-2 -mx-2 transition-colors duration-200"
          >
            <div className="flex items-center space-x-3 flex-1">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0 dark:hidden"
                style={{ backgroundColor: expense.color }}
              />
              <span
                className="w-3 h-3 rounded-full flex-shrink-0 hidden dark:block"
                style={{ backgroundColor: expense.darkColor }}
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200">
                {expense.category}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm font-semibold text-gray-900 dark:text-white transition-colors duration-200">
                ${expense.amount.toLocaleString()}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 w-12 text-right transition-colors duration-200">
                {expense.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExpenseBreakdown;