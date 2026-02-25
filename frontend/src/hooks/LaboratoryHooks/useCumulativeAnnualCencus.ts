import { useQuery } from '@tanstack/react-query';
import { getCumulativeAnnualCensus } from '../../services/LaboratoryServices/cumulativeAnnualCencusService';
import type { AnnualCensusResponse } from '../../services/LaboratoryServices/cumulativeAnnualCencusService';

/**
 * React Query hook for fetching cumulative annual census data
 */
export const useCumulativeAnnualCensus = () => {
  return useQuery<AnnualCensusResponse, Error>({
    queryKey: ['cumulative-annual-census'],
    queryFn: getCumulativeAnnualCensus,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime:    10 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
};