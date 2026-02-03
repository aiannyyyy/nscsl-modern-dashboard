import api from './api';

// Export interfaces
export interface FacilityVisit {
    id?: number;
    facility_code: string;
    facility_name: string;
    date_visited: string;
    province: string;
    status: string;
    remarks: string;
    mark?: string | null;
    attachment_path?: string | null;
    created_by?: string | null;
    created_at?: string | null;
    modified_by?: string | null;
    modified_at?: string | null;
}

export interface StatusCount {
    active: number;
    inactive: number;
    closed: number;
}

export interface FacilityLookup {
    facilitycode: string;
    facilityname: string;
    province: string;
}

// Service class
class FacilityVisitsService {
    async getAll(): Promise<FacilityVisit[]> {
        const response = await api.get('/facility-visits');
        return response.data;
    }

    async getStatusCount(dateFrom?: string, dateTo?: string): Promise<StatusCount> {
        const params: any = {};
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        
        const response = await api.get('/facility-visits/facility-status-count', { params });
        return response.data;
    }

    async lookupFacility(facilityCode: string): Promise<FacilityLookup | null> {
        try {
            const response = await api.get('/facility-visits/lookup-facility', {
                params: { facilitycode: facilityCode }
            });
            
            // The API returns an array format: [[code, adrs_type, name, province]]
            if (response.data && response.data.length > 0) {
                const [facilitycode, , facilityname, province] = response.data[0];
                return {
                    facilitycode,
                    facilityname,
                    province
                };
            }
            return null;
        } catch (error) {
            console.error('Facility lookup error:', error);
            return null;
        }
    }

    async create(data: FormData): Promise<any> {
        const response = await api.post('/facility-visits', data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }

    async update(id: number, data: FormData): Promise<any> {
        const response = await api.put(`/facility-visits/${id}`, data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }

    async delete(id: number): Promise<any> {
        const response = await api.delete(`/facility-visits/${id}`);
        return response.data;
    }

    async updateStatus(id: number, status: string): Promise<any> {
        const response = await api.patch(`/facility-visits/${id}/status`, { status });
        return response.data;
    }

    async getFacilitiesByStatus(status: string, startDate?: string, endDate?: string): Promise<FacilityVisit[]> {
        const params: any = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        
        const response = await api.get(`/facility-visits/facilities-by-status/${status}`, { params });
        return response.data;
    }
}

// Default export
export default new FacilityVisitsService();