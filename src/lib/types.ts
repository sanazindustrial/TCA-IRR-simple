// Core application types

export type Role = 'Admin' | 'Reviewer' | 'User' | 'Guest';

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    avatarUrl?: string;
}

export interface ExternalSource {
    id: string;
    name: string;
    description: string;
    category: string;
    type: string;
    pricing: 'Free' | 'Paid' | 'Freemium';
    framework: string;
    apiUrl: string;
    websiteUrl?: string;
    apiEndpoint?: string;
    apiKey?: string;
    requiresAuth: boolean;
    active: boolean;
    isConnected?: boolean;
    icon: string;
    features?: string[];
}