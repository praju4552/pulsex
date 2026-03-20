// ─── Shared Game Statistics & Engagement Layer ────────────────────────────────

export interface GameStats {
    bestScore: number;
    bestTime: number;   // seconds (lower = better)
    totalPlays: number;
    lastPlayed: string; // ISO date
}

export interface StreakData {
    lastDate: string;
    currentStreak: number;
}

const today = () => new Date().toISOString().split('T')[0];

// ── XP ────────────────────────────────────────────────────────────────────────

export const getUserXP = () => parseInt(localStorage.getItem('user_xp') ?? '0', 10);
export const addXP = (n: number) => {
    localStorage.setItem('user_xp', String(getUserXP() + Math.round(n)));
};

// ── Streak ────────────────────────────────────────────────────────────────────

export function getStreak(): StreakData {
    const raw = localStorage.getItem('game_streak');
    return raw ? JSON.parse(raw) : { lastDate: '', currentStreak: 0 };
}

export function bumpStreak(): StreakData {
    const s = getStreak();
    const t = today();
    const yesterday = new Date(Date.now() - 864e5).toISOString().split('T')[0];
    let streak = s.currentStreak;
    if (s.lastDate === t) { /* already played today */ }
    else if (s.lastDate === yesterday) streak += 1;
    else streak = 1;
    const result: StreakData = { lastDate: t, currentStreak: streak };
    localStorage.setItem('game_streak', JSON.stringify(result));
    return result;
}

export function streakMultiplier(): number {
    const { currentStreak } = getStreak();
    return currentStreak >= 5 ? 1.2 : 1.0;
}

// ── Per-game stats ────────────────────────────────────────────────────────────

export function getStats(gameKey: string): GameStats {
    const raw = localStorage.getItem(`stats_${gameKey}`);
    return raw ? JSON.parse(raw) : { bestScore: 0, bestTime: Infinity, totalPlays: 0, lastPlayed: '' };
}

export function saveStats(
    gameKey: string,
    score: number,
    timeSecs: number
): { newBestScore: boolean; newBestTime: boolean; xpEarned: number } {
    const prev = getStats(gameKey);
    const multi = streakMultiplier();
    const xp = Math.floor((score / 10) * multi);
    addXP(xp);
    bumpStreak();

    const newBestScore = score > prev.bestScore;
    const newBestTime = timeSecs < (prev.bestTime ?? Infinity);

    const updated: GameStats = {
        bestScore: newBestScore ? score : prev.bestScore,
        bestTime: newBestTime ? timeSecs : (prev.bestTime ?? Infinity),
        totalPlays: prev.totalPlays + 1,
        lastPlayed: today(),
    };
    localStorage.setItem(`stats_${gameKey}`, JSON.stringify(updated));
    return { newBestScore, newBestTime, xpEarned: xp };
}

// ── Score helpers ─────────────────────────────────────────────────────────────

export const fmtTime = (s: number) =>
    `${Math.floor(s / 60)}:${(Math.floor(s) % 60).toString().padStart(2, '0')}`;

export const todaySeed = () =>
    parseInt(today().replace(/-/g, ''), 10) % 99991;

// ── Confetti ──────────────────────────────────────────────────────────────────

export const CONFETTI_COLORS = [
    '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#f97316', '#22d3ee', '#a3e635'
];
