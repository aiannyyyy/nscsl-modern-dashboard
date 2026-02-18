import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { itJobOrderService } from '../../services/ITServices/itJobOrderService';
import type {JobOrder,
    JobOrderWithDetails,
    CreateJobOrderPayload,
    UpdateJobOrderPayload,
    JobOrderFilters,
    JobOrderStats,
    QueueItem,
    PaginatedResponse,
    ApiResponse } from '../../services/ITServices/itJobOrderService';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const jobOrderKeys = {
    all: ['jobOrders'] as const,
    lists: () => [...jobOrderKeys.all, 'list'] as const,
    list: (filters?: JobOrderFilters) => [...jobOrderKeys.lists(), filters] as const,
    details: () => [...jobOrderKeys.all, 'detail'] as const,
    detail: (id: number) => [...jobOrderKeys.details(), id] as const,
    myActive: () => [...jobOrderKeys.all, 'myActive'] as const,
    stats: () => [...jobOrderKeys.all, 'stats'] as const,
    queue: () => [...jobOrderKeys.all, 'queue'] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Get all job orders with filters and pagination
 */
export const useJobOrders = (
    filters?: JobOrderFilters,
    options?: Omit<UseQueryOptions<PaginatedResponse<JobOrder>>, 'queryKey' | 'queryFn'>
) => {
    return useQuery<PaginatedResponse<JobOrder>>({
        queryKey: jobOrderKeys.list(filters),
        queryFn: () => itJobOrderService.getAllJobOrders(filters),
        refetchInterval: 10000, // 👈 just add this line
        ...options,
    });
};

/**
 * Get single job order by ID
 */
export const useJobOrder = (
    id: number,
    options?: Omit<UseQueryOptions<ApiResponse<JobOrderWithDetails>>, 'queryKey' | 'queryFn'>
) => {
    return useQuery<ApiResponse<JobOrderWithDetails>>({
        queryKey: jobOrderKeys.detail(id),
        queryFn: () => itJobOrderService.getJobOrderById(id),
        enabled: !!id,
        ...options,
    });
};

/**
 * Get current user's active job orders
 */
export const useMyActiveJobOrders = (
    options?: Omit<UseQueryOptions<ApiResponse<JobOrder[]>>, 'queryKey' | 'queryFn'>
) => {
    return useQuery<ApiResponse<JobOrder[]>>({
        queryKey: jobOrderKeys.myActive(),
        queryFn: () => itJobOrderService.getMyActiveJobOrders(),
        refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
        ...options,
    });
};

/**
 * Get job order statistics
 */
export const useJobOrderStats = (
    options?: Omit<UseQueryOptions<ApiResponse<JobOrderStats>>, 'queryKey' | 'queryFn'>
) => {
    return useQuery<ApiResponse<JobOrderStats>>({
        queryKey: jobOrderKeys.stats(),
        queryFn: () => itJobOrderService.getStatistics(),
        placeholderData: keepPreviousData,  // ← ADD THIS
        ...options,
    });
};

/**
 * Get queue status
 */
export const useQueue = (
    options?: Omit<UseQueryOptions<ApiResponse<QueueItem[]>>, 'queryKey' | 'queryFn'>
) => {
    return useQuery<ApiResponse<QueueItem[]>>({
        queryKey: jobOrderKeys.queue(),
        queryFn: () => itJobOrderService.getQueue(),
        refetchInterval: 15000, // Refetch every 15 seconds
        ...options,
    });
};

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Create new job order
 */
export const useCreateJobOrder = (
    options?: UseMutationOptions<
        ApiResponse<{ id: number; work_order_no: string; status: string }>,
        Error,
        CreateJobOrderPayload
    >
) => {
    const queryClient = useQueryClient();

    return useMutation<
        ApiResponse<{ id: number; work_order_no: string; status: string }>,
        Error,
        CreateJobOrderPayload
    >({
        mutationFn: (payload) => itJobOrderService.createJobOrder(payload),
        onSuccess: (data) => {
            toast.success(`Job order ${data.data?.work_order_no} created successfully!`);
            queryClient.invalidateQueries({ queryKey: jobOrderKeys.lists() });
            queryClient.invalidateQueries({ queryKey: jobOrderKeys.myActive() });
            queryClient.invalidateQueries({ queryKey: jobOrderKeys.stats() });
        },
        onError: (error) => {
            toast.error(`Failed to create job order: ${error.message}`);
        },
        ...options,
    });
};

/**
 * Update job order
 */
export const useUpdateJobOrder = (
    options?: UseMutationOptions<
        ApiResponse<void>,
        Error,
        { id: number; payload: UpdateJobOrderPayload }
    >
) => {
    const queryClient = useQueryClient();

    return useMutation<
        ApiResponse<void>,
        Error,
        { id: number; payload: UpdateJobOrderPayload }
    >({
        mutationFn: ({ id, payload }) => itJobOrderService.updateJobOrder(id, payload),
        onSuccess: (_, variables) => {
            toast.success('Job order updated successfully!');
            queryClient.invalidateQueries({ queryKey: jobOrderKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: jobOrderKeys.lists() });
            queryClient.invalidateQueries({ queryKey: jobOrderKeys.myActive() });
            queryClient.invalidateQueries({ queryKey: jobOrderKeys.stats() });
        },
        onError: (error) => {
            toast.error(`Failed to update job order: ${error.message}`);
        },
        ...options,
    });
};

/**
 * Delete/Cancel job order
 */
export const useDeleteJobOrder = (
    options?: UseMutationOptions<ApiResponse<void>, Error, number>
) => {
    const queryClient = useQueryClient();

    return useMutation<ApiResponse<void>, Error, number>({
        mutationFn: (id) => itJobOrderService.deleteJobOrder(id),
        onSuccess: () => {
            toast.success('Job order cancelled successfully!');
            queryClient.invalidateQueries({ queryKey: jobOrderKeys.lists() });
            queryClient.invalidateQueries({ queryKey: jobOrderKeys.myActive() });
            queryClient.invalidateQueries({ queryKey: jobOrderKeys.stats() });
        },
        onError: (error) => {
            toast.error(`Failed to cancel job order: ${error.message}`);
        },
        ...options,
    });
};

// ============================================================================
// WORKFLOW MUTATION HOOKS
// ============================================================================

/**
 * Approve job order
 */
export const useApproveJobOrder = (
    options?: UseMutationOptions<ApiResponse<void>, Error, number>
) => {
    const queryClient = useQueryClient();

    return useMutation<ApiResponse<void>, Error, number>({
        mutationFn: (id) => itJobOrderService.approveJobOrder(id),
        onSuccess: (_, id) => {
            toast.success('Job order approved and queued!');
            queryClient.invalidateQueries({ queryKey: jobOrderKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: jobOrderKeys.lists() });
            queryClient.invalidateQueries({ queryKey: jobOrderKeys.queue() });
            queryClient.invalidateQueries({ queryKey: jobOrderKeys.stats() });
        },
        onError: (error) => {
            toast.error(`Failed to approve job order: ${error.message}`);
        },
        ...options,
    });
};

/**
 * Reject job order
 */
export const useRejectJobOrder = (
    options?: UseMutationOptions<
        ApiResponse<void>,
        Error,
        { id: number; reason: string }
    >
) => {
    const queryClient = useQueryClient();

    return useMutation<
        ApiResponse<void>,
        Error,
        { id: number; reason: string }
    >({
        mutationFn: ({ id, reason }) => itJobOrderService.rejectJobOrder(id, reason),
        onSuccess: (_, variables) => {
            toast.success('Job order rejected.');
            queryClient.invalidateQueries({ queryKey: jobOrderKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: jobOrderKeys.lists() });
            queryClient.invalidateQueries({ queryKey: jobOrderKeys.myActive() });
            queryClient.invalidateQueries({ queryKey: jobOrderKeys.stats() });
        },
        onError: (error) => {
            toast.error(`Failed to reject job order: ${error.message}`);
        },
        ...options,
    });
};

/**
 * Assign job order to technician
 */
export const useAssignJobOrder = (
    options?: UseMutationOptions<
        ApiResponse<void>,
        Error,
        { id: number; techId: number }
    >
) => {
    const queryClient = useQueryClient();

    return useMutation<
        ApiResponse<void>,
        Error,
        { id: number; techId: number }
    >({
        mutationFn: ({ id, techId }) => itJobOrderService.assignJobOrder(id, techId),
        onSuccess: (_, variables) => {
            toast.success('Job order assigned successfully!');
            queryClient.invalidateQueries({ queryKey: jobOrderKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: jobOrderKeys.lists() });
            queryClient.invalidateQueries({ queryKey: jobOrderKeys.queue() });
            queryClient.invalidateQueries({ queryKey: jobOrderKeys.stats() });
        },
        onError: (error) => {
            toast.error(`Failed to assign job order: ${error.message}`);
        },
        ...options,
    });
};

/**
 * Start working on job order
 */
export const useStartJobOrder = (
    options?: UseMutationOptions<ApiResponse<void>, Error, number>
) => {
    const queryClient = useQueryClient();

    return useMutation<ApiResponse<void>, Error, number>({
        mutationFn: (id) => itJobOrderService.startJobOrder(id),
        onSuccess: (_, id) => {
            toast.success('Started working on job order!');
            queryClient.invalidateQueries({ queryKey: jobOrderKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: jobOrderKeys.lists() });
            queryClient.invalidateQueries({ queryKey: jobOrderKeys.myActive() });
            queryClient.invalidateQueries({ queryKey: jobOrderKeys.stats() });
        },
        onError: (error) => {
            toast.error(`Failed to start job order: ${error.message}`);
        },
        ...options,
    });
};

/**
 * Resolve job order
 */
export const useResolveJobOrder = (
    options?: UseMutationOptions<
        ApiResponse<void>,
        Error,
        {
            id: number;
            data: {
                action_taken: string;
                resolution_notes?: string;
                actual_hours?: number;
            };
        }
    >
) => {
    const queryClient = useQueryClient();

    return useMutation<
        ApiResponse<void>,
        Error,
        {
            id: number;
            data: {
                action_taken: string;
                resolution_notes?: string;
                actual_hours?: number;
            };
        }
    >({
        mutationFn: ({ id, data }) => itJobOrderService.resolveJobOrder(id, data),
        onSuccess: (_, variables) => {
            toast.success('Job order resolved successfully!');
            queryClient.invalidateQueries({ queryKey: jobOrderKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: jobOrderKeys.lists() });
            queryClient.invalidateQueries({ queryKey: jobOrderKeys.myActive() });
            queryClient.invalidateQueries({ queryKey: jobOrderKeys.stats() });
        },
        onError: (error) => {
            toast.error(`Failed to resolve job order: ${error.message}`);
        },
        ...options,
    });
};

/**
 * Close job order
 */
export const useCloseJobOrder = (
    options?: UseMutationOptions<ApiResponse<void>, Error, number>
) => {
    const queryClient = useQueryClient();

    return useMutation<ApiResponse<void>, Error, number>({
        mutationFn: (id) => itJobOrderService.closeJobOrder(id),
        onSuccess: (_, id) => {
            toast.success('Job order closed successfully!');
            queryClient.invalidateQueries({ queryKey: jobOrderKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: jobOrderKeys.lists() });
            queryClient.invalidateQueries({ queryKey: jobOrderKeys.myActive() });
            queryClient.invalidateQueries({ queryKey: jobOrderKeys.stats() });
        },
        onError: (error) => {
            toast.error(`Failed to close job order: ${error.message}`);
        },
        ...options,
    });
};

// ============================================================================
// QUEUE MUTATION HOOKS
// ============================================================================

/**
 * Get next job order from queue
 */
export const useGetNextFromQueue = (
    options?: UseMutationOptions<ApiResponse<JobOrder | null>, Error, void>
) => {
    const queryClient = useQueryClient();

    return useMutation<ApiResponse<JobOrder | null>, Error, void>({
        mutationFn: () => itJobOrderService.getNextFromQueue(),
        onSuccess: (data) => {
            if (data.data) {
                toast.success(`Next work order: ${data.data.work_order_no}`);
                queryClient.invalidateQueries({ queryKey: jobOrderKeys.queue() });
                queryClient.invalidateQueries({ queryKey: jobOrderKeys.lists() });
                queryClient.invalidateQueries({ queryKey: jobOrderKeys.myActive() });
            } else {
                toast.info('No work orders in queue');
            }
        },
        onError: (error) => {
            toast.error(`Failed to get next work order: ${error.message}`);
        },
        ...options,
    });
};

/**
 * Reorder queue
 */
export const useReorderQueue = (
    options?: UseMutationOptions<ApiResponse<void>, Error, void>
) => {
    const queryClient = useQueryClient();

    return useMutation<ApiResponse<void>, Error, void>({
        mutationFn: () => itJobOrderService.reorderQueue(),
        onSuccess: () => {
            toast.success('Queue reordered successfully!');
            queryClient.invalidateQueries({ queryKey: jobOrderKeys.queue() });
        },
        onError: (error) => {
            toast.error(`Failed to reorder queue: ${error.message}`);
        },
        ...options,
    });
};

// ============================================================================
// ATTACHMENT MUTATION HOOKS
// ============================================================================

/**
 * Upload attachment
 */
export const useUploadAttachment = (
    options?: UseMutationOptions<
        ApiResponse<any>,
        Error,
        { id: number; file: File }
    >
) => {
    const queryClient = useQueryClient();

    return useMutation<
        ApiResponse<any>,
        Error,
        { id: number; file: File }
    >({
        mutationFn: ({ id, file }) => itJobOrderService.uploadAttachment(id, file),
        onSuccess: (_, variables) => {
            toast.success('File uploaded successfully!');
            queryClient.invalidateQueries({ queryKey: jobOrderKeys.detail(variables.id) });
        },
        onError: (error) => {
            toast.error(`Failed to upload file: ${error.message}`);
        },
        ...options,
    });
};

/**
 * Delete attachment
 */
export const useDeleteAttachment = (
    options?: UseMutationOptions<
        ApiResponse<void>,
        Error,
        { attachmentId: number; jobOrderId: number }
    >
) => {
    const queryClient = useQueryClient();

    return useMutation<
        ApiResponse<void>,
        Error,
        { attachmentId: number; jobOrderId: number }
    >({
        mutationFn: ({ attachmentId }) => itJobOrderService.deleteAttachment(attachmentId),
        onSuccess: (_, variables) => {
            toast.success('Attachment deleted successfully!');
            queryClient.invalidateQueries({ queryKey: jobOrderKeys.detail(variables.jobOrderId) });
        },
        onError: (error) => {
            toast.error(`Failed to delete attachment: ${error.message}`);
        },
        ...options,
    });
};

// ============================================================================
// COMMENT MUTATION HOOKS
// ============================================================================

/**
 * Add comment
 */
export const useAddComment = (
    options?: UseMutationOptions<
        ApiResponse<{ id: number }>,
        Error,
        { id: number; comment: string; is_internal?: number }
    >
) => {
    const queryClient = useQueryClient();

    return useMutation<
        ApiResponse<{ id: number }>,
        Error,
        { id: number; comment: string; is_internal?: number }
    >({
        mutationFn: ({ id, comment, is_internal }) =>
            itJobOrderService.addComment(id, { comment, is_internal }),
        onSuccess: (_, variables) => {
            toast.success('Comment added successfully!');
            queryClient.invalidateQueries({ queryKey: jobOrderKeys.detail(variables.id) });
        },
        onError: (error) => {
            toast.error(`Failed to add comment: ${error.message}`);
        },
        ...options,
    });
};