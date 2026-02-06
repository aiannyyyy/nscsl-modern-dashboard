import React, { useState, useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList
} from 'recharts';
import { Download, ChevronDown } from 'lucide-react';
import { useCumulativeAnnualCensus } from '../../../hooks/LaboratoryHooks/useCumulativeAnnualCencus';
import { downloadChart } from '../../../utils/chartDownloadUtils';

interface ChartData {
  year: string;
  test_6: number;
  enbs: number;
  cumulative: number;
}

interface Props {
  expanded: boolean;
  onExpand: () => void;
}

export const CumulativeAnnualChart: React.FC<Props> = ({ expanded, onExpand }) => {
  const [monthRange, setMonthRange] = useState('January');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const monthRanges = [
    { value: '01', label: 'January' },
    { value: '02', label: 'January-February' },
    { value: '03', label: 'January-March' },
    { value: '04', label: 'January-April' },
    { value: '05', label: 'January-May' },
    { value: '06', label: 'January-June' },
    { value: '07', label: 'January-July' },
    { value: '08', label: 'January-August' },
    { value: '09', label: 'January-September' },
    { value: '10', label: 'January-October' },
    { value: '11', label: 'January-November' },
    { value: '12', label: 'January-December' }
  ];

  // Fetch data using React Query hook
  const { data, isLoading, error, refetch } = useCumulativeAnnualCensus();

  // Transform API data to chart format
  const chartData: ChartData[] = useMemo(() => {
    if (!data?.data || data.data.length === 0) {
      return [];
    }

    // Get selected month number (01-12)
    const selectedMonth = monthRanges.find(m => m.label === monthRange)?.value || '01';

    // Group data by year - FULL YEAR totals for bars (ignore month selection for bars)
    const yearMap = new Map<string, { test_6: number; enbs: number }>();

    data.data.forEach(item => {
      const [year] = item.YEAR_MONTH.split('-');
      
      if (!yearMap.has(year)) {
        yearMap.set(year, { test_6: 0, enbs: 0 });
      }
      
      const yearData = yearMap.get(year)!;
      yearData.test_6 += item.TEST_6 || 0;
      yearData.enbs += item.ENBS || 0;
    });

    // Calculate cumulative values for each year UP TO selected month
    const cumulativeByYear = new Map<string, number>();
    
    // Sort all data by year-month
    const sortedData = [...data.data].sort((a, b) => a.YEAR_MONTH.localeCompare(b.YEAR_MONTH));
    
    sortedData.forEach(item => {
      const [year, month] = item.YEAR_MONTH.split('-');
      
      // Only include months up to selected month for cumulative
      if (month <= selectedMonth) {
        const currentCumulative = cumulativeByYear.get(year) || 0;
        cumulativeByYear.set(year, currentCumulative + (item.TEST_6 || 0) + (item.ENBS || 0));
      }
    });

    // Convert to chart format
    const result: ChartData[] = Array.from(yearMap.entries())
      .map(([year, values]) => ({
        year,
        test_6: values.test_6,  // Full year total
        enbs: values.enbs,      // Full year total
        cumulative: cumulativeByYear.get(year) || 0  // Cumulative up to selected month
      }))
      .sort((a, b) => a.year.localeCompare(b.year));

    return result;
  }, [data, monthRange]);

  // Prepare export data
  const exportData = useMemo(() => {
    return chartData.map(row => ({
      Year: row.year,
      'Test 6': row.test_6,
      'ENBS': row.enbs,
      'Cumulative': row.cumulative || '-'
    }));
  }, [chartData]);

  // Handle export
  const handleExport = async (format: 'png' | 'svg' | 'excel') => {
    setExportMenuOpen(false);
    
    const filename = `cumulative-annual-census-${monthRange.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}`;
    
    try {
      await downloadChart({
        elementId: 'cumulative-annual-chart-container',
        filename,
        format,
        data: format === 'excel' ? exportData : undefined,
        sheetName: 'Annual Census',
        backgroundColor: document.documentElement.classList.contains('dark') ? '#111827' : '#ffffff',
        scale: 2,
      });
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  // Custom label renderer for bars
  const renderBarLabel = (props: any) => {
    const { x, y, width, value } = props;
    if (value === 0) return null;
    
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    return (
      <text
        x={x + width / 2}
        y={y - 5}
        fill={isDarkMode ? '#e5e7eb' : '#374151'}
        textAnchor="middle"
        fontSize={10}
        fontWeight="600"
      >
        {value.toLocaleString()}
      </text>
    );
  };

  // Custom label renderer for line
  const renderLineLabel = (props: any) => {
    const { x, y, value } = props;
    if (value === 0) return null;
    
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    return (
      <text
        x={x}
        y={y - 10}
        fill="#000"
        textAnchor="middle"
        fontSize={11}
        fontWeight="700"
      >
        {value.toLocaleString()}
      </text>
    );
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
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Cumulative Annual Census Of Samples Received ({monthRange})
        </h3>

        <div className="flex items-center gap-2 flex-wrap">
          {expanded && (
            <>
              <select
                value={monthRange}
                onChange={(e) => setMonthRange(e.target.value)}
                className="h-8 px-3 text-xs rounded-lg border
                  bg-white dark:bg-gray-700
                  border-gray-300 dark:border-gray-600
                  text-gray-800 dark:text-gray-100
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {monthRanges.map((range) => (
                  <option key={range.label} value={range.label}>{range.label}</option>
                ))}
              </select>
            </>
          )}

          {/* Export Dropdown */}
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
              >
                <Download size={14} />
                Export
                <ChevronDown size={12} />
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
                      <Download size={14} />
                      Download as PNG
                    </button>
                    <button
                      onClick={() => handleExport('svg')}
                      className="w-full px-4 py-2.5 text-left text-xs hover:bg-gray-50 dark:hover:bg-gray-700
                        text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-2"
                    >
                      <Download size={14} />
                      Download as SVG
                    </button>
                    <button
                      onClick={() => handleExport('excel')}
                      className="w-full px-4 py-2.5 text-left text-xs hover:bg-gray-50 dark:hover:bg-gray-700
                        text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-2"
                    >
                      <Download size={14} />
                      Export to Excel
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

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

      {/* Chart */}
      <div id="cumulative-annual-chart-container" className="flex-1 p-5 min-h-0">
        {isLoading && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading chart...</p>
            </div>
          </div>
        )}

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

        {!isLoading && !error && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 30, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                className="dark:opacity-20"
                stroke="#e5e7eb" 
              />
              <XAxis 
                dataKey="year" 
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
              
              {/* Stacked Bars */}
              <Bar dataKey="test_6" stackId="a" fill="#60a5fa" name="Test 6" radius={[0, 0, 0, 0]}>
                <LabelList dataKey="test_6" content={renderBarLabel} position="top" />
              </Bar>
              <Bar dataKey="enbs" stackId="a" fill="#f472b6" name="ENBS" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="enbs" content={renderBarLabel} position="top" />
              </Bar>
              
              {/* Cumulative Line */}
              <Line 
                type="monotone" 
                dataKey="cumulative" 
                stroke="#000" 
                strokeWidth={3}
                dot={{ r: 5, fill: '#000' }}
                activeDot={{ r: 7 }}
                name="Cumulative"
              >
                <LabelList dataKey="cumulative" content={renderLineLabel} />
              </Line>
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Metadata - only visible when expanded */}
      {expanded && !isLoading && data?.success && (
        <div className="px-5 pb-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 pt-3">
            <span>Total Records: <strong className="text-gray-800 dark:text-gray-200">{data.count}</strong></span>
            <span>Execution Time: <strong className="text-gray-800 dark:text-gray-200">{data.executionTime}</strong></span>
            <span>Period: <strong className="text-gray-800 dark:text-gray-200">{monthRange}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};