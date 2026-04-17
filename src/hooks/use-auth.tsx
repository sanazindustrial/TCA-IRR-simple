'use client';

import type { User, Role } from '@/lib/types';
import {
    createContext,
    useContext,
    useState,
    useMemo,
    type ReactNode,
    useEffect,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Do not expose demo users in production auth flow
const authUsers: User[] = [];

type AuthContextType = {
    users: User[];
    currentUser: User | null;
    isAuthenticated: boolean | null;
    login: (email: string, password?: string) => Promise<void>;
    logout: () => void;
    switchRole: (role: Role) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        setMounted(true);
        try {
            // Check both possible localStorage keys (loggedInUser from login page, currentUser as fallback)
            const userJson = localStorage.getItem('loggedInUser') || localStorage.getItem('currentUser');
            if (userJson) {
                const rawUser = JSON.parse(userJson);
                // Map backend fields to frontend User type
                const user: User = {
                    id: String(rawUser.id),
                    name: rawUser.name || rawUser.full_name || rawUser.username || 'Unknown',
                    email: rawUser.email,
                    role: (rawUser.role ? rawUser.role.charAt(0).toUpperCase() + rawUser.role.slice(1) : 'User') as Role,
                    avatarUrl: rawUser.avatarUrl || rawUser.avatar_url || `https://picsum.photos/seed/${rawUser.email}/100/100`
                };
                setCurrentUser(user);
                setIsAuthenticated(true);
            } else {
                // No user found - do not default to admin, require login
                setIsAuthenticated(false);
                setCurrentUser(null);
            }
        } catch (e) {
            console.error('Error loading user from localStorage:', e);
            setIsAuthenticated(false);
        }
    }, []);

    const login = async (email: string, password?: string) => {
        try {
            if (!password) {
                throw new Error('Password is required');
            }

            const { backendAPI } = await import('@/lib/backend-api');
            const response = await backendAPI.login(email, password);

            if (response.success && response.user) {
                const normalizedUser = {
                    ...response.user,
                    id: response.user.id || response.user.user_id,
                    name: response.user.name || response.user.full_name || response.user.username || 'Unknown',
                    role: response.user.role
                        ? response.user.role.charAt(0).toUpperCase() + response.user.role.slice(1)
                        : 'User',
                };

                const user: User = {
                    id: String(normalizedUser.id),
                    name: normalizedUser.name,
                    email: normalizedUser.email,
                    role: normalizedUser.role as Role,
                    avatarUrl: normalizedUser.avatarUrl || normalizedUser.avatar_url || `https://picsum.photos/seed/${normalizedUser.email}/100/100`
                };

                setCurrentUser(user);
                setIsAuthenticated(true);
                localStorage.setItem('loggedInUser', JSON.stringify(normalizedUser));
                localStorage.setItem('currentUser', JSON.stringify(normalizedUser));
                localStorage.setItem('authToken', response.access_token);
                return;
            }

            throw new Error(response.error || 'Invalid email or password');
        } catch (error) {
            console.error("Login error:", error);
            setCurrentUser(null);
            setIsAuthenticated(false);
            throw error;
        }
    };

    const logout = () => {
        setCurrentUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('loggedInUser');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        router.push('/login');
    };

    const switchRole = (_role: Role) => {
        console.warn('Role switching is disabled in the real production auth flow.');
    };

    const value = useMemo(
        () => ({
            users: currentUser ? [currentUser] : authUsers,
            currentUser,
            isAuthenticated,
            login,
            logout,
            switchRole,
        }),
        [currentUser, isAuthenticated]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        // Return default values when not wrapped in provider (for build-time rendering)
        return {
            users: authUsers,
            currentUser: null,
            isAuthenticated: false,
            login: async () => { },
            logout: () => { },
            switchRole: () => { },
        };
    }
    return context;
}