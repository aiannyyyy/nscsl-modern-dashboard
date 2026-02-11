import React from 'react';

interface Invoice {
  id: string;
  clientName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  status: 'current' | 'overdue' | 'critical';
}

const AccountsReceivable: React.FC = () => {
  // Mock data - replace with actual API calls
  const invoices: Invoice[] = [
    {
      id: '1',
      clientName: 'Tech Corp Inc.',
      invoiceNumber: 'INV-2024-001',
      amount: 15000,
      dueDate: '2024-06-20',
      daysOverdue: 0,
      status: 'current',
    },
    {
      id: '2',
      clientName: 'Design Studio LLC',
      invoiceNumber: 'INV-2024-002',
      amount: 8500,
      dueDate: '2024-06-10',
      daysOverdue: 5,
      status: 'overdue',
    },
    {
      id: '3',
      clientName: 'Marketing Solutions',
      invoiceNumber: 'INV-2024-003',
      amount: 12000,
      dueDate: '2024-05-30',
      daysOverdue: 16,
      status: 'critical',
    },
    {
      id: '4',
      clientName: 'Startup XYZ',
      invoiceNumber: 'INV-2024-004',
      amount: 5500,
      dueDate: '2024-06-25',
      daysOverdue: 0,
      status: 'current',
    },
  ];

  const totalReceivable = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const overdueAmount = invoices
    .filter((inv) => inv.status !== 'current')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const statusColors = {
    current: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
    overdue: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    critical: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 transition-colors duration-200">
          Accounts Receivable
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800 transition-colors duration-200">
            <span className="block text-sm text-blue-700 dark:text-blue-400 font-medium transition-colors duration-200">
              Total Outstanding
            </span>
            <span className="block text-2xl font-bold text-blue-900 dark:text-blue-300 mt-1 transition-colors duration-200">
              ${totalReceivable.toLocaleString()}
            </span>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800 transition-colors duration-200">
            <span className="block text-sm text-orange-700 dark:text-orange-400 font-medium transition-colors duration-200">
              Overdue
            </span>
            <span className="block text-2xl font-bold text-orange-900 dark:text-orange-300 mt-1 transition-colors duration-200">
              ${overdueAmount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="space-y-3 mb-6">
        {invoices.map((invoice) => (
          <div
            key={invoice.id}
            className={`border rounded-lg p-4 hover:shadow-md transition-all duration-200 ${statusColors[invoice.status]}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white transition-colors duration-200">
                  {invoice.clientName}
                </h3>
                <span className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">
                  {invoice.invoiceNumber}
                </span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900 dark:text-white transition-colors duration-200">
                  ${invoice.amount.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-gray-600 dark:text-gray-400 transition-colors duration-200">
                  Due: {new Date(invoice.dueDate).toLocaleDateString()}
                </span>
                {invoice.daysOverdue > 0 && (
                  <span className="px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 rounded text-xs font-medium transition-colors duration-200">
                    {invoice.daysOverdue} days overdue
                  </span>
                )}
              </div>
              <button className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200">
                Send Reminder
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex space-x-3">
        <button className="flex-1 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors duration-200">
          Generate Report
        </button>
        <button className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200">
          Send All Reminders
        </button>
      </div>
    </div>
  );
};

export default AccountsReceivable;