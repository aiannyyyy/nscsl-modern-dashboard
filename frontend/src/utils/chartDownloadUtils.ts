import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export type ChartExportFormat = 'png' | 'svg' | 'excel';

export interface ChartExportOptions {
  elementId: string;
  filename: string;
  format?: ChartExportFormat;
  data?: any[];  // For Excel export
  sheetName?: string;
  backgroundColor?: string;
  scale?: number;
}

// ─────────────────────────────────────────────
// Chart Download Utilities
// ─────────────────────────────────────────────

/**
 * Download chart as PNG image
 */
export const downloadChartAsPNG = async (
  elementId: string,
  filename: string,
  options?: {
    backgroundColor?: string;
    scale?: number;
  }
): Promise<void> => {
  const chartElement = document.getElementById(elementId);
  if (!chartElement) {
    throw new Error(`Chart element with id "${elementId}" not found`);
  }

  try {
    const canvas = await html2canvas(chartElement, {
      backgroundColor: options?.backgroundColor || '#ffffff',
      scale: options?.scale || 2,
      logging: false,
      useCORS: true,
    });

    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error('Failed to create image blob');
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(url), 100);
    }, 'image/png');
  } catch (error) {
    console.error('PNG export failed:', error);
    throw error;
  }
};

/**
 * Download chart as SVG
 */
export const downloadChartAsSVG = (
  elementId: string,
  filename: string
): void => {
  const chartElement = document.getElementById(elementId);
  if (!chartElement) {
    throw new Error(`Chart element with id "${elementId}" not found`);
  }

  const svg = chartElement.querySelector('svg');
  if (!svg) {
    throw new Error('SVG element not found in chart');
  }

  try {
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => URL.revokeObjectURL(url), 100);
  } catch (error) {
    console.error('SVG export failed:', error);
    throw error;
  }
};

/**
 * Download chart data as Excel
 */
export const downloadChartAsExcel = (
  data: any[],
  filename: string,
  sheetName: string = 'Chart Data'
): void => {
  if (!data || data.length === 0) {
    throw new Error('No data provided for Excel export');
  }

  try {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Write to array buffer
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => URL.revokeObjectURL(url), 100);
  } catch (error) {
    console.error('Excel export failed:', error);
    throw error;
  }
};

/**
 * Universal chart download function
 */
export const downloadChart = async (options: ChartExportOptions): Promise<void> => {
  const {
    elementId,
    filename,
    format = 'png',
    data,
    sheetName,
    backgroundColor,
    scale,
  } = options;

  try {
    switch (format) {
      case 'png':
        await downloadChartAsPNG(elementId, filename, { backgroundColor, scale });
        break;

      case 'svg':
        downloadChartAsSVG(elementId, filename);
        break;

      case 'excel':
        if (!data) {
          throw new Error('Data is required for Excel export');
        }
        downloadChartAsExcel(data, filename, sheetName);
        break;

      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  } catch (error) {
    console.error('Chart download failed:', error);
    alert(`Failed to download chart: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
};

// ─────────────────────────────────────────────
// React Hook (Optional)
// ─────────────────────────────────────────────
export const useChartDownload = () => {
  const download = async (options: ChartExportOptions) => {
    await downloadChart(options);
  };

  return { download };
};