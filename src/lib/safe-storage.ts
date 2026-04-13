/**
 * Safe localStorage utilities for Next.js SSR compatibility
 */

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

export const safeLocalStorage = {
    getItem: (key: string): string | null => {
        if (!isBrowser) return null;
        try {
            return localStorage.getItem(key);
        } catch (error) {
            console.warn('localStorage.getItem failed:', error);
            return null;
        }
    },

    setItem: (key: string, value: string): void => {
        if (!isBrowser) return;
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            console.warn('localStorage.setItem failed:', error);
        }
    },

    removeItem: (key: string): void => {
        if (!isBrowser) return;
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.warn('localStorage.removeItem failed:', error);
        }
    },

    clear: (): void => {
        if (!isBrowser) return;
        try {
            localStorage.clear();
        } catch (error) {
            console.warn('localStorage.clear failed:', error);
        }
    }
};

export default safeLocalStorage;