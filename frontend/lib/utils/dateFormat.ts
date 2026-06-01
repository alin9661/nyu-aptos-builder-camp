'use client';

import { useState, useEffect } from 'react';

/**
 * Format a date safely for SSR
 * This function uses ISO strings to ensure consistent server/client rendering
 */
export function formatDateForDisplay(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Return ISO string - this is consistent across server and client
  return dateObj.toISOString();
}

/**
 * Hook to format date with locale-specific formatting on client-side only
 * This prevents hydration mismatches by using the same format on server and initial client render
 */
export function useFormattedDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Initial state uses ISO string (consistent with server render)
  const [formatted, setFormatted] = useState<string>(dateObj.toISOString());

  useEffect(() => {
    // On client mount, format with locale-specific options
    if (options) {
      setFormatted(dateObj.toLocaleString(undefined, options));
    } else {
      setFormatted(dateObj.toLocaleString());
    }
  }, [date, options]);

  return formatted;
}

/**
 * Hook to format date as locale date string
 */
export function useFormattedDateString(date: Date | string): string {
  return useFormattedDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Hook to format date as locale time string
 */
export function useFormattedTimeString(date: Date | string): string {
  return useFormattedDate(date, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Hook to format date as full locale date and time
 */
export function useFormattedDateTime(date: Date | string): string {
  return useFormattedDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 * Uses client-side only to avoid hydration mismatch
 */
export function useRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Initial state uses absolute time
  const [relative, setRelative] = useState<string>(dateObj.toISOString());

  useEffect(() => {
    const formatRelative = () => {
      const now = new Date();
      const diffMs = now.getTime() - dateObj.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffSec < 60) {
        return 'just now';
      } else if (diffMin < 60) {
        return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
      } else if (diffHour < 24) {
        return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
      } else if (diffDay < 7) {
        return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
      } else {
        return dateObj.toLocaleDateString();
      }
    };

    setRelative(formatRelative());

    // Update every minute for recent timestamps
    const interval = setInterval(() => {
      setRelative(formatRelative());
    }, 60000);

    return () => clearInterval(interval);
  }, [date]);

  return relative;
}

/**
 * Simple date formatter that returns a consistent format string
 * Safe for both server and client rendering
 */
export function formatDate(date: Date | string, format: 'short' | 'long' | 'iso' = 'short'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  switch (format) {
    case 'iso':
      return dateObj.toISOString();
    case 'long':
      // Use a consistent format that doesn't depend on locale
      return dateObj.toISOString().split('T')[0] + ' ' + dateObj.toISOString().split('T')[1].split('.')[0];
    case 'short':
    default:
      // Just the date part (YYYY-MM-DD)
      return dateObj.toISOString().split('T')[0];
  }
}
