import React, { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    useGetNotifications,
    useGetUnreadCount,
    useMarkAsRead,
    useMarkAllAsRead,
    useDeleteNotification,
    useDeleteAllNotifications,
} from '../hooks/useNotifications';
import type { Notification } from '../services/notificationService';

export const Notifications: React.FC = () => {
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);

    // Fetch notifications and unread count
    const { data: notifications = [], isLoading, error, refetch } = useGetNotifications();
    const { data: unreadData } = useGetUnreadCount();
    const unreadCount = unreadData?.count || 0;

    // Mutations
    const markAsReadMutation = useMarkAsRead();
    const markAllAsReadMutation = useMarkAllAsRead();
    const deleteNotificationMutation = useDeleteNotification();
    const deleteAllMutation = useDeleteAllNotifications();

    const handleNotificationClick = async (notification: Notification) => {
        try {
            // Mark as read first
            if (!notification.is_read) {
                await markAsReadMutation.mutateAsync(notification.id);
            }

            // Close dropdown
            setShowNotifications(false);

            // Navigate if link exists - with error handling
            if (notification.link) {
                try {
                    navigate(notification.link);
                } catch (navError) {
                    console.error('Navigation error:', navError);
                    // If navigation fails, just close the dropdown
                }
            }
        } catch (error) {
            console.error('Error handling notification click:', error);
        }
    };

    const handleMarkAllAsRead = () => {
        markAllAsReadMutation.mutate();
    };

    const handleClearAll = () => {
        deleteAllMutation.mutate();
    };

    const handleDeleteNotification = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        deleteNotificationMutation.mutate(id);
    };

    const handleRefresh = () => {
        refetch();
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'endorsement_added':
                return '📋';
            case 'facility_visit':
                return '🏥';
            case 'document_uploaded':
                return '📄';
            case 'approval_needed':
                return '✅';
            case 'task_assigned':
                return '📌';
            case 'system_alert':
                return '⚠️';
            default:
                return 'ℹ️';
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'endorsement_added':
            case 'approval_needed':
                return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
            case 'facility_visit':
            case 'document_uploaded':
                return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
            case 'system_alert':
                return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400';
            case 'task_assigned':
                return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
            default:
                return 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400';
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="relative">
            {/* Notification Bell Button */}
            <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 hover:scale-105"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowNotifications(false)}
                    ></div>

                    {/* Dropdown Content */}
                    <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 animate-in slide-in-from-top-2 duration-200">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-3">
                                <h6 className="font-semibold text-gray-900 dark:text-white">
                                    Notifications
                                </h6>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleRefresh}
                                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                        title="Refresh notifications"
                                    >
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setShowNotifications(false)}
                                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                    >
                                        <X size={16} className="text-gray-500" />
                                    </button>
                                </div>
                            </div>

                            {/* Actions */}
                            {notifications.length > 0 && (
                                <div className="flex items-center gap-2">
                                    {unreadCount > 0 && (
                                        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full font-medium">
                                            {unreadCount} New
                                        </span>
                                    )}
                                    <button
                                        onClick={handleMarkAllAsRead}
                                        disabled={markAllAsReadMutation.isPending || unreadCount === 0}
                                        className="ml-auto text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Mark all as read
                                    </button>
                                    <button
                                        onClick={handleClearAll}
                                        disabled={deleteAllMutation.isPending}
                                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Clear all
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-96 overflow-y-auto">
                            {error ? (
                                <div className="p-8 text-center text-red-500 dark:text-red-400">
                                    <p className="text-sm">Failed to load notifications</p>
                                    <button
                                        onClick={handleRefresh}
                                        className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        Try again
                                    </button>
                                </div>
                            ) : isLoading ? (
                                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                    <p className="text-sm">Loading notifications...</p>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                    <Bell size={32} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No notifications</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                                                !notification.is_read
                                                    ? 'bg-blue-50/50 dark:bg-blue-900/10'
                                                    : ''
                                            }`}
                                            onClick={() => handleNotificationClick(notification)}
                                        >
                                            <div className="flex items-start gap-3">
                                                {/* Icon */}
                                                <div
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationColor(
                                                        notification.type
                                                    )}`}
                                                >
                                                    <span className="text-lg">
                                                        {getNotificationIcon(notification.type)}
                                                    </span>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h6 className="font-semibold text-sm text-gray-900 dark:text-white">
                                                            {notification.title}
                                                        </h6>
                                                        <div className="flex items-center gap-2">
                                                            {!notification.is_read && (
                                                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                                                            )}
                                                            <button
                                                                onClick={(e) =>
                                                                    handleDeleteNotification(
                                                                        notification.id,
                                                                        e
                                                                    )
                                                                }
                                                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                                                                title="Delete notification"
                                                            >
                                                                <X size={14} className="text-gray-500" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                        {notification.message}
                                                    </p>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <p className="text-xs text-gray-500 dark:text-gray-500">
                                                            {formatTimeAgo(notification.created_at)}
                                                        </p>
                                                        <p className="text-xs text-gray-400 dark:text-gray-600">
                                                            by {notification.created_by}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
                                <button
                                    onClick={() => {
                                        navigate('/notifications');
                                        setShowNotifications(false);
                                    }}
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                >
                                    View all notifications
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};