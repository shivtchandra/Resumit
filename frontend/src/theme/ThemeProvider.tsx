import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'resumit-theme';

function readStoredTheme(): Theme | null {
    if (typeof window === 'undefined') return null;
    try {
        const v = localStorage.getItem(STORAGE_KEY);
        if (v === 'dark' || v === 'light') return v;
    } catch {
        /* ignore */
    }
    return null;
}

function getSystemDark(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolveInitialTheme(): Theme {
    const stored = readStoredTheme();
    if (stored) return stored;
    return getSystemDark() ? 'dark' : 'light';
}

type ThemeContextValue = {
    theme: Theme;
    setTheme: (t: Theme) => void;
    toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(resolveInitialTheme);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch {
            /* ignore */
        }
    }, [theme]);

    const setTheme = useCallback((t: Theme) => {
        setThemeState(t);
    }, []);

    const toggleTheme = useCallback(() => {
        setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
    }, []);

    const value = useMemo(
        () => ({ theme, setTheme, toggleTheme }),
        [theme, setTheme, toggleTheme]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return ctx;
}
