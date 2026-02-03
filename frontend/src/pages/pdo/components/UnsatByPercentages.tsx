import React, { useEffect, useState } from "react";
import { DateRangeModal } from "./DateRangeModal";
import { FacilityPatientModal } from "./FacilityPatientModal";
import { getUnsatRate } from "../../../services/unsatApi";

/**
 * ================================
 * Types
 * ================================
 */
interface UnsatRateItem {
  FACILITY_NAME?: string;
  facility_name?: string;
  PROVINCE?: string;
  province?: string;
  UNSAT_RATE?: number;
  unsat_rate?: number;
}

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
export const UnsatByPercentages: React.FC = () => {
  const [openDateModal, setOpenDateModal] = useState(false);
  const [openFacilityModal, setOpenFacilityModal] = useState(false);

  const [data, setData] = useState<UnsatRateItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedFacility, setSelectedFacility] = useState<string | null>(null);
  const [range, setRange] = useState(getCurrentMonthRange());

  /**
   * Fetch data
   */
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getUnsatRate(range.from, range.to);
      setData(res);
    } catch (err) {
      console.error("❌ Failed to load unsat percentages", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [range.from, range.to]);

  return (
    <>
      <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-lg h-[490px]">
        {/* ================= HEADER ================= */}
        <div className="p-5 flex justify-between items-start">
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

        {/* ================= BODY ================= */}
        <div className="mx-5 mt-3 h-[330px] overflow-y-auto border rounded-lg">
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

              const province =
                item.PROVINCE || item.province || "—";

              const rate =
                item.UNSAT_RATE ?? item.unsat_rate ?? 0;

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
                  {/* LEFT */}
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      {facility}
                    </p>
                    <p className="text-xs text-gray-500">{province}</p>
                  </div>

                  {/* RIGHT */}
                  <div className="text-right">
                    <p className="text-lg font-semibold text-red-600">
                      {rate.toFixed(2)}%
                    </p>
                    <p className="text-xs text-gray-400">unsat rate</p>
                  </div>
                </div>
              );
            })}
        </div>

        {/* ================= FOOTER ================= */}
        <div className="text-center text-sm text-gray-400 mt-2">
          Showing unsatisfactory rate as percentages
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
        mode="percentage"
      />
    </>
  );
};
