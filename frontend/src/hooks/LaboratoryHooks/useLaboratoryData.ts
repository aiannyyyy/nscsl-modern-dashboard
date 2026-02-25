import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import labTotalDailySamplesService from '../../services/LaboratoryServices/labTotalDailySamples';
import type {
    LabTotalDailySamplesResponse,
    LabTotalDailySamplesParams,
    SampleType
} from '../../services/LaboratoryServices/labTotalDailySamples';

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

// ✅ New hook for initial samples
export const useInitialSamples = (
    year: string | number,
    month: string
): UseQueryResult<LabTotalDailySamplesResponse, Error> => {
    return useQuery({
        queryKey: ['initialSamples', year, month],
        queryFn: () => labTotalDailySamplesService.getInitialSamples(year, month),
        enabled: !!year && !!month,
        staleTime: 5 * 60 * 1000,
    });
};

export const useCurrentMonthSamples = (
    sampleType: SampleType = 'received'
): UseQueryResult<LabTotalDailySamplesResponse, Error> => {
    return useQuery({
        queryKey: ['currentMonthSamples', sampleType],
        queryFn: () => labTotalDailySamplesService.getCurrentMonthSamples(sampleType),
        staleTime: 5 * 60 * 1000,
        refetchInterval: 30 * 60 * 1000,
    });
};