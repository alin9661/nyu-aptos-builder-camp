import { apiClient } from './client';
import {
  ApiResponse,
  Notification,
  NotificationPreferences,
  NotificationFilters,
  NotificationCategory,
  PaginatedResponse,
} from '../types/api';

/**
 * Notifications API module
 * Handles all notification-related operations
 */

/**
 * Get user notifications with optional filtering and pagination
 */
export async function getNotifications(
  filters?: NotificationFilters
): Promise<PaginatedResponse<Notification>> {
  return apiClient.get<{
    notifications: Notification[];
    pagination: any;
  }>('/api/notifications', {
    params: filters,
  });
}

/**
 * Get count of unread notifications
 */
export async function getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
  return apiClient.get<{ count: number }>('/api/notifications/unread-count');
}

/**
 * Mark a specific notification as read
 */
export async function markAsRead(id: number): Promise<ApiResponse<void>> {
  return apiClient.put<void>(`/api/notifications/${id}/read`);
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<ApiResponse<{ updated: number }>> {
  return apiClient.put<{ updated: number }>('/api/notifications/read-all');
}

/**
 * Delete a specific notification
 */
export async function deleteNotification(id: number): Promise<ApiResponse<void>> {
  return apiClient.delete<void>(`/api/notifications/${id}`);
}

/**
 * Get user notification preferences
 */
export async function getNotificationPreferences(): Promise<
  ApiResponse<NotificationPreferences>
> {
  return apiClient.get<NotificationPreferences>('/api/notifications/preferences');
}

/**
 * Update user notification preferences
 */
export async function updateNotificationPreferences(
  preferences: Partial<NotificationPreferences>
): Promise<ApiResponse<NotificationPreferences>> {
  return apiClient.put<NotificationPreferences>(
    '/api/notifications/preferences',
    preferences
  );
}

/**
 * Send a test notification (development only)
 */
export async function sendTestNotification(
  category: NotificationCategory = 'system'
): Promise<ApiResponse<Notification>> {
  return apiClient.post<Notification>('/api/notifications/test', { category });
}

/**
 * Get available notification categories
 */
export async function getNotificationCategories(): Promise<
  ApiResponse<NotificationCategory[]>
> {
  return apiClient.get<NotificationCategory[]>('/api/notifications/categories');
}
