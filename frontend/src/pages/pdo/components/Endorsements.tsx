import React, { useState } from 'react';
import { Search, Download, Filter } from 'lucide-react';

type StatusFilter = 'all' | 'open' | 'closed';

export const Endorsements: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const handleExport = () => {
    console.log('Export endorsements');
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 transition-colors min-h-[500px]">
      <div className="p-5">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-5">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Endorsements
          </h4>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Lab Number..."
                className="pl-9 pr-3 py-1.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-xs border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-56"
              />
              <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Status:
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                    statusFilter === 'all'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <Filter size={12} />
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('open')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                    statusFilter === 'open'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  Open
                </button>
                <button
                  onClick={() => setStatusFilter('closed')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                    statusFilter === 'closed'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  Closed
                </button>
              </div>
            </div>

            {/* Export */}
            <button 
              onClick={handleExport}
              className="px-2.5 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs font-medium flex items-center gap-1.5"
            >
              <Download size={14} />
              Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800/50">
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Lab Number
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Patient Name
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Facility Code
                </th>
                <th className="px-3 py-2 text-center text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Attachment
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Date & Time Endorsed
                </th>
                <th className="px-3 py-2 text-center text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-xs">
                  No matching endorsements found
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
