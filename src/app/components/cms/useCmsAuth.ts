/**
 * useCmsAuth.ts
 * Shared hook for all CMS pages.
 * - Returns the current cms_token from sessionStorage.
 * - Provides a `cmsApiFetch` wrapper that intercepts 401/403 responses and
 *   clears the session + redirects to /prototyping/auth automatically.
 */
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../api/config';

export function useCmsAuth() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem('cms_token') || '';

  const cmsApiFetch = useCallback(
    async (path: string, options: RequestInit = {}): Promise<Response> => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
        Authorization: `Bearer ${token}`,
      };

      const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

      if (res.status === 401 || res.status === 403) {
        // Token expired or invalid — clear session and redirect to login
        sessionStorage.removeItem('cms_token');
        sessionStorage.removeItem('cms_admin');
        navigate('/prototyping/auth');
      }

      return res;
    },
    [token, navigate]
  );

  return { token, cmsApiFetch };
}
