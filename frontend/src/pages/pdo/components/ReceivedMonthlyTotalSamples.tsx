import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LabelList,
  ReferenceArea,
} from "recharts";
import {
  getMonthlyLabNoCount,
  calculatePercentageDiff,
  type MonthlyDataItem,
} from "../../../services/receivedApi";
import axios from "axios";

const years = Array.from({ length: 16 }, (_, i) => 2028 - i);
const provinces = ["BATANGAS", "CAVITE", "LAGUNA", "QUEZON", "RIZAL"];
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface Props {
  expanded: boolean;
  onExpand: () => void;
}

interface ChartDataPoint {
  month: string;
  monthIndex: number;
  year1: number;
  year2: number;
}

/**
 * Custom Label Component for bar values
 */
const CustomLabel = (props: any) => {
  const { x, y, width, value } = props;
  const isDarkMode = document.documentElement.classList.contains('dark');
  
  // Don't show label if value is 0
  if (value === 0) return null;
  
  return (
    <text
      x={x + width / 2}
      y={y - 5}
      fill={isDarkMode ? '#f3f4f6' : '#1f2937'}
      textAnchor="middle"
      fontSize={11}
      fontWeight={600}
    >
      {value}
    </text>
  );
};

export const MonthlyTotalSamples: React.FC<Props> = ({
  expanded,
  onExpand,
}) => {
  // ✅ Get current date
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonthIndex = currentDate.getMonth(); // 0-11
  const currentMonthName = months[currentMonthIndex];

  // ✅ Set defaults: Last year vs Current year, Current month
  const [yearA, setYearA] = useState(String(currentYear - 1));
  const [yearB, setYearB] = useState(String(currentYear));
  const [province, setProvince] = useState("BATANGAS");
  const [month, setMonth] = useState(currentMonthName);

  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Comparison stats
  const [yearATotal, setYearATotal] = useState(0);
  const [yearBTotal, setYearBTotal] = useState(0);

  // ✅ Get selected month index for highlighting
  const selectedMonthIndex = months.indexOf(month);

  /**
   * Fetch data for both years
   */
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("📅 Fetching data for:", { yearA, yearB, province, month });

      // ✅ Determine the date range based on current date
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1; // 1-12

      // Determine end dates for both years
      let yearAEndDate = `${yearA}-12-31`;
      let yearBEndDate = `${yearB}-12-31`;

      // Only limit to current month if the year IS the current year
      if (Number(yearA) === currentYear) {
        const lastDayOfMonth = new Date(Number(yearA), currentMonth, 0).getDate();
        yearAEndDate = `${yearA}-${String(currentMonth).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;
      }
      
      if (Number(yearB) === currentYear) {
        const lastDayOfMonth = new Date(Number(yearB), currentMonth, 0).getDate();
        yearBEndDate = `${yearB}-${String(currentMonth).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;
      }

      // Note: We no longer limit past years to match current year's period
      // Each year fetches its full available data

      console.log("📊 Date ranges:");
      console.log(`Year A (${yearA}): ${yearA}-01-01 to ${yearAEndDate}`);
      console.log(`Year B (${yearB}): ${yearB}-01-01 to ${yearBEndDate}`);

      // ✅ Fetch data with error handling for each year
      let responseA;
      let responseB;

      try {
        responseA = await getMonthlyLabNoCount({
          from: `${yearA}-01-01`,
          to: yearAEndDate,
          province: province,
        });
        console.log("✅ Year A data received:", responseA);
      } catch (err: any) {
        // Check if it's a 404 (no data) or other error
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 404) {
            console.warn(`⚠️ No data found for Year A (${yearA})`);
          } else {
            console.warn(`⚠️ Error fetching Year A (${yearA}):`, err.message);
          }
        }
        // Return empty data structure
        responseA = { 
          monthlyData: [], 
          summary: { totalRecords: 0, totalSamples: 0, totalLabNo: 0 },
          parameters: {
            type: 'monthly',
            spectypes: [],
            province: province,
            dateRange: { from: `${yearA}-01-01`, to: yearAEndDate }
          },
          rawData: []
        };
      }

      try {
        responseB = await getMonthlyLabNoCount({
          from: `${yearB}-01-01`,
          to: yearBEndDate,
          province: province,
        });
        console.log("✅ Year B data received:", responseB);
      } catch (err: any) {
        // Check if it's a 404 (no data) or other error
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 404) {
            console.warn(`⚠️ No data found for Year B (${yearB})`);
          } else {
            console.warn(`⚠️ Error fetching Year B (${yearB}):`, err.message);
          }
        }
        // Return empty data structure
        responseB = { 
          monthlyData: [], 
          summary: { totalRecords: 0, totalSamples: 0, totalLabNo: 0 },
          parameters: {
            type: 'monthly',
            spectypes: [],
            province: province,
            dateRange: { from: `${yearB}-01-01`, to: yearBEndDate }
          },
          rawData: []
        };
      }

      console.log("📊 Year A Response:", responseA);
      console.log("📊 Year B Response:", responseB);

      // Process data into chart format
      const dataByMonth: { [key: string]: ChartDataPoint } = {};

      // Initialize all months
      months.forEach((monthName, index) => {
        dataByMonth[monthName] = {
          month: monthName.substring(0, 3), // Short month name
          monthIndex: index,
          year1: 0,
          year2: 0,
        };
      });

      // Fill Year A data
      responseA.monthlyData?.forEach((item: MonthlyDataItem) => {
        const monthName = months[item.month - 1];
        if (dataByMonth[monthName]) {
          dataByMonth[monthName].year1 = item.total_samples;
        }
      });

      // Fill Year B data
      responseB.monthlyData?.forEach((item: MonthlyDataItem) => {
        const monthName = months[item.month - 1];
        if (dataByMonth[monthName]) {
          dataByMonth[monthName].year2 = item.total_samples;
        }
      });

      // Convert to array
      const chartArray = months.map((monthName) => dataByMonth[monthName]);
      setChartData(chartArray);

      // ✅ Calculate totals from the actual data received (same period comparison)
      const totalA = responseA.summary?.totalSamples || 0;
      const totalB = responseB.summary?.totalSamples || 0;
      setYearATotal(totalA);
      setYearBTotal(totalB);

      console.log("✅ Chart data processed:", chartArray);
      console.log("📈 Totals (Same Period) - Year A:", totalA, "Year B:", totalB);

    } catch (err) {
      console.error("❌ Failed to load monthly samples data", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
      
      // ✅ Even on error, initialize empty chart data instead of showing error
      const emptyData = months.map((monthName, index) => ({
        month: monthName.substring(0, 3),
        monthIndex: index,
        year1: 0,
        year2: 0,
      }));
      setChartData(emptyData);
      setYearATotal(0);
      setYearBTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [yearA, yearB, province]);

  // Calculate comparison stats
  const diff = yearBTotal - yearATotal;
  const percentDiff = calculatePercentageDiff(yearATotal, yearBTotal);
  const isIncrease = diff > 0;
  const isDecrease = diff < 0;

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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Monthly Total Samples
        </h3>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {expanded && (
            <>
              <select
                className="h-8 px-3 text-xs rounded-lg border
                  bg-white dark:bg-gray-700
                  border-gray-300 dark:border-gray-600
                  text-gray-800 dark:text-gray-100
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={yearA}
                onChange={(e) => setYearA(e.target.value)}
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">VS</span>

              <select
                className="h-8 px-3 text-xs rounded-lg border
                  bg-white dark:bg-gray-700
                  border-gray-300 dark:border-gray-600
                  text-gray-800 dark:text-gray-100
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={yearB}
                onChange={(e) => setYearB(e.target.value)}
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              <select
                className="h-8 px-3 text-xs rounded-lg border
                  bg-white dark:bg-gray-700
                  border-gray-300 dark:border-gray-600
                  text-gray-800 dark:text-gray-100
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
              >
                {provinces.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>

              {/* ✅ Month selector */}
              <select
                className="h-8 px-3 text-xs rounded-lg border
                  bg-white dark:bg-gray-700
                  border-gray-300 dark:border-gray-600
                  text-gray-800 dark:text-gray-100
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              >
                {months.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </>
          )}

          {/* Expand / Collapse */}
          <button
            onClick={onExpand}
            className="h-8 px-4 text-xs rounded-lg font-medium
              bg-blue-600 hover:bg-blue-700
              text-white shadow transition-colors flex items-center gap-1.5"
          >
            {expanded ? (
              <>
                Collapse
              </>
            ) : (
              <>
                Expand
              </>
            )}
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 p-5">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading chart...</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
              
              {/* ✅ Highlight selected month with a box */}
              <ReferenceArea
                x1={selectedMonthIndex - 0.5}
                x2={selectedMonthIndex + 0.5}
                fill="#fbbf24"
                fillOpacity={0.15}
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
              
              <XAxis 
                dataKey="month"
                tick={(props) => {
                  const { x, y, payload } = props;
                  const isSelected = payload.index === selectedMonthIndex;
                  const isDarkMode = document.documentElement.classList.contains('dark');
                  
                  return (
                    <text
                      x={x}
                      y={Number(y) + 10}
                      textAnchor="middle"
                      fill={isSelected ? '#f59e0b' : (isDarkMode ? '#9ca3af' : '#6b7280')}
                      fontSize={12}
                      fontWeight={isSelected ? 700 : 400}
                    >
                      {payload.value}
                    </text>
                  );
                }}
                axisLine={{ stroke: '#d1d5db' }}
                label={{
                  value: 'Month',
                  position: 'insideBottom',
                  offset: -5,
                  style: { fontSize: 12, fill: '#6b7280' }
                }}
              />
              
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#d1d5db' }}
              />
              
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
              />
              
              <Legend 
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                iconType="circle"
              />
              
              {/* Year 1 Bar - Blue */}
              <Bar 
                dataKey="year1" 
                name={yearA}
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              >
                <LabelList content={CustomLabel} />
              </Bar>
              
              {/* Year 2 Bar - Pink/Red */}
              <Bar 
                dataKey="year2" 
                name={yearB}
                fill="#ec4899"
                radius={[4, 4, 0, 0]}
              >
                <LabelList content={CustomLabel} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Comparison Table */}
      {expanded && !loading && chartData.length > 0 && (
        <div className="px-5 pb-4">
          <table className="w-full text-sm border-collapse text-center border border-gray-300 dark:border-gray-700">
            <thead className="bg-blue-600 dark:bg-blue-700 text-white">
              <tr>
                <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-semibold">Year</th>
                <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-semibold">{yearA}</th>
                <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-semibold">{yearB}</th>
                <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-semibold">INC/DEC</th>
                <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-semibold">%</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <td className="border border-gray-300 dark:border-gray-700 px-3 py-2 font-medium text-gray-800 dark:text-gray-100">
                  Total Received
                </td>
                <td className="border border-gray-300 dark:border-gray-700 px-3 py-2 text-gray-800 dark:text-gray-100">
                  {yearATotal.toLocaleString()}
                </td>
                <td className="border border-gray-300 dark:border-gray-700 px-3 py-2 text-gray-800 dark:text-gray-100">
                  {yearBTotal.toLocaleString()}
                </td>
                <td className={`border border-gray-300 dark:border-gray-700 px-3 py-2 font-semibold ${
                  isIncrease ? 'text-green-600 dark:text-green-400' : 
                  isDecrease ? 'text-red-600 dark:text-red-400' : 
                  'text-gray-600 dark:text-gray-400'
                }`}>
                  {diff > 0 ? '+' : ''}{diff.toLocaleString()}
                </td>
                <td className={`border border-gray-300 dark:border-gray-700 px-3 py-2 font-semibold ${
                  isIncrease ? 'text-green-600 dark:text-green-400' : 
                  isDecrease ? 'text-red-600 dark:text-red-400' : 
                  'text-gray-600 dark:text-gray-400'
                }`}>
                  {percentDiff} {isIncrease ? 'Increase' : isDecrease ? 'Decrease' : ''}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};