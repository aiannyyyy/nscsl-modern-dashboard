import React from 'react';

interface FilterSectionProps {
  selectedProvince: string;
  startDate: string;
  endDate: string;
  isLoading: boolean;
  onProvinceChange: (province: string) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onApplyFilters: () => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  selectedProvince,
  startDate,
  endDate,
  isLoading,
  onProvinceChange,
  onStartDateChange,
  onEndDateChange,
  onApplyFilters,
}) => {
  return (
    <div
      className="
        bg-white dark:bg-gray-800
        rounded-lg shadow-sm
        p-6 mb-6
        transition-colors
      "
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <svg
          className="w-5 h-5 text-gray-600 dark:text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
          Filter Options
        </h5>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Province Dropdown */}
        <select
          id="provinceFilter"
          value={selectedProvince}
          onChange={(e) => onProvinceChange(e.target.value)}
          disabled={isLoading}
          className="
            px-4 py-2 min-w-[140px]
            border border-gray-300 dark:border-gray-600
            rounded-md
            bg-white dark:bg-gray-700
            text-gray-700 dark:text-gray-200
            font-medium
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-100 dark:disabled:bg-gray-600
            disabled:cursor-not-allowed
            transition-colors
          "
        >
          <option value="cavite">Cavite</option>
          <option value="laguna">Laguna</option>
          <option value="batangas">Batangas</option>
          <option value="rizal">Rizal</option>
          <option value="quezon">Quezon</option>
        </select>

        {/* Start Date */}
        <input
          type="date"
          id="startDate"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          disabled={isLoading}
          className="
            px-4 py-2
            border border-gray-300 dark:border-gray-600
            rounded-md
            bg-white dark:bg-gray-700
            text-gray-700 dark:text-gray-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-100 dark:disabled:bg-gray-600
            disabled:cursor-not-allowed
            transition-colors
            [color-scheme:light] dark:[color-scheme:dark]
          "
        />

        {/* End Date */}
        <input
          type="date"
          id="endDate"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          disabled={isLoading}
          className="
            px-4 py-2
            border border-gray-300 dark:border-gray-600
            rounded-md
            bg-white dark:bg-gray-700
            text-gray-700 dark:text-gray-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-100 dark:disabled:bg-gray-600
            disabled:cursor-not-allowed
            transition-colors
            [color-scheme:light] dark:[color-scheme:dark]
          "
        />

        {/* Apply Filters Button */}
        <button
          onClick={onApplyFilters}
          disabled={isLoading}
          className="
            px-6 py-2
            bg-blue-600 dark:bg-blue-500
            text-white font-medium
            rounded-md
            hover:bg-blue-700 dark:hover:bg-blue-600
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            dark:focus:ring-offset-gray-800
            disabled:bg-blue-400 dark:disabled:bg-blue-400
            disabled:cursor-not-allowed
            transition-all
            flex items-center gap-2
          "
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          Apply Filters
        </button>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading data, please wait...
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterSection;