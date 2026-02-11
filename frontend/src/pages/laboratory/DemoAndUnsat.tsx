import React, { useState } from "react";
import { EncodersCard } from "../laboratory/components/EncodersCard";
import { SpeedMonitoringChart } from "./components/SpeedMonitoringChart";
import { DemogCommonErrorChart } from "./components/DemogCommonErrorChart";
import { EndorsementTable } from "./components/EndorsementTable";
import { EndorsementChart } from "./components/EndorsementChart";

export const DemoAndUnsat: React.FC = () => {
  // expand state for row
  const [row1Expanded, setRow1Expanded] = useState<"speed" | "error" | null>(null);
  
  return (
    <div className="space-y-6">
      {/* Row 0 — Encoder Summary */}
      <EncodersCard />
      
      {/* Row 1 — Speed Monitoring + Demographic Errors */}
      <div className="grid grid-cols-12 gap-6">
        {/* Speed Monitoring */}
        <div
          className={`transition-all duration-300
            ${
              row1Expanded === "speed"
                ? "col-span-8"
                : row1Expanded === "error"
                ? "col-span-4"
                : "col-span-6"
            }`}
        >
          <SpeedMonitoringChart
            expanded={row1Expanded === "speed"}
            onExpand={() =>
              setRow1Expanded(row1Expanded === "speed" ? null : "speed")
            }
          />
        </div>
        
        {/* Demographic Common Errors */}
        <div
          className={`transition-all duration-300
            ${
              row1Expanded === "error"
                ? "col-span-8"
                : row1Expanded === "speed"
                ? "col-span-4"
                : "col-span-6"
            }`}
        >
          <DemogCommonErrorChart
            expanded={row1Expanded === "error"}
            onExpand={() =>
              setRow1Expanded(row1Expanded === "error" ? null : "error")
            }
          />
        </div>
      </div>
      
      {/* Row 2 — Endorsement Table (75%) + Chart (25%) */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8">
          <EndorsementTable />
        </div>
        <div className="col-span-4">
          <EndorsementChart />
        </div>
      </div>
    </div>
  );
};

export default DemoAndUnsat;