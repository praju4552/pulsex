import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { API_BASE_URL } from '../api/config';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
    username: string;
    avatarEmoji: string;
    avatarColor: string;
    xp: number;
    streak: number;
    credits: number;
}

interface UserContextType {
    user: UserProfile;
    setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
    refreshCredits: () => Promise<void>;
}

// ─── Avatar Presets ───────────────────────────────────────────────────────────

export const AVATAR_OPTIONS = [
    { emoji: '🦊', color: '#7C3AED' },
    { emoji: '🐼', color: '#2563EB' },
    { emoji: '🐯', color: '#EA580C' },
    { emoji: '🐸', color: '#16A34A' },
    { emoji: '🦄', color: '#DB2777' },
    { emoji: '🐙', color: '#9333EA' },
    { emoji: '🦁', color: '#F59E0B' },
    { emoji: '🐺', color: '#334155' },
];

// ─── Level & Ring Utilities ───────────────────────────────────────────────────

export const userLevel = (xp: number): number => Math.floor(xp / 100) + 1;

export const levelName = (level: number): string => {
    if (level < 5) return 'Rookie';
    if (level < 10) return 'Explorer';
    if (level < 20) return 'Expert';
    if (level < 40) return 'Master';
    return 'Legend';
};

export const getRingColor = (level: number): string => {
    if (level < 5) return '#16A34A'; // green
    if (level < 10) return '#2563EB'; // blue
    if (level < 20) return '#9333EA'; // purple
    return '#F59E0B';                 // gold
};

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_USER: UserProfile = {
    username: 'Player',
    avatarEmoji: '🦊',
    avatarColor: '#7C3AED',
    xp: 0,
    streak: 0,
    credits: 0,
};

// ─── Context ──────────────────────────────────────────────────────────────────

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserProfile>(DEFAULT_USER);

    // Load from localStorage on mount
    // Bridge with legacy keys user_xp and game_streak from gameStats.ts
    useEffect(() => {
        try {
            const stored = localStorage.getItem('userProfile');
            if (stored) {
                setUser(JSON.parse(stored));
            } else {
                // First time: pick up any existing XP / streak from the old keys
                const legacyXp = parseInt(localStorage.getItem('user_xp') ?? '0', 10);
                const legacyStreak = (() => {
                    const raw = localStorage.getItem('game_streak');
                    if (!raw) return 0;
                    try { return (JSON.parse(raw) as { currentStreak: number }).currentStreak; }
                    catch { return 0; }
                })();
                if (legacyXp || legacyStreak) {
                    setUser(u => ({ ...u, xp: legacyXp, streak: legacyStreak }));
                }
            }
        } catch { /* ignore corrupt data */ }
    }, []);

    const refreshCredits = async () => {
        try {
            // authToken is now stored in React memory (AuthContext) not localStorage.
            // TODO: thread the token down as a prop or via a shared signal when
            // the silent-refresh / httpOnly-cookie flow is implemented.
            // For now credits refresh is a no-op when the user is not logged in.
            const token = null; // placeholder until token sharing is implemented
            if (!token) return;

            const res = await fetch(`${API_BASE_URL}/credits/balance`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data && typeof data.balance === 'number') {
                setUser(prev => ({ ...prev, credits: data.balance }));
            }
        } catch (error) {
            console.error("Failed to refresh credits", error);
        }
    };

    // Initial load and periodic refresh
    useEffect(() => {
        refreshCredits();
        const interval = setInterval(refreshCredits, 5000); // Poll every 5 seconds for "instant" feel
        return () => clearInterval(interval);
    }, []);

    // Persist to localStorage whenever user changes
    useEffect(() => {
        localStorage.setItem('userProfile', JSON.stringify(user));
        // Keep legacy keys in sync so gameStats.ts helpers still work
        localStorage.setItem('user_xp', String(user.xp));
    }, [user]);

    return (
        <UserContext.Provider value={{ user, setUser, refreshCredits }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser(): UserContextType {
    const ctx = useContext(UserContext);
    if (!ctx) throw new Error('useUser must be used inside <UserProvider>');
    return ctx;
}
