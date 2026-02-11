import api from '../api';

// Base endpoint
const ENDORSEMENT_ENDPOINT = '/endorsements';

// Types
export interface EndorsementData {
    id?: number;
    labno: string;
    fname: string;
    lname: string;
    facility_code: string;
    facility_name: string;
    test_result: string;
    remarks?: string;
    attachment_path?: string;
    endorsed_by?: string;
    date_endorsed?: string;
    modified_by?: string;
    date_modified?: string;
    status?: number;
}

export interface OracleLookupResponse {
    success: boolean;
    data?: {
        labNumber: string;
        firstName: string;
        lastName: string;
        facilityCode: string;
        facilityName: string;
        testResult: string;
        dateReceived: string;
    };
    error?: string;
    executionTime?: string;
    timestamp?: string;
}

export interface EndorsementStats {
    total: number;
    active: number;
    inactive: number;
}

export interface DateRange {
    date_from?: string;
    date_to?: string;
}

export interface StatusFilter {
    status: string;
    startDate?: string;
    endDate?: string;
}

// Oracle lookup
export const lookupLabNumber = async (labno: string): Promise<OracleLookupResponse> => {
    const response = await api.get(`${ENDORSEMENT_ENDPOINT}/lookup/${labno}`);
    return response.data;
};

// Get all endorsements
export const getAllEndorsements = async (): Promise<EndorsementData[]> => {
    const response = await api.get(ENDORSEMENT_ENDPOINT);
    return response.data;
};

// Get endorsement by ID
export const getEndorsementById = async (id: number): Promise<EndorsementData> => {
    const response = await api.get(`${ENDORSEMENT_ENDPOINT}/${id}`);
    return response.data;
};

// Get endorsements by lab number
export const getEndorsementsByLabNo = async (labno: string): Promise<EndorsementData[]> => {
    const response = await api.get(`${ENDORSEMENT_ENDPOINT}/labno/${labno}`);
    return response.data;
};

// Get endorsements by facility code
export const getEndorsementsByFacility = async (facilityCode: string): Promise<EndorsementData[]> => {
    const response = await api.get(`${ENDORSEMENT_ENDPOINT}/facility/${facilityCode}`);
    return response.data;
};

// Get endorsements by status
export const getEndorsementsByStatus = async (filter: StatusFilter): Promise<EndorsementData[]> => {
    const params = new URLSearchParams();
    if (filter.startDate) params.append('startDate', filter.startDate);
    if (filter.endDate) params.append('endDate', filter.endDate);
    
    const response = await api.get(
        `${ENDORSEMENT_ENDPOINT}/status/${filter.status}?${params.toString()}`
    );
    return response.data;
};

// Get endorsement statistics
export const getEndorsementStats = async (dateRange?: DateRange): Promise<EndorsementStats> => {
    const params = new URLSearchParams();
    if (dateRange?.date_from) params.append('date_from', dateRange.date_from);
    if (dateRange?.date_to) params.append('date_to', dateRange.date_to);
    
    const response = await api.get(
        `${ENDORSEMENT_ENDPOINT}/stats/summary?${params.toString()}`
    );
    return response.data;
};

// Get unique test results for dropdown
export const getUniqueTestResults = async (): Promise<string[]> => {
    const response = await api.get(`${ENDORSEMENT_ENDPOINT}/test-results/unique`);
    return response.data;
};

// Create endorsement
export const createEndorsement = async (data: FormData): Promise<{ message: string; id: number }> => {
    const response = await api.post(ENDORSEMENT_ENDPOINT, data, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

// Update endorsement
export const updateEndorsement = async (id: number, data: FormData): Promise<{ message: string; attachments_updated: number; files_deleted: number }> => {
    const response = await api.put(`${ENDORSEMENT_ENDPOINT}/${id}`, data, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

// Update endorsement status only
export const updateEndorsementStatus = async (id: number, status: number, modified_by?: string): Promise<{ message: string }> => {
    const response = await api.patch(`${ENDORSEMENT_ENDPOINT}/${id}/status`, { 
        status,
        modified_by 
    });
    return response.data;
};

// Delete endorsement
export const deleteEndorsement = async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`${ENDORSEMENT_ENDPOINT}/${id}`);
    return response.data;
};

// Helper function to create FormData from EndorsementData
export const createEndorsementFormData = (
    data: EndorsementData,
    files?: File[],
    filesToKeep?: string[],
    filesToDelete?: string[]
): FormData => {
    const formData = new FormData();
    
    // Add text fields
    formData.append('labno', data.labno);
    formData.append('fname', data.fname);
    formData.append('lname', data.lname);
    formData.append('facility_code', data.facility_code);
    formData.append('facility_name', data.facility_name);
    formData.append('test_result', data.test_result);
    
    if (data.remarks) formData.append('remarks', data.remarks);
    if (data.status !== undefined) formData.append('status', data.status.toString());
    if (data.endorsed_by) formData.append('endorsed_by', data.endorsed_by);
    if (data.modified_by) formData.append('modified_by', data.modified_by);
    
    // Add files
    if (files && files.length > 0) {
        files.forEach(file => {
            formData.append('attachments', file);
        });
    }
    
    // Add file management data for updates
    if (filesToKeep) {
        formData.append('files_to_keep', JSON.stringify(filesToKeep));
    }
    if (filesToDelete) {
        formData.append('files_to_delete', JSON.stringify(filesToDelete));
    }
    
    return formData;
};

export default {
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
    createEndorsementFormData,
};