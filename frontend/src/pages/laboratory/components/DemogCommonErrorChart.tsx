import React, { useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Download, ChevronDown } from "lucide-react";
import { downloadChart } from "../../../utils/chartDownloadUtils";

interface ErrorData {
  error: string;
  count: number;
}

interface Props {
  expanded: boolean;
  onExpand: () => void;
}

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"];

export const DemogCommonErrorChart: React.FC<Props> = ({
  expanded,
  onExpand,
}) => {
  const [year, setYear] = useState("2025");
  const [month, setMonth] = useState("January");
  const [exportOpen, setExportOpen] = useState(false);

  /* 🔹 MOCK DATA (TOP 5) */
  const chartData: ErrorData[] = useMemo(
    () => [
      { error: "Wrong Date of Birth", count: 152 },
      { error: "Misspelled Last Name", count: 124 },
      { error: "Invalid Sex Entry", count: 98 },
      { error: "Wrong Facility Code", count: 76 },
      { error: "Missing Middle Name", count: 64 },
    ],
    []
  );

  const exportData = useMemo(
    () =>
      chartData.map((d) => ({
        Error: d.error,
        Occurrences: d.count,
      })),
    [chartData]
  );

  const handleExport = async (format: "png" | "svg" | "excel") => {
    setExportOpen(false);

    await downloadChart({
      elementId: "demog-common-error-container",
      filename: `demog-common-errors-${year}-${month.toLowerCase()}`,
      format,
      data: format === "excel" ? exportData : undefined,
      sheetName: "Common Errors",
      backgroundColor: document.documentElement.classList.contains("dark")
        ? "#111827"
        : "#ffffff",
      scale: 2,
    });
  };

  return (
    <div
        className="flex flex-col rounded-2xl shadow-lg overflow-hidden
            bg-white dark:bg-gray-900
            transition-all duration-300
            h-[500px]"
     >
      {/* ================= Header ================= */}
      <div
        className="flex items-center justify-between px-5 py-3 border-b
        bg-gray-50 dark:bg-gray-800
        border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
          Demographic Encoders – Most Common Errors (Top 5)
          <div className="text-sm font-normal text-gray-500 dark:text-gray-400">
            {month} {year}
          </div>
        </h3>

        <div className="flex items-center gap-2 flex-wrap">
          {expanded && (
            <>
              <Select value={year} setValue={setYear} />
              <Select
                value={month}
                setValue={setMonth}
                options={[
                  "January","February","March","April","May","June",
                  "July","August","September","October","November","December",
                ]}
              />
            </>
          )}

          {/* Export */}
          <div className="relative">
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="h-8 px-3 text-xs rounded-lg border
                bg-white dark:bg-gray-700
                border-gray-300 dark:border-gray-600
                text-gray-800 dark:text-gray-100
                hover:bg-gray-50 dark:hover:bg-gray-600
                flex items-center gap-1.5"
            >
              <Download size={14} />
              Export
              <ChevronDown size={12} />
            </button>

            {exportOpen && (
              <div
                className="absolute right-0 mt-1 w-44 rounded-lg shadow-lg border z-20
                bg-white dark:bg-gray-800
                border-gray-200 dark:border-gray-700"
              >
                {["png", "svg", "excel"].map((f) => (
                  <button
                    key={f}
                    onClick={() => handleExport(f as any)}
                    className="w-full px-4 py-2.5 text-left text-xs
                      hover:bg-gray-50 dark:hover:bg-gray-700
                      text-gray-700 dark:text-gray-300"
                  >
                    Export {f.toUpperCase()}
                  </button>
                ))}
              </div>
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

      {/* ================= Pie Chart ================= */}
      <div
        id="demog-common-error-container"
        className="flex-1 p-4 min-h-0"
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip />
            <Legend verticalAlign="bottom" height={36} />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="error"
              innerRadius={expanded ? 80 : 60}
              outerRadius={expanded ? 130 : 100}
              paddingAngle={4}
              label
            >
              {chartData.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/* ================= Shared Select ================= */

const Select = ({
  value,
  setValue,
  options = ["2025", "2024", "2023", "2022", "2021"],
}: {
  value: string;
  setValue: (v: string) => void;
  options?: string[];
}) => (
  <select
    value={value}
    onChange={(e) => setValue(e.target.value)}
    className="h-8 px-3 text-xs rounded-lg border
      bg-white dark:bg-gray-700
      border-gray-300 dark:border-gray-600
      text-gray-800 dark:text-gray-100"
  >
    {options.map((o) => (
      <option key={o}>{o}</option>
    ))}
  </select>
);
