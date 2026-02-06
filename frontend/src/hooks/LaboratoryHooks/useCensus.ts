import { useQuery} from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import CensusService, {
} from '../../services/LaboratoryServices/censusService';
import type { CumulativeCensusParams,
    CumulativeCensusResponse,
    CensusError, } from '../../services/LaboratoryServices/censusService';

/**
 * Hook to fetch cumulative monthly census data
 * @param {CumulativeCensusParams} params - Query parameters
 * @param {boolean} enabled - Whether the query should run
 * @returns {UseQueryResult}
 */
export const useCumulativeMonthlyCensus = (
    params: CumulativeCensusParams,
    enabled: boolean = true
): UseQueryResult<CumulativeCensusResponse, CensusError> => {
    return useQuery<CumulativeCensusResponse, CensusError>({
        queryKey: ['cumulative-monthly-census', params.type],
        queryFn: () => CensusService.getCumulativeMonthlyCensus(params),
        enabled: enabled && !!params.type,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
        retry: 2,
        refetchOnWindowFocus: false,
    });
};

/**
 * Hook to fetch received census data
 * @param {boolean} enabled - Whether the query should run
 * @returns {UseQueryResult}
 */
export const useReceivedCensus = (
    enabled: boolean = true
): UseQueryResult<CumulativeCensusResponse, CensusError> => {
    return useCumulativeMonthlyCensus({ type: 'Received' }, enabled);
};

/**
 * Hook to fetch screened census data
 * @param {boolean} enabled - Whether the query should run
 * @returns {UseQueryResult}
 */
export const useScreenedCensus = (
    enabled: boolean = true
): UseQueryResult<CumulativeCensusResponse, CensusError> => {
    return useCumulativeMonthlyCensus({ type: 'Screened' }, enabled);
};