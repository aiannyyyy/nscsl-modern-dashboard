import api from '../api';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface CommonErrorData {
    TABLECOLUMN: string;
    month: string;
    TOTAL_COUNT: number;
    MRGOMEZ_COUNT: number;
    JMAPELADO_COUNT: number;
    ABBRUTAS_COUNT: number;
    AAMORFE_COUNT: number;
    PERCENTAGE: number;
}

export interface ErrorDetail {
    labno: string;
    lname: string;
    fname: string;
    dtrecv: string;
    tableColumn: string;
    oldData: string;
    newData: string;
    createDt: string;
}

export interface TechnicianSummary {
    tech_name: string;
    tech_id: string;
    count: number;
    errors: ErrorDetail[];
}

export interface CommonErrorFilters {
    year: string;
    month: string;
    dateRange: {
        start: string;
        end: string;
    };
}

export interface CommonErrorBreakdownFilters extends CommonErrorFilters {
    tableColumn: string;
}

export interface CommonErrorResponse {
    success: boolean;
    data: CommonErrorData[];
    filters: CommonErrorFilters;
    executionTime: string;
    timestamp: string;
}

export interface CommonErrorBreakdownResponse {
    success: boolean;
    data: {
        detailedRecords: any[];
        technicianSummary: TechnicianSummary[];
        totalRecords: number;
    };
    filters: CommonErrorBreakdownFilters;
    executionTime: string;
    timestamp: string;
}

export interface CommonErrorParams {
    year: number;
    month: number;
}

export interface CommonErrorBreakdownParams extends CommonErrorParams {
    tableColumn: string;
}

// ─────────────────────────────────────────────
// API Service Functions
// ─────────────────────────────────────────────

/**
 * Fetch common error data by year and month
 * @param params - Year and month parameters
 * @returns Promise with common error data
 */
export const fetchCommonErrors = async (
    params: CommonErrorParams
): Promise<CommonErrorResponse> => {
    const response = await api.get<CommonErrorResponse>('/common-errors', {
        params: {
            year: params.year,
            month: params.month
        }
    });

    return response.data;
};

/**
 * Fetch detailed breakdown of errors for a specific table column
 * @param params - Year, month, and table column parameters
 * @returns Promise with detailed error breakdown
 */
export const fetchCommonErrorBreakdown = async (
    params: CommonErrorBreakdownParams
): Promise<CommonErrorBreakdownResponse> => {
    const response = await api.get<CommonErrorBreakdownResponse>('/common-errors/breakdown', {
        params: {
            year: params.year,
            month: params.month,
            tableColumn: params.tableColumn
        }
    });

    return response.data;
};

/**
 * Get common errors for current month
 * @returns Promise with common error data
 */
export const fetchCurrentMonthErrors = async (): Promise<CommonErrorResponse> => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    return fetchCommonErrors({ year, month });
};

/**
 * Get common errors for previous month
 * @returns Promise with common error data
 */
export const fetchPreviousMonthErrors = async (): Promise<CommonErrorResponse> => {
    const now = new Date();
    const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const month = now.getMonth() === 0 ? 12 : now.getMonth();

    return fetchCommonErrors({ year, month });
};

/**
 * Get common errors for a specific date
 * @param date - Date object
 * @returns Promise with common error data
 */
export const fetchCommonErrorsByDate = async (date: Date): Promise<CommonErrorResponse> => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    return fetchCommonErrors({ year, month });
};

/**
 * Get common errors year-to-date
 * @returns Promise with array of common error data for each month
 */
export const fetchYearToDateErrors = async (): Promise<CommonErrorResponse[]> => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const promises = Array.from({ length: currentMonth }, (_, i) => 
        fetchCommonErrors({ year: currentYear, month: i + 1 })
    );

    return Promise.all(promises);
};

// Default export
const commonErrorService = {
    fetchCommonErrors,
    fetchCommonErrorBreakdown,
    fetchCurrentMonthErrors,
    fetchPreviousMonthErrors,
    fetchCommonErrorsByDate,
    fetchYearToDateErrors,
};

export default commonErrorService;