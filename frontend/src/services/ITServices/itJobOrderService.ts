import api from '../api';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface JobOrder {
    id: number;
    work_order_no: string;
    title: string;
    description: string;
    type: string;
    category: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    status: 'pending_approval' | 'approved' | 'queued' | 'assigned' | 'in_progress' | 'on_hold' | 'resolved' | 'closed' | 'cancelled' | 'rejected';
    requester_id: number;
    requester_name?: string;
    requester_email?: string;
    requester_dept?: string;
    department: string;
    location?: string;
    asset_id?: string;
    tech_id?: number;
    tech_name?: string;
    tech_username?: string;
    approved_by_id?: number;
    approved_by_name?: string;
    estimated_hours?: number;
    actual_hours?: number;
    tags?: string;
    action_taken?: string;
    reason?: string;
    resolution_notes?: string;
    due_date?: string;
    created_at: string;
    updated_at: string;
    approved_at?: string;
    assigned_at?: string;
    started_at?: string;
    resolved_at?: string;
    closed_at?: string;
    closed_by_id?: number;
}

export interface JobOrderWithDetails extends JobOrder {
    attachments: Attachment[];
    comments: Comment[];
    history: History[];
}

export interface Attachment {
    id: number;
    job_order_id: number;
    file_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    uploaded_by: number;
    uploaded_by_name?: string;
    created_at: string;
}

export interface Comment {
    id: number;
    job_order_id: number;
    user_id: number;
    author_name?: string;
    comment: string;
    is_internal: number;
    created_at: string;
}

export interface History {
    id: number;
    job_order_id: number;
    user_id: number;
    user_name?: string;
    action: string;
    field_changed?: string;
    old_value?: string;
    new_value?: string;
    created_at: string;
}

export interface CreateJobOrderPayload {
    title: string;
    description: string;
    type: string;
    category: string;
    priority?: 'critical' | 'high' | 'medium' | 'low';
    department: string;
    location?: string;
    asset_id?: string;
    estimated_hours?: number;
    tags?: string;
    requester_id?: number;
}

export interface UpdateJobOrderPayload {
    title?: string;
    description?: string;
    type?: string;
    category?: string;
    priority?: 'critical' | 'high' | 'medium' | 'low';
    status?: string;
    tech_id?: number;
    action_taken?: string;
    reason?: string;
    resolution_notes?: string;
    estimated_hours?: number;
    actual_hours?: number;
    tags?: string;
    location?: string;
    asset_id?: string;
    due_date?: string;
}

export interface JobOrderFilters {
    status?: string;
    priority?: string;
    department?: string;
    tech_id?: number;
    requester_id?: number;
    search?: string;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
    count?: number;
}

export interface JobOrderStats {
    total: number;
    pending_approval: number;
    queued: number;
    assigned: number;
    in_progress: number;
    resolved: number;
    closed: number;
    cancelled: number;
    rejected: number;
    by_priority: {
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
    avg_resolution_time: number;
}

export interface QueueItem {
    id: number;
    work_order_no: string;
    title: string;
    priority: string;
    department: string;
    requester_name: string;
    queue_position: number;
    estimated_hours?: number;
    created_at: string;
}

// ============================================================================
// API SERVICE
// ============================================================================

class ITJobOrderService {
    private readonly endpoint = '/it-job-order';

    // ========================================================================
    // CRUD OPERATIONS
    // ========================================================================

    /**
     * Create a new job order
     */
    async createJobOrder(payload: CreateJobOrderPayload): Promise<ApiResponse<{ id: number; work_order_no: string; status: string }>> {
        const response = await api.post(this.endpoint, payload);
        return response.data;
    }

    /**
     * Get all job orders with filters and pagination
     */
    async getAllJobOrders(filters?: JobOrderFilters): Promise<PaginatedResponse<JobOrder>> {
        const response = await api.get(this.endpoint, { params: filters });
        return response.data;
    }

    /**
     * Get current user's active job orders
     */
    async getMyActiveJobOrders(): Promise<ApiResponse<JobOrder[]>> {
        const response = await api.get(`${this.endpoint}/my-active`);
        return response.data;
    }

    /**
     * Get job order statistics
     */
    async getStatistics(): Promise<ApiResponse<JobOrderStats>> {
        const response = await api.get(`${this.endpoint}/stats`);
        return response.data;
    }

    /**
     * Get single job order by ID with full details
     */
    async getJobOrderById(id: number): Promise<ApiResponse<JobOrderWithDetails>> {
        const response = await api.get(`${this.endpoint}/${id}`);
        return response.data;
    }

    /**
     * Update job order
     */
    async updateJobOrder(id: number, payload: UpdateJobOrderPayload): Promise<ApiResponse<void>> {
        const response = await api.put(`${this.endpoint}/${id}`, payload);
        return response.data;
    }

    /**
     * Cancel/Delete job order
     */
    async deleteJobOrder(id: number): Promise<ApiResponse<void>> {
        const response = await api.delete(`${this.endpoint}/${id}`);
        return response.data;
    }

    // ========================================================================
    // APPROVAL & WORKFLOW
    // ========================================================================

    /**
     * Approve job order
     */
    async approveJobOrder(id: number): Promise<ApiResponse<void>> {
        const response = await api.post(`${this.endpoint}/${id}/approve`);
        return response.data;
    }

    /**
     * Reject job order
     */
    async rejectJobOrder(id: number, reason: string): Promise<ApiResponse<void>> {
        const response = await api.post(`${this.endpoint}/${id}/reject`, { reason });
        return response.data;
    }

    /**
     * Assign job order to technician
     */
    async assignJobOrder(id: number, techId: number): Promise<ApiResponse<void>> {
        const response = await api.post(`${this.endpoint}/${id}/assign`, { tech_id: techId });
        return response.data;
    }

    /**
     * Start working on job order
     */
    async startJobOrder(id: number): Promise<ApiResponse<void>> {
        const response = await api.post(`${this.endpoint}/${id}/start`);
        return response.data;
    }

    /**
     * Resolve job order
     */
    async resolveJobOrder(
        id: number, 
        data: { 
            action_taken: string; 
            resolution_notes?: string; 
            actual_hours?: number 
        }
    ): Promise<ApiResponse<void>> {
        const response = await api.post(`${this.endpoint}/${id}/resolve`, data);
        return response.data;
    }

    /**
     * Close job order
     */
    async closeJobOrder(id: number): Promise<ApiResponse<void>> {
        const response = await api.post(`${this.endpoint}/${id}/close`);
        return response.data;
    }

    // ========================================================================
    // QUEUE MANAGEMENT
    // ========================================================================

    /**
     * Get queue status
     */
    async getQueue(): Promise<ApiResponse<QueueItem[]>> {
        const response = await api.get(`${this.endpoint}/queue/status`);
        return response.data;
    }

    /**
     * Get next job order from queue
     */
    async getNextFromQueue(): Promise<ApiResponse<JobOrder | null>> {
        const response = await api.post(`${this.endpoint}/queue/next`);
        return response.data;
    }

    /**
     * Reorder queue based on priority
     */
    async reorderQueue(): Promise<ApiResponse<void>> {
        const response = await api.post(`${this.endpoint}/queue/reorder`);
        return response.data;
    }

    // ========================================================================
    // ATTACHMENTS
    // ========================================================================

    /**
     * Upload attachment to job order
     */
    async uploadAttachment(id: number, file: File): Promise<ApiResponse<Attachment>> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post(`${this.endpoint}/${id}/attachments`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }

    /**
     * Delete attachment
     */
    async deleteAttachment(attachmentId: number): Promise<ApiResponse<void>> {
        const response = await api.delete(`${this.endpoint}/attachments/${attachmentId}`);
        return response.data;
    }

    // ========================================================================
    // COMMENTS
    // ========================================================================

    /**
     * Add comment to job order
     */
    async addComment(
        id: number, 
        data: { comment: string; is_internal?: number }
    ): Promise<ApiResponse<{ id: number }>> {
        const response = await api.post(`${this.endpoint}/${id}/comments`, data);
        return response.data;
    }
}

// Export singleton instance
export const itJobOrderService = new ITJobOrderService();

export default itJobOrderService;