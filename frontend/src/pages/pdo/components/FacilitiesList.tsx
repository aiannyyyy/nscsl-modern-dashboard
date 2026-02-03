import React, { useState, useMemo } from 'react';
import type { NsfPerformanceData } from '../../../services/nsfPerformanceApi';

interface FacilitiesListProps {
  facilities: NsfPerformanceData[];
  selectedProvince: string;
  onFacilitySelect: (facility: NsfPerformanceData) => void;
}

const FacilitiesList: React.FC<FacilitiesListProps> = ({
  facilities,
  selectedProvince,
  onFacilitySelect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const formatProvinceName = (province: string) =>
    province.charAt(0).toUpperCase() + province.slice(1);

  const filteredFacilities = useMemo(() => {
    if (!searchTerm) return facilities;
    const lowerSearch = searchTerm.toLowerCase();

    return facilities.filter(
      (facility) =>
        facility.SUBMID.toString().includes(lowerSearch) ||
        facility.FACILITY_NAME.toLowerCase().includes(lowerSearch)
    );
  }, [facilities, searchTerm]);

  return (
    <div className="mb-8">
      {/* Header + Search */}
      <div
        className="
          bg-white dark:bg-gray-800
          rounded-lg shadow-sm
          p-4 mb-4
          flex flex-wrap justify-between items-center gap-4
          transition-colors
        "
      >
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center
            bg-blue-900 dark:bg-blue-600
          ">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {formatProvinceName(selectedProvince)} Facilities — Click to View Performance
          </span>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="searchCode"
            className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search:
          </label>
          <input
            id="searchCode"
            type="text"
            placeholder="Facility code or name..."
            autoComplete="off"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="
              w-64 px-4 py-2 text-sm
              border border-gray-300 dark:border-gray-600
              rounded-lg
              bg-white dark:bg-gray-700
              text-gray-800 dark:text-gray-200
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              transition-colors
            "
          />
        </div>
      </div>

      {/* Facilities */}
      <div className="space-y-3">
        {filteredFacilities.length === 0 ? (
          <div
            className="
              bg-white dark:bg-gray-800
              rounded-lg shadow-sm
              p-12 text-center
              transition-colors
            "
          >
            <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No facilities found matching your search.
            </p>
          </div>
        ) : (
          filteredFacilities.map((facility) => (
            <div
              key={facility.SUBMID}
              onClick={() => onFacilitySelect(facility)}
              className="
                bg-white dark:bg-gray-800
                border border-gray-200 dark:border-gray-700
                rounded-lg p-5
                shadow-sm hover:shadow-md
                hover:border-blue-400 dark:hover:border-blue-500
                transition-all duration-200
                cursor-pointer
              "
            >
              <div className="flex items-center justify-between">
                {/* Left */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0
                    bg-blue-600 dark:bg-blue-500
                  ">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                  </div>

                  <div className="min-w-0">
                    <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {facility.SUBMID}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {facility.FACILITY_NAME}
                    </div>
                  </div>
                </div>

                {/* Right */}
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {facility.TOTAL_SAMPLE_COUNT.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Total Samples
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-3xl font-bold ${
                        facility.TOTAL_UNSAT_RATE && facility.TOTAL_UNSAT_RATE > 5
                          ? 'text-red-600 dark:text-red-400'
                          : facility.TOTAL_UNSAT_RATE && facility.TOTAL_UNSAT_RATE > 0
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}
                    >
                      {facility.TOTAL_UNSAT_RATE
                        ? `${facility.TOTAL_UNSAT_RATE}%`
                        : '0.0%'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Unsat Rate
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FacilitiesList;
