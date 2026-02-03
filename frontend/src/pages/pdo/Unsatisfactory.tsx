import React from "react";
import { UnsatByNumbers } from "./components/UnsatByNumbers";
import { UnsatByPercentages } from "./components/UnsatByPercentages";
import { UnsatPerProvince } from "./components/UnsatPerProvince"

export const Unsatisfactory: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Title */}
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
        Unsatisfactory Samples
      </h2>

      {/* Top Row */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-6">
          <UnsatByNumbers />
        </div>

        <div className="col-span-12 xl:col-span-6">
          <UnsatByPercentages />
        </div>
      </div>

      {/* Bottom Full Width */}
      <UnsatPerProvince />

    </div>
  );
};
