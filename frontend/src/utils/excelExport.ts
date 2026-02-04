import * as XLSX from 'xlsx';

/**
 * Export unsatisfactory rate data to Excel
 */
export const exportUnsatRateToExcel = (
  data: any[],
  from: string,
  to: string,
  province: string
) => {
  const formattedData = data.map((item, index) => ({
    'Rank': index + 1,
    'Facility Name': item.FACILITY_NAME || item.facility_name || 'Unknown',
    'Province': item.PROVINCE || item.province || '—',
    'Unsatisfactory Rate (%)': (item.UNSAT_RATE ?? item.unsat_rate ?? 0).toFixed(2),
    'Unsatisfactory Count': item.UNSATISFACTORY_COUNT || item.unsatisfactory_count || 0,
    'Total Samples': item.TOTAL_SAMPLES || item.total_samples || 0,
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Unsat Rate');

  // Generate filename
  const fromDate = from.split(' ')[0];
  const toDate = to.split(' ')[0];
  const provinceText = province === 'all' ? 'All' : province;
  const filename = `Unsat_Rate_${provinceText}_${fromDate}_to_${toDate}.xlsx`;

  XLSX.writeFile(workbook, filename);
};

/**
 * Export unsatisfactory count data to Excel
 */
export const exportUnsatCountToExcel = (
  data: any[],
  from: string,
  to: string,
  province: string
) => {
  const formattedData = data.map((item, index) => ({
    'Rank': index + 1,
    'Facility Name': item.FACILITY_NAME || item.facility_name || 'Unknown',
    'Province': item.PROVINCE || item.province || '—',
    'Unsatisfactory Count': item.UNSATISFACTORY_COUNT || item.unsatisfactory_count || 0,
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Unsat Count');

  // Generate filename
  const fromDate = from.split(' ')[0];
  const toDate = to.split(' ')[0];
  const provinceText = province === 'all' ? 'All' : province;
  const filename = `Unsat_Count_${provinceText}_${fromDate}_to_${toDate}.xlsx`;

  XLSX.writeFile(workbook, filename);
};