import { useQuery} from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { speedMonitoringService } from '../../services/LaboratoryServices/speedMonitoringService';

// Types
export interface SpeedMonitoringData {
  FIRSTNAME: string;
  MONTH: string;
  MONTHLY_AVG_INIT_TIME_SECONDS: number;
  TOTAL_SAMPLES: number;
}

export interface SpeedMonitoringResponse {
  success: boolean;
  data: SpeedMonitoringData[];
  meta: {
    year: string;
    month: string;
    type: 'entry' | 'verification';
    count: number;
  };
}

export interface SpeedMonitoringParams {
  year: string;
  month: string;
  type: 'entry' | 'verification';
}

// Query Keys
export const speedMonitoringKeys = {
  all: ['speedMonitoring'] as const,
  lists: () => [...speedMonitoringKeys.all, 'list'] as const,
  list: (params: SpeedMonitoringParams) => 
    [...speedMonitoringKeys.lists(), params] as const,
  currentMonth: (type: 'entry' | 'verification') => 
    [...speedMonitoringKeys.all, 'currentMonth', type] as const,
};

/**
 * Hook to fetch speed monitoring data
 * @param params - Query parameters (year, month, type)
 * @param options - React Query options
 */
export const useSpeedMonitoring = (
  params: SpeedMonitoringParams,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
    staleTime?: number;
  }
): UseQueryResult<SpeedMonitoringResponse, Error> => {
  return useQuery({
    queryKey: speedMonitoringKeys.list(params),
    queryFn: () => speedMonitoringService.getSpeedMonitoring(params),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes default
  });
};

/**
 * Hook to fetch speed monitoring data for current month
 * @param type - Type ("entry" or "verification")
 * @param options - React Query options
 */
export const useCurrentMonthSpeedMonitoring = (
  type: 'entry' | 'verification',
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
    staleTime?: number;
  }
): UseQueryResult<SpeedMonitoringResponse, Error> => {
  return useQuery({
    queryKey: speedMonitoringKeys.currentMonth(type),
    queryFn: () => speedMonitoringService.getCurrentMonthSpeedMonitoring(type),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes default
  });
};

/**
 * Hook to fetch both entry and verification data for current month
 */
export const useCurrentMonthSpeedMonitoringBoth = (
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
    staleTime?: number;
  }
) => {
  const entryQuery = useCurrentMonthSpeedMonitoring('entry', options);
  const verificationQuery = useCurrentMonthSpeedMonitoring('verification', options);

  return {
    entry: entryQuery,
    verification: verificationQuery,
    isLoading: entryQuery.isLoading || verificationQuery.isLoading,
    isError: entryQuery.isError || verificationQuery.isError,
    error: entryQuery.error || verificationQuery.error,
    refetch: () => {
      entryQuery.refetch();
      verificationQuery.refetch();
    }
  };
};

/**
 * Hook with formatted data for easier consumption
 */
export const useSpeedMonitoringFormatted = (
  params: SpeedMonitoringParams,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
    staleTime?: number;
  }
) => {
  const query = useSpeedMonitoring(params, options);

  // Format data by technician name
  const formattedData = query.data?.data.reduce((acc, item) => {
    acc[item.FIRSTNAME] = {
      avgTimeSeconds: item.MONTHLY_AVG_INIT_TIME_SECONDS,
      totalSamples: item.TOTAL_SAMPLES,
      avgTimeMinutes: Math.round(item.MONTHLY_AVG_INIT_TIME_SECONDS / 60),
    };
    return acc;
  }, {} as Record<string, { avgTimeSeconds: number; totalSamples: number; avgTimeMinutes: number }>);

  return {
    ...query,
    formattedData,
  };
};