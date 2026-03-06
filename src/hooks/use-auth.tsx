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
        name: 'Reviewer User',
        email: 'reviewer@example.com',
        role: 'Reviewer',
        avatarUrl: 'https://picsum.photos/seed/reviewer/100/100'
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
            const userJson = localStorage.getItem('currentUser');
            if (userJson) {
                const user = JSON.parse(userJson);
                setCurrentUser(user);
                setIsAuthenticated(true);
            } else {
                // Default to Admin for demo purposes
                const defaultUser = mockUsers[0]; // Admin user
                setCurrentUser(defaultUser);
                setIsAuthenticated(true);
                localStorage.setItem('currentUser', JSON.stringify(defaultUser));
            }
        } catch (e) {
            setIsAuthenticated(false);
        }
    }, []);

    const login = async (email: string, password?: string) => {
        try {
            // Mock login - find user by email
            const user = mockUsers.find(u => u.email === email);
            if (user) {
                setCurrentUser(user);
                setIsAuthenticated(true);
                localStorage.setItem('currentUser', JSON.stringify(user));
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
        localStorage.removeItem('currentUser');
        router.push('/login');
    };

    const switchRole = (role: Role) => {
        const user = mockUsers.find((u) => u.role === role);
        if (user) {
            setCurrentUser(user);
            setIsAuthenticated(true);
            localStorage.setItem('currentUser', JSON.stringify(user));
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
            currentUser: mockUsers[0], // Default to Admin
            isAuthenticated: true,
            login: async () => { },
            logout: () => { },
            switchRole: () => { },
        };
    }
    return context;
}