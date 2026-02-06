import { useQuery } from '@tanstack/react-query';
import cardSummaryService from '../../services/LaboratoryServices/cardSummary';
import type { 
    CardSummaryResponse,
    CardSummaryParams 
} from '../../services/LaboratoryServices/cardSummary';

/**
 * Hook to fetch laboratory card summary data
 */
export const useCardSummary = (params?: CardSummaryParams) => {
    return useQuery({
        queryKey: ['labCardSummary', params?.dateFrom, params?.dateTo],
        queryFn: () => cardSummaryService.getCardSummary(params || {}),
        staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
        gcTime: 10 * 60 * 1000, // Cache for 10 minutes
        refetchOnWindowFocus: true, // Refetch when user comes back to tab
        retry: 2,
    });
};

/**
 * Hook to fetch current month card summary
 */
export const useCurrentMonthSummary = () => {
    return useQuery({
        queryKey: ['labCardSummary', 'current-month'],
        queryFn: () => cardSummaryService.getCurrentMonthSummary(),
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: true,
        refetchInterval: 2 * 60 * 1000, // Auto-refetch every 2 minutes for dashboard cards
    });
};

/**
 * Hook to fetch card summary for custom date range
 */
export const useCustomRangeSummary = (dateFrom: string, dateTo: string, enabled: boolean = true) => {
    return useQuery({
        queryKey: ['labCardSummary', 'custom', dateFrom, dateTo],
        queryFn: () => cardSummaryService.getCustomRangeSummary(dateFrom, dateTo),
        enabled: enabled && !!dateFrom && !!dateTo, // Only fetch if dates are provided and enabled
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: true,
    });
};