import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    getNotifications,
    getUnreadCount,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    type Notification,
    type UnreadCountResponse,
    type CreateNotificationPayload,
    type NotificationResponse,
} from '../services/notificationService';

// Query keys
export const notificationKeys = {
    all: ['notifications'] as const,
    lists: () => [...notificationKeys.all, 'list'] as const,
    list: (limit?: number, offset?: number) => [...notificationKeys.lists(), { limit, offset }] as const,
    unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
};

// ============= QUERIES =============

/**
 * Hook to get all notifications for current user's department
 */
export const useGetNotifications = (limit = 50, offset = 0) => {
    return useQuery<Notification[], Error>({
        queryKey: notificationKeys.list(limit, offset),
        queryFn: () => getNotifications(limit, offset),
        staleTime: 1000 * 15,
        refetchInterval: 1000 * 15,
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        retry: 1,
    });
};

/**
 * Hook to get unread notification count
 */
export const useGetUnreadCount = () => {
    return useQuery<UnreadCountResponse, Error>({
        queryKey: notificationKeys.unreadCount(),
        queryFn: getUnreadCount,
        staleTime: 1000 * 15,
        refetchInterval: 1000 * 15,
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        retry: 1,
    });
};

// ============= MUTATIONS =============

/**
 * Hook to create notification (admin use)
 */
export const useCreateNotification = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateNotificationPayload) => createNotification(data),
        onSuccess: () => {
            // Invalidate and refetch all notification queries
            queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        },
        onError: (error) => {
            console.error('Failed to create notification:', error);
        },
    });
};

/**
 * Hook to mark notification as read
 */
export const useMarkAsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => markAsRead(id),
        onMutate: async (id) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: notificationKeys.all });

            // Snapshot previous values
            const previousNotifications = queryClient.getQueriesData({ 
                queryKey: notificationKeys.lists() 
            });

            // Optimistically update to read
            queryClient.setQueriesData<Notification[]>(
                { queryKey: notificationKeys.lists() },
                (old) => {
                    if (!old) return old;
                    return old.map((notif) =>
                        notif.id === id 
                            ? { ...notif, is_read: true, read_at: new Date().toISOString() } 
                            : notif
                    );
                }
            );

            // Optimistically update count
            queryClient.setQueryData<UnreadCountResponse>(
                notificationKeys.unreadCount(),
                (old) => {
                    if (!old || old.count === 0) return old;
                    return { count: old.count - 1 };
                }
            );

            return { previousNotifications };
        },
        onError: (error, variables, context) => {
            console.error('Failed to mark as read:', error);
            // Restore previous state on error
            if (context?.previousNotifications) {
                context.previousNotifications.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
        },
        onSettled: () => {
            // Refetch to ensure consistency
            queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        },
    });
};

/**
 * Hook to mark all notifications as read
 */
export const useMarkAllAsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => markAllAsRead(),
        onMutate: async () => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: notificationKeys.all });

            // Snapshot previous values
            const previousNotifications = queryClient.getQueriesData({ 
                queryKey: notificationKeys.lists() 
            });

            // Optimistically update all to read
            queryClient.setQueriesData<Notification[]>(
                { queryKey: notificationKeys.lists() },
                (old) => {
                    if (!old) return old;
                    return old.map((notif) => ({
                        ...notif,
                        is_read: true,
                        read_at: new Date().toISOString(),
                    }));
                }
            );

            // Update count to 0
            queryClient.setQueryData<UnreadCountResponse>(
                notificationKeys.unreadCount(),
                { count: 0 }
            );

            return { previousNotifications };
        },
        onError: (error, variables, context) => {
            console.error('Failed to mark all as read:', error);
            // Restore previous state
            if (context?.previousNotifications) {
                context.previousNotifications.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        },
    });
};

/**
 * Hook to delete notification
 */
export const useDeleteNotification = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => deleteNotification(id),
        onMutate: async (id) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: notificationKeys.all });

            // Snapshot previous values
            const previousNotifications = queryClient.getQueriesData({ 
                queryKey: notificationKeys.lists() 
            });

            // Optimistically remove notification
            queryClient.setQueriesData<Notification[]>(
                { queryKey: notificationKeys.lists() },
                (old) => {
                    if (!old) return old;
                    const deletedNotif = old.find((n) => n.id === id);
                    
                    // Update count if deleted notification was unread
                    if (deletedNotif && !deletedNotif.is_read) {
                        queryClient.setQueryData<UnreadCountResponse>(
                            notificationKeys.unreadCount(),
                            (oldCount) => {
                                if (!oldCount || oldCount.count === 0) return oldCount;
                                return { count: oldCount.count - 1 };
                            }
                        );
                    }
                    
                    return old.filter((notif) => notif.id !== id);
                }
            );

            return { previousNotifications };
        },
        onError: (error, variables, context) => {
            console.error('Failed to delete notification:', error);
            // Restore previous state
            if (context?.previousNotifications) {
                context.previousNotifications.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        },
    });
};

/**
 * Hook to delete all notifications
 */
export const useDeleteAllNotifications = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => deleteAllNotifications(),
        onMutate: async () => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: notificationKeys.all });

            // Snapshot previous values
            const previousNotifications = queryClient.getQueriesData({ 
                queryKey: notificationKeys.lists() 
            });

            // Optimistically clear all
            queryClient.setQueriesData<Notification[]>(
                { queryKey: notificationKeys.lists() },
                []
            );

            queryClient.setQueryData<UnreadCountResponse>(
                notificationKeys.unreadCount(),
                { count: 0 }
            );

            return { previousNotifications };
        },
        onError: (error, variables, context) => {
            console.error('Failed to delete all notifications:', error);
            // Restore previous state
            if (context?.previousNotifications) {
                context.previousNotifications.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        },
    });
};

export default {
    // Queries
    useGetNotifications,
    useGetUnreadCount,
    // Mutations
    useCreateNotification,
    useMarkAsRead,
    useMarkAllAsRead,
    useDeleteNotification,
    useDeleteAllNotifications,
};