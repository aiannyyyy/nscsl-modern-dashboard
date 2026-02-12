import React, { useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Sector,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Download, ChevronDown, Loader2, X, User } from "lucide-react";
import { downloadChart } from "../../../utils/chartDownloadUtils";
import { useCommonErrors, useCommonErrorBreakdown } from "../../../hooks/LaboratoryHooks/useCommonError";

interface ErrorData {
  error: string;
  count: number;
}

interface Props {
  expanded: boolean;
  onExpand: () => void;
}

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const USERNAME_MAP: Record<string, string> = {
  AAMORFE: "Abigail Morfe",
  JMAPELADO: "Jay Arr Apelado",
  MRGOMEZ: "Mary Rose Gomez",
  ABBRUTAS: "Angelica Brutas",
};

const getDisplayName = (username: string): string =>
  USERNAME_MAP[username.toUpperCase()] ?? username;

// ─────────────────────────────────────────────
// Breakdown Modal Component
// ─────────────────────────────────────────────
interface BreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableColumn: string;
  year: number;
  month: number;
  // Pass pre-computed tech data from parent to avoid extra API call
  techData: { name: string; count: number; percentage: string }[];
  totalCount: number;
}

const BreakdownModal: React.FC<BreakdownModalProps> = ({
  isOpen,
  onClose,
  tableColumn,
  year,
  month,
  techData,
  totalCount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl
        bg-white dark:bg-gray-900
        border border-gray-200 dark:border-gray-700"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b
          bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800
          border-gray-200 dark:border-gray-700"
        >
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Error Breakdown: {tableColumn}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {MONTHS[month - 1]} {year}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors
              hover:bg-white dark:hover:bg-gray-700
              text-gray-500 dark:text-gray-400
              hover:text-gray-700 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {techData.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No breakdown data available
              </p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  className="p-4 rounded-xl border
                  bg-blue-50 dark:bg-blue-900/20
                  border-blue-200 dark:border-blue-800"
                >
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    Total Errors
                  </p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                    {totalCount}
                  </p>
                </div>
                <div
                  className="p-4 rounded-xl border
                  bg-purple-50 dark:bg-purple-900/20
                  border-purple-200 dark:border-purple-800"
                >
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                    Error Type
                  </p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1 truncate">
                    {tableColumn}
                  </p>
                </div>
                <div
                  className="p-4 rounded-xl border
                  bg-green-50 dark:bg-green-900/20
                  border-green-200 dark:border-green-800"
                >
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    Demog Encoders
                  </p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                    {techData.length}
                  </p>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="p-4 rounded-xl border bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                  Errors by Demog Encoders
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={techData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      stroke="currentColor"
                      className="text-gray-600 dark:text-gray-400"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      stroke="currentColor"
                      className="text-gray-600 dark:text-gray-400"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: document.documentElement.classList.contains("dark")
                          ? "#1f2937"
                          : "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                      formatter={(value: any, name: string) => [
                        value,
                        name === "count" ? "Errors" : name,
                      ]}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Demog Encoder Details Table */}
              <div className="rounded-xl border overflow-hidden bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Encoders
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Error Count
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Percentage
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {[...techData]
                        .sort((a, b) => b.count - a.count)
                        .map((tech, index) => (
                          <tr
                            key={tech.name}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold
                                ${
                                  index === 0
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                    : index === 1
                                    ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                    : index === 2
                                    ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                                    : "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                                }`}
                              >
                                {index + 1}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-10 h-10 rounded-full flex items-center justify-center
                                  bg-gradient-to-br from-blue-500 to-indigo-600
                                  text-white font-semibold"
                                >
                                  <User size={20} />
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {tech.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {tech.count}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-blue-500 rounded-full transition-all"
                                    style={{ width: `${tech.percentage}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12 text-right">
                                  {tech.percentage}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Custom Active Shape for Hover Effect
// ─────────────────────────────────────────────
const renderActiveShape = (props: any) => {
  const {
    cx, cy,
    innerRadius, outerRadius,
    startAngle, endAngle,
    fill, payload, percent, value,
  } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 15}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.2))" }}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 5}
        outerRadius={innerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.3}
      />
      <text x={cx} y={cy - 20} textAnchor="middle" fill={fill} className="font-bold text-lg">
        {payload.error}
      </text>
      <text x={cx} y={cy + 5} textAnchor="middle" fill="#666" className="text-base">
        {`Count: ${value}`}
      </text>
      <text x={cx} y={cy + 25} textAnchor="middle" fill="#999" className="text-sm">
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    </g>
  );
};

// ─────────────────────────────────────────────
// Main Chart Component
// ─────────────────────────────────────────────
export const DemogCommonErrorChart: React.FC<Props> = ({ expanded, onExpand }) => {
  const currentDate = new Date();
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [exportOpen, setExportOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const [showAll, setShowAll] = useState(false);
  const [selectedError, setSelectedError] = useState<string | null>(null);

  const { data: apiData, isLoading, isError, error } = useCommonErrors({ year, month });

  // ── Aggregate by TABLECOLUMN (summing across all usernames) ──
  const aggregatedByColumn = useMemo(() => {
    if (!apiData?.data || apiData.data.length === 0) return {} as Record<string, number>;

    return apiData.data.reduce<Record<string, number>>((acc, row) => {
      acc[row.TABLECOLUMN] = (acc[row.TABLECOLUMN] ?? 0) + row.TOTAL_COUNT;
      return acc;
    }, {});
  }, [apiData]);

  // ── Chart data (top 5 or all) ──
  const chartData: ErrorData[] = useMemo(() => {
    const sorted = Object.entries(aggregatedByColumn)
      .sort(([, a], [, b]) => b - a);

    return (showAll ? sorted : sorted.slice(0, 5)).map(([column, count]) => ({
      error: column,
      count,
    }));
  }, [aggregatedByColumn, showAll]);

  // ── Tech breakdown for the selected error (used by modal) ──
  const modalTechData = useMemo(() => {
    if (!selectedError || !apiData?.data) return [];

    const rows = apiData.data.filter(r => r.TABLECOLUMN === selectedError);
    const total = rows.reduce((s, r) => s + r.TOTAL_COUNT, 0);

    return rows
      .map(r => ({
        name: getDisplayName(r.USERNAME),
        count: r.TOTAL_COUNT,
        percentage: total > 0
          ? ((r.TOTAL_COUNT / total) * 100).toFixed(1)
          : "0",
      }))
      .sort((a, b) => b.count - a.count);
  }, [selectedError, apiData]);

  const modalTotalCount = useMemo(() => {
    if (!selectedError) return 0;
    return aggregatedByColumn[selectedError] ?? 0;
  }, [selectedError, aggregatedByColumn]);

  // ── Export data (pivoted by USERNAME) ──
  const exportData = useMemo(() => {
    if (!apiData?.data) return [];

    const usernames = [...new Set(apiData.data.map(r => r.USERNAME))].sort();

    const byColumn = apiData.data.reduce<Record<string, Record<string, number>>>((acc, row) => {
      if (!acc[row.TABLECOLUMN]) acc[row.TABLECOLUMN] = {};
      acc[row.TABLECOLUMN][row.USERNAME] = row.TOTAL_COUNT;
      return acc;
    }, {});

    return Object.entries(byColumn)
      .map(([column, techCounts]) => {
        const total = Object.values(techCounts).reduce((s, v) => s + v, 0);
        const row: Record<string, any> = {
          "Error Type": column,
          "Total Count": total,
        };
        for (const username of usernames) {
          row[getDisplayName(username)] = techCounts[username] ?? 0;
        }
        return row;
      })
      .sort((a, b) => b["Total Count"] - a["Total Count"])
      .map((row, index) => ({ Rank: index + 1, ...row }));
  }, [apiData]);

  const handleExport = async (format: "png" | "svg" | "excel") => {
    setExportOpen(false);
    await downloadChart({
      elementId: "demog-common-error-container",
      filename: `demog-common-errors-${year}-${MONTHS[month - 1].toLowerCase()}`,
      format,
      data: format === "excel" ? exportData : undefined,
      sheetName: "Common Errors",
      backgroundColor: document.documentElement.classList.contains("dark")
        ? "#111827"
        : "#ffffff",
      scale: 2,
    });
  };

  const years = Array.from({ length: 10 }, (_, i) => currentDate.getFullYear() - i);

  return (
    <>
      <div
        className="flex flex-col rounded-2xl shadow-lg overflow-hidden
        bg-white dark:bg-gray-900
        transition-all duration-300
        h-[500px]"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 border-b
          bg-gray-50 dark:bg-gray-800
          border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
            Demographic Encoders – Most Common Errors
            <div className="text-sm font-normal text-gray-500 dark:text-gray-400">
              {MONTHS[month - 1]} {year} • {showAll ? "All Errors" : "Top 5"}
            </div>
          </h3>

          <div className="flex items-center gap-2 flex-wrap">
            {expanded && (
              <>
                <select
                  value={showAll ? "all" : "top5"}
                  onChange={(e) => setShowAll(e.target.value === "all")}
                  className="h-8 px-3 text-xs rounded-lg border
                    bg-white dark:bg-gray-700
                    border-gray-300 dark:border-gray-600
                    text-gray-800 dark:text-gray-100
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="top5">Top 5</option>
                  <option value="all">Show All</option>
                </select>

                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="h-8 px-3 text-xs rounded-lg border
                    bg-white dark:bg-gray-700
                    border-gray-300 dark:border-gray-600
                    text-gray-800 dark:text-gray-100
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>

                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="h-8 px-3 text-xs rounded-lg border
                    bg-white dark:bg-gray-700
                    border-gray-300 dark:border-gray-600
                    text-gray-800 dark:text-gray-100
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {MONTHS.map((m, idx) => (
                    <option key={m} value={idx + 1}>{m}</option>
                  ))}
                </select>
              </>
            )}

            {/* Export */}
            <div className="relative">
              <button
                onClick={() => setExportOpen(!exportOpen)}
                disabled={isLoading || chartData.length === 0}
                className="h-8 px-3 text-xs rounded-lg border
                  bg-white dark:bg-gray-700
                  border-gray-300 dark:border-gray-600
                  text-gray-800 dark:text-gray-100
                  hover:bg-gray-50 dark:hover:bg-gray-600
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center gap-1.5"
              >
                <Download size={14} />
                Export
                <ChevronDown size={12} />
              </button>

              {exportOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                  <div
                    className="absolute right-0 mt-1 w-44 rounded-lg shadow-lg border z-20
                    bg-white dark:bg-gray-800
                    border-gray-200 dark:border-gray-700"
                  >
                    {(["png", "svg", "excel"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => handleExport(f)}
                        className="w-full px-4 py-2.5 text-left text-xs
                          hover:bg-gray-50 dark:hover:bg-gray-700
                          text-gray-700 dark:text-gray-300
                          first:rounded-t-lg last:rounded-b-lg"
                      >
                        Export as {f.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={onExpand}
              className="h-8 px-4 text-xs rounded-lg font-medium
                bg-blue-600 hover:bg-blue-700
                text-white shadow"
            >
              {expanded ? "Collapse" : "Expand"}
            </button>
          </div>
        </div>

        {/* Chart Content */}
        <div id="demog-common-error-container" className="flex-1 p-4 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading data...</p>
              </div>
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-sm text-red-500 mb-2">
                  Error loading data: {error?.message || "Unknown error"}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-xs text-blue-500 hover:text-blue-600"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No data available for {MONTHS[month - 1]} {year}
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={{
                    backgroundColor: document.documentElement.classList.contains("dark")
                      ? "#1f2937"
                      : "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  wrapperStyle={{ fontSize: "12px" }}
                />
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="error"
                  innerRadius={expanded ? 80 : 60}
                  outerRadius={expanded ? 130 : 100}
                  paddingAngle={4}
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(undefined)}
                  onClick={(_, index) => {
                    const errorType = chartData[index]?.error;
                    if (errorType) setSelectedError(errorType);
                  }}
                  label={
                    activeIndex === undefined
                      ? ({ error, count, percent }) =>
                          `${error}: ${count} (${(percent * 100).toFixed(1)}%)`
                      : false
                  }
                  style={{ cursor: "pointer" }}
                >
                  {chartData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={COLORS[index % COLORS.length]}
                      style={{
                        transition: "all 0.3s ease",
                        opacity:
                          activeIndex === undefined || activeIndex === index ? 1 : 0.6,
                      }}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Breakdown Modal */}
      <BreakdownModal
        isOpen={!!selectedError}
        onClose={() => setSelectedError(null)}
        tableColumn={selectedError || ""}
        year={year}
        month={month}
        techData={modalTechData}
        totalCount={modalTotalCount}
      />
    </>
  );
};