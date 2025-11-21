'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useRelativeTime } from '@/lib/utils/dateFormat';
import { useNotifications, useUnreadCount } from '@/hooks/useNotifications';
import { useServerEvents } from '@/hooks/useServerEvents';
import { Notification, NotificationCategory } from '@/lib/types/api';

/**
 * Notification Bell Icon with Dropdown
 * Now connected to backend API
 */
export function NotificationCenter() {
  const { data, loading, markAsRead, markAllAsRead, deleteNotification, refetch } =
    useNotifications({ limit: 10 }, true, 15000); // Auto-refresh every 15s
  const { data: unreadCount, refetch: refetchUnreadCount } = useUnreadCount(true, 10000); // Refresh count every 10s

  // Real-time notifications via SSE
  useServerEvents({
    channels: [
      'reimbursements:new',
      'reimbursements:approved',
      'reimbursements:paid',
      'proposals:new',
      'proposals:vote',
      'proposals:finalized',
      'elections:vote',
      'elections:finalized',
      'treasury:deposit',
    ],
    enabled: true,
    onEvent: (event) => {
      console.log('Notification event received:', event.channel);
      // Refetch notifications and count when events occur
      refetch();
      refetchUnreadCount();
    },
  });

  const notifications = data?.notifications || [];

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsRead(id);
      refetchUnreadCount();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      refetchUnreadCount();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleRemoveNotification = async (id: number) => {
    try {
      await deleteNotification(id);
      refetchUnreadCount();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <BellIcon />
          {(unreadCount ?? 0) > 0 && (
            <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-white">
              {(unreadCount ?? 0) > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px] max-w-[calc(100vw-2rem)]">
        <div className="flex items-center justify-between px-3 py-2">
          <h3 className="font-semibold">Notifications</h3>
          {(unreadCount ?? 0) > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Mark all as read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-[400px] overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={() => handleMarkAsRead(notification.id)}
                onRemove={() => handleRemoveNotification(notification.id)}
              />
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onRead: () => void;
  onRemove: () => void;
}

function NotificationItem({ notification, onRead, onRemove }: NotificationItemProps) {
  const relativeTime = useRelativeTime(new Date(notification.created_at));

  const handleClick = () => {
    if (!notification.read) {
      onRead();
    }
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  return (
    <DropdownMenuItem
      className={cn(
        'flex cursor-pointer items-start gap-3 px-3 py-3 focus:bg-accent',
        !notification.read && 'bg-accent/50'
      )}
      onSelect={handleClick}
    >
      <div className="mt-0.5 shrink-0">
        <NotificationIcon category={notification.category} priority={notification.priority} />
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-tight">{notification.title}</p>
          {!notification.read && (
            <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
          )}
        </div>
        <p className="text-xs text-muted-foreground">{notification.message}</p>
        <p className="text-xs text-muted-foreground">{relativeTime}</p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="shrink-0 rounded-sm p-1 opacity-70 hover:opacity-100"
        aria-label="Remove notification"
      >
        <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </DropdownMenuItem>
  );
}

function NotificationIcon({
  category,
  priority
}: {
  category: NotificationCategory;
  priority: string;
}) {
  const iconClasses = 'size-5';

  // Determine color based on priority or category
  const getColor = () => {
    if (priority === 'urgent') return 'text-red-600';
    if (priority === 'high') return 'text-orange-600';

    switch (category) {
      case 'wallet':
        return 'text-blue-600';
      case 'security':
        return 'text-red-600';
      case 'governance':
        return 'text-purple-600';
      case 'reimbursement':
        return 'text-green-600';
      case 'treasury':
        return 'text-yellow-600';
      case 'education':
        return 'text-indigo-600';
      case 'system':
        return 'text-gray-600';
      default:
        return 'text-muted-foreground';
    }
  };

  // Choose icon based on category
  switch (category) {
    case 'wallet':
      return (
        <svg className={cn(iconClasses, getColor())} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      );
    case 'security':
      return (
        <svg className={cn(iconClasses, getColor())} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      );
    case 'governance':
      return (
        <svg className={cn(iconClasses, getColor())} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      );
    case 'reimbursement':
      return (
        <svg className={cn(iconClasses, getColor())} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    case 'treasury':
      return (
        <svg className={cn(iconClasses, getColor())} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      );
    case 'education':
      return (
        <svg className={cn(iconClasses, getColor())} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      );
    case 'system':
    default:
      return (
        <svg className={cn(iconClasses, getColor())} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
  }
}

function BellIcon() {
  return (
    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}
