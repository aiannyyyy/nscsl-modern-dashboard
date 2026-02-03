import { useState } from "react";
import { CorrectiveActionReportChart } from "./components/CorrectiveActionReportChart";
import { CarPerProvinceChart } from "./components/CarPerProvinceChart";
import { CarListTable } from "./components/CarListTable";

export default function ListCar() {
  // State to trigger chart refreshes when data changes
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // This function is called by CarListTable when a document is added or status is updated
  const handleDataChange = () => {
    // Increment the trigger to force charts to refresh
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Corrective Action Report Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track and manage corrective action reports across facilities
          </p>
        </div>

        {/* Charts Row - Pass refreshTrigger to both charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CarPerProvinceChart refreshTrigger={refreshTrigger} />
          <CorrectiveActionReportChart refreshTrigger={refreshTrigger} />
        </div>

        {/* Table Row - Pass callback to notify when data changes */}
        <CarListTable onDataChange={handleDataChange} />
      </div>
    </div>
  );
}