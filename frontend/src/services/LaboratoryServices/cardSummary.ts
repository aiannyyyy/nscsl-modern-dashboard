import api from '../api';

/**
 * Card Summary Data Interface
 */
interface CardSummaryData {
    received: number;
    screened: number;
    unsat: number;
}

/**
 * Card Summary Response Interface
 */
interface CardSummaryResponse {
    success: boolean;
    data: CardSummaryData;
    filters: {
        dateFrom?: string;
        dateTo?: string;
        type: 'custom' | 'current_month';
    };
    executionTime: string;
    timestamp: string;
}

/**
 * Card Summary Request Parameters
 */
interface CardSummaryParams {
    dateFrom?: string;
    dateTo?: string;
}

/**
 * Laboratory Card Summary API Service
 */
const cardSummaryService = {
    /**
     * Get laboratory card summary data
     * @param {CardSummaryParams} params - Optional parameters
     * @returns {Promise<CardSummaryResponse>} Response with received, screened, and unsat counts
     */
    getCardSummary: async (params: CardSummaryParams = {}): Promise<CardSummaryResponse> => {
        try {
            const response = await api.get<CardSummaryResponse>('/laboratory/card-summary', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching laboratory card summary:', error);
            throw error;
        }
    },

    /**
     * Get laboratory card summary for current month
     * @returns {Promise<CardSummaryResponse>} Response with current month data
     */
    getCurrentMonthSummary: async (): Promise<CardSummaryResponse> => {
        try {
            const response = await api.get<CardSummaryResponse>('/laboratory/card-summary');
            return response.data;
        } catch (error) {
            console.error('Error fetching current month summary:', error);
            throw error;
        }
    },

    /**
     * Get laboratory card summary for custom date range
     * @param {string} dateFrom - Start date (YYYY-MM-DD)
     * @param {string} dateTo - End date (YYYY-MM-DD)
     * @returns {Promise<CardSummaryResponse>} Response with data for specified range
     */
    getCustomRangeSummary: async (dateFrom: string, dateTo: string): Promise<CardSummaryResponse> => {
        try {
            const response = await api.get<CardSummaryResponse>('/laboratory/card-summary', {
                params: { dateFrom, dateTo }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching custom range summary:', error);
            throw error;
        }
    }
};

export default cardSummaryService;
export type { CardSummaryData, CardSummaryResponse, CardSummaryParams };