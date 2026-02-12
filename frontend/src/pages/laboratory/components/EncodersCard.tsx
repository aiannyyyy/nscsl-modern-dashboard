import React from 'react';
import { RefreshCw, User } from 'lucide-react';
import { useDemogCurrentMonth, useDemogTotals } from '../../../hooks/LaboratoryHooks/useDemogSummaryCards';

export const EncodersCard: React.FC = () => {
  const { stats, loading, error, refetch } = useDemogCurrentMonth();
  const totals = useDemogTotals(stats);

  const getCurrentMonthName = () => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const now = new Date();
    return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading current month statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-red-200 dark:border-red-800 p-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-400">Error Loading Data</h3>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={refetch}
              className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const technicians = [
    { name: "Jay Arr Apelado",  entryKey: "Jay Arr Apelado",  color: "bg-blue-500"   },
    { name: "Angelica Brutas",  entryKey: "Angelica Brutas",  color: "bg-green-600"  },
    { name: "Mary Rose Gomez",  entryKey: "Mary Rose Gomez",  color: "bg-orange-500" },
    { name: "Abigail Morfe",    entryKey: "Abigail Morfe",    color: "bg-red-600"    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Data Entry Statistics
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {getCurrentMonthName()}
          </p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {technicians.map((person, idx) => {
          const entryCount = stats.entry[person.entryKey as keyof typeof stats.entry] ?? 0;
          const entryPercent = totals.entry > 0
            ? ((entryCount / totals.entry) * 100).toFixed(1)
            : '0.0';

          return (
            <div
              key={idx}
              className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`${person.color} rounded-lg p-2.5 flex-shrink-0`}>
                  <User className="text-white" size={20} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-normal text-gray-600 dark:text-gray-400 mb-0.5 leading-tight">
                    {person.name}
                  </h3>

                  {/* Main Count */}
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none">
                      {entryCount.toLocaleString()}
                    </p>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                      ({entryPercent}%)
                    </span>
                  </div>

                  {/* Footer */}
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">
                    at the moment
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};