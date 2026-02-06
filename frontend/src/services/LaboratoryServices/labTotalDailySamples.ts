import api from '../api';

/**
 * Daily Sample Data Interface
 */
interface DailySampleData {
    RECEIVED_DATE: string;
    TOTAL_SAMPLES: number;
}

/**
 * Lab Total Daily Samples Response Interface
 */
interface LabTotalDailySamplesResponse {
    success: boolean;
    data: DailySampleData[];
    filters: {
        year: string;
        month: string;
        sampleType: 'received' | 'screened';
        specTypes: string[];
    };
    recordCount: number;
    executionTime: string;
    timestamp: string;
}

/**
 * Lab Total Daily Samples Request Parameters
 */
interface LabTotalDailySamplesParams {
    year: string | number;
    month: string;
    sampleType?: 'received' | 'screened';
}

/**
 * Laboratory Total Daily Samples API Service
 */
const labTotalDailySamplesService = {
    /**
     * Get laboratory total daily samples
     * @param {LabTotalDailySamplesParams} params - Request parameters
     * @returns {Promise<LabTotalDailySamplesResponse>} Daily sample counts
     */
    getLabTotalDailySamples: async (params: LabTotalDailySamplesParams): Promise<LabTotalDailySamplesResponse> => {
        try {
            const response = await api.get<LabTotalDailySamplesResponse>('/laboratory/total-daily-samples', { 
                params 
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching lab total daily samples:', error);
            throw error;
        }
    },

    /**
     * Get received samples for a specific month
     * @param {string | number} year - Year (e.g., 2024)
     * @param {string} month - Month name (e.g., 'january') - LOWERCASE
     * @returns {Promise<LabTotalDailySamplesResponse>}
     */
    getReceivedSamples: async (year: string | number, month: string): Promise<LabTotalDailySamplesResponse> => {
        try {
            const response = await api.get<LabTotalDailySamplesResponse>('/laboratory/total-daily-samples', {
                params: { year, month, sampleType: 'received' }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching received samples:', error);
            throw error;
        }
    },

    /**
     * Get screened samples for a specific month
     * @param {string | number} year - Year (e.g., 2024)
     * @param {string} month - Month name (e.g., 'january') - LOWERCASE
     * @returns {Promise<LabTotalDailySamplesResponse>}
     */
    getScreenedSamples: async (year: string | number, month: string): Promise<LabTotalDailySamplesResponse> => {
        try {
            const response = await api.get<LabTotalDailySamplesResponse>('/laboratory/total-daily-samples', {
                params: { year, month, sampleType: 'screened' }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching screened samples:', error);
            throw error;
        }
    },

    /**
     * Get current month samples
     * @param {string} sampleType - 'received' or 'screened'
     * @returns {Promise<LabTotalDailySamplesResponse>}
     */
    getCurrentMonthSamples: async (sampleType: 'received' | 'screened' = 'received'): Promise<LabTotalDailySamplesResponse> => {
        const now = new Date();
        const year = now.getFullYear();
        // ✅ FIXED: Use lowercase month names to match backend
        const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                           'july', 'august', 'september', 'october', 'november', 'december'];
        const month = monthNames[now.getMonth()];

        try {
            const response = await api.get<LabTotalDailySamplesResponse>('/laboratory/total-daily-samples', {
                params: { year, month, sampleType }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching current month samples:', error);
            throw error;
        }
    }
};

export default labTotalDailySamplesService;
export type { 
    DailySampleData, 
    LabTotalDailySamplesResponse, 
    LabTotalDailySamplesParams 
};