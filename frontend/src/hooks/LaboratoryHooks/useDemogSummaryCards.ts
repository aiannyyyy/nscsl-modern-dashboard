import { useState, useEffect, useCallback } from 'react';
import demogSummaryCardService, { 
} from '../../services/LaboratoryServices/demogSummaryCardService';
import type { DemogSummaryStats, DemogSummaryStatsWithDateRange, DateRangeParams } from '../../services/LaboratoryServices/demogSummaryCardService';

// Hook for current month statistics
export const useDemogCurrentMonth = () => {
    const [stats, setStats] = useState<DemogSummaryStats | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await demogSummaryCardService.getCurrentMonthStats();
            setStats(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch current month statistics');
            console.error('Error fetching current month stats:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return { stats, loading, error, refetch: fetchStats };
};

// Hook for date range statistics
export const useDemogDateRange = (initialStartDate?: string, initialEndDate?: string) => {
    const [stats, setStats] = useState<DemogSummaryStatsWithDateRange | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<DateRangeParams | null>(
        initialStartDate && initialEndDate
            ? { startDate: initialStartDate, endDate: initialEndDate }
            : null
    );

    const fetchStats = useCallback(async (params: DateRangeParams) => {
        setLoading(true);
        setError(null);
        setDateRange(params);
        
        try {
            const data = await demogSummaryCardService.getStatsByDateRange(params);
            setStats(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch statistics for date range');
            console.error('Error fetching date range stats:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (initialStartDate && initialEndDate) {
            fetchStats({ startDate: initialStartDate, endDate: initialEndDate });
        }
    }, [initialStartDate, initialEndDate, fetchStats]);

    return { 
        stats, 
        loading, 
        error, 
        dateRange,
        fetchStats,
        refetch: () => dateRange && fetchStats(dateRange)
    };
};

// Hook for specific month statistics
export const useDemogMonth = (year: number, month: number) => {
    const [stats, setStats] = useState<DemogSummaryStatsWithDateRange | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await demogSummaryCardService.getStatsByMonth(year, month);
            setStats(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch month statistics');
            console.error('Error fetching month stats:', err);
        } finally {
            setLoading(false);
        }
    }, [year, month]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return { stats, loading, error, refetch: fetchStats };
};

// Hook for specific year statistics
export const useDemogYear = (year: number) => {
    const [stats, setStats] = useState<DemogSummaryStatsWithDateRange | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await demogSummaryCardService.getStatsByYear(year);
            setStats(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch year statistics');
            console.error('Error fetching year stats:', err);
        } finally {
            setLoading(false);
        }
    }, [year]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return { stats, loading, error, refetch: fetchStats };
};

// Advanced hook with manual control and multiple query options
export const useDemogStats = () => {
    const [stats, setStats] = useState<DemogSummaryStats | DemogSummaryStatsWithDateRange | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCurrentMonth = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await demogSummaryCardService.getCurrentMonthStats();
            setStats(data);
            return data;
        } catch (err: any) {
            const errorMsg = err.message || 'Failed to fetch current month statistics';
            setError(errorMsg);
            console.error('Error fetching current month stats:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchDateRange = useCallback(async (params: DateRangeParams) => {
        setLoading(true);
        setError(null);
        try {
            const data = await demogSummaryCardService.getStatsByDateRange(params);
            setStats(data);
            return data;
        } catch (err: any) {
            const errorMsg = err.message || 'Failed to fetch date range statistics';
            setError(errorMsg);
            console.error('Error fetching date range stats:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchMonth = useCallback(async (year: number, month: number) => {
        setLoading(true);
        setError(null);
        try {
            const data = await demogSummaryCardService.getStatsByMonth(year, month);
            setStats(data);
            return data;
        } catch (err: any) {
            const errorMsg = err.message || 'Failed to fetch month statistics';
            setError(errorMsg);
            console.error('Error fetching month stats:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchYear = useCallback(async (year: number) => {
        setLoading(true);
        setError(null);
        try {
            const data = await demogSummaryCardService.getStatsByYear(year);
            setStats(data);
            return data;
        } catch (err: any) {
            const errorMsg = err.message || 'Failed to fetch year statistics';
            setError(errorMsg);
            console.error('Error fetching year stats:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const clearStats = useCallback(() => {
        setStats(null);
        setError(null);
    }, []);

    return {
        stats,
        loading,
        error,
        fetchCurrentMonth,
        fetchDateRange,
        fetchMonth,
        fetchYear,
        clearStats
    };
};

// Utility hook for calculating totals
export const useDemogTotals = (stats: DemogSummaryStats | null) => {
    const [totals, setTotals] = useState({
        entry: 0,
        verification: 0,
        total: 0
    });

    useEffect(() => {
        if (stats) {
            setTotals({
                entry: demogSummaryCardService.getTotalEntryCount(stats),
                verification: demogSummaryCardService.getTotalVerificationCount(stats),
                total: demogSummaryCardService.getTotalCount(stats)
            });
        } else {
            setTotals({ entry: 0, verification: 0, total: 0 });
        }
    }, [stats]);

    return totals;
};