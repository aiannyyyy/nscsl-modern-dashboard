import api from '../api';

interface AnnualCensusData {
  YEAR_MONTH: string;
  TOTAL_SAMPLES: number;
  TEST_6: number;
  ENBS: number;
}

interface AnnualCensusResponse {
  success: boolean;
  data: AnnualCensusData[];
  filters: {
    spectypes: string[];
    dateRanges: {
      test_6: string;
      enbs: string;
    };
  };
  count: number;
  executionTime: string;
  timestamp: string;
}

/**
 * Fetch cumulative annual census data
 * @returns Promise with annual census response
 */
export const getCumulativeAnnualCensus = async (): Promise<AnnualCensusResponse> => {
  try {
    // Remove the leading /api since it's already in the base URL
    const response = await api.get('/laboratory/cumulative-annual-census');
    return response.data;
  } catch (error) {
    console.error('Error fetching cumulative annual census:', error);
    throw error;
  }
};