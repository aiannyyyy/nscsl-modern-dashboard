import api from '../api';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface CommonErrorData {
    USERNAME: string;
    TABLECOLUMN: string;
    TOTAL_COUNT: number;
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

export const fetchCommonErrors = async (
    params: CommonErrorParams
): Promise<CommonErrorResponse> => {
    const response = await api.get<CommonErrorResponse>('/common-errors', {
        params: { year: params.year, month: params.month }
    });
    return response.data;
};

export const fetchCommonErrorBreakdown = async (
    params: CommonErrorBreakdownParams
): Promise<CommonErrorBreakdownResponse> => {
    const response = await api.get<CommonErrorBreakdownResponse>('/common-errors/breakdown', {
        params: { year: params.year, month: params.month, tableColumn: params.tableColumn }
    });
    return response.data;
};

export const fetchCurrentMonthErrors = async (): Promise<CommonErrorResponse> => {
    const now = new Date();
    return fetchCommonErrors({ year: now.getFullYear(), month: now.getMonth() + 1 });
};

export const fetchPreviousMonthErrors = async (): Promise<CommonErrorResponse> => {
    const now = new Date();
    const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const month = now.getMonth() === 0 ? 12 : now.getMonth();
    return fetchCommonErrors({ year, month });
};

export const fetchCommonErrorsByDate = async (date: Date): Promise<CommonErrorResponse> => {
    return fetchCommonErrors({ year: date.getFullYear(), month: date.getMonth() + 1 });
};

export const fetchYearToDateErrors = async (): Promise<CommonErrorResponse[]> => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const promises = Array.from({ length: currentMonth }, (_, i) =>
        fetchCommonErrors({ year: now.getFullYear(), month: i + 1 })
    );
    return Promise.all(promises);
};

const commonErrorService = {
    fetchCommonErrors,
    fetchCommonErrorBreakdown,
    fetchCurrentMonthErrors,
    fetchPreviousMonthErrors,
    fetchCommonErrorsByDate,
    fetchYearToDateErrors,
};

export default commonErrorService;