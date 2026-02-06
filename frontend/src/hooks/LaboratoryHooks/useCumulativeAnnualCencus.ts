import { useQuery } from '@tanstack/react-query';
import { getCumulativeAnnualCensus } from '../../services/LaboratoryServices/cumulativeAnnualCencusService';

/**
 * React Query hook for fetching cumulative annual census data
 * @returns Query result with annual census data
 */
export const useCumulativeAnnualCensus = () => {
  return useQuery({
    queryKey: ['cumulative-annual-census'],
    queryFn: getCumulativeAnnualCensus,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};