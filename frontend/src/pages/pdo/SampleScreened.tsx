import React, { useState } from "react";
import { CumulativePerProvince } from "./components/ScreenedCumulativePerProvince";
import { MonthlyTotalSamples } from "./components/ScreenedMonthlyTotalSamples";

export const SampleScreened: React.FC = () => {
  const [expanded, setExpanded] = useState<
    "monthly" | "cumulative" | null
  >(null);

  return (
    <div className="space-y-4">
        {/* Page / Section Title */}
        <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Sample Screened
        </h2>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-12 gap-6">
        {/* Monthly */}
        <div
            className={`transition-all duration-300
            ${
                expanded === "monthly"
                ? "col-span-8"
                : expanded === "cumulative"
                ? "col-span-4"
                : "col-span-6"
            }`}
        >
            <MonthlyTotalSamples
            expanded={expanded === "monthly"}
            onExpand={() =>
                setExpanded(expanded === "monthly" ? null : "monthly")
            }
            />
        </div>

        {/* Cumulative */}
        <div
            className={`transition-all duration-300
            ${
                expanded === "cumulative"
                ? "col-span-8"
                : expanded === "monthly"
                ? "col-span-4"
                : "col-span-6"
            }`}
        >
            <CumulativePerProvince
            expanded={expanded === "cumulative"}
            onExpand={() =>
                setExpanded(expanded === "cumulative" ? null : "cumulative")
            }
            />
        </div>
        </div>
    </div>
  );
};
