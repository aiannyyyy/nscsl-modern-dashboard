import React from 'react';
import FinancialSummary from './Accounting/FinancialSummary';
import RevenueChart from './Accounting/RevenueChart';
import ExpenseBreakdown from './Accounting/ExpenseBreakdown';
import RecentTransactions from './Accounting/RecentTransactions';
import AccountsReceivable from './Accounting/AccountsReceivable';
import AccountsPayable from './Accounting/AccountsPayable';
import CashFlow from './Accounting/CashFlow';

const AccountingOverview: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8 transition-colors duration-200">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-200">
          Accounting Dashboard
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">
          Financial Overview & Management
        </p>
      </div>

      {/* Financial Summary Cards */}
      <section className="mb-8">
        <FinancialSummary />
      </section>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-colors duration-200">
          <RevenueChart />
        </section>
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-colors duration-200">
          <ExpenseBreakdown />
        </section>
      </div>

      {/* Cash Flow Section */}
      <section className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-colors duration-200">
        <CashFlow />
      </section>

      {/* Accounts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-colors duration-200">
          <AccountsReceivable />
        </section>
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-colors duration-200">
          <AccountsPayable />
        </section>
      </div>

      {/* Recent Transactions */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-colors duration-200">
        <RecentTransactions />
      </section>
    </div>
  );
};

export default AccountingOverview;