import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    lookupLabNumber,
    getAllEndorsements,
    getEndorsementById,
    getEndorsementsByLabNo,
    getEndorsementsByFacility,
    getEndorsementsByStatus,
    getEndorsementStats,
    getUniqueTestResults,
    createEndorsement,
    updateEndorsement,
    updateEndorsementStatus,
    deleteEndorsement,
    type EndorsementData,
    type OracleLookupResponse,
    type EndorsementStats,
    type DateRange,
    type StatusFilter,
} from '../../services/LaboratoryServices/unsatEndorsementService';

// Query keys
export const endorsementKeys = {
    all: ['endorsements'] as const,
    lists: () => [...endorsementKeys.all, 'list'] as const,
    list: (filters?: string) => [...endorsementKeys.lists(), { filters }] as const,
    details: () => [...endorsementKeys.all, 'detail'] as const,
    detail: (id: number) => [...endorsementKeys.details(), id] as const,
    lookup: (labno: string) => [...endorsementKeys.all, 'lookup', labno] as const,
    byLabNo: (labno: string) => [...endorsementKeys.all, 'labno', labno] as const,
    byFacility: (facilityCode: string) => [...endorsementKeys.all, 'facility', facilityCode] as const,
    byStatus: (status: string) => [...endorsementKeys.all, 'status', status] as const,
    stats: (dateRange?: DateRange) => [...endorsementKeys.all, 'stats', dateRange] as const,
};

// ============= QUERIES =============

/**
 * Hook to lookup lab number from Oracle database
 */
export const useLookupLabNumber = (labno: string, enabled = true) => {
    return useQuery<OracleLookupResponse, Error>({
        queryKey: endorsementKeys.lookup(labno),
        queryFn: () => lookupLabNumber(labno),
        enabled: enabled && !!labno,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
    });
};

/**
 * Hook to get all endorsements
 */
export const useGetAllEndorsements = () => {
    return useQuery<EndorsementData[], Error>({
        queryKey: endorsementKeys.lists(),
        queryFn: getAllEndorsements,
        staleTime: 30 * 1000, // 30 seconds
    });
};

/**
 * Hook to get endorsement by ID
 */
export const useGetEndorsementById = (id: number, enabled = true) => {
    return useQuery<EndorsementData, Error>({
        queryKey: endorsementKeys.detail(id),
        queryFn: () => getEndorsementById(id),
        enabled: enabled && !!id,
        staleTime: 60 * 1000, // 1 minute
    });
};

/**
 * Hook to get endorsements by lab number
 */
export const useGetEndorsementsByLabNo = (labno: string, enabled = true) => {
    return useQuery<EndorsementData[], Error>({
        queryKey: endorsementKeys.byLabNo(labno),
        queryFn: () => getEndorsementsByLabNo(labno),
        enabled: enabled && !!labno,
        staleTime: 60 * 1000, // 1 minute
    });
};

/**
 * Hook to get endorsements by facility code
 */
export const useGetEndorsementsByFacility = (facilityCode: string, enabled = true) => {
    return useQuery<EndorsementData[], Error>({
        queryKey: endorsementKeys.byFacility(facilityCode),
        queryFn: () => getEndorsementsByFacility(facilityCode),
        enabled: enabled && !!facilityCode,
        staleTime: 60 * 1000, // 1 minute
    });
};

/**
 * Hook to get endorsements by status
 */
export const useGetEndorsementsByStatus = (filter: StatusFilter, enabled = true) => {
    return useQuery<EndorsementData[], Error>({
        queryKey: endorsementKeys.byStatus(filter.status),
        queryFn: () => getEndorsementsByStatus(filter),
        enabled: enabled && !!filter.status,
        staleTime: 60 * 1000, // 1 minute
    });
};

/**
 * Hook to get endorsement statistics
 */
export const useGetEndorsementStats = (dateRange?: DateRange) => {
    return useQuery<EndorsementStats, Error>({
        queryKey: endorsementKeys.stats(dateRange),
        queryFn: () => getEndorsementStats(dateRange),
        staleTime: 60 * 1000, // 1 minute
    });
};

/**
 * Hook to get unique test results for dropdown filter
 */
export const useGetUniqueTestResults = () => {
    return useQuery<string[], Error>({
        queryKey: [...endorsementKeys.all, 'unique-test-results'],
        queryFn: getUniqueTestResults,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

// ============= MUTATIONS =============

/**
 * Hook to create endorsement
 */
export const useCreateEndorsement = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: FormData) => createEndorsement(data),
        onSuccess: () => {
            // Invalidate and refetch endorsement lists
            queryClient.invalidateQueries({ queryKey: endorsementKeys.lists() });
            queryClient.invalidateQueries({ queryKey: endorsementKeys.all });
        },
    });
};

/**
 * Hook to update endorsement
 */
export const useUpdateEndorsement = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: FormData }) => 
            updateEndorsement(id, data),
        onSuccess: (_, variables) => {
            // Invalidate specific endorsement and lists
            queryClient.invalidateQueries({ queryKey: endorsementKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: endorsementKeys.lists() });
            queryClient.invalidateQueries({ queryKey: endorsementKeys.all });
        },
    });
};

/**
 * Hook to update endorsement status
 */
export const useUpdateEndorsementStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status, modified_by }: { id: number; status: number; modified_by?: string }) =>
            updateEndorsementStatus(id, status, modified_by),
        onSuccess: (_, variables) => {
            // Invalidate specific endorsement and lists
            queryClient.invalidateQueries({ queryKey: endorsementKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: endorsementKeys.lists() });
            queryClient.invalidateQueries({ queryKey: endorsementKeys.all });
        },
    });
};

/**
 * Hook to delete endorsement
 */
export const useDeleteEndorsement = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => deleteEndorsement(id),
        onSuccess: () => {
            // Invalidate all endorsement queries
            queryClient.invalidateQueries({ queryKey: endorsementKeys.all });
        },
    });
};

// ============= OPTIMISTIC UPDATES =============

/**
 * Hook to update endorsement with optimistic update
 */
export const useUpdateEndorsementOptimistic = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: FormData }) => 
            updateEndorsement(id, data),
        onMutate: async ({ id }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: endorsementKeys.detail(id) });

            // Snapshot previous value
            const previousEndorsement = queryClient.getQueryData(endorsementKeys.detail(id));

            // Return context with previous value
            return { previousEndorsement, id };
        },
        onError: (_err, _variables, context) => {
            // Rollback to previous value on error
            if (context?.previousEndorsement) {
                queryClient.setQueryData(
                    endorsementKeys.detail(context.id),
                    context.previousEndorsement
                );
            }
        },
        onSettled: (_, __, variables) => {
            // Refetch after error or success
            queryClient.invalidateQueries({ queryKey: endorsementKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: endorsementKeys.lists() });
        },
    });
};

/**
 * Hook to delete endorsement with optimistic update
 */
export const useDeleteEndorsementOptimistic = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => deleteEndorsement(id),
        onMutate: async (id) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: endorsementKeys.lists() });

            // Snapshot previous value
            const previousEndorsements = queryClient.getQueryData<EndorsementData[]>(
                endorsementKeys.lists()
            );

            // Optimistically update to remove endorsement
            if (previousEndorsements) {
                queryClient.setQueryData<EndorsementData[]>(
                    endorsementKeys.lists(),
                    previousEndorsements.filter((endorsement) => endorsement.id !== id)
                );
            }

            return { previousEndorsements };
        },
        onError: (_err, _variables, context) => {
            // Rollback on error
            if (context?.previousEndorsements) {
                queryClient.setQueryData(endorsementKeys.lists(), context.previousEndorsements);
            }
        },
        onSettled: () => {
            // Refetch after error or success
            queryClient.invalidateQueries({ queryKey: endorsementKeys.all });
        },
    });
};

export default {
    // Queries
    useLookupLabNumber,
    useGetAllEndorsements,
    useGetEndorsementById,
    useGetEndorsementsByLabNo,
    useGetEndorsementsByFacility,
    useGetEndorsementsByStatus,
    useGetEndorsementStats,
    useGetUniqueTestResults,
    // Mutations
    useCreateEndorsement,
    useUpdateEndorsement,
    useUpdateEndorsementStatus,
    useDeleteEndorsement,
    // Optimistic
    useUpdateEndorsementOptimistic,
    useDeleteEndorsementOptimistic,
};