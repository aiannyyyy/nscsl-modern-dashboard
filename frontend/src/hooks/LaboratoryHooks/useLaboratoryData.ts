import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import labTotalDailySamplesService from '../../services/LaboratoryServices/labTotalDailySamples';
import type { 
    LabTotalDailySamplesResponse,
    LabTotalDailySamplesParams 
} from '../../services/LaboratoryServices/labTotalDailySamples';

/**
 * Hook to fetch laboratory total daily samples
 */
export const useLabTotalDailySamples = (
    params: LabTotalDailySamplesParams
): UseQueryResult<LabTotalDailySamplesResponse, Error> => {
    return useQuery({
        queryKey: ['labDailySamples', params.year, params.month, params.sampleType],
        queryFn: () => labTotalDailySamplesService.getLabTotalDailySamples(params),
        enabled: !!params.year && !!params.month,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: true,
        retry: 2,
    });
};

/**
 * Hook to fetch received samples
 */
export const useReceivedSamples = (
    year: string | number,
    month: string
): UseQueryResult<LabTotalDailySamplesResponse, Error> => {
    return useQuery({
        queryKey: ['receivedSamples', year, month],
        queryFn: () => labTotalDailySamplesService.getReceivedSamples(year, month),
        enabled: !!year && !!month,
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Hook to fetch screened samples
 */
export const useScreenedSamples = (
    year: string | number,
    month: string
): UseQueryResult<LabTotalDailySamplesResponse, Error> => {
    return useQuery({
        queryKey: ['screenedSamples', year, month],
        queryFn: () => labTotalDailySamplesService.getScreenedSamples(year, month),
        enabled: !!year && !!month,
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Hook to fetch current month samples
 */
export const useCurrentMonthSamples = (
    sampleType: 'received' | 'screened' = 'received'
): UseQueryResult<LabTotalDailySamplesResponse, Error> => {
    return useQuery({
        queryKey: ['currentMonthSamples', sampleType],
        queryFn: () => labTotalDailySamplesService.getCurrentMonthSamples(sampleType),
        staleTime: 5 * 60 * 1000,
        refetchInterval: 30 * 60 * 1000,
    });
};