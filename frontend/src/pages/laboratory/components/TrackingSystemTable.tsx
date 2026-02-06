import React, { useState } from 'react';
import { useLabTrackingStats } from '../../../hooks/LaboratoryHooks/useLabTrackingStats';

// ─────────────────────────────────────────────
// Constants & Helpers
// ─────────────────────────────────────────────
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const monthToNumber = (month: string): number =>
  MONTHS.indexOf(month) + 1;

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface TrackingData {
  month: string;
  dtcoll_dtrecv: {
    ave: number;
    med: number;
    mod: number;
  };
  dtrecv_dtrelease: {
    ave: number;
    med: number;
    mod: number;
  };
}

interface StatCardProps {
  label: string;
  value: number;
  target: number;
  unit: string;
}

// ─────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────
const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  target,
  unit,
}) => {
  const isOver = value > target;

  return (
    <div
      className={`flex-1 rounded-xl border px-3 py-2.5 flex flex-col items-center
        ${
          isOver
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
        }
      `}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            isOver ? 'bg-red-500' : 'bg-green-500'
          }`}
        />
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {label}
        </span>
      </div>

      <p
        className={`text-2xl font-bold leading-tight ${
          isOver
            ? 'text-red-600 dark:text-red-400'
            : 'text-green-600 dark:text-green-400'
        }`}
      >
        {value.toFixed(2)}
      </p>

      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
        {unit}
      </p>
    </div>
  );
};

// ─────────────────────────────────────────────
// Metric Row
// ─────────────────────────────────────────────
interface MetricRowProps {
  title: string;
  ave: number;
  med: number;
  mod: number;
  target: number;
  unit: string;
}

const MetricRow: React.FC<MetricRowProps> = ({
  title,
  ave,
  med,
  mod,
  target,
  unit,
}) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
        {title}
      </p>
      <span className="text-xs text-gray-400 dark:text-gray-500">
        Target: {target} {unit}
      </span>
    </div>

    <div className="flex gap-2">
      <StatCard label="Ave" value={ave} target={target} unit={unit} />
      <StatCard label="Med" value={med} target={target} unit={unit} />
      <StatCard label="Mod" value={mod} target={target} unit={unit} />
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export const TrackingSystemTable: React.FC = () => {
  const currentDate = new Date();

  const [year, setYear] = useState(
    currentDate.getFullYear().toString()
  );
  const [month, setMonth] = useState(
    MONTHS[currentDate.getMonth()]
  );

  const years = Array.from({ length: 12 }, (_, i) =>
    (currentDate.getFullYear() - i).toString()
  );

  const monthNumber = monthToNumber(month);

  const {
    data: apiData,
    isLoading,
    isError,
  } = useLabTrackingStats({
    year: Number(year),
    month: monthNumber,
  });

  // Targets (days)
  const TARGET_COLL_RECV = 3;
  const TARGET_RECV_RELEASE = 5;

  const data: TrackingData | null = apiData
    ? {
        month: month.substring(0, 3),
        dtcoll_dtrecv: {
          ave: apiData.data.dtcoll_to_dtrecv.average,
          med: apiData.data.dtcoll_to_dtrecv.median,
          mod: apiData.data.dtcoll_to_dtrecv.mode,
        },
        dtrecv_dtrelease: {
          ave: apiData.data.dtrecv_to_dtrptd.average,
          med: apiData.data.dtrecv_to_dtrptd.median,
          mod: apiData.data.dtrecv_to_dtrptd.mode,
        },
      }
    : null;

  return (
    <div className="rounded-2xl shadow-lg overflow-hidden bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b
        bg-gray-50 dark:bg-gray-800
        border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <svg
            className="w-5 h-5 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Tracking System
        </h3>

        <div className="flex items-center gap-2">
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
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
            onChange={(e) => setMonth(e.target.value)}
            className="h-8 px-3 text-xs rounded-lg border
              bg-white dark:bg-gray-700
              border-gray-300 dark:border-gray-600
              text-gray-800 dark:text-gray-100
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MONTHS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col justify-center gap-4">
        {isLoading || !data ? (
          <div className="w-full flex items-center justify-center py-6">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isError ? 'Failed to load data' : 'Loading...'}
              </p>
            </div>
          </div>
        ) : (
          <>
            <MetricRow
              title="DTCOLL → DTRECV"
              ave={data.dtcoll_dtrecv.ave}
              med={data.dtcoll_dtrecv.med}
              mod={data.dtcoll_dtrecv.mod}
              target={TARGET_COLL_RECV}
              unit="days"
            />

            <div className="w-full h-px bg-gray-200 dark:bg-gray-700" />

            <MetricRow
              title="DTRECV → DTRELEASE"
              ave={data.dtrecv_dtrelease.ave}
              med={data.dtrecv_dtrelease.med}
              mod={data.dtrecv_dtrelease.mod}
              target={TARGET_RECV_RELEASE}
              unit="days"
            />
          </>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 px-4 pb-3 pt-2 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Under target
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Over target
          </span>
        </div>
      </div>
    </div>
  );
};
