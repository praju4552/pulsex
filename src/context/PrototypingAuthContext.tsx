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
  // Token lives exclusively in React memory — never in localStorage.
  // On page refresh the session intentionally clears; the user must log in again.
  // (Future: add silent-refresh via httpOnly refreshToken cookie.)
  const [user, setUser] = useState<PrototypingUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const loginPrototyping = (newUser: PrototypingUser, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
  };

  const logoutPrototyping = () => {
    setUser(null);
    setToken(null);
    // If CMS session was set via sessionStorage, clear that too
    sessionStorage.removeItem('cms_token');
    sessionStorage.removeItem('cms_admin');
  };

  const updatePrototypingUser = (updatedUser: PrototypingUser) => {
    setUser(updatedUser);
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
