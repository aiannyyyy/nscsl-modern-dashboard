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

export const useCommonErrors = (
    params: CommonErrorParams,
    options?: Omit<UseQueryOptions<CommonErrorResponse, Error>, 'queryKey' | 'queryFn'>
): UseQueryResult<CommonErrorResponse, Error> => {
    return useQuery<CommonErrorResponse, Error>({
        queryKey: commonErrorKeys.list(params),
        queryFn: () => fetchCommonErrors(params),
        enabled: !!params.year && !!params.month,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 2,
        ...options,
    });
};

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
 * Groups rows by TABLECOLUMN and aggregates per-technician counts.
 * New query returns one row per (USERNAME, TABLECOLUMN) pair.
 */
export const useCommonErrorStats = (params: CommonErrorParams) => {
    const { data, ...queryResult } = useCommonErrors(params);

    const stats = React.useMemo(() => {
        if (!data?.data || data.data.length === 0) {
            return {
                totalErrors: 0,
                totalByTechnician: {} as Record<string, number>,
                topErrorTypes: [],
                totalErrorTypes: 0,
                averageErrorsPerType: 0,
            };
        }

        // Aggregate totals per TABLECOLUMN
        const byColumn: Record<string, number> = {};
        // Aggregate totals per USERNAME
        const byTech: Record<string, number> = {};

        for (const row of data.data) {
            byColumn[row.TABLECOLUMN] = (byColumn[row.TABLECOLUMN] ?? 0) + row.TOTAL_COUNT;
            byTech[row.USERNAME] = (byTech[row.USERNAME] ?? 0) + row.TOTAL_COUNT;
        }

        const totalErrors = Object.values(byColumn).reduce((sum, v) => sum + v, 0);

        const topErrorTypes = Object.entries(byColumn)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([type, count]) => ({
                type,
                count,
                percentage: totalErrors > 0
                    ? parseFloat(((count / totalErrors) * 100).toFixed(2))
                    : 0,
            }));

        const totalErrorTypes = Object.keys(byColumn).length;

        return {
            totalErrors,
            totalByTechnician: byTech,
            topErrorTypes,
            totalErrorTypes,
            averageErrorsPerType: totalErrorTypes > 0
                ? Math.round(totalErrors / totalErrorTypes)
                : 0,
        };
    }, [data]);

    return { ...queryResult, data, stats };
};

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

    return { ...queryResult, data, stats };
};