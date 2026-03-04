import React, { useState, useEffect } from 'react';
import { Download, ChevronDown } from 'lucide-react';
import {
  getLopezPurchasedFilterCards,
  type FilterCardResult,
} from '../../../services/PDOServices/lopezFilterCardServices';

const currentDate = new Date();
const currentMonth = currentDate.getMonth() + 1;
const currentYear = currentDate.getFullYear();

const months = [
  { label: 'January', value: 1 },
  { label: 'February', value: 2 },
  { label: 'March', value: 3 },
  { label: 'April', value: 4 },
  { label: 'May', value: 5 },
  { label: 'June', value: 6 },
  { label: 'July', value: 7 },
  { label: 'August', value: 8 },
  { label: 'September', value: 9 },
  { label: 'October', value: 10 },
  { label: 'November', value: 11 },
  { label: 'December', value: 12 },
];

const years = Array.from({ length: 16 }, (_, i) => currentYear - i);

const getLastDayOfMonth = (year: number, month: number) =>
  new Date(year, month, 0).getDate();

export const LopezPurchasedFilterCardsTable = () => {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [data, setData] = useState<FilterCardResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  const fetchData = async (month: number, year: number) => {
    setLoading(true);
    try {
      const lastDay = getLastDayOfMonth(year, month);
      const date_from = `${year}-${String(month).padStart(2, '0')}-01`;
      const date_to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const result = await getLopezPurchasedFilterCards({ date_from, date_to });
      setData(result.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on mount and when month/year changes
  useEffect(() => {
    fetchData(selectedMonth, selectedYear); // initial fetch

    const interval = setInterval(() => {
        fetchData(selectedMonth, selectedYear);
    }, 3600000); // poll every 1 hour

    return () => clearInterval(interval);
    }, [selectedMonth, selectedYear]);

  const handleExportExcel = () => {
    setShowDownloadMenu(false);
    const monthLabel = months.find(m => m.value === selectedMonth)?.label;
    const headers = ['City', 'Total Count'];
    const rows = data.map(row => [row.CITY, row.TOTAL_COUNT]);
    const total = data.reduce((sum, row) => sum + row.TOTAL_COUNT, 0);
    rows.push(['TOTAL', total]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Lopez_FilterCards_${monthLabel}_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPNG = () => {
    setShowDownloadMenu(false);
    const element = document.getElementById('lopez-filter-cards-table');
    if (!element) return;

    import('html2canvas').then(({ default: html2canvas }) => {
      html2canvas(element, { backgroundColor: '#ffffff', scale: 2 }).then(canvas => {
        const link = document.createElement('a');
        link.download = `Lopez_FilterCards_${selectedMonth}_${selectedYear}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    }).catch(() => console.error('html2canvas not installed. Run: npm install html2canvas'));
  };

  const totalCount = data.reduce((sum, row) => sum + row.TOTAL_COUNT, 0);

  return (
    <div className="w-1/2 flex flex-col rounded-2xl shadow-lg overflow-hidden bg-white dark:bg-gray-900 transition-all duration-300">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 17v-2a2 2 0 00-2-2H5a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v8m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          Lopez Purchased Filter Cards
        </h3>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="h-8 px-3 text-xs rounded-lg border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          <select
            className="h-8 px-3 text-xs rounded-lg border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Export Button */}
          <div className="relative">
            <button
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              disabled={loading || data.length === 0}
              className="h-8 px-3 text-xs rounded-lg border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
            >
              <Download size={14} />
              Export
              <ChevronDown size={12} />
            </button>

            {showDownloadMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDownloadMenu(false)} />
                <div className="absolute right-0 mt-1 w-44 rounded-lg shadow-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 z-20 overflow-hidden">
                  <button
                    onClick={handleExportPNG}
                    className="w-full px-4 py-2 text-left text-xs hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-2"
                  >
                    <Download size={12} />
                    Download as PNG
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="w-full px-4 py-2 text-left text-xs hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-2"
                  >
                    <Download size={12} />
                    Export Data to Excel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div id="lopez-filter-cards-table" className="p-5">
        <div className="max-h-[500px] overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="sticky top-0 bg-blue-600 dark:bg-blue-700 text-white uppercase text-xs">
              <tr>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3 text-right">Total Count</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-gray-400">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-gray-400 text-xs">
                    No data found.
                  </td>
                </tr>
              ) : (
                <>
                  {data.map((row, index) => (
                    <tr
                      key={index}
                      className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{row.CITY}</td>
                      <td className="px-4 py-2 text-right font-medium text-gray-800 dark:text-gray-100">
                        {row.TOTAL_COUNT.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 font-semibold">
                    <td className="px-4 py-2 text-gray-800 dark:text-gray-100">TOTAL</td>
                    <td className="px-4 py-2 text-right text-gray-800 dark:text-gray-100">
                      {totalCount.toLocaleString()}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};