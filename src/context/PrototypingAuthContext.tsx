import { createContext, useContext, useState, ReactNode } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PrototypingUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  streetAddress?: string;
  apartment?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  [key: string]: any;
}

interface PrototypingAuthState {
  user: PrototypingUser | null;
  token: string | null;
}

interface PrototypingAuthContextType extends PrototypingAuthState {
  /** Call after a successful login/signup API response */
  loginPrototyping: (user: PrototypingUser, token: string) => void;
  /** Call on logout */
  logoutPrototyping: () => void;
  /** Update user profile fields in memory (e.g. after an edit-profile save) */
  updatePrototypingUser: (updatedUser: PrototypingUser) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const PrototypingAuthContext = createContext<PrototypingAuthContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PrototypingAuthProvider({ children }: { children: ReactNode }) {
  // Token persists in sessionStorage — survives page refreshes but clears on tab close.
  const [user, setUser] = useState<PrototypingUser | null>(() => {
    try {
      const saved = sessionStorage.getItem('proto_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [token, setToken] = useState<string | null>(() => {
    try { return sessionStorage.getItem('proto_token'); } catch { return null; }
  });

  const loginPrototyping = (newUser: PrototypingUser, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    try {
      sessionStorage.setItem('proto_user', JSON.stringify(newUser));
      sessionStorage.setItem('proto_token', newToken);
    } catch {}
  };

  const logoutPrototyping = () => {
    setUser(null);
    setToken(null);
    // Clear all session data
    sessionStorage.removeItem('proto_user');
    sessionStorage.removeItem('proto_token');
    sessionStorage.removeItem('cms_token');
    sessionStorage.removeItem('cms_admin');
  };

  const updatePrototypingUser = (updatedUser: PrototypingUser) => {
    setUser(updatedUser);
    try { sessionStorage.setItem('proto_user', JSON.stringify(updatedUser)); } catch {}
  };

  return (
    <PrototypingAuthContext.Provider
      value={{ user, token, loginPrototyping, logoutPrototyping, updatePrototypingUser }}
    >
      {children}
    </PrototypingAuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePrototypingAuth(): PrototypingAuthContextType {
  const ctx = useContext(PrototypingAuthContext);
  if (!ctx) throw new Error('usePrototypingAuth must be used inside <PrototypingAuthProvider>');
  return ctx;
}
