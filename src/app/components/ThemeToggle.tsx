import { motion } from 'motion/react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
    className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <button
            onClick={toggleTheme}
            className={`relative flex items-center justify-center w-10 h-10 rounded-xl overflow-hidden transition-all duration-300 ${
                isDark
                    ? 'bg-glass-bg-hover border border-border-glass hover:bg-white/[0.1] hover:border-[#00cc55]/50'
                    : 'bg-surface-100 border border-border-glass hover:bg-surface-200 hover:border-accent-primary/50'
            } ${className}`}
            aria-label="Toggle theme"
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
            <div className="relative w-full h-full flex items-center justify-center">
                <motion.div
                    initial={false}
                    animate={{
                        y: isDark ? 0 : 30,
                        opacity: isDark ? 1 : 0,
                        rotate: isDark ? 0 : 90,
                    }}
                    transition={{ duration: 0.4, type: 'spring', stiffness: 200, damping: 20 }}
                    className="absolute"
                >
                    <Moon className="w-5 h-5 text-text-primary" />
                </motion.div>
                
                <motion.div
                    initial={false}
                    animate={{
                        y: isDark ? -30 : 0,
                        opacity: isDark ? 0 : 1,
                        rotate: isDark ? -90 : 0,
                    }}
                    transition={{ duration: 0.4, type: 'spring', stiffness: 200, damping: 20 }}
                    className="absolute"
                >
                    <Sun className="w-5 h-5 text-text-primary" />
                </motion.div>
            </div>
        </button>
    );
}
