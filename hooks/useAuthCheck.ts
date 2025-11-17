'use client';

import { useEffect, useRef } from 'react';
import useAuthStore from '@/store/useAuthStore';
import { authAPI } from '@/services/api';

/**
 * Hook to verify token validity on mount
 * Silently logs out if token is invalid
 */
export function useAuthCheck() {
  const { isAuthenticated, token, logout } = useAuthStore();
  const hasChecked = useRef(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (hasChecked.current) return;
      if (!isAuthenticated || !token) return;

      hasChecked.current = true;

      try {
        // Try to fetch user profile to verify token is still valid
        await authAPI.getProfile();
      } catch {
        // Token is invalid or expired, logout silently
        console.log('Token expired or invalid, logging out');
        logout();
      }
    };

    verifyToken();
  }, [isAuthenticated, token, logout]);

  return { isAuthenticated };
}
