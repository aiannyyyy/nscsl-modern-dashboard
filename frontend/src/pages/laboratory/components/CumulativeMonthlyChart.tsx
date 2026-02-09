// src/components/Laboratory/CumulativeMonthlyChart.tsx
import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useCumulativeMonthlyCensus } from '../../../hooks/LaboratoryHooks/useCensus';
import { downloadChart } from '../../../utils/chartDownloadUtils';

interface CumulativeData {
  month: string;
  [year: string]: number | string;
}

interface Props {
  expanded: boolean;
  onExpand: () => void;
}

export const CumulativeMonthlyChart: React.FC<Props> = ({ expanded, onExpand }) => {
  const [sampleType, setSampleType] = useState<'Received' | 'Screened'>('Received');
  const [showTable, setShowTable] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Fetch data using React Query hook
  const { data, isLoading, error, refetch } = useCumulativeMonthlyCensus({
    type: sampleType,
  });

  // Transform API data to chart format
  const { chartData, years } = useMemo(() => {
    if (!data?.data || data.data.length === 0) {
      return { chartData: [], years: [] };
    }

    // Extract unique years from data - FIX: Handle null/undefined YEAR values
    const uniqueYears = Array.from(
      new Set(
        data.data
          .filter(item => item.YEAR != null) // Filter out null/undefined years
          .map(item => item.YEAR.toString())
      )
    ).sort();

    // Initialize chart data structure with all 12 months
    const transformedData: CumulativeData[] = months.map((monthName, index) => ({
      month: monthName,
      monthIndex: index + 1, // Store month index for mapping
    }));

    // Populate data for each year and month
    data.data.forEach(item => {
      // FIX: Skip items with null/undefined YEAR or MONTH
      if (item.YEAR == null || item.MONTH == null) {
        return;
      }

      const monthIndex = item.MONTH - 1; // Convert to 0-based index
      const year = item.YEAR.toString();
      
      if (transformedData[monthIndex]) {
        transformedData[monthIndex][year] = item.TOTAL_SAMPLES || 0;
      }
    });

    // Fill missing values with 0
    transformedData.forEach(row => {
      uniqueYears.forEach(year => {
        if (row[year] === undefined) {
          row[year] = 0;
        }
      });
    });

    return {
      chartData: transformedData,
      years: uniqueYears,
    };
  }, [data, months]);

  // Prepare export data
  const exportData = useMemo(() => {
    return chartData.map(row => {
      const exportRow: any = { Month: row.month };
      years.forEach(year => {
        exportRow[year] = row[year];
      });
      return exportRow;
    });
  }, [chartData, years]);

  // Handle export
  const handleExport = async (format: 'png' | 'svg' | 'excel') => {
    setExportMenuOpen(false);
    
    const filename = `cumulative-monthly-${sampleType.toLowerCase()}-${new Date().toISOString().split('T')[0]}`;
    
    try {
      await downloadChart({
        elementId: 'cumulative-chart-container',
        filename,
        format,
        data: format === 'excel' ? exportData : undefined,
        sheetName: `${sampleType} Data`,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#111827' : '#ffffff',
        scale: 2,
      });
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <div
      className={`flex flex-col rounded-2xl shadow-lg overflow-hidden
        bg-white dark:bg-gray-900
        transition-all duration-300 ease-in-out
        ${expanded ? "h-[600px]" : "h-[380px]"}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b
        bg-gray-50 dark:bg-gray-800
        border-gray-200 dark:border-gray-700"
      >
        {/* Title */}
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0l-8 8m8-8v12M5 21H3a2 2 0 01-2-2V5a2 2 0 012-2h2m4 18h8" />
          </svg>
          Cumulative Monthly {data?.success && `(${sampleType})`}
        </h3>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {expanded && (
            <>
              <select
                value={sampleType}
                onChange={(e) => setSampleType(e.target.value as 'Received' | 'Screened')}
                className="h-8 px-3 text-xs rounded-lg border
                  bg-white dark:bg-gray-700
                  border-gray-300 dark:border-gray-600
                  text-gray-800 dark:text-gray-100
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Received">Received</option>
                <option value="Screened">Screened</option>
              </select>

              {/* Show/Hide Table Button */}
              {!isLoading && !error && chartData.length > 0 && (
                <button
                  onClick={() => setShowTable(!showTable)}
                  className="h-8 px-3 text-xs rounded-lg font-medium
                    bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600
                    text-gray-800 dark:text-gray-100 transition-colors flex items-center gap-1.5"
                  title={showTable ? "Show Chart" : "Show Table"}
                >
                  {showTable ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Chart
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Table
                    </>
                  )}
                </button>
              )}

              {/* Refresh Button 
              <button
                onClick={() => refetch()}
                className="h-8 px-3 text-xs rounded-lg font-medium
                  bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600
                  text-gray-800 dark:text-gray-100 transition-colors flex items-center gap-1.5"
                title="Refresh data"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              */}
            </>
          )}

          {/* Export Dropdown - Always visible */}
          {!isLoading && !error && chartData.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
                className="h-8 px-3 text-xs rounded-lg border
                  bg-white dark:bg-gray-700
                  border-gray-300 dark:border-gray-600
                  text-gray-800 dark:text-gray-100
                  hover:bg-gray-50 dark:hover:bg-gray-600
                  flex items-center gap-1.5 transition-colors"
                title="Export chart"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {exportMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setExportMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-1 w-48 rounded-lg shadow-lg border z-20
                    bg-white dark:bg-gray-800
                    border-gray-200 dark:border-gray-700
                    overflow-hidden"
                  >
                    <button
                      onClick={() => handleExport('png')}
                      className="w-full px-4 py-2.5 text-left text-xs hover:bg-gray-50 dark:hover:bg-gray-700
                        text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download as PNG
                    </button>
                    <button
                      onClick={() => handleExport('svg')}
                      className="w-full px-4 py-2.5 text-left text-xs hover:bg-gray-50 dark:hover:bg-gray-700
                        text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download as SVG
                    </button>
                    <button
                      onClick={() => handleExport('excel')}
                      className="w-full px-4 py-2.5 text-left text-xs hover:bg-gray-50 dark:hover:bg-gray-700
                        text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Export to Excel
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Expand / Collapse */}
          <button
            onClick={onExpand}
            className="h-8 px-4 text-xs rounded-lg font-medium
              bg-blue-600 hover:bg-blue-700
              text-white shadow transition-colors flex items-center gap-1.5"
          >
            {expanded ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-5 min-h-0 overflow-hidden" id="cumulative-chart-container">
        {/* Loading State */}
        {isLoading && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading chart...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <svg className="w-12 h-12 text-red-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-gray-800 dark:text-gray-200 font-medium mb-1">Failed to load data</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{error.message}</p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && chartData.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-sm text-gray-500 dark:text-gray-400">No data available</p>
            </div>
          </div>
        )}

        {/* Chart Display */}
        {!isLoading && !error && chartData.length > 0 && !showTable && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                className="dark:opacity-20"
                stroke="#e5e7eb" 
              />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12, fill: 'currentColor' }}
                className="text-gray-600 dark:text-gray-400"
                stroke="currentColor"
              />
              <YAxis 
                tick={{ fontSize: 12, fill: 'currentColor' }}
                className="text-gray-600 dark:text-gray-400"
                stroke="currentColor"
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: document.documentElement.classList.contains('dark') 
                    ? 'rgba(31, 41, 55, 0.95)' 
                    : 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid',
                  borderColor: document.documentElement.classList.contains('dark') 
                    ? '#374151' 
                    : '#e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: document.documentElement.classList.contains('dark') 
                    ? '#f3f4f6' 
                    : '#1f2937',
                }}
                formatter={(value: number) => value.toLocaleString()}
                labelStyle={{
                  color: document.documentElement.classList.contains('dark') 
                    ? '#f3f4f6' 
                    : '#1f2937',
                }}
              />
              <Legend 
                wrapperStyle={{ 
                  fontSize: '12px', 
                  paddingTop: '10px',
                  color: document.documentElement.classList.contains('dark') 
                    ? '#f3f4f6' 
                    : '#1f2937',
                }} 
              />
              {years.map((year, index) => (
                <Line
                  key={year}
                  type="monotone"
                  dataKey={year}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name={year}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}

        {/* Table Display */}
        {!isLoading && !error && chartData.length > 0 && showTable && (
          <div className="h-full overflow-auto">
            <table className="w-full text-center border-collapse text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-blue-600 dark:bg-blue-700 text-white">
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-semibold sticky left-0 bg-blue-600 dark:bg-blue-700 z-20">
                    Month
                  </th>
                  {years.map((year) => (
                    <th key={year} className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-semibold">
                      {year}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chartData.map((row) => (
                  <tr key={row.month} className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors">
                    <td className="border border-gray-300 dark:border-gray-700 px-3 py-2 font-medium text-gray-800 dark:text-gray-100 sticky left-0 bg-gray-50 dark:bg-gray-800 z-10">
                      {row.month}
                    </td>
                    {years.map((year) => (
                      <td key={year} className="border border-gray-300 dark:border-gray-700 px-3 py-2 text-gray-800 dark:text-gray-100">
                        {typeof row[year] === 'number' 
                          ? (row[year] as number).toLocaleString() 
                          : row[year] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Metadata - only visible when expanded */}
      {expanded && !isLoading && data?.success && (
        <div className="px-5 pb-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 pt-3">
            <span>Total Records: <strong className="text-gray-800 dark:text-gray-200">{data.count}</strong></span>
            <span>Execution Time: <strong className="text-gray-800 dark:text-gray-200">{data.executionTime}</strong></span>
            <span>Spectypes: <strong className="text-gray-800 dark:text-gray-200">{data.filters.spectypes.join(', ')}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};