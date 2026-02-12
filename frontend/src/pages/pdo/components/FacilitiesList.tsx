import React, { useState, useMemo } from 'react';
import { FileDown, Hospital } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { NsfPerformanceData } from '../../../services/PDOServices/nsfPerformanceApi';
import { usePermissions } from '../../../hooks/usePermission';

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
  const { canExport } = usePermissions(['program', 'administrator']);
  const [searchTerm, setSearchTerm] = useState('');

  const formatProvinceName = (province: string) =>
    province.charAt(0).toUpperCase() + province.slice(1);

  // Filter and sort facilities
  const filteredFacilities = useMemo(() => {
    let filtered = facilities;

    // Apply search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = facilities.filter(
        (facility) =>
          facility.SUBMID.toString().includes(lowerSearch) ||
          facility.FACILITY_NAME.toLowerCase().includes(lowerSearch)
      );
    }

    // Sort by TOTAL_SAMPLE_COUNT descending
    return filtered.sort((a, b) => b.TOTAL_SAMPLE_COUNT - a.TOTAL_SAMPLE_COUNT);
  }, [facilities, searchTerm]);

  // Export to Excel function with explicit Save As dialog
  const handleExportToExcel = () => {
    try {
      // Prepare data for export
      const exportData = filteredFacilities.map((facility, index) => ({
        'Rank': index + 1,
        'Facility Code': facility.SUBMID,
        'Facility Name': facility.FACILITY_NAME,
        'Total Samples': facility.TOTAL_SAMPLE_COUNT,
        'Unsat Rate (%)': facility.TOTAL_UNSAT_RATE ? facility.TOTAL_UNSAT_RATE.toFixed(2) : '0.00',
        'Province': formatProvinceName(selectedProvince),
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const colWidths = [
        { wch: 6 },  // Rank
        { wch: 15 }, // Facility Code
        { wch: 40 }, // Facility Name
        { wch: 15 }, // Total Samples
        { wch: 15 }, // Unsat Rate
        { wch: 20 }, // Province
      ];
      ws['!cols'] = colWidths;

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Facilities');

      // Generate filename with timestamp and province
      const timestamp = new Date().toISOString().slice(0, 10);
      const provinceName = formatProvinceName(selectedProvince);
      const searchSuffix = searchTerm ? '_filtered' : '';
      const filename = `NSF_Facilities_${provinceName}_${timestamp}${searchSuffix}.xlsx`;

      // Write to array buffer
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

      // Create blob
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      // Create download link and trigger Save As dialog
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL object
      setTimeout(() => URL.revokeObjectURL(url), 100);

    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export to Excel. Please try again.');
    }
  };

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
            <Hospital className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-semibold text-gray-800 dark:text-gray-100 block">
              {formatProvinceName(selectedProvince)} Facilities — Click to View Performance
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Sorted by Total Samples (Highest to Lowest)
            </span>
          </div>
        </div>

        {/* Search + Export */}
        <div className="flex items-center gap-3">
          {/* Export Button */}
          {canExport && (
            <button
              onClick={handleExportToExcel}
              disabled={filteredFacilities.length === 0}
              className="
                h-10 px-4 text-sm rounded-lg
                bg-green-600 hover:bg-green-700
                disabled:bg-gray-400 disabled:cursor-not-allowed
                text-white font-medium
                flex items-center gap-2
                transition-colors
                shadow-sm hover:shadow-md
              "
              title="Export to Excel"
            >
              <FileDown size={16} />
              Export
            </button>
          )}
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
      </div>

      {/* Facilities Count */}
      {filteredFacilities.length > 0 && (
        <div className="mb-3 px-1">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing <span className="font-semibold text-gray-800 dark:text-gray-200">{filteredFacilities.length}</span> of{' '}
            <span className="font-semibold text-gray-800 dark:text-gray-200">{facilities.length}</span> facilities
            {searchTerm && (
              <span className="ml-1">
                (filtered by "<span className="font-medium">{searchTerm}</span>")
              </span>
            )}
          </p>
        </div>
      )}

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
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          filteredFacilities.map((facility, index) => (
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
                relative
              "
            >
              {/* Rank Badge */}
              <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">#{index + 1}</span>
              </div>

              <div className="flex items-center justify-between pl-10">
                {/* Left */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0
                    bg-blue-600 dark:bg-blue-500
                  ">
                    <Hospital className="w-6 h-6 text-white" />
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
                        ? `${facility.TOTAL_UNSAT_RATE.toFixed(2)}%`
                        : '0.00%'}
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