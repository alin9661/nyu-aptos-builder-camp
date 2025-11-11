'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface User {
  address: string;
  role: string;
  displayName?: string;
  email?: string;
  ssoId?: string;
  ssoProvider?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, address: string, role: string) => void;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load user from localStorage and verify token
  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const userAddress = localStorage.getItem('userAddress');
      const userRole = localStorage.getItem('userRole');

      if (accessToken && userAddress && userRole) {
        try {
          // Verify token with backend
          const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data.user) {
              setUser({
                address: data.data.user.address,
                role: data.data.user.role,
                displayName: data.data.user.displayName,
                email: data.data.user.email,
              });
            } else {
              // Token invalid, clear storage
              clearAuth();
            }
          } else {
            // Try to refresh token
            const refreshed = await tryRefreshToken();
            if (!refreshed) {
              clearAuth();
            }
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          clearAuth();
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const clearAuth = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userAddress');
    localStorage.removeItem('userRole');
    setUser(null);
  };

  const login = useCallback((
    accessToken: string,
    refreshToken: string,
    address: string,
    role: string
  ) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('userAddress', address);
    localStorage.setItem('userRole', role);

    setUser({
      address,
      role,
    });
  }, []);

  const logout = useCallback(async () => {
    const accessToken = localStorage.getItem('accessToken');

    try {
      // Call backend logout endpoint
      if (accessToken) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    }

    clearAuth();
    router.push('/auth');
  }, [router]);

  const tryRefreshToken = async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.accessToken) {
          localStorage.setItem('accessToken', data.data.accessToken);
          return true;
        }
      }
    } catch (error) {
      console.error('Token refresh error:', error);
    }

    return false;
  };

  const refreshToken = useCallback(async (): Promise<boolean> => {
    return tryRefreshToken();
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshToken,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
