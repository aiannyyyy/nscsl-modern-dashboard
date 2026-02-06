import api from '../api';

/* =========================
   Types
========================= */

export interface TimeStats {
  average: number;
  median: number;
  mode: number;
}

export interface LabTrackingStats {
  dtcoll_to_dtrecv: TimeStats;
  dtrecv_to_dtrptd: TimeStats;
}

export interface LabTrackingStatsResponse {
  success: boolean;
  data: LabTrackingStats;
  filters: {
    year: number;
    month: number;
    startDate: string;
    endDate: string;
  };
  executionTime: string;
  timestamp: string;
}

/* =========================
   API Call
========================= */

export const getLabTrackingStats = async (
  year?: number,
  month?: number
): Promise<LabTrackingStatsResponse> => {
  const response = await api.get<LabTrackingStatsResponse>(
    '/laboratory/tracking-stats',
    {
      params: { year, month },
    }
  );

  return response.data;
};
