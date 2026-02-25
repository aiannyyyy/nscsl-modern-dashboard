import api from '../api';

export interface AnnualCensusData {
  YEAR_MONTH: string;
  TOTAL_SAMPLES: number;
  TEST_6: number;
  ENBS: number;
  CNT_SCREENED: number;  // renamed from SCREENED — Oracle reserved word
  CNT_INITIAL: number;   // renamed from INITIAL  — Oracle reserved word
}

export interface AnnualCensusResponse {
  success: boolean;
  data: AnnualCensusData[];
  filters: {
    breakdowns: {
      received: {
        test_6: { spectypes: string[]; dateRange: string };
        enbs:   { spectypes: string[]; dateRange: string };
      };
      screened: { spectypes: string[]; dateRange: string };
      initial:  { spectypes: string[]; dateRange: string };
    };
  };
  count: number;
  executionTime: string;
  timestamp: string;
}

export const getCumulativeAnnualCensus = async (): Promise<AnnualCensusResponse> => {
  try {
    const response = await api.get('/laboratory/cumulative-annual-census');
    return response.data;
  } catch (error) {
    console.error('Error fetching cumulative annual census:', error);
    throw error;
  }
};