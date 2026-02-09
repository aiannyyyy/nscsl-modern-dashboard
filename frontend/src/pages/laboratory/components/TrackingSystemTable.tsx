import React, { useState } from 'react';
import { useLabTrackingStats } from '../../../hooks/LaboratoryHooks/useLabTrackingStats';

// ─────────────────────────────────────────────
// Constants & Helpers
// ─────────────────────────────────────────────

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const monthToNumber = (month: string): number => MONTHS.indexOf(month) + 1;

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
  unit: string;
}

// ─────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
}) => {
  return (
    <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-xl border border-green-200 dark:border-green-800">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400"></div>
        <div className="text-xs font-medium text-green-600 dark:text-green-400 uppercase">
          {label}
        </div>
      </div>
      <div className="text-3xl font-bold text-green-700 dark:text-green-300">
        {value.toFixed(2)}
      </div>
      <div className="text-xs text-green-600 dark:text-green-400 mt-1">
        {unit}
      </div>
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
  unit: string;
}

const MetricRow: React.FC<MetricRowProps> = ({
  title,
  ave,
  med,
  mod,
  unit,
}) => (
  <div className="space-y-3">
    <div className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">
      {title}
    </div>
    <div className="grid grid-cols-3 gap-3">
      <StatCard label="AVE" value={ave} unit={unit} />
      <StatCard label="MED" value={med} unit={unit} />
      <StatCard label="MOD" value={mod} unit={unit} />
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
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Tracking System
          </h2>
        </div>
        <div className="flex gap-2">
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="h-9 px-3 text-sm rounded-lg border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="h-9 px-3 text-sm rounded-lg border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {isLoading || !data ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            {isError ? 'Failed to load data' : 'Loading...'}
          </div>
        ) : (
          <>
            <MetricRow
              title="DTCOLL → DTRECV"
              ave={data.dtcoll_dtrecv.ave}
              med={data.dtcoll_dtrecv.med}
              mod={data.dtcoll_dtrecv.mod}
              unit="days"
            />
            <MetricRow
              title="DTRECV → DTRELEASE"
              ave={data.dtrecv_dtrelease.ave}
              med={data.dtrecv_dtrelease.med}
              mod={data.dtrecv_dtrelease.mod}
              unit="days"
            />
          </>
        )}
      </div>
    </div>
  );
};