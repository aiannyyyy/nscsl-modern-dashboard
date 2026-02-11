import React, { useState } from 'react';

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  type: 'income' | 'expense';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
}

type FilterType = 'all' | 'income' | 'expense';

const RecentTransactions: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('all');

  // Mock data - replace with actual API calls
  const transactions: Transaction[] = [
    {
      id: 'TXN001',
      date: '2024-06-15',
      description: 'Client Payment - Project Alpha',
      category: 'Revenue',
      type: 'income',
      amount: 15000,
      status: 'completed',
    },
    {
      id: 'TXN002',
      date: '2024-06-14',
      description: 'Office Rent - June',
      category: 'Operations',
      type: 'expense',
      amount: 3500,
      status: 'completed',
    },
    {
      id: 'TXN003',
      date: '2024-06-14',
      description: 'Software Subscription',
      category: 'Technology',
      type: 'expense',
      amount: 299,
      status: 'completed',
    },
    {
      id: 'TXN004',
      date: '2024-06-13',
      description: 'Salary Payment - Team',
      category: 'Salaries',
      type: 'expense',
      amount: 45000,
      status: 'pending',
    },
    {
      id: 'TXN005',
      date: '2024-06-12',
      description: 'Client Payment - Project Beta',
      category: 'Revenue',
      type: 'income',
      amount: 8500,
      status: 'completed',
    },
  ];

  const filteredTransactions = transactions.filter(
    (t) => filter === 'all' || t.type === filter
  );

  const statusColors = {
    completed: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300',
    pending: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300',
    failed: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300',
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-200">
          Recent Transactions
        </h2>
        <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden transition-colors duration-200">
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
              filter === 'all'
                ? 'bg-indigo-600 dark:bg-indigo-500 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-l border-gray-300 dark:border-gray-600 transition-colors duration-200 ${
              filter === 'income'
                ? 'bg-indigo-600 dark:bg-indigo-500 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
            onClick={() => setFilter('income')}
          >
            Income
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-l border-gray-300 dark:border-gray-600 transition-colors duration-200 ${
              filter === 'expense'
                ? 'bg-indigo-600 dark:bg-indigo-500 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
            onClick={() => setFilter('expense')}
          >
            Expenses
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-200">
                Date
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-200">
                Description
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-200">
                Category
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-200">
                Amount
              </th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-200">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((transaction) => (
              <tr
                key={transaction.id}
                className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
              >
                <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">
                  {new Date(transaction.date).toLocaleDateString()}
                </td>
                <td className="py-4 px-4 text-sm text-gray-900 dark:text-white transition-colors duration-200">
                  {transaction.description}
                </td>
                <td className="py-4 px-4">
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded transition-colors duration-200">
                    {transaction.category}
                  </span>
                </td>
                <td
                  className={`py-4 px-4 text-sm font-semibold text-right transition-colors duration-200 ${
                    transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {transaction.type === 'income' ? '+' : '-'}$
                  {transaction.amount.toLocaleString()}
                </td>
                <td className="py-4 px-4 text-center">
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded capitalize transition-colors duration-200 ${
                      statusColors[transaction.status]
                    }`}
                  >
                    {transaction.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-6 flex justify-center">
        <button className="px-6 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200">
          View All Transactions
        </button>
      </div>
    </div>
  );
};

export default RecentTransactions;