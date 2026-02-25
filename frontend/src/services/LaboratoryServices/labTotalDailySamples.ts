import api from '../api';

interface DailySampleData {
    RECEIVED_DATE: string;
    TOTAL_SAMPLES: number;
}

// ✅ Added 'initial' to the union type
type SampleType = 'received' | 'screened' | 'initial';

interface LabTotalDailySamplesResponse {
    success: boolean;
    data: DailySampleData[];
    filters: {
        year: string;
        month: string;
        sampleType: SampleType;
        specTypes: string[];
    };
    recordCount: number;
    executionTime: string;
    timestamp: string;
}

interface LabTotalDailySamplesParams {
    year: string | number;
    month: string;
    sampleType?: SampleType;
}

const labTotalDailySamplesService = {
    getLabTotalDailySamples: async (params: LabTotalDailySamplesParams): Promise<LabTotalDailySamplesResponse> => {
        const response = await api.get<LabTotalDailySamplesResponse>('/laboratory/total-daily-samples', { params });
        return response.data;
    },

    getReceivedSamples: async (year: string | number, month: string): Promise<LabTotalDailySamplesResponse> => {
        const response = await api.get<LabTotalDailySamplesResponse>('/laboratory/total-daily-samples', {
            params: { year, month, sampleType: 'received' }
        });
        return response.data;
    },

    getScreenedSamples: async (year: string | number, month: string): Promise<LabTotalDailySamplesResponse> => {
        const response = await api.get<LabTotalDailySamplesResponse>('/laboratory/total-daily-samples', {
            params: { year, month, sampleType: 'screened' }
        });
        return response.data;
    },

    // ✅ New method for initial samples
    getInitialSamples: async (year: string | number, month: string): Promise<LabTotalDailySamplesResponse> => {
        const response = await api.get<LabTotalDailySamplesResponse>('/laboratory/total-daily-samples', {
            params: { year, month, sampleType: 'initial' }
        });
        return response.data;
    },

    getCurrentMonthSamples: async (sampleType: SampleType = 'received'): Promise<LabTotalDailySamplesResponse> => {
        const now = new Date();
        const year = now.getFullYear();
        const monthNames = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
        ];
        const month = monthNames[now.getMonth()];
        const response = await api.get<LabTotalDailySamplesResponse>('/laboratory/total-daily-samples', {
            params: { year, month, sampleType }
        });
        return response.data;
    }
};

export default labTotalDailySamplesService;
export type { DailySampleData, LabTotalDailySamplesResponse, LabTotalDailySamplesParams, SampleType };