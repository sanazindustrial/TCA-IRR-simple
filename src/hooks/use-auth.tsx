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

// Mock users for demonstration
const mockUsers: User[] = [
    {
        id: '1',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'Admin',
        avatarUrl: 'https://picsum.photos/seed/admin/100/100'
    },
    {
        id: '2',
        name: 'Analyst User',
        email: 'analyst@example.com',
        role: 'Analyst',
        avatarUrl: 'https://picsum.photos/seed/analyst/100/100'
    },
    {
        id: '3',
        name: 'Standard User',
        email: 'user@example.com',
        role: 'User',
        avatarUrl: 'https://picsum.photos/seed/user/100/100'
    }
];

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
                    role: rawUser.role || 'User',
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
            // Try backend API first
            const useBackendAPI = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'true';
            
            if (useBackendAPI && password) {
                try {
                    const { backendAPI } = await import('@/lib/backend-api');
                    const response = await backendAPI.login(email, password);
                    
                    if (response.success && response.user) {
                        const user: User = {
                            id: String(response.user.id),
                            name: response.user.name || response.user.full_name || response.user.username || 'Unknown',
                            email: response.user.email,
                            role: response.user.role || 'User',
                            avatarUrl: response.user.avatarUrl || response.user.avatar_url || `https://picsum.photos/seed/${response.user.email}/100/100`
                        };
                        setCurrentUser(user);
                        setIsAuthenticated(true);
                        localStorage.setItem('loggedInUser', JSON.stringify(response.user));
                        localStorage.setItem('authToken', response.access_token);
                        if (response.refresh_token) localStorage.setItem('refreshToken', response.refresh_token);
                        // Trigger immediate health sweep now that we have a token
                        import('@/lib/health-service').then(({ healthService }) => healthService.sweep());
                        return;
                    }
                } catch (backendError) {
                    console.warn('Backend login failed, trying local auth:', backendError);
                }
            }
            
            // Fallback to mock users
            const localUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (localUser) {
                setCurrentUser(localUser);
                setIsAuthenticated(true);
                localStorage.setItem('loggedInUser', JSON.stringify(localUser));
            } else {
                throw new Error('User not found');
            }
        } catch (error) {
            console.error("Login error:", error);
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

    const switchRole = (role: Role) => {
        const user = mockUsers.find((u) => u.role === role);
        if (user) {
            setCurrentUser(user);
            setIsAuthenticated(true);
            localStorage.setItem('loggedInUser', JSON.stringify(user));
        }
    };

    const value = useMemo(
        () => ({
            users: mockUsers,
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
            users: mockUsers,
            currentUser: null, // Do not default to Admin
            isAuthenticated: false,
            login: async () => { },
            logout: () => { },
            switchRole: () => { },
        };
    }
    return context;
}