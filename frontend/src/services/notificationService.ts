import api from './api';

export interface Notification {
    notification_id: number;
    type: string;
    title: string;
    message: string;
    source_module: string | null;
    reference_id: number | null;
    priority: 'low' | 'normal' | 'high';
    created_at: string;
    is_read: boolean;
    read_at: string | null;
    created_by_username: string | null;
}

export interface NotificationResponse {
    success: boolean;
    data: Notification[];
    unread_count: number;
    total: number;
}

export interface UnreadCountResponse {
    success: boolean;
    count: number;
}

class NotificationService {
    async getUserNotifications(unreadOnly = false, limit = 50, offset = 0): Promise<NotificationResponse> {
        const response = await api.get('/notifications', {
            params: { unreadOnly, limit, offset }
        });
        return response.data;
    }

    async getUnreadCount(): Promise<UnreadCountResponse> {
        const response = await api.get('/notifications/unread-count');
        return response.data;
    }

    async markAsRead(notificationId: number): Promise<void> {
        await api.patch(`/notifications/${notificationId}/read`);
    }

    async markAllAsRead(): Promise<void> {
        await api.patch('/notifications/read-all');
    }

    async deleteNotification(notificationId: number): Promise<void> {
        await api.delete(`/notifications/${notificationId}`);
    }

    async getNotificationById(notificationId: number): Promise<Notification> {
        const response = await api.get(`/notifications/${notificationId}`);
        return response.data.data;
    }
}

// Export both the service instance and the types
const notificationService = new NotificationService();
export { notificationService };
export default notificationService;