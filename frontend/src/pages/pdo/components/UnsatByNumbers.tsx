import React, { useEffect, useState } from "react";
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
 * Component
 * ================================
 */
const UnsatByNumbers: React.FC = () => {
  const [openDateModal, setOpenDateModal] = useState(false);
  const [openFacilityModal, setOpenFacilityModal] = useState(false);

  const [data, setData] = useState<UnsatItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedFacility, setSelectedFacility] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState("all");
  const [range, setRange] = useState(getCurrentMonthRange());

  /**
   * Fetch data - Now includes province parameter
   */
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getTopUnsatisfactory(range.from, range.to, selectedProvince);
      setData(res);
    } catch (err) {
      console.error("❌ Failed to load unsat by numbers", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Refetch when province changes
  useEffect(() => {
    fetchData();
  }, [range.from, range.to, selectedProvince]);

  /**
   * Handle export to Excel
   */
  const handleExport = () => {
    exportUnsatCountToExcel(data, range.from, range.to, selectedProvince);
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
            >
              {PROVINCES.map((prov) => (
                <option key={prov.value} value={prov.value}>
                  {prov.label}
                </option>
              ))}
            </select>

            <button
              onClick={handleExport}
              disabled={data.length === 0}
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
            <div className="text-center text-sm text-gray-400 py-10">
              Loading data...
            </div>
          )}

          {!loading && data.length === 0 && (
            <div className="text-center text-sm text-gray-400 py-10">
              No data available
            </div>
          )}

          {!loading &&
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
                             cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
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
        <div className="text-center text-sm text-gray-400 mt-2">
          Showing unsatisfactory count by numbers
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