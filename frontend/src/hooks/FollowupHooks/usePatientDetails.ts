import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
    fetchPatientDetails,
    fetchTestCodes,
    type PatientDetailsFilters,
    type PatientDetailsResponse,
    type TestCodesResponse,
} from '../../services/FollowupServices/patientDetailsService';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const patientDetailsKeys = {
    all: ['followup', 'patientDetails'] as const,
    list: (filters: PatientDetailsFilters) =>
        [...patientDetailsKeys.all, filters] as const,
    testCodes: ['followup', 'testCodes'] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Hook to fetch patient details for follow-up
 *
 * @example
 * const { data, isLoading, isError, error, refetch } = usePatientDetails({
 *   dateFrom: '2024-01-01',
 *   dateTo:   '2024-01-31',
 *   testCode: 'OHP1',       // optional, defaults to 'ALL'
 * });
 */
export const usePatientDetails = (
    filters: PatientDetailsFilters,
    options?: { enabled?: boolean }
) => {
    const isReady =
        Boolean(filters.dateFrom) &&
        Boolean(filters.dateTo) &&
        (options?.enabled ?? true);

    return useQuery<PatientDetailsResponse, Error>({
        queryKey: patientDetailsKeys.list(filters),
        queryFn: () => fetchPatientDetails(filters),
        enabled: isReady,
        placeholderData: keepPreviousData,   // keeps old data visible while fetching new page/filter
        staleTime: 5 * 60 * 1000,           // 5 minutes
        gcTime: 10 * 60 * 1000,             // 10 minutes
        retry: 2,
    });
};

/**
 * Hook to fetch the list of valid test code options
 * Cached for 1 hour since test codes rarely change
 *
 * @example
 * const { data, isLoading } = useTestCodes();
 * const testCodes = data?.data ?? [];
 */
export const useTestCodes = () => {
    return useQuery<TestCodesResponse, Error>({
        queryKey: patientDetailsKeys.testCodes,
        queryFn: fetchTestCodes,
        staleTime: 60 * 60 * 1000,     // 1 hour
        gcTime: 60 * 60 * 1000,        // 1 hour
        retry: 2,
    });
};