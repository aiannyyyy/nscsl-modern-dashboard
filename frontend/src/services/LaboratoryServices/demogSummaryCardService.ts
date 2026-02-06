import api from '../api';

// Export interfaces
export interface DemogSummaryStats {
    entry: {
        "Jay Arr Apelado": number;
        "Angelica Brutas": number;
        "Mary Rose Gomez": number;
        "Abigail Morfe": number;
    };
    verification: {
        "Apelado Jay Arr": number;
        "Brutas Angelica": number;
        "Gomez Mary Rose": number;
        "Morfe Abigail": number;
    };
}

export interface DemogSummaryStatsWithDateRange extends DemogSummaryStats {
    dateRange: {
        startDate: string;
        endDate: string;
    };
}

export interface DateRangeParams {
    startDate: string; // Format: YYYY-MM-DD
    endDate: string;   // Format: YYYY-MM-DD
}

// Service class
class DemogSummaryCardService {
    private baseUrl = '/laboratory/demog-summary-cards';

    /**
     * Get data entry statistics for the current month
     * @returns Promise with entry and verification counts
     */
    async getCurrentMonthStats(): Promise<DemogSummaryStats> {
        try {
            const response = await api.get(this.baseUrl);
            return response.data;
        } catch (error) {
            console.error('Error fetching current month stats:', error);
            throw error;
        }
    }

    /**
     * Get data entry statistics for a specific date range
     * @param params - Object containing startDate and endDate
     * @returns Promise with entry and verification counts including date range
     */
    async getStatsByDateRange(params: DateRangeParams): Promise<DemogSummaryStatsWithDateRange> {
        try {
            const response = await api.get(`${this.baseUrl}/date-range`, {
                params: {
                    startDate: params.startDate,
                    endDate: params.endDate
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching stats by date range:', error);
            throw error;
        }
    }

    /**
     * Get statistics for a specific month
     * @param year - Year (e.g., 2024)
     * @param month - Month (1-12)
     * @returns Promise with entry and verification counts
     */
    async getStatsByMonth(year: number, month: number): Promise<DemogSummaryStatsWithDateRange> {
        try {
            // Calculate first and last day of the month
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0); // Last day of month

            const params: DateRangeParams = {
                startDate: this.formatDate(startDate),
                endDate: this.formatDate(endDate)
            };

            return await this.getStatsByDateRange(params);
        } catch (error) {
            console.error('Error fetching stats by month:', error);
            throw error;
        }
    }

    /**
     * Get statistics for a specific year
     * @param year - Year (e.g., 2024)
     * @returns Promise with entry and verification counts
     */
    async getStatsByYear(year: number): Promise<DemogSummaryStatsWithDateRange> {
        try {
            const params: DateRangeParams = {
                startDate: `${year}-01-01`,
                endDate: `${year}-12-31`
            };

            return await this.getStatsByDateRange(params);
        } catch (error) {
            console.error('Error fetching stats by year:', error);
            throw error;
        }
    }

    /**
     * Helper function to format Date object to YYYY-MM-DD
     * @param date - Date object
     * @returns Formatted date string
     */
    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Get total entry count across all technicians
     * @param stats - DemogSummaryStats object
     * @returns Total entry count
     */
    getTotalEntryCount(stats: DemogSummaryStats): number {
        return Object.values(stats.entry).reduce((sum, count) => sum + count, 0);
    }

    /**
     * Get total verification count across all technicians
     * @param stats - DemogSummaryStats object
     * @returns Total verification count
     */
    getTotalVerificationCount(stats: DemogSummaryStats): number {
        return Object.values(stats.verification).reduce((sum, count) => sum + count, 0);
    }

    /**
     * Get combined total count (entry + verification)
     * @param stats - DemogSummaryStats object
     * @returns Total count
     */
    getTotalCount(stats: DemogSummaryStats): number {
        return this.getTotalEntryCount(stats) + this.getTotalVerificationCount(stats);
    }
}

// Default export
export default new DemogSummaryCardService();