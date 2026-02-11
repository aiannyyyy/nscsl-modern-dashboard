import React from 'react';

interface Bill {
  id: string;
  vendor: string;
  billNumber: string;
  amount: number;
  dueDate: string;
  category: string;
  status: 'upcoming' | 'due_soon' | 'overdue';
  isPaid: boolean;
}

const AccountsPayable: React.FC = () => {
  // Mock data - replace with actual API calls
  const bills: Bill[] = [
    {
      id: '1',
      vendor: 'Cloud Services Inc.',
      billNumber: 'BILL-CS-001',
      amount: 2500,
      dueDate: '2024-06-18',
      category: 'Technology',
      status: 'due_soon',
      isPaid: false,
    },
    {
      id: '2',
      vendor: 'Office Supplies Co.',
      billNumber: 'BILL-OS-045',
      amount: 850,
      dueDate: '2024-06-25',
      category: 'Operations',
      status: 'upcoming',
      isPaid: false,
    },
    {
      id: '3',
      vendor: 'Utility Company',
      billNumber: 'BILL-UC-202',
      amount: 1200,
      dueDate: '2024-06-08',
      category: 'Operations',
      status: 'overdue',
      isPaid: false,
    },
    {
      id: '4',
      vendor: 'Marketing Agency',
      billNumber: 'BILL-MA-789',
      amount: 5000,
      dueDate: '2024-06-30',
      category: 'Marketing',
      status: 'upcoming',
      isPaid: false,
    },
  ];

  const totalPayable = bills
    .filter((bill) => !bill.isPaid)
    .reduce((sum, bill) => sum + bill.amount, 0);

  const dueThisWeek = bills
    .filter((bill) => {
      const due = new Date(bill.dueDate);
      const today = new Date();
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return !bill.isPaid && due >= today && due <= weekFromNow;
    })
    .reduce((sum, bill) => sum + bill.amount, 0);

  const statusColors = {
    upcoming: 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600',
    due_soon: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    overdue: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  };

  const categoryColors: Record<string, string> = {
    Technology: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300',
    Operations: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300',
    Marketing: 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300',
    Salaries: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300',
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 transition-colors duration-200">
          Accounts Payable
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800 transition-colors duration-200">
            <span className="block text-sm text-red-700 dark:text-red-400 font-medium transition-colors duration-200">
              Total Outstanding
            </span>
            <span className="block text-2xl font-bold text-red-900 dark:text-red-300 mt-1 transition-colors duration-200">
              ${totalPayable.toLocaleString()}
            </span>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800 transition-colors duration-200">
            <span className="block text-sm text-orange-700 dark:text-orange-400 font-medium transition-colors duration-200">
              Due This Week
            </span>
            <span className="block text-2xl font-bold text-orange-900 dark:text-orange-300 mt-1 transition-colors duration-200">
              ${dueThisWeek.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Bills List */}
      <div className="space-y-3 mb-6">
        {bills.map((bill) => (
          <div
            key={bill.id}
            className={`border rounded-lg p-4 hover:shadow-md transition-all duration-200 ${statusColors[bill.status]}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white transition-colors duration-200">
                  {bill.vendor}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">
                    {bill.billNumber}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded transition-colors duration-200 ${
                      categoryColors[bill.category] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                    }`}
                  >
                    {bill.category}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900 dark:text-white transition-colors duration-200">
                  ${bill.amount.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-600 dark:text-gray-400 transition-colors duration-200">
                  Due: {new Date(bill.dueDate).toLocaleDateString()}
                </span>
                {bill.status === 'overdue' && (
                  <span className="px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 rounded text-xs font-medium transition-colors duration-200">
                    Overdue
                  </span>
                )}
                {bill.status === 'due_soon' && (
                  <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 rounded text-xs font-medium transition-colors duration-200">
                    Due Soon
                  </span>
                )}
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-2 bg-indigo-600 dark:bg-indigo-500 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors duration-200">
                  Pay Now
                </button>
                <button className="px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200">
                  Schedule
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex space-x-3">
        <button className="flex-1 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors duration-200">
          Pay All Due
        </button>
        <button className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200">
          Export Bills
        </button>
      </div>
    </div>
  );
};

export default AccountsPayable;