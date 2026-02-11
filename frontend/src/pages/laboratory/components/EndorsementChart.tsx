import React, { useState, useEffect, useMemo } from 'react';
import { Download, ChevronDown } from 'lucide-react';
import { useGetAllEndorsements, useGetUniqueTestResults } from '../../../hooks/LaboratoryHooks/useUnsatEndorsement';
import { downloadChart } from '../../../utils/chartDownloadUtils';

interface EndorsementChartProps {
  refreshTrigger?: number;
}

export const EndorsementChart: React.FC<EndorsementChartProps> = ({ refreshTrigger }) => {
  const { data: endorsementsData, isLoading, refetch } = useGetAllEndorsements();
  const { data: uniqueTestResults = [] } = useGetUniqueTestResults();
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  
  // Year and Month filters
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');

  // Generate year options (last 5 years)
  const yearOptions = useMemo(() => {
    const years = [];
    for (let i = 0; i < 5; i++) {
      years.push(currentYear - i);
    }
    return years;
  }, [currentYear]);

  // Month options
  const monthOptions = [
    { value: 'all', label: 'All Months' },
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  useEffect(() => {
    console.log('📈 Chart useEffect triggered', { refreshTrigger });
    refetch();
  }, [refreshTrigger, refetch]);

  // Filter endorsements by year and month
  const filteredEndorsements = useMemo(() => {
    if (!endorsementsData || endorsementsData.length === 0) {
      return [];
    }

    return endorsementsData.filter(record => {
      // Use date_endorsed field from EndorsementData interface
      if (!record.date_endorsed) {
        return false; // Exclude records without a date
      }
      
      const recordDate = new Date(record.date_endorsed);
      const recordYear = recordDate.getFullYear();
      const recordMonth = recordDate.getMonth() + 1; // getMonth() returns 0-11

      const yearMatch = recordYear === selectedYear;
      const monthMatch = selectedMonth === 'all' || recordMonth === selectedMonth;

      return yearMatch && monthMatch;
    });
  }, [endorsementsData, selectedYear, selectedMonth]);

  // Calculate test result counts from filtered data
  const testResultStats = useMemo(() => {
    if (filteredEndorsements.length === 0) {
      return [];
    }

    const counts: { [key: string]: number } = {};
    
    filteredEndorsements.forEach(record => {
      const result = record.test_result || 'Unknown';
      counts[result] = (counts[result] || 0) + 1;
    });

    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
    }));
  }, [filteredEndorsements]);

  const total = testResultStats.reduce((sum, item) => sum + item.count, 0);

  const getPercentage = (value: number) => {
    if (total === 0) return 0;
    return ((value / total) * 100).toFixed(1);
  };

  // Color assignment based on test result keywords
  const getColorForResult = (result: string) => {
    const upperResult = result.toUpperCase();
    const positiveKeywords = ['PRESUMPTIVE', 'POSITIVE', 'ABNORMAL', 'ELEVATED', 'HIGH'];
    const negativeKeywords = ['NORMAL', 'NEGATIVE', 'WITHIN', 'WNL'];
    const pendingKeywords = ['PENDING', 'INCONCLUSIVE', 'RETEST', 'REPEAT'];
    
    if (positiveKeywords.some(keyword => upperResult.includes(keyword))) {
      return {
        stroke: '#ef4444',
        bg: 'bg-red-50 dark:bg-red-900/20',
        text: 'text-red-700 dark:text-red-300',
        label: 'text-red-600 dark:text-red-400'
      };
    } else if (negativeKeywords.some(keyword => upperResult.includes(keyword))) {
      return {
        stroke: '#10b981',
        bg: 'bg-green-50 dark:bg-green-900/20',
        text: 'text-green-700 dark:text-green-300',
        label: 'text-green-600 dark:text-green-400'
      };
    } else if (pendingKeywords.some(keyword => upperResult.includes(keyword))) {
      return {
        stroke: '#eab308',
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        text: 'text-yellow-700 dark:text-yellow-300',
        label: 'text-yellow-600 dark:text-yellow-400'
      };
    } else {
      return {
        stroke: '#3b82f6',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        text: 'text-blue-700 dark:text-blue-300',
        label: 'text-blue-600 dark:text-blue-400'
      };
    }
  };

  const handleDownload = async (format: 'png' | 'svg' | 'excel') => {
    setShowDownloadMenu(false);

    try {
      if (format === 'excel') {
        const excelData = testResultStats.map(stat => ({
          'Test Result': stat.name,
          'Count': stat.count,
          'Percentage': `${getPercentage(stat.count)}%`
        }));

        excelData.push({
          'Test Result': 'TOTAL',
          'Count': total,
          'Percentage': '100%'
        });

        await downloadChart({
          elementId: 'endorsement-chart',
          filename: `Endorsement_Test_Results_${selectedYear}_${selectedMonth === 'all' ? 'All' : monthOptions.find(m => m.value === selectedMonth)?.label}_${new Date().toISOString().split('T')[0]}`,
          format: 'excel',
          data: excelData,
          sheetName: 'Test Results',
        });
      } else {
        await downloadChart({
          elementId: 'endorsement-chart',
          filename: `Endorsement_Test_Results_${selectedYear}_${selectedMonth === 'all' ? 'All' : monthOptions.find(m => m.value === selectedMonth)?.label}_${new Date().toISOString().split('T')[0]}`,
          format,
          backgroundColor: '#ffffff',
          scale: 2,
        });
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 transition-colors h-full max-h-[500px] flex flex-col">
      <div className="p-4 flex-1 flex flex-col overflow-hidden">
        {/* Header with Download Button */}
        <div className="mb-3 flex items-start justify-between flex-shrink-0">
          <div>
            <h4 className="text-base font-semibold text-gray-900 dark:text-white">
              Endorsement Test Results Distribution
            </h4>
          </div>

          {/* Download Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              disabled={total === 0 || isLoading}
              className="h-8 px-3 text-xs rounded-lg border
                bg-white dark:bg-gray-700
                border-gray-300 dark:border-gray-600
                text-gray-800 dark:text-gray-100
                hover:bg-gray-50 dark:hover:bg-gray-600
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center gap-1.5 transition-colors"
            >
              <Download size={14} />
              Export
              <ChevronDown size={12} />
            </button>

            {showDownloadMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowDownloadMenu(false)}
                />
                <div className="absolute right-0 mt-1 w-44 rounded-lg shadow-lg border
                  bg-white dark:bg-gray-800
                  border-gray-200 dark:border-gray-700
                  z-20 overflow-hidden"
                >
                  <button
                    onClick={() => handleDownload('png')}
                    className="w-full px-4 py-2 text-left text-xs hover:bg-gray-50 dark:hover:bg-gray-700
                      text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-2"
                  >
                    <Download size={12} />
                    Download as PNG
                  </button>
                  <button
                    onClick={() => handleDownload('svg')}
                    className="w-full px-4 py-2 text-left text-xs hover:bg-gray-50 dark:hover:bg-gray-700
                      text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-2"
                  >
                    <Download size={12} />
                    Download as SVG
                  </button>
                  <button
                    onClick={() => handleDownload('excel')}
                    className="w-full px-4 py-2 text-left text-xs hover:bg-gray-50 dark:hover:bg-gray-700
                      text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-2"
                  >
                    <Download size={12} />
                    Export Data to Excel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Chart Area - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div id="endorsement-chart" className="flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg min-h-[200px] p-4">
            {isLoading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <div className="text-gray-600 dark:text-gray-400">Loading...</div>
              </div>
            ) : total === 0 ? (
              <div className="text-center">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-gray-600 dark:text-gray-400">No endorsement data available</p>
              </div>
            ) : (
              <div className="text-center w-full">
                <div className="grid grid-cols-1 gap-4 max-w-4xl mx-auto">
                  {testResultStats.map((stat, index) => {
                    const colors = getColorForResult(stat.name);
                    const percentage = (stat.count / total) * 100;
                    const circumference = 2 * Math.PI * 40;
                    const dashArray = `${(percentage / 100) * circumference} ${circumference}`;
                    
                    return (
                      <div key={index} className="text-center">
                        <div className="relative w-24 h-24 mx-auto mb-2">
                          <svg viewBox="0 0 100 100" className="transform -rotate-90">
                            <circle 
                              cx="50" 
                              cy="50" 
                              r="40" 
                              fill="none" 
                              stroke="#e5e7eb" 
                              strokeWidth="20" 
                            />
                            <circle
                              cx="50" 
                              cy="50" 
                              r="40" 
                              fill="none" 
                              stroke={colors.stroke} 
                              strokeWidth="20"
                              strokeDasharray={dashArray}
                              className="transition-all duration-500"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className={`text-xl font-bold ${colors.text}`}>
                              {stat.count}
                            </div>
                          </div>
                        </div>
                        <div className={`${colors.bg} rounded-lg p-2`}>
                          <div className={`text-xs font-semibold ${colors.text} truncate`} title={stat.name}>
                            {stat.name}
                          </div>
                          <div className={`text-xs ${colors.label} mt-1`}>
                            {getPercentage(stat.count)}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total Endorsements: <span className="font-semibold text-gray-900 dark:text-white">{total}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          {!isLoading && total > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-3">
              {testResultStats.map((stat, index) => {
                const colors = getColorForResult(stat.name);
                return (
                  <div key={index} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: colors.stroke }}></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[150px]" title={stat.name}>
                      {stat.name} ({stat.count})
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Year and Month Filters - Footer */}
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-center gap-3">
            {/* Year Dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Year:
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-1.5 text-xs rounded-lg border
                  bg-white dark:bg-gray-700
                  border-gray-300 dark:border-gray-600
                  text-gray-800 dark:text-gray-100
                  hover:bg-gray-50 dark:hover:bg-gray-600
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  transition-colors cursor-pointer"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Month:
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="px-3 py-1.5 text-xs rounded-lg border
                  bg-white dark:bg-gray-700
                  border-gray-300 dark:border-gray-600
                  text-gray-800 dark:text-gray-100
                  hover:bg-gray-50 dark:hover:bg-gray-600
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  transition-colors cursor-pointer"
              >
                {monthOptions.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};