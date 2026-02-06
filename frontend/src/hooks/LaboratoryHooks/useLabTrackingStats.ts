import { useQuery } from '@tanstack/react-query';
import { getLabTrackingStats } from
  '../../services//LaboratoryServices/labTrackingService';

interface UseLabTrackingStatsParams {
  year?: number;
  month?: number;
}

export const useLabTrackingStats = ({
  year,
  month,
}: UseLabTrackingStatsParams = {}) => {
  return useQuery({
    queryKey: ['labTrackingStats', year, month],
    queryFn: () => getLabTrackingStats(year, month),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000,
  });
};
