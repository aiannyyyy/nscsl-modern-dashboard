import React, { useEffect, useState, useCallback, useRef } from "react";
import { DateRangeModal } from "./DateRangeModal";
import { FacilityPatientModal } from "./FacilityPatientModal";
import { getTopUnsatisfactory } from "../../../services/PDOServices/unsatApi";
import { exportUnsatCountToExcel } from "../../../utils/excelExport";

/**
 * ================================
 * Types
 * ================================
 */
interface UnsatItem {
  FACILITY_NAME?: string;
  facility_name?: string;
  PROVINCE?: string;
  province?: string;
  UNSATISFACTORY_COUNT?: number;
  unsatisfactory_count?: number;
}

/**
 * ================================
 * Constants
 * ================================
 */
const PROVINCES = [
  { value: "all", label: "All Province" },
  { value: "Batangas", label: "Batangas" },
  { value: "Cavite", label: "Cavite" },
  { value: "Laguna", label: "Laguna" },
  { value: "Rizal", label: "Rizal" },
  { value: "Quezon", label: "Quezon" },
];

/**
 * ================================
 * Helpers
 * ================================
 */
const getCurrentMonthRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const format = (d: Date, endOfDay = false) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${endOfDay ? "23:59:59" : "00:00:00"}`;
  };

  return {
    from: format(new Date(year, month, 1)),
    to: format(new Date(year, month + 1, 0), true),
  };
};

/**
 * ================================
 * Component - OPTIMIZED
 * ================================
 */
const UnsatByNumbers: React.FC = () => {
  const [openDateModal, setOpenDateModal] = useState(false);
  const [openFacilityModal, setOpenFacilityModal] = useState(false);

  const [data, setData] = useState<UnsatItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedFacility, setSelectedFacility] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState("all");
  const [range, setRange] = useState(getCurrentMonthRange());

  // Track the current request to cancel it when params change
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Fetch data with request cancellation
   */
  const fetchData = useCallback(async () => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(true);
      setError(null);

      const res = await getTopUnsatisfactory(
        range.from,
        range.to,
        selectedProvince,
        controller.signal
      );

      // Only update state if request wasn't cancelled
      if (!controller.signal.aborted) {
        setData(res);
      }
    } catch (err: any) {
      // Don't show error for cancelled requests
      if (err.name === 'CanceledError' || err.name === 'AbortError') {
        console.log('Request cancelled');
        return;
      }

      console.error("❌ Failed to load unsat by numbers", err);
      
      if (!controller.signal.aborted) {
        setData([]);
        setError(err.response?.data?.error || "Failed to load data. Please try again.");
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [range.from, range.to, selectedProvince]);

  /**
   * Fetch when dependencies change
   */
  useEffect(() => {
    fetchData();

    // Cleanup: cancel request on unmount or when dependencies change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  /**
   * Handle export to Excel
   */
  const handleExport = () => {
    exportUnsatCountToExcel(data, range.from, range.to, selectedProvince);
  };

  /**
   * Handle retry
   */
  const handleRetry = () => {
    fetchData();
  };

  return (
    <>
      <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-lg h-[490px]">
        {/* ================= HEADER ================= */}
        <div className="p-5 space-y-3">
          <div className="flex justify-between items-start">
            <h4 className="font-semibold text-gray-800 dark:text-gray-100">
              Top Unsatisfactory Sample Contributor
              <br />
              <span className="text-sm text-blue-600">
                From {range.from.split(" ")[0]} to {range.to.split(" ")[0]}
              </span>
            </h4>

            <button
              onClick={() => setOpenDateModal(true)}
              className="h-8 px-3 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Select Date Range
            </button>
          </div>

          {/* ================= PROVINCE DROPDOWN & EXPORT ================= */}
          <div className="flex gap-2">
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="flex-1 h-9 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              {PROVINCES.map((prov) => (
                <option key={prov.value} value={prov.value}>
                  {prov.label}
                </option>
              ))}
            </select>

            <button
              onClick={handleExport}
              disabled={data.length === 0 || loading}
              className="h-9 px-4 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700
                         disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export
            </button>
          </div>
        </div>

        {/* ================= BODY ================= */}
        <div className="mx-5 mt-3 h-[280px] overflow-y-auto border rounded-lg">
          {loading && (
            <div className="flex flex-col items-center justify-center py-10 space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-500">Loading data...</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-10 space-y-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-red-600 text-center px-4">{error}</p>
              <button
                onClick={handleRetry}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && data.length === 0 && (
            <div className="text-center text-sm text-gray-400 py-10">
              No data available for the selected criteria
            </div>
          )}

          {!loading && !error &&
            data.map((item, index) => {
              const facility =
                item.FACILITY_NAME || item.facility_name || "Unknown Facility";
              const province = item.PROVINCE || item.province || "—";
              const count =
                item.UNSATISFACTORY_COUNT ??
                item.unsatisfactory_count ??
                0;

              return (
                <div
                  key={index}
                  onClick={() => {
                    setSelectedFacility(facility);
                    setOpenFacilityModal(true);
                  }}
                  className="flex justify-between items-center px-4 py-2 border-b last:border-b-0
                             cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      {facility}
                    </p>
                    <p className="text-xs text-gray-500">{province}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-semibold text-red-600">
                      {count}
                    </p>
                    <p className="text-xs text-gray-400">samples</p>
                  </div>
                </div>
              );
            })}
        </div>

        {/* ================= FOOTER ================= */}
        <div className="px-5 py-3 border-t text-sm">
          <span>Showing unsatisfactory rate as numbers</span>
          {!loading && !error && (
            <div className="flex justify-left text-gray-600 dark:text-gray-300">
              <span>Total Facilities: </span>
              <span className="font-semibold">{data.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* ================= DATE RANGE MODAL ================= */}
      <DateRangeModal
        open={openDateModal}
        onClose={() => setOpenDateModal(false)}
        onApply={(from, to) => {
          setRange({ from, to });
          setOpenDateModal(false);
        }}
      />

      {/* ================= FACILITY DETAILS MODAL ================= */}
      <FacilityPatientModal
        open={openFacilityModal}
        onClose={() => setOpenFacilityModal(false)}
        facilityName={selectedFacility}
        from={range.from}
        to={range.to}
        mode="numbers"
      />
    </>
  );
};

export { UnsatByNumbers };
export default UnsatByNumbers;