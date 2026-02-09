import { useQuery } from '@tanstack/react-query';
import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import React from 'react';
import {
    fetchCommonErrors,
    fetchCommonErrorBreakdown,
    fetchCurrentMonthErrors,
} from '../../services/LaboratoryServices/commonErrorService';
import type {
    CommonErrorResponse,
    CommonErrorBreakdownResponse,
    CommonErrorParams,
    CommonErrorBreakdownParams,
} from '../../services/LaboratoryServices/commonErrorService';

// ─────────────────────────────────────────────
// Query Keys
// ─────────────────────────────────────────────

export const commonErrorKeys = {
    all: ['commonErrors'] as const,
    lists: () => [...commonErrorKeys.all, 'list'] as const,
    list: (params: CommonErrorParams) => [...commonErrorKeys.lists(), params] as const,
    current: () => [...commonErrorKeys.all, 'current'] as const,
    breakdowns: () => [...commonErrorKeys.all, 'breakdown'] as const,
    breakdown: (params: CommonErrorBreakdownParams) => 
        [...commonErrorKeys.breakdowns(), params] as const,
};

// ─────────────────────────────────────────────
// Main Hooks
// ─────────────────────────────────────────────

/**
 * Hook to fetch common error data by year and month
 * @param params - Year and month parameters
 * @param options - React Query options
 * @returns UseQueryResult with common error data
 */
export const useCommonErrors = (
    params: CommonErrorParams,
    options?: Omit<UseQueryOptions<CommonErrorResponse, Error>, 'queryKey' | 'queryFn'>
): UseQueryResult<CommonErrorResponse, Error> => {
    return useQuery<CommonErrorResponse, Error>({
        queryKey: commonErrorKeys.list(params),
        queryFn: () => fetchCommonErrors(params),
        enabled: !!params.year && !!params.month,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 2,
        ...options,
    });
};

/**
 * Hook to fetch detailed breakdown of errors for a specific table column
 * @param params - Year, month, and table column parameters
 * @param options - React Query options
 * @returns UseQueryResult with detailed error breakdown
 */
export const useCommonErrorBreakdown = (
    params: CommonErrorBreakdownParams,
    options?: Omit<UseQueryOptions<CommonErrorBreakdownResponse, Error>, 'queryKey' | 'queryFn'>
): UseQueryResult<CommonErrorBreakdownResponse, Error> => {
    return useQuery<CommonErrorBreakdownResponse, Error>({
        queryKey: commonErrorKeys.breakdown(params),
        queryFn: () => fetchCommonErrorBreakdown(params),
        enabled: !!params.year && !!params.month && !!params.tableColumn,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 2,
        ...options,
    });
};

/**
 * Hook to fetch common error data for current month
 * @param options - React Query options
 * @returns UseQueryResult with common error data
 */
export const useCurrentMonthCommonErrors = (
    options?: Omit<UseQueryOptions<CommonErrorResponse, Error>, 'queryKey' | 'queryFn'>
): UseQueryResult<CommonErrorResponse, Error> => {
    return useQuery<CommonErrorResponse, Error>({
        queryKey: commonErrorKeys.current(),
        queryFn: fetchCurrentMonthErrors,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 2,
        ...options,
    });
};

// ─────────────────────────────────────────────
// Derived Data Hooks
// ─────────────────────────────────────────────

/**
 * Hook to get aggregated statistics from common error data
 * @param params - Year and month parameters
 * @returns Aggregated statistics
 */
export const useCommonErrorStats = (params: CommonErrorParams) => {
    const { data, ...queryResult } = useCommonErrors(params);

    const stats = React.useMemo(() => {
        if (!data?.data || data.data.length === 0) {
            return {
                totalErrors: 0,
                totalByTechnician: {
                    MRGOMEZ: 0,
                    JMAPELADO: 0,
                    ABBRUTAS: 0,
                    AAMORFE: 0,
                },
                topErrorTypes: [],
                totalErrorTypes: 0,
                averageErrorsPerType: 0,
            };
        }

        const totalErrors = data.data.reduce((sum, item) => sum + item.TOTAL_COUNT, 0);
        
        const totalByTechnician = {
            MRGOMEZ: data.data.reduce((sum, item) => sum + item.MRGOMEZ_COUNT, 0),
            JMAPELADO: data.data.reduce((sum, item) => sum + item.JMAPELADO_COUNT, 0),
            ABBRUTAS: data.data.reduce((sum, item) => sum + item.ABBRUTAS_COUNT, 0),
            AAMORFE: data.data.reduce((sum, item) => sum + item.AAMORFE_COUNT, 0),
        };

        const topErrorTypes = [...data.data]
            .sort((a, b) => b.TOTAL_COUNT - a.TOTAL_COUNT)
            .slice(0, 5)
            .map(item => ({
                type: item.TABLECOLUMN,
                count: item.TOTAL_COUNT,
                percentage: item.PERCENTAGE,
            }));

        return {
            totalErrors,
            totalByTechnician,
            topErrorTypes,
            totalErrorTypes: data.data.length,
            averageErrorsPerType: data.data.length > 0 
                ? Math.round(totalErrors / data.data.length) 
                : 0,
        };
    }, [data]);

    return {
        ...queryResult,
        data,
        stats,
    };
};

/**
 * Hook to get breakdown statistics for a specific error type
 * @param params - Year, month, and table column parameters
 * @returns Breakdown statistics
 */
export const useCommonErrorBreakdownStats = (params: CommonErrorBreakdownParams) => {
    const { data, ...queryResult } = useCommonErrorBreakdown(params);

    const stats = React.useMemo(() => {
        if (!data?.data?.technicianSummary || data.data.technicianSummary.length === 0) {
            return {
                totalRecords: 0,
                technicianCount: 0,
                topTechnician: null,
                errorsByTechnician: [],
            };
        }

        const errorsByTechnician = data.data.technicianSummary
            .map(tech => ({
                name: tech.tech_name,
                id: tech.tech_id,
                count: tech.count,
                percentage: data.data.totalRecords > 0 
                    ? Math.round((tech.count / data.data.totalRecords) * 100) 
                    : 0,
            }))
            .sort((a, b) => b.count - a.count);

        return {
            totalRecords: data.data.totalRecords,
            technicianCount: data.data.technicianSummary.length,
            topTechnician: errorsByTechnician[0] || null,
            errorsByTechnician,
        };
    }, [data]);

    return {
        ...queryResult,
        data,
        stats,
    };
};