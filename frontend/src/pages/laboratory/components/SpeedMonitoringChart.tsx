import React, { useState, useMemo, useEffect } from "react";
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
  LabelList,
  ReferenceArea,
} from "recharts";
import { ChevronDown, RefreshCw } from "lucide-react";
import { downloadChart } from "../../../utils/chartDownloadUtils";
import { useSpeedMonitoring } from "../../../hooks/LaboratoryHooks/useSpeedMonitoring";

interface Props {
  expanded: boolean;
  onExpand: () => void;
}

export const SpeedMonitoringChart: React.FC<Props> = ({
  expanded,
  onExpand,
}) => {
  const currentDate = new Date();
  const [year, setYear] = useState(currentDate.getFullYear().toString());
  const [month, setMonth] = useState((currentDate.getMonth() + 1).toString());
  const [type, setType] = useState<'entry' | 'verification'>('entry');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.classList.contains("dark")
  );

  // Watch for dark mode changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // React Query hook
  const { data, isLoading, isError, error, refetch } = useSpeedMonitoring({
    year,
    month,
    type,
  });

  // Month names for display
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Performance thresholds based on type
  const performanceThresholds = useMemo(() => {
    if (type === 'entry') {
      return {
        ideal: { min: 0, max: 25 },
        acceptable: { min: 25, max: 35 },
        unacceptable: { min: 35, max: 100 }
      };
    } else {
      return {
        ideal: { min: 0, max: 20 },
        acceptable: { min: 20, max: 30 },
        unacceptable: { min: 30, max: 100 }
      };
    }
  }, [type]);

  // Name mapping for display
  const nameMap: Record<string, string> = {
    "JAY ARR": "Jay Arr Apelado",
    "Mary Rose": "Mary Rose Gomez",
    "ABIGAIL": "Abigail Morfe",
    "ANGELICA": "Angelica Brutas"
  };

  // Transform API data for chart
  const chartData = useMemo(() => {
    if (!data?.data) return [];

    // Group by technician and sum samples
    const technicianData: Record<string, { samples: number; seconds: number; count: number }> = {};

    data.data.forEach(entry => {
      const name = entry.FIRSTNAME;
      if (!technicianData[name]) {
        technicianData[name] = { samples: 0, seconds: 0, count: 0 };
      }
      technicianData[name].samples += entry.TOTAL_SAMPLES;
      technicianData[name].seconds += entry.MONTHLY_AVG_INIT_TIME_SECONDS;
      technicianData[name].count++;
    });

    // Transform to chart format
    return Object.entries(technicianData).map(([name, data]) => ({
      encoder: nameMap[name] || name,
      samples: data.samples,
      seconds: data.count > 0 ? Math.round(data.seconds / data.count) : 0,
    }));
  }, [data]);

  const exportData = useMemo(
    () =>
      chartData.map((d) => ({
        Encoder: d.encoder,
        "Total Samples Encoded": d.samples,
        "Seconds per Filter Card": d.seconds,
      })),
    [chartData]
  );

  const handleExport = async (format: "png" | "svg" | "excel") => {
    setExportMenuOpen(false);

    await downloadChart({
      elementId: "speed-monitoring-chart-container",
      filename: `speed-monitoring-${year}-${monthNames[parseInt(month) - 1].toLowerCase()}`,
      format,
      data: format === "excel" ? exportData : undefined,
      sheetName: "Speed Monitoring",
      backgroundColor: document.documentElement.classList.contains("dark")
        ? "#111827"
        : "#ffffff",
      scale: 2,
    });
  };

  const renderBarLabel = ({ x, y, width, value }: any) =>
    value ? (
      <text
        x={x + width / 2}
        y={y - 6}
        textAnchor="middle"
        fontSize={10}
        fontWeight={600}
        fill={isDarkMode ? "#e5e7eb" : "#374151"}
      >
        {value.toLocaleString()}
      </text>
    ) : null;

  const renderLineLabel = ({ x, y, value }: any) =>
    value ? (
      <text
        x={x}
        y={y - 10}
        textAnchor="middle"
        fontSize={10}
        fontWeight={600}
        fill="#fb923c"
      >
        {value}s
      </text>
    ) : null;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">
            {payload[0].payload.encoder}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-gray-600 dark:text-gray-400">
              <span style={{ color: entry.color }}>●</span>{' '}
              {entry.name}: {entry.name.includes('Samples') 
                ? entry.value.toLocaleString() 
                : `${entry.value}s`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col rounded-2xl shadow-lg overflow-hidden bg-white dark:bg-gray-900 h-[500px]">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col rounded-2xl shadow-lg overflow-hidden bg-white dark:bg-gray-900 h-[500px]">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">
              Error: {error?.message || 'Failed to load data'}
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 mx-auto"
            >
              <RefreshCw size={16} />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-2xl shadow-lg overflow-hidden bg-white dark:bg-gray-900 transition-all duration-300 h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
          Speed Monitoring – {type === 'entry' ? 'Data Entry' : 'Data Verification'}
          <div className="text-sm font-normal text-gray-500 dark:text-gray-400">
            {monthNames[parseInt(month) - 1]} {year}
          </div>
        </h3>

        <div className="flex items-center gap-2 flex-wrap">
          {expanded && (
            <>
              <Select 
                value={year} 
                setValue={setYear} 
                options={["2025", "2024", "2023"]} 
              />
              <Select
                value={month}
                setValue={setMonth}
                options={Array.from({ length: 12 }, (_, i) => (i + 1).toString())}
                labels={monthNames}
              />
              <Select
                value={type}
                setValue={(v) => setType(v as 'entry' | 'verification')}
                options={["entry", "verification"]}
                labels={["Data Entry", "Data Verification"]}
              />
            </>
          )}

          {/* Refresh 
          <button
            onClick={() => refetch()}
            className="h-8 px-3 text-xs rounded-lg border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-1.5"
          >
            <RefreshCw size={14} />
          </button>
          */}
          {/* Export */}
          <div className="relative">
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="h-8 px-3 text-xs rounded-lg border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
              <ChevronDown size={12} />
            </button>

            {exportMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setExportMenuOpen(false)}
                ></div>
                <div className="absolute right-0 mt-1 w-48 rounded-lg shadow-lg border z-20 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  {["png", "svg", "excel"].map((f) => (
                    <button
                      key={f}
                      onClick={() => handleExport(f as any)}
                      className="w-full px-4 py-2.5 text-left text-xs hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 first:rounded-t-lg last:rounded-b-lg"
                    >
                      Export {f.toUpperCase()}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            onClick={onExpand}
            className="h-8 px-4 text-xs rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white shadow"
          >
            {expanded ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>

      {/* Chart */}
      <div id="speed-monitoring-chart-container" className="flex-1 p-5 min-h-0 flex flex-col">
        {/* Performance Legend - Moved to top */}
        <div className="flex justify-center gap-8 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded border border-gray-300" style={{ backgroundColor: 'rgba(75, 192, 75, 0.4)' }}></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Ideal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded border border-gray-300" style={{ backgroundColor: 'rgba(255, 159, 64, 0.4)' }}></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Acceptable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded border border-gray-300" style={{ backgroundColor: 'rgba(255, 99, 132, 0.4)' }}></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Unacceptable</span>
          </div>
        </div>

        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 30, right: 30, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            
            {/* Performance threshold backgrounds */}
            <ReferenceArea
              yAxisId="right"
              y1={performanceThresholds.ideal.min}
              y2={performanceThresholds.ideal.max}
              fill="#4bc04b"
              fillOpacity={0.1}
              strokeOpacity={0}
            />
            <ReferenceArea
              yAxisId="right"
              y1={performanceThresholds.acceptable.min}
              y2={performanceThresholds.acceptable.max}
              fill="#ff9f40"
              fillOpacity={0.1}
              strokeOpacity={0}
            />
            <ReferenceArea
              yAxisId="right"
              y1={performanceThresholds.unacceptable.min}
              y2={performanceThresholds.unacceptable.max}
              fill="#ff6384"
              fillOpacity={0.1}
              strokeOpacity={0}
            />

            <XAxis 
              dataKey="encoder" 
              tick={{ fill: isDarkMode ? "#9ca3af" : "#4b5563" }}
            />
            <YAxis 
              yAxisId="left"
              label={{ 
                value: 'No. of Samples', 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: isDarkMode ? "#9ca3af" : "#4b5563" }
              }}
              tick={{ fill: isDarkMode ? "#9ca3af" : "#4b5563" }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              domain={[0, 70]}
              label={{ 
                value: 'Seconds', 
                angle: 90, 
                position: 'insideRight',
                style: { fill: isDarkMode ? "#9ca3af" : "#4b5563" }
              }}
              tick={{ fill: isDarkMode ? "#9ca3af" : "#4b5563" }}
            />
            
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom"
              wrapperStyle={{ paddingTop: '10px' }}
            />

            <Bar 
              dataKey="samples" 
              fill="#7dd3fc" 
              name="Total Samples Encoded"
              yAxisId="left"
            >
              <LabelList content={renderBarLabel} />
            </Bar>

            <Line
              yAxisId="right"
              type="monotone"
              dataKey="seconds"
              stroke="#fb923c"
              strokeWidth={3}
              dot={{ r: 5, fill: "#fb923c", strokeWidth: 2, stroke: "#fff" }}
              name="Seconds per Filter Card"
            >
              <LabelList content={renderLineLabel} />
            </Line>
          </ComposedChart>
        </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

/* Select Component */
const Select = ({
  value,
  setValue,
  options,
  labels,
}: {
  value: string;
  setValue: (v: string) => void;
  options: string[];
  labels?: string[];
}) => (
  <select
    value={value}
    onChange={(e) => setValue(e.target.value)}
    className="h-8 px-3 text-xs rounded-lg border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
  >
    {options.map((o, i) => (
      <option key={o} value={o}>
        {labels ? labels[i] : o}
      </option>
    ))}
  </select>
);