
import api from '../api';

export interface CumulativeCensusParams {
    type: 'Received' | 'Screened';
}

export interface CumulativeCensusDataItem {
    MONTH: number;
    YEAR: number;
    TOTAL_SAMPLES: number;
}

export interface CumulativeCensusResponse {
    success: boolean;
    data: CumulativeCensusDataItem[];
    filters: {
        type: string;
        spectypes: string[];
    };
    count: number;
    executionTime: string;
    timestamp: string;
}

export interface CensusError {
    success: false;
    error: string;
    message: string;
    executionTime?: string;
}

class CensusService {
    /**
     * Get cumulative monthly census data
     * @param {CumulativeCensusParams} params - Query parameters
     * @returns {Promise<CumulativeCensusResponse>}
     */
    static async getCumulativeMonthlyCensus(
        params: CumulativeCensusParams
    ): Promise<CumulativeCensusResponse> {
        const response = await api.get<CumulativeCensusResponse>(
            '/laboratory/census/cumulative-monthly',
            { params }
        );
        return response.data;
    }
}

export default CensusService;