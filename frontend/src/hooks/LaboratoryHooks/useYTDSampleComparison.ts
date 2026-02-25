import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import ytdSampleComparisonService from '../../services/LaboratoryServices/ytdSampleComparisonService';

// ==================== TYPES ====================

export interface YTDRawData {
    MONTH: number;
    YEAR: number;
    TOTAL_SAMPLES: number;
}

export interface YTDFilters {
    year1: string | number;
    year2: string | number;
    type: string;
    spectypeValues: string[];
}

export interface YTDResponse {
    success: boolean;
    data: YTDRawData[];
    filters: YTDFilters;
    recordCount: number;
    executionTime: string;
    timestamp: string;
}

export interface YTDChartData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        borderColor: string;
        backgroundColor: string;
        tension: number;
        fill: boolean;
        pointRadius: number;
        pointHoverRadius: number;
    }[];
}

export interface YTDTableRow {
    month: string;
    monthNumber: number;
    monthShort: string;
    year1: number;
    year2: number;
    difference: number;
    differenceFormatted: string;
    percentChange: string;
    percentChangeValue: number;
    trend: 'up' | 'down' | 'neutral';
    year1Formatted: string;
    year2Formatted: string;
}

export interface YTDSummaryStats {
    year1Total: number;
    year2Total: number;
    difference: number;
    percentChange: number;
    year1Average: number;
    year2Average: number;
    year1Max: number;
    year2Max: number;
    year1Min: number;
    year2Min: number;
    year1TotalFormatted: string;
    year2TotalFormatted: string;
    differenceFormatted: string;
    trend: 'increase' | 'decrease' | 'stable';
}

// ✅ Added 'initial' to the union type
export type YTDSampleType = 'received' | 'screened' | 'initial';

export interface UseYTDSampleComparisonParams {
    year1: number | string;
    year2: number | string;
    type: YTDSampleType;
    enabled?: boolean;
}

// ==================== MAIN HOOK ====================

/**
 * Hook to fetch YTD Sample Comparison data
 * @param params - Query parameters
 * @returns Query result with raw data
 */
export const useYTDSampleComparison = ({
    year1,
    year2,
    type,
    enabled = true
}: UseYTDSampleComparisonParams): UseQueryResult<YTDResponse, Error> => {
    return useQuery<YTDResponse, Error>({
        queryKey: ['ytdSampleComparison', year1, year2, type],
        queryFn: async () => {
            const response = await ytdSampleComparisonService.getYTDSampleComparison(
                year1,
                year2,
                type
            );

            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch YTD comparison data');
            }

            return response as YTDResponse;
        },
        enabled: enabled && !!year1 && !!year2 && !!type,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false
    });
};

// ==================== DERIVED DATA HOOKS ====================

/**
 * Hook to get transformed chart data
 */
export const useYTDChartData = ({
    year1,
    year2,
    type,
    enabled = true
}: UseYTDSampleComparisonParams): UseQueryResult<YTDChartData, Error> => {
    return useQuery<YTDChartData, Error>({
        queryKey: ['ytdChartData', year1, year2, type],
        queryFn: async () => {
            const response = await ytdSampleComparisonService.getYTDSampleComparison(
                year1,
                year2,
                type
            );

            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch YTD comparison data');
            }

            return ytdSampleComparisonService.transformYTDDataForChart(
                response.data,
                Number(year1),
                Number(year2)
            );
        },
        enabled: enabled && !!year1 && !!year2 && !!type,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false
    });
};

/**
 * Hook to get transformed bar chart data
 */
export const useYTDBarChartData = ({
    year1,
    year2,
    type,
    enabled = true
}: UseYTDSampleComparisonParams): UseQueryResult<YTDChartData, Error> => {
    return useQuery<YTDChartData, Error>({
        queryKey: ['ytdBarChartData', year1, year2, type],
        queryFn: async () => {
            const response = await ytdSampleComparisonService.getYTDSampleComparison(
                year1,
                year2,
                type
            );

            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch YTD comparison data');
            }

            return ytdSampleComparisonService.transformYTDDataForBarChart(
                response.data,
                Number(year1),
                Number(year2)
            );
        },
        enabled: enabled && !!year1 && !!year2 && !!type,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false
    });
};

/**
 * Hook to get transformed table data
 */
export const useYTDTableData = ({
    year1,
    year2,
    type,
    enabled = true
}: UseYTDSampleComparisonParams): UseQueryResult<YTDTableRow[], Error> => {
    return useQuery<YTDTableRow[], Error>({
        queryKey: ['ytdTableData', year1, year2, type],
        queryFn: async () => {
            const response = await ytdSampleComparisonService.getYTDSampleComparison(
                year1,
                year2,
                type
            );

            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch YTD comparison data');
            }

            return ytdSampleComparisonService.transformYTDDataForTable(
                response.data,
                Number(year1),
                Number(year2)
            );
        },
        enabled: enabled && !!year1 && !!year2 && !!type,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false
    });
};

/**
 * Hook to get summary statistics
 */
export const useYTDSummaryStats = ({
    year1,
    year2,
    type,
    enabled = true
}: UseYTDSampleComparisonParams): UseQueryResult<YTDSummaryStats, Error> => {
    return useQuery<YTDSummaryStats, Error>({
        queryKey: ['ytdSummaryStats', year1, year2, type],
        queryFn: async () => {
            const response = await ytdSampleComparisonService.getYTDSampleComparison(
                year1,
                year2,
                type
            );

            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch YTD comparison data');
            }

            return ytdSampleComparisonService.calculateSummaryStats(
                response.data,
                Number(year1),
                Number(year2)
            );
        },
        enabled: enabled && !!year1 && !!year2 && !!type,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false
    });
};

// ==================== COMBINED HOOK ====================

export interface UseYTDComparisonResult {
    rawData: YTDRawData[] | undefined;
    chartData: YTDChartData | undefined;
    tableData: YTDTableRow[] | undefined;
    summaryStats: YTDSummaryStats | undefined;
    isLoading: boolean;
    isChartLoading: boolean;
    isTableLoading: boolean;
    isStatsLoading: boolean;
    error: Error | null;
    chartError: Error | null;
    tableError: Error | null;
    statsError: Error | null;
    refetch: () => void;
    refetchChart: () => void;
    refetchTable: () => void;
    refetchStats: () => void;
    filters: YTDFilters | undefined;
    recordCount: number | undefined;
    executionTime: string | undefined;
}

/**
 * Combined hook that fetches all YTD comparison data at once
 */
export const useYTDComparison = ({
    year1,
    year2,
    type,
    enabled = true
}: UseYTDSampleComparisonParams): UseYTDComparisonResult => {
    const rawQuery = useYTDSampleComparison({ year1, year2, type, enabled });
    const chartQuery = useYTDChartData({ year1, year2, type, enabled });
    const tableQuery = useYTDTableData({ year1, year2, type, enabled });
    const statsQuery = useYTDSummaryStats({ year1, year2, type, enabled });

    return {
        rawData: rawQuery.data?.data,
        chartData: chartQuery.data,
        tableData: tableQuery.data,
        summaryStats: statsQuery.data,
        isLoading: rawQuery.isLoading,
        isChartLoading: chartQuery.isLoading,
        isTableLoading: tableQuery.isLoading,
        isStatsLoading: statsQuery.isLoading,
        error: rawQuery.error,
        chartError: chartQuery.error,
        tableError: tableQuery.error,
        statsError: statsQuery.error,
        refetch: rawQuery.refetch,
        refetchChart: chartQuery.refetch,
        refetchTable: tableQuery.refetch,
        refetchStats: statsQuery.refetch,
        filters: rawQuery.data?.filters,
        recordCount: rawQuery.data?.recordCount,
        executionTime: rawQuery.data?.executionTime
    };
};

// ==================== EXPORT ALL ====================

export default {
    useYTDSampleComparison,
    useYTDChartData,
    useYTDBarChartData,
    useYTDTableData,
    useYTDSummaryStats,
    useYTDComparison
};