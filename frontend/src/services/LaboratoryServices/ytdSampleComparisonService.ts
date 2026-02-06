// src/services/LaboratoryServices/ytdSampleComparisonService.js

import api from "../api";

class YTDSampleComparisonService {
    // ==================== API CALLS ====================
    
    /**
     * Get YTD Sample Comparison
     * @param {number|string} year1 - First year to compare
     * @param {number|string} year2 - Second year to compare
     * @param {string} type - Sample type: 'received' or 'screened'
     * @returns {Promise<Object>} API response with comparison data
     */
    async getYTDSampleComparison(year1, year2, type) {
        try {
            const response = await api.get('/laboratory/ytd-sample-comparison', {
                params: {
                    year1,
                    year2,
                    type
                }
            });

            return {
                success: true,
                data: response.data.data,
                filters: response.data.filters,
                recordCount: response.data.recordCount,
                executionTime: response.data.executionTime,
                timestamp: response.data.timestamp
            };
        } catch (error) {
            console.error('[YTDSampleComparisonService] Error:', error);
            
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch YTD sample comparison',
                message: error.response?.data?.message || error.message,
                validationErrors: error.response?.data?.validationErrors
            };
        }
    }

    // ==================== VALIDATION ====================

    /**
     * Validate years before API call
     * @param {number|string} year1 
     * @param {number|string} year2 
     * @returns {Object} Validation result
     */
    validateYears(year1, year2) {
        const errors = [];
        const currentYear = new Date().getFullYear();

        if (!year1) errors.push('First year is required');
        if (!year2) errors.push('Second year is required');

        if (year1 && (isNaN(year1) || year1 < 2000 || year1 > currentYear + 1)) {
            errors.push(`First year must be between 2000 and ${currentYear + 1}`);
        }

        if (year2 && (isNaN(year2) || year2 < 2000 || year2 > currentYear + 1)) {
            errors.push(`Second year must be between 2000 and ${currentYear + 1}`);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate sample type
     * @param {string} type 
     * @returns {Object} Validation result
     */
    validateType(type) {
        const validTypes = ['received', 'screened'];
        const normalizedType = type?.toLowerCase().trim();

        return {
            isValid: validTypes.includes(normalizedType),
            normalizedType,
            error: !validTypes.includes(normalizedType) ? 'Type must be either "received" or "screened"' : null
        };
    }

    /**
     * Validate all parameters
     * @param {number|string} year1 
     * @param {number|string} year2 
     * @param {string} type 
     * @returns {Object} Complete validation result
     */
    validateAll(year1, year2, type) {
        const yearValidation = this.validateYears(year1, year2);
        const typeValidation = this.validateType(type);

        const allErrors = [
            ...yearValidation.errors,
            ...(typeValidation.error ? [typeValidation.error] : [])
        ];

        return {
            isValid: allErrors.length === 0,
            errors: allErrors,
            normalizedType: typeValidation.normalizedType
        };
    }

    /**
     * Get valid sample types
     * @returns {Object} Valid types configuration
     */
    getValidTypes() {
        return {
            received: 'Received Samples',
            screened: 'Screened Samples'
        };
    }

    /**
     * Get valid sample types as array for dropdown
     * @returns {Array} Array of type objects
     */
    getValidTypesArray() {
        return [
            { value: 'received', label: 'Received Samples' },
            { value: 'screened', label: 'Screened Samples' }
        ];
    }

    // ==================== DATA TRANSFORMATION ====================

    /**
     * Transform YTD data for chart visualization
     * @param {Array} rawData - Raw data from API
     * @param {number} year1 
     * @param {number} year2 
     * @returns {Object} Transformed data for charts (Chart.js format)
     */
    transformYTDDataForChart(rawData, year1, year2) {
        if (!rawData || !Array.isArray(rawData)) {
            return {
                labels: [],
                datasets: []
            };
        }

        const monthNames = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];

        // Initialize arrays with zeros
        const year1Data = new Array(12).fill(0);
        const year2Data = new Array(12).fill(0);

        // Populate data
        rawData.forEach(row => {
            const monthIndex = row.MONTH - 1; // Convert to 0-based index
            const totalSamples = Number(row.TOTAL_SAMPLES) || 0;

            if (row.YEAR == year1) {
                year1Data[monthIndex] = totalSamples;
            } else if (row.YEAR == year2) {
                year2Data[monthIndex] = totalSamples;
            }
        });

        return {
            labels: monthNames,
            datasets: [
                {
                    label: `${year1}`,
                    data: year1Data,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: `${year2}`,
                    data: year2Data,
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }
            ]
        };
    }

    /**
     * Transform YTD data for bar chart
     * @param {Array} rawData - Raw data from API
     * @param {number} year1 
     * @param {number} year2 
     * @returns {Object} Transformed data for bar charts
     */
    transformYTDDataForBarChart(rawData, year1, year2) {
        const chartData = this.transformYTDDataForChart(rawData, year1, year2);
        
        // Modify for bar chart styling
        chartData.datasets = chartData.datasets.map((dataset, index) => ({
            ...dataset,
            backgroundColor: index === 0 
                ? 'rgba(75, 192, 192, 0.6)' 
                : 'rgba(255, 99, 132, 0.6)',
            borderColor: index === 0 
                ? 'rgb(75, 192, 192)' 
                : 'rgb(255, 99, 132)',
            borderWidth: 1
        }));

        return chartData;
    }

    /**
     * Transform YTD data for table display
     * @param {Array} rawData - Raw data from API
     * @param {number} year1 
     * @param {number} year2 
     * @returns {Array} Formatted table data
     */
    transformYTDDataForTable(rawData, year1, year2) {
        if (!rawData || !Array.isArray(rawData)) {
            return [];
        }

        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        // Create a map for quick lookup
        const dataMap = {};
        rawData.forEach(row => {
            const key = `${row.YEAR}-${row.MONTH}`;
            dataMap[key] = Number(row.TOTAL_SAMPLES) || 0;
        });

        // Build table rows
        const tableData = [];
        for (let month = 1; month <= 12; month++) {
            const year1Samples = dataMap[`${year1}-${month}`] || 0;
            const year2Samples = dataMap[`${year2}-${month}`] || 0;
            const difference = year2Samples - year1Samples;
            const percentChange = year1Samples > 0 
                ? ((difference / year1Samples) * 100).toFixed(2)
                : year2Samples > 0 ? 100 : 0;

            tableData.push({
                month: monthNames[month - 1],
                monthNumber: month,
                monthShort: this.getMonthName(month, true),
                year1: year1Samples,
                year2: year2Samples,
                difference,
                differenceFormatted: this.formatNumber(Math.abs(difference)),
                percentChange: `${percentChange}%`,
                percentChangeValue: parseFloat(percentChange),
                trend: difference > 0 ? 'up' : difference < 0 ? 'down' : 'neutral',
                year1Formatted: this.formatNumber(year1Samples),
                year2Formatted: this.formatNumber(year2Samples)
            });
        }

        return tableData;
    }

    /**
     * Calculate summary statistics
     * @param {Array} rawData - Raw data from API
     * @param {number} year1 
     * @param {number} year2 
     * @returns {Object} Summary statistics
     */
    calculateSummaryStats(rawData, year1, year2) {
        if (!rawData || !Array.isArray(rawData)) {
            return {
                year1Total: 0,
                year2Total: 0,
                difference: 0,
                percentChange: 0,
                year1Average: 0,
                year2Average: 0,
                year1Max: 0,
                year2Max: 0,
                year1Min: 0,
                year2Min: 0
            };
        }

        let year1Total = 0;
        let year2Total = 0;
        const year1Values = [];
        const year2Values = [];

        rawData.forEach(row => {
            const totalSamples = Number(row.TOTAL_SAMPLES) || 0;
            
            if (row.YEAR == year1) {
                year1Total += totalSamples;
                year1Values.push(totalSamples);
            } else if (row.YEAR == year2) {
                year2Total += totalSamples;
                year2Values.push(totalSamples);
            }
        });

        const difference = year2Total - year1Total;
        const percentChange = year1Total > 0 
            ? ((difference / year1Total) * 100).toFixed(2)
            : year2Total > 0 ? 100 : 0;

        return {
            year1Total,
            year2Total,
            difference,
            percentChange: parseFloat(percentChange),
            year1Average: year1Values.length > 0 
                ? parseFloat((year1Total / year1Values.length).toFixed(2)) 
                : 0,
            year2Average: year2Values.length > 0 
                ? parseFloat((year2Total / year2Values.length).toFixed(2)) 
                : 0,
            year1Max: year1Values.length > 0 ? Math.max(...year1Values) : 0,
            year2Max: year2Values.length > 0 ? Math.max(...year2Values) : 0,
            year1Min: year1Values.length > 0 ? Math.min(...year1Values) : 0,
            year2Min: year2Values.length > 0 ? Math.min(...year2Values) : 0,
            year1TotalFormatted: this.formatNumber(year1Total),
            year2TotalFormatted: this.formatNumber(year2Total),
            differenceFormatted: this.formatNumber(Math.abs(difference)),
            trend: difference > 0 ? 'increase' : difference < 0 ? 'decrease' : 'stable'
        };
    }

    // ==================== UTILITY FUNCTIONS ====================

    /**
     * Format number with commas
     * @param {number} num 
     * @returns {string} Formatted number
     */
    formatNumber(num) {
        if (num === null || num === undefined) return '0';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    /**
     * Get year range for dropdowns
     * @param {number} startYear - Starting year (default: 2015)
     * @returns {Array} Array of year objects
     */
    getYearRange(startYear = 2015) {
        const currentYear = new Date().getFullYear();
        const years = [];
        
        for (let year = currentYear + 1; year >= startYear; year--) {
            years.push({
                value: year,
                label: year.toString()
            });
        }
        
        return years;
    }

    /**
     * Export data to CSV
     * @param {Array} tableData - Table data to export
     * @param {string} year1 
     * @param {string} year2 
     * @param {string} type 
     */
    exportToCSV(tableData, year1, year2, type) {
        if (!tableData || tableData.length === 0) {
            console.warn('No data to export');
            return;
        }

        const filename = `YTD_Comparison_${year1}_vs_${year2}_${type}_${new Date().toISOString().split('T')[0]}.csv`;

        // Define headers
        const headers = ['Month', year1, year2, 'Difference', 'Percent Change'];
        
        // Build CSV content
        const csvContent = [
            headers.join(','),
            ...tableData.map(row => [
                row.month,
                row.year1,
                row.year2,
                row.difference,
                row.percentChange
            ].join(','))
        ].join('\n');

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    /**
     * Export chart data to JSON
     * @param {Object} chartData 
     * @param {Object} filters 
     */
    exportToJSON(chartData, filters) {
        const exportData = {
            exportDate: new Date().toISOString(),
            filters,
            chartData
        };

        const filename = `YTD_Chart_Data_${filters.year1}_vs_${filters.year2}_${new Date().toISOString().split('T')[0]}.json`;
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
            type: 'application/json' 
        });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    /**
     * Get month name from number
     * @param {number} monthNumber - Month number (1-12)
     * @param {boolean} short - Return short name
     * @returns {string} Month name
     */
    getMonthName(monthNumber, short = false) {
        const monthNames = short 
            ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            : ['January', 'February', 'March', 'April', 'May', 'June', 
               'July', 'August', 'September', 'October', 'November', 'December'];
        
        return monthNames[monthNumber - 1] || '';
    }

    /**
     * Get color for trend
     * @param {string} trend - 'up', 'down', or 'neutral'
     * @returns {string} Color code
     */
    getTrendColor(trend) {
        const colors = {
            up: '#10b981',      // green
            down: '#ef4444',    // red
            neutral: '#6b7280' // gray
        };
        return colors[trend] || colors.neutral;
    }

    /**
     * Get trend icon
     * @param {string} trend - 'up', 'down', or 'neutral'
     * @returns {string} Icon name or symbol
     */
    getTrendIcon(trend) {
        const icons = {
            up: '↑',
            down: '↓',
            neutral: '→'
        };
        return icons[trend] || icons.neutral;
    }
}

export default new YTDSampleComparisonService();