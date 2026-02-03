import React, { useState } from 'react';
import { SummaryCards } from './components/SummaryCards';
import { DailyComparisonChart } from './components/DailyComparisonChart';
import { TrackingSystemTable } from './components/TrackingSystemTable';
import { YTDComparisonChart } from './components/YTDComparisonChart';
import { CumulativeMonthlyChart } from './components/CumulativeMonthlyChart';
import { CumulativeAnnualChart, UnsatRateChart } from './components/CumulativeAnnualChart';
import { LaboratorySupplies } from './components/LaboratorySupplies';
import { ReagentSupplies } from './components/ReagentSupplies';

export const LaboratoryOverview: React.FC = () => {
  // Expand states
  const [row1Expanded, setRow1Expanded] = useState<"daily" | "ytd" | null>(null);
  const [row3Expanded, setRow3Expanded] = useState<"cumMonthly" | "cumAnnual" | null>(null);

  return (
    <div className="space-y-6">
      {/* Summary Cards Section */}
      <SummaryCards />

      {/* Row 1: Daily + YTD — expands col-span like SampleReceived */}
      <div className="grid grid-cols-12 gap-6">
        <div
          className={`transition-all duration-300
            ${
              row1Expanded === "daily"
                ? "col-span-8"
                : row1Expanded === "ytd"
                ? "col-span-4"
                : "col-span-6"
            }`}
        >
          <DailyComparisonChart
            expanded={row1Expanded === "daily"}
            onExpand={() => setRow1Expanded(row1Expanded === "daily" ? null : "daily")}
          />
        </div>

        <div
          className={`transition-all duration-300
            ${
              row1Expanded === "ytd"
                ? "col-span-8"
                : row1Expanded === "daily"
                ? "col-span-4"
                : "col-span-6"
            }`}
        >
          <YTDComparisonChart
            expanded={row1Expanded === "ytd"}
            onExpand={() => setRow1Expanded(row1Expanded === "ytd" ? null : "ytd")}
          />
        </div>
      </div>

      {/* Row 2: Tracking + Supplies horizontal (3 equal columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TrackingSystemTable />
        <LaboratorySupplies />
        <ReagentSupplies />
      </div>

      {/* Row 3: Cumulative Monthly + Cumulative Annual — same col-span expand pattern */}
      <div className="grid grid-cols-12 gap-6">
        <div
          className={`transition-all duration-300
            ${
              row3Expanded === "cumMonthly"
                ? "col-span-8"
                : row3Expanded === "cumAnnual"
                ? "col-span-4"
                : "col-span-6"
            }`}
        >
          <CumulativeMonthlyChart
            expanded={row3Expanded === "cumMonthly"}
            onExpand={() => setRow3Expanded(row3Expanded === "cumMonthly" ? null : "cumMonthly")}
          />
        </div>

        <div
          className={`transition-all duration-300
            ${
              row3Expanded === "cumAnnual"
                ? "col-span-8"
                : row3Expanded === "cumMonthly"
                ? "col-span-4"
                : "col-span-6"
            }`}
        >
          <CumulativeAnnualChart
            expanded={row3Expanded === "cumAnnual"}
            onExpand={() => setRow3Expanded(row3Expanded === "cumAnnual" ? null : "cumAnnual")}
          />
        </div>
      </div>

      {/* Row 4: Unsat Rate — full width */}
      <UnsatRateChart
        expanded={false}
        onExpand={() => {}}
      />
    </div>
  );
};