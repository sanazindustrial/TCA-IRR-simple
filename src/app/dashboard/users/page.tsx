'use client';
import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  MoreHorizontal,
  Search,
  Download,
  Users,
  UserPlus,
  Trash2,
  RefreshCw,
  Loader2,
  Shield,
  ShieldCheck,
  UserCog,
  Mail,
  Key,
  UserX,
  UserCheck,
  Crown,
  Briefcase,
  User as UserIcon,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Edit,
  DollarSign,
  Settings,
  Save,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { costApi, UserCost } from '@/lib/cost-api';
import { RolesApi, RoleConfig, RolePermission, DEFAULT_ROLE_CONFIGS } from '@/lib/roles-api';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

// Default role limits (can be overridden)
const DEFAULT_ROLE_LIMITS: {
  admin: { triageReports: string | number; ddReports: string | number };
  analyst: { triageReports: string | number; ddReports: string | number };
  user: { triageReports: string | number; ddReports: string | number };
} = {
  admin: { triageReports: 'Unlimited', ddReports: 'Unlimited' },
  analyst: { triageReports: 25, ddReports: 5 },
  user: { triageReports: 10, ddReports: 2 },
};

// Icon mapping for roles (icons can't be stored in DB)
const ROLE_ICONS = {
  admin: { icon: Crown, borderColor: 'border-red-500/20', badgeVariant: 'destructive' as const },
  analyst: { icon: Briefcase, borderColor: 'border-blue-500/20', badgeVariant: 'default' as const },
  user: { icon: UserIcon, borderColor: 'border-gray-500/20', badgeVariant: 'secondary' as const },
};

// Initial role permissions (used before API loads)
const INITIAL_ROLE_PERMISSIONS = {
  admin: {
    label: 'Administrator',
    icon: Crown,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    badgeVariant: 'destructive' as const,
    permissions: [
      { name: 'User Management', description: 'Create, edit, delete users', enabled: true },
      { name: 'System Settings', description: 'Configure platform settings', enabled: true },
      { name: 'All Reports', description: 'Access all analysis reports', enabled: true },
      { name: 'Billing & Costs', description: 'View and manage costs', enabled: true },
      { name: 'API Access', description: 'Full API access', enabled: true },
      { name: 'Audit Logs', description: 'View system audit logs', enabled: true },
    ],
    limits: { triageReports: 'Unlimited' as string | number, ddReports: 'Unlimited' as string | number },
  },
  analyst: {
    label: 'Analyst',
    icon: Briefcase,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    badgeVariant: 'default' as const,
    permissions: [
      { name: 'User Management', description: 'Create, edit, delete users', enabled: false },
      { name: 'System Settings', description: 'Configure platform settings', enabled: false },
      { name: 'All Reports', description: 'Access all analysis reports', enabled: true },
      { name: 'Billing & Costs', description: 'View and manage costs', enabled: false },
      { name: 'API Access', description: 'Limited API access', enabled: true },
      { name: 'Audit Logs', description: 'View system audit logs', enabled: false },
    ],
    limits: { triageReports: 25 as string | number, ddReports: 5 as string | number },
  },
  user: {
    label: 'User',
    icon: UserIcon,
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/20',
    badgeVariant: 'secondary' as const,
    permissions: [
      { name: 'User Management', description: 'Create, edit, delete users', enabled: false },
      { name: 'System Settings', description: 'Configure platform settings', enabled: false },
      { name: 'All Reports', description: 'Access all analysis reports', enabled: false },
      { name: 'Billing & Costs', description: 'View and manage costs', enabled: false },
      { name: 'API Access', description: 'No API access', enabled: false },
      { name: 'Audit Logs', description: 'View system audit logs', enabled: false },
    ],
    limits: { triageReports: 10 as string | number, ddReports: 2 as string | number },
  },
};

// Type for role permission config
type RolePermissionConfig = typeof INITIAL_ROLE_PERMISSIONS;

// Generic role config type for editing (allows any badgeVariant)
type EditableRoleConfig = {
  label: string;
  icon: typeof Crown | typeof Briefcase | typeof UserIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeVariant: 'destructive' | 'default' | 'secondary';
  permissions: { name: string; description: string; enabled: boolean }[];
  limits: { triageReports: string | number; ddReports: string | number };
};

// User interface matching backend API response
interface BackendUser {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  full_name: string | null;
}

// User interface for UI display
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'analyst' | 'user';
  status: 'Active' | 'Inactive';
  lastActivity: string;
  createdAt: string;
  backendId: number;
}

// Convert backend user to UI user format
function mapBackendUser(bu: BackendUser): User {
  return {
    id: `usr_${bu.id}`,
    backendId: bu.id,
    name: bu.full_name || bu.username,
    email: bu.email,
    role: bu.role.toLowerCase() as 'admin' | 'analyst' | 'user',
    status: bu.is_active ? 'Active' : 'Inactive',
    lastActivity: bu.updated_at ? formatTimeAgo(new Date(bu.updated_at)) : formatTimeAgo(new Date(bu.created_at)),
    createdAt: new Date(bu.created_at).toLocaleDateString(),
  };
}

// Format relative time
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// API response types
interface PaginatedResponse {
  items: BackendUser[];
  total: number;
  page: number;
  size: number;
  pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'analyst'>('analyst');
  const [isInviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [isInviteLoading, setInviteLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [editRole, setEditRole] = useState<string>('');
  const [isAccessDenied, setIsAccessDenied] = useState(false);
  const [userCosts, setUserCosts] = useState<Map<string, UserCost>>(new Map());
  const [isLoadingCosts, setIsLoadingCosts] = useState(false);
  const [roleLimits, setRoleLimits] = useState(DEFAULT_ROLE_LIMITS);
  const [isEditLimitsOpen, setEditLimitsOpen] = useState(false);
  const [editingLimits, setEditingLimits] = useState(DEFAULT_ROLE_LIMITS);
  const [rolePermissions, setRolePermissions] = useState<RolePermissionConfig>(INITIAL_ROLE_PERMISSIONS);
  const [isEditRoleConfigOpen, setEditRoleConfigOpen] = useState(false);
  const [editingRoleKey, setEditingRoleKey] = useState<'admin' | 'analyst' | 'user'>('admin');
  const [editingRoleConfig, setEditingRoleConfig] = useState<EditableRoleConfig | null>(null);
  const [isSavingRoleConfig, setIsSavingRoleConfig] = useState(false);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [reportUsage, setReportUsage] = useState<Record<string, { triage: number; dd: number }>>({});
  const [editUserName, setEditUserName] = useState('');
  const [editUserTriageLimit, setEditUserTriageLimit] = useState<string>('');
  const [editUserDDLimit, setEditUserDDLimit] = useState<string>('');
  const [editUserPermissions, setEditUserPermissions] = useState<{name: string; description: string; enabled: boolean}[]>([]);
  const [editUserTab, setEditUserTab] = useState('profile');
  const [isSavingUser, setIsSavingUser] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  // Get auth token
  const getAuthToken = () => localStorage.getItem('authToken');
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://tcairrapiccontainer.azurewebsites.net';

  // Check if current user is admin
  const isAdmin = currentUser?.role?.toLowerCase() === 'admin';

  // Stats calculations
  const activeUsers = users.filter(u => u.status === 'Active').length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const analystCount = users.filter(u => u.role === 'analyst').length;
  const userCount = users.filter(u => u.role === 'user').length;

  // Load users from backend
  const loadUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const token = getAuthToken();
      if (!token) {
        toast({
          variant: 'destructive',
          title: 'Authentication Required',
          description: 'Please log in to view users.',
        });
        return;
      }

      const params = new URLSearchParams({ size: '100' });
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`${backendUrl}/api/v1/users?${params.toString()}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const usersList = data.items || data.users || [];
        let mappedUsers = Array.isArray(usersList) ? usersList.map(mapBackendUser) : [];

        // Apply filters
        if (roleFilter && roleFilter !== 'all') {
          mappedUsers = mappedUsers.filter(u => u.role === roleFilter);
        }
        if (statusFilter && statusFilter !== 'all') {
          mappedUsers = mappedUsers.filter(u =>
            statusFilter === 'active' ? u.status === 'Active' : u.status === 'Inactive'
          );
        }

        setUsers(mappedUsers);
        setTotalUsers(data.total ?? data.pagination?.total ?? mappedUsers.length);
        setIsAccessDenied(false);
      } else if (response.status === 403) {
        setIsAccessDenied(true);
        setUsers([]);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        variant: 'destructive',
        title: 'Error Loading Users',
        description: error instanceof Error ? error.message : 'Could not load users from server.',
      });
    } finally {
      setIsLoadingUsers(false);
    }
  }, [backendUrl, searchQuery, roleFilter, statusFilter, toast]);

  // Load users on mount and when search/filters change
  useEffect(() => {
    const debounce = setTimeout(() => {
      loadUsers();
    }, searchQuery ? 300 : 0);
    return () => clearTimeout(debounce);
  }, [loadUsers, searchQuery, roleFilter, statusFilter]);

  // Auto-refresh users list every 30 seconds to show new signups immediately
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Initialize lastRefresh on client side only to avoid hydration mismatch
  useEffect(() => {
    setLastRefresh(new Date());
  }, []);

  // Load user costs from cost API
  const loadUserCosts = useCallback(async () => {
    setIsLoadingCosts(true);
    try {
      const data = await costApi.getSummary();
      const costMap = new Map<string, UserCost>();
      data.aiBreakdown.costByUser.forEach(uc => {
        costMap.set(uc.name.toLowerCase(), uc);
      });
      setUserCosts(costMap);
    } catch (error) {
      console.error('Error loading user costs:', error);
    } finally {
      setIsLoadingCosts(false);
    }
  }, []);

  // Load costs on mount
  useEffect(() => {
    loadUserCosts();
  }, [loadUserCosts]);

  // Load role configurations from backend
  const loadRoleConfigurations = useCallback(async () => {
    setIsLoadingRoles(true);
    try {
      const data = await RolesApi.getConfigurations();
      if (data.roles) {
        // Helper to convert API permissions to local format
        const convertPermissions = (perms: { name: string; description?: string; enabled: boolean }[]) =>
          perms.map(p => ({ name: p.name, description: p.description || '', enabled: p.enabled }));

        // Helper to convert limits
        const convertLimits = (limits: { triageReports: number | 'Unlimited'; ddReports: number | 'Unlimited' }) => ({
          triageReports: limits.triageReports as string | number,
          ddReports: limits.ddReports as string | number,
        });

        // Merge API data with local icon configuration
        const mergedConfig: RolePermissionConfig = {
          admin: {
            label: data.roles.admin.label,
            icon: ROLE_ICONS.admin.icon,
            color: data.roles.admin.color,
            bgColor: data.roles.admin.bgColor,
            borderColor: ROLE_ICONS.admin.borderColor,
            badgeVariant: ROLE_ICONS.admin.badgeVariant,
            permissions: convertPermissions(data.roles.admin.permissions),
            limits: convertLimits(data.roles.admin.limits),
          },
          analyst: {
            label: data.roles.analyst.label,
            icon: ROLE_ICONS.analyst.icon,
            color: data.roles.analyst.color,
            bgColor: data.roles.analyst.bgColor,
            borderColor: ROLE_ICONS.analyst.borderColor,
            badgeVariant: ROLE_ICONS.analyst.badgeVariant,
            permissions: convertPermissions(data.roles.analyst.permissions),
            limits: convertLimits(data.roles.analyst.limits),
          },
          user: {
            label: data.roles.user.label,
            icon: ROLE_ICONS.user.icon,
            color: data.roles.user.color,
            bgColor: data.roles.user.bgColor,
            borderColor: ROLE_ICONS.user.borderColor,
            badgeVariant: ROLE_ICONS.user.badgeVariant,
            permissions: convertPermissions(data.roles.user.permissions),
            limits: convertLimits(data.roles.user.limits),
          },
        };
        setRolePermissions(mergedConfig);
        // Also update roleLimits
        setRoleLimits({
          admin: convertLimits(data.roles.admin.limits),
          analyst: convertLimits(data.roles.analyst.limits),
          user: convertLimits(data.roles.user.limits),
        });
      }
    } catch (error) {
      console.error('Error loading role configurations:', error);
    } finally {
      setIsLoadingRoles(false);
    }
  }, []);

  // Load role configurations on mount
  useEffect(() => {
    loadRoleConfigurations();
  }, [loadRoleConfigurations]);

  // Load report usage counts from localStorage
  useEffect(() => {
    try {
      const data = localStorage.getItem('reportUsage');
      if (data) setReportUsage(JSON.parse(data));
    } catch { /* ignore */ }
  }, []);

  // Open role config editor
  const openRoleConfigEditor = (roleKey: 'admin' | 'analyst' | 'user') => {
    setEditingRoleKey(roleKey);
    const config = rolePermissions[roleKey];
    setEditingRoleConfig({
      label: config.label,
      icon: config.icon,
      color: config.color,
      bgColor: config.bgColor,
      borderColor: config.borderColor,
      badgeVariant: config.badgeVariant,
      permissions: [...config.permissions],
      limits: { ...config.limits },
    });
    setEditRoleConfigOpen(true);
  };

  // Save role configuration to backend
  const handleSaveRoleConfig = async () => {
    if (!editingRoleConfig) return;

    setIsSavingRoleConfig(true);
    try {
      // Convert limits to API format
      const convertLimitForApi = (val: string | number): number | 'Unlimited' => {
        if (val === 'Unlimited' || (typeof val === 'string' && val.toLowerCase() === 'unlimited')) {
          return 'Unlimited';
        }
        return typeof val === 'number' ? val : parseInt(val) || 0;
      };

      await RolesApi.updateConfiguration(editingRoleKey, {
        label: editingRoleConfig.label,
        color: editingRoleConfig.color,
        bgColor: editingRoleConfig.bgColor,
        permissions: editingRoleConfig.permissions.map(p => ({
          name: p.name,
          description: p.description,
          enabled: p.enabled,
        })),
        limits: {
          triageReports: convertLimitForApi(editingRoleConfig.limits.triageReports),
          ddReports: convertLimitForApi(editingRoleConfig.limits.ddReports),
        },
      });

      // Update local state
      setRolePermissions(prev => ({
        ...prev,
        [editingRoleKey]: editingRoleConfig,
      }));
      setRoleLimits(prev => ({
        ...prev,
        [editingRoleKey]: editingRoleConfig.limits,
      }));

      setEditRoleConfigOpen(false);
      toast({
        title: '✅ Role Updated',
        description: `${editingRoleConfig.label} configuration saved successfully.`,
      });
    } catch (error) {
      console.error('Error saving role configuration:', error);
      toast({
        variant: 'destructive',
        title: 'Error Saving Role',
        description: error instanceof Error ? error.message : 'Failed to save role configuration.',
      });
    } finally {
      setIsSavingRoleConfig(false);
    }
  };

  // Toggle permission in editing state
  const toggleEditingPermission = (permIndex: number) => {
    if (!editingRoleConfig) return;
    const newPerms = [...editingRoleConfig.permissions];
    newPerms[permIndex] = { ...newPerms[permIndex], enabled: !newPerms[permIndex].enabled };
    setEditingRoleConfig({ ...editingRoleConfig, permissions: newPerms });
  };

  // Update editing limit
  const updateEditingLimit = (field: 'triageReports' | 'ddReports', value: string) => {
    if (!editingRoleConfig) return;
    const parsed = value.toLowerCase() === 'unlimited' ? 'Unlimited' : (parseInt(value) || 0);
    setEditingRoleConfig({
      ...editingRoleConfig,
      limits: { ...editingRoleConfig.limits, [field]: parsed },
    });
  };

  // Get cost for a user
  const getUserCost = (userName: string): UserCost | undefined => {
    // Try exact match first, then partial match
    const lowerName = userName.toLowerCase();
    if (userCosts.has(lowerName)) return userCosts.get(lowerName);
    // Try to find partial match
    for (const [key, value] of userCosts.entries()) {
      if (lowerName.includes(key) || key.includes(lowerName)) return value;
    }
    return undefined;
  };

  // Handle saving role limits
  const handleSaveLimits = () => {
    setRoleLimits(editingLimits);
    setEditLimitsOpen(false);
    toast({
      title: '✅ Limits Updated',
      description: 'Report limits have been updated for all roles.',
    });
  };

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadUsers();
      setLastRefresh(new Date());
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [loadUsers, autoRefresh]);

  // Manual refresh handler
  const handleManualRefresh = () => {
    loadUsers();
    setLastRefresh(new Date());
    toast({
      title: '🔄 Refreshed',
      description: 'User list has been updated.',
    });
  };

  // Format last refresh time
  const formatLastRefresh = (date: Date | null) => {
    if (!date) return 'Loading...';
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 120) return '1 minute ago';
    return `${Math.floor(diffSec / 60)} minutes ago`;
  };

  // Send invite handler
  const handleSendInvite = async () => {
    if (!inviteEmail) {
      toast({
        variant: 'destructive',
        title: 'Missing Email',
        description: 'Please enter an email address.',
      });
      return;
    }

    const token = getAuthToken();
    if (!token) {
      toast({
        variant: 'destructive',
        title: 'Not Authenticated',
        description: 'You must be logged in to invite users.',
      });
      return;
    }

    setInviteLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/v1/users/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to invite user');
      }

      toast({
        title: '✉️ Invitation Sent',
        description: data.email_sent
          ? `An invitation has been sent to ${inviteEmail}. They will receive a link to create their account.`
          : `Invitation created for ${inviteEmail}. Note: Email service may not be configured - share the invite link manually.`,
      });
      setInviteDialogOpen(false);
      setInviteEmail('');
      setInviteRole('analyst');
      loadUsers();
    } catch (error) {
      console.error('Invite error:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Send Invitation',
        description: error instanceof Error ? error.message : 'Failed to send invitation.',
      });
    } finally {
      setInviteLoading(false);
    }
  };

  // Delete user handler
  const handleDeleteUser = async (user: User) => {
    const token = getAuthToken();
    if (!token) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`${backendUrl}/api/v1/users/${user.backendId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to delete user');
      }

      toast({
        title: '🗑️ User Deleted',
        description: `${user.name} has been removed from the system.`,
      });
      setDeleteUserId(null);
      loadUsers();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to Delete',
        description: error instanceof Error ? error.message : 'Failed to delete user.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle user status handler
  const handleToggleUserStatus = async (user: User) => {
    const token = getAuthToken();
    if (!token) return;

    const action = user.status === 'Active' ? 'suspend' : 'activate';
    try {
      const response = await fetch(`${backendUrl}/api/v1/users/${user.backendId}/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || `Failed to ${action} user`);
      }

      toast({
        title: action === 'suspend' ? '⏸️ User Suspended' : '✅ User Activated',
        description: `${user.name} has been ${action}d.`
      });
      loadUsers();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to ${action} user.`
      });
    }
  };

  // Reset password handler
  const handleResetPassword = async (user: User) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${backendUrl}/api/v1/users/${user.backendId}/reset-password`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to reset password');
      }

      const data = await response.json();
      toast({
        title: '🔑 Password Reset Link Generated',
        description: `A password reset link has been sent to ${user.email}.`
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reset password.'
      });
    }
  };

  // Export users handler
  const handleExportUsers = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${backendUrl}/api/v1/users/export?format=csv`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to export users');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({ title: '📥 Export Complete', description: 'Users exported to CSV successfully.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Failed to export users.' });
    }
  };

  // Change user role handler
  const handleOpenEditUser = (user: User) => {
    setSelectedUser(user);
    setEditRole(user.role);
    setEditUserName(user.name);
    try {
      const overrides = JSON.parse(localStorage.getItem('userOverrides') || '{}');
      const userOv = overrides[user.backendId] || {};
      const roleLim = roleLimits[user.role];
      setEditUserTriageLimit(String(userOv.triageLimit ?? roleLim.triageReports));
      setEditUserDDLimit(String(userOv.ddLimit ?? roleLim.ddReports));
      setEditUserPermissions(
        userOv.permissions
          ? [...userOv.permissions]
          : rolePermissions[user.role].permissions.map(p => ({ ...p }))
      );
    } catch {
      const roleLim = roleLimits[user.role];
      setEditUserTriageLimit(String(roleLim.triageReports));
      setEditUserDDLimit(String(roleLim.ddReports));
      setEditUserPermissions(rolePermissions[user.role].permissions.map(p => ({ ...p })));
    }
    setEditUserTab('profile');
    setEditDialogOpen(true);
  };

  const handleSaveUserEdit = async () => {
    if (!selectedUser) return;
    setIsSavingUser(true);
    try {
      const token = getAuthToken();
      if (token) {
        const response = await fetch(`${backendUrl}/api/v1/users/${selectedUser.backendId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            role: editRole,
            full_name: editUserName || undefined,
          }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.detail || 'Failed to update user');
        }
      }
      // Save per-user overrides (limits + permissions) to localStorage
      const overrides = JSON.parse(localStorage.getItem('userOverrides') || '{}');
      const triageVal = editUserTriageLimit.toLowerCase() === 'unlimited'
        ? 'Unlimited'
        : (parseInt(editUserTriageLimit) || 0);
      const ddVal = editUserDDLimit.toLowerCase() === 'unlimited'
        ? 'Unlimited'
        : (parseInt(editUserDDLimit) || 0);
      overrides[selectedUser.backendId] = {
        triageLimit: triageVal,
        ddLimit: ddVal,
        permissions: editUserPermissions,
      };
      localStorage.setItem('userOverrides', JSON.stringify(overrides));

      toast({
        title: '✅ User Updated',
        description: `${selectedUser.name} has been successfully updated.`
      });
      setEditDialogOpen(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update user.'
      });
    } finally {
      setIsSavingUser(false);
    }
  };

  // Get user to delete
  const userToDelete = deleteUserId ? users.find(u => u.id === deleteUserId) : null;

  // Access denied state
  if (isAccessDenied) {
    return (
      <div className="container mx-auto p-8">
        <Card className="max-w-lg mx-auto">
          <CardContent className="pt-12 pb-8 text-center">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-6">
              Only administrators can access user management. Contact your admin if you need access.
            </p>
            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Delete User
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>Are you sure you want to permanently delete <strong>{userToDelete?.name}</strong>?</p>
                <p className="text-sm text-destructive">This action cannot be undone. All user data will be lost.</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={isDeleting}
                onClick={() => userToDelete && handleDeleteUser(userToDelete)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Delete Permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                Edit User
              </DialogTitle>
              <DialogDescription>
                Update profile, role, report limits, and permissions for <strong>{selectedUser?.name}</strong>.
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="py-2">
                {/* User info bar */}
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg mb-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className={rolePermissions[selectedUser.role]?.bgColor || 'bg-gray-100'}>
                      {(editUserName || selectedUser.name).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedUser.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>
                <Tabs value={editUserTab} onValueChange={setEditUserTab}>
                  <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="profile">Profile &amp; Role</TabsTrigger>
                    <TabsTrigger value="limits">Report Limits</TabsTrigger>
                    <TabsTrigger value="permissions">Permissions</TabsTrigger>
                  </TabsList>

                  {/* Tab 1: Profile & Role */}
                  <TabsContent value="profile" className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                    <div className="space-y-2">
                      <Label>Display Name</Label>
                      <Input
                        value={editUserName}
                        onChange={(e) => setEditUserName(e.target.value)}
                        placeholder="Enter display name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <div className="grid gap-2">
                        {Object.entries(rolePermissions).map(([role, config]) => {
                          const Icon = config.icon;
                          return (
                            <div
                              key={role}
                              onClick={() => {
                                setEditRole(role);
                                const roleLim = roleLimits[role as keyof typeof roleLimits];
                                setEditUserTriageLimit(String(roleLim.triageReports));
                                setEditUserDDLimit(String(roleLim.ddReports));
                                setEditUserPermissions(rolePermissions[role as keyof typeof rolePermissions].permissions.map(p => ({ ...p })));
                              }}
                              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${editRole === role
                                ? `${config.borderColor} ${config.bgColor}`
                                : 'border-border hover:border-muted-foreground/50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-1.5 rounded-md ${config.bgColor}`}>
                                  <Icon className={`h-4 w-4 ${config.color}`} />
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{config.label}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {role === 'admin' && 'Full system access'}
                                    {role === 'analyst' && 'Analysis and reporting access'}
                                    {role === 'user' && 'Basic access only'}
                                  </p>
                                </div>
                                {editRole === role && (
                                  <CheckCircle2 className={`h-4 w-4 ${config.color}`} />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Tab 2: Report Limits */}
                  <TabsContent value="limits" className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                    <p className="text-sm text-muted-foreground">
                      Override the default report limits for this user. Enter a number or &quot;Unlimited&quot;.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Triage Reports Limit</Label>
                        <Input
                          value={editUserTriageLimit}
                          onChange={(e) => setEditUserTriageLimit(e.target.value)}
                          placeholder="e.g. 10 or Unlimited"
                        />
                        <p className="text-xs text-muted-foreground">
                          Role default: {String(roleLimits[editRole as keyof typeof roleLimits]?.triageReports ?? 'N/A')}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>DD Reports Limit</Label>
                        <Input
                          value={editUserDDLimit}
                          onChange={(e) => setEditUserDDLimit(e.target.value)}
                          placeholder="e.g. 5 or Unlimited"
                        />
                        <p className="text-xs text-muted-foreground">
                          Role default: {String(roleLimits[editRole as keyof typeof roleLimits]?.ddReports ?? 'N/A')}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground border-t pt-3">
                      Per-user limits override the role-level defaults and are saved locally on this device.
                    </p>
                  </TabsContent>

                  {/* Tab 3: Permissions */}
                  <TabsContent value="permissions" className="max-h-[50vh] overflow-y-auto pr-1">
                    <p className="text-sm text-muted-foreground mb-3">
                      Toggle individual permissions for this user. Changes are saved locally on this device.
                    </p>
                    <div className="space-y-2 border rounded-lg p-3">
                      {editUserPermissions.map((perm, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b last:border-b-0">
                          <div>
                            <p className="font-medium text-sm">{perm.name}</p>
                            <p className="text-xs text-muted-foreground">{perm.description}</p>
                          </div>
                          <Switch
                            checked={perm.enabled}
                            onCheckedChange={(checked) => {
                              setEditUserPermissions(prev =>
                                prev.map((p, idx) => idx === i ? { ...p, enabled: checked } : p)
                              );
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveUserEdit} disabled={isSavingUser || !editRole}>
                {isSavingUser ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" />Save Changes</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-7 w-7 text-primary" />
              </div>
              User Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage users, roles, and permissions for your organization
              <span className="ml-2 text-xs">
                • Last updated: {formatLastRefresh(lastRefresh)}
                {autoRefresh && <span className="text-green-500 ml-1">• Auto-refresh ON</span>}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? 'text-green-600' : 'text-muted-foreground'}
              title={autoRefresh ? 'Auto-refresh is ON (every 30s)' : 'Auto-refresh is OFF'}
            >
              <Clock className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleManualRefresh} disabled={isLoadingUsers}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingUsers ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportUsers}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Dialog open={isInviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Invite New User
                  </DialogTitle>
                  <DialogDescription>
                    Send an invitation email for admin or analyst access
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Email Address</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="colleague@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['admin', 'analyst'] as const).map((role) => {
                        const config = rolePermissions[role];
                        const Icon = config.icon;
                        return (
                          <div
                            key={role}
                            onClick={() => setInviteRole(role)}
                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${inviteRole === role
                              ? `${config.borderColor} ${config.bgColor}`
                              : 'border-border hover:border-muted-foreground/50'
                              }`}
                          >
                            <div className="flex items-center gap-2">
                              <Icon className={`h-4 w-4 ${config.color}`} />
                              <span className="font-medium text-sm">{config.label}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Regular users can sign up directly at the login page
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setInviteDialogOpen(false)} disabled={isInviteLoading}>
                    Cancel
                  </Button>
                  <Button onClick={handleSendInvite} disabled={isInviteLoading || !inviteEmail}>
                    {isInviteLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>
                    ) : (
                      <><Mail className="mr-2 h-4 w-4" />Send Invitation</>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{totalUsers}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-green-600">{activeUsers}</p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-full">
                  <UserCheck className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Admins</p>
                  <p className="text-2xl font-bold text-red-600">{adminCount}</p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-full">
                  <Crown className="h-5 w-5 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Analysts</p>
                  <p className="text-2xl font-bold text-blue-600">{analystCount}</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-full">
                  <Briefcase className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Crown className="h-3 w-3 text-red-500" />
                        Admin
                      </div>
                    </SelectItem>
                    <SelectItem value="analyst">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-3 w-3 text-blue-500" />
                        Analyst
                      </div>
                    </SelectItem>
                    <SelectItem value="user">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-3 w-3 text-gray-500" />
                        User
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        Active
                      </div>
                    </SelectItem>
                    <SelectItem value="inactive">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-3 w-3 text-gray-500" />
                        Inactive
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">User</TableHead>
                    <TableHead className="font-semibold">Role</TableHead>
                    <TableHead className="font-semibold">Permissions</TableHead>
                    <TableHead className="font-semibold">Reports (Used / Limit)</TableHead>
                    <TableHead className="font-semibold">AI Cost</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Last Active</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingUsers ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-48 text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="mt-2 text-muted-foreground">Loading users...</p>
                      </TableCell>
                    </TableRow>
                  ) : users.length > 0 ? (
                    users.map(user => {
                      const roleConfig = rolePermissions[user.role];
                      const RoleIcon = roleConfig.icon;
                      const userCost = getUserCost(user.name);
                      // Per-user limit overrides stored in localStorage take precedence
                      let userLimits = roleLimits[user.role];
                      try {
                        const overrides = JSON.parse(localStorage.getItem('userOverrides') || '{}');
                        const ov = overrides[user.backendId];
                        if (ov) userLimits = { triageReports: ov.triageLimit ?? userLimits.triageReports, ddReports: ov.ddLimit ?? userLimits.ddReports };
                      } catch { /* ignore */ }
                      return (
                        <TableRow key={user.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className={roleConfig.bgColor}>
                                  {user.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${roleConfig.bgColor} ${roleConfig.color}`}>
                              <RoleIcon className="h-3.5 w-3.5" />
                              {roleConfig.label}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {roleConfig.permissions.filter(p => p.enabled).slice(0, 3).map((perm, i) => (
                                <Tooltip key={i}>
                                  <TooltipTrigger>
                                    <Badge variant="outline" className="text-xs">
                                      {perm.name.split(' ')[0]}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="font-medium">{perm.name}</p>
                                    <p className="text-xs text-muted-foreground">{perm.description}</p>
                                  </TooltipContent>
                                </Tooltip>
                              ))}
                              {roleConfig.permissions.filter(p => p.enabled).length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{roleConfig.permissions.filter(p => p.enabled).length - 3}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm space-y-0.5">
                              <div>
                                <span className="text-muted-foreground">Triage: </span>
                                <span className="font-semibold text-primary">{reportUsage[user.backendId.toString()]?.triage ?? 0}</span>
                                <span className="text-muted-foreground"> / {userLimits.triageReports}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">DD: </span>
                                <span className="font-semibold text-primary">{reportUsage[user.backendId.toString()]?.dd ?? 0}</span>
                                <span className="text-muted-foreground"> / {userLimits.ddReports}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {isLoadingCosts ? (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            ) : userCost ? (
                              <Tooltip>
                                <TooltipTrigger>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1">
                                      <DollarSign className="h-3 w-3 text-green-600" />
                                      <span className="font-medium text-green-600">${userCost.cost.toFixed(2)}</span>
                                    </div>
                                    <Progress value={userCost.percentage} className="h-1.5 w-16" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="font-medium">{userCost.percentage.toFixed(1)}% of total AI cost</p>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <span className="text-xs text-muted-foreground">No data</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.status === 'Active' ? 'default' : 'secondary'} className={user.status === 'Active' ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' : ''}>
                              {user.status === 'Active' ? (
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                              ) : (
                                <XCircle className="h-3 w-3 mr-1" />
                              )}
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Clock className="h-3.5 w-3.5" />
                              {user.lastActivity}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleOpenEditUser(user)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit User
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                                  <Key className="mr-2 h-4 w-4" />
                                  Reset Password
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleUserStatus(user)}>
                                  {user.status === 'Active' ? (
                                    <>
                                      <UserX className="mr-2 h-4 w-4" />
                                      Suspend User
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="mr-2 h-4 w-4" />
                                      Activate User
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setDeleteUserId(user.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-48 text-center">
                        <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <h3 className="mt-4 text-lg font-semibold">No users found</h3>
                        <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit Limits Dialog */}
        <Dialog open={isEditLimitsOpen} onOpenChange={setEditLimitsOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Edit Report Limits
              </DialogTitle>
              <DialogDescription>
                Configure the maximum number of reports each role can generate per month.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {(['analyst', 'user'] as const).map((role) => {
                const config = rolePermissions[role];
                const Icon = config.icon;
                return (
                  <div key={role} className={`p-4 rounded-lg border ${config.borderColor} ${config.bgColor}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className={`h-4 w-4 ${config.color}`} />
                      <span className="font-medium">{config.label}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Triage Reports</Label>
                        <Input
                          type="number"
                          min="0"
                          value={editingLimits[role].triageReports}
                          onChange={(e) => setEditingLimits(prev => ({
                            ...prev,
                            [role]: { ...prev[role], triageReports: parseInt(e.target.value) || 0 }
                          }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">DD Reports</Label>
                        <Input
                          type="number"
                          min="0"
                          value={editingLimits[role].ddReports}
                          onChange={(e) => setEditingLimits(prev => ({
                            ...prev,
                            [role]: { ...prev[role], ddReports: parseInt(e.target.value) || 0 }
                          }))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              <p className="text-xs text-muted-foreground">
                Note: Admin role always has unlimited reports.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditLimitsOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveLimits}>
                <Save className="mr-2 h-4 w-4" />
                Save Limits
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Permissions Reference */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Role Permissions Reference
                {isLoadingRoles && <Loader2 className="h-4 w-4 animate-spin" />}
              </CardTitle>
              <CardDescription>
                Overview of permissions granted to each role
              </CardDescription>
            </div>
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => {
                setEditingLimits(roleLimits);
                setEditLimitsOpen(true);
              }}>
                <Settings className="h-4 w-4 mr-2" />
                Edit Limits
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              {Object.entries(rolePermissions).map(([role, config]) => {
                const Icon = config.icon;
                const limits = roleLimits[role as keyof typeof roleLimits];
                return (
                  <div key={role} className={`p-4 rounded-lg border ${config.borderColor} ${config.bgColor} relative`}>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={() => openRoleConfigEditor(role as 'admin' | 'analyst' | 'user')}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    <div className="flex items-center gap-2 mb-4">
                      <Icon className={`h-5 w-5 ${config.color}`} />
                      <h3 className="font-semibold">{config.label}</h3>
                    </div>
                    <div className="space-y-2">
                      {config.permissions.map((perm, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          {perm.enabled ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                          )}
                          <span className={perm.enabled ? '' : 'text-muted-foreground'}>{perm.name}</span>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-3" />
                    <div className="text-sm">
                      <p><span className="text-muted-foreground">Triage Reports:</span> <strong>{limits.triageReports}</strong></p>
                      <p><span className="text-muted-foreground">DD Reports:</span> <strong>{limits.ddReports}</strong></p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Role Configuration Edit Dialog */}
        <Dialog open={isEditRoleConfigOpen} onOpenChange={setEditRoleConfigOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Edit {editingRoleConfig?.label || 'Role'} Configuration
              </DialogTitle>
              <DialogDescription>
                Modify permissions and limits for this role
              </DialogDescription>
            </DialogHeader>
            {editingRoleConfig && (
              <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto">
                {/* Role Label */}
                <div className="space-y-2">
                  <Label>Role Label</Label>
                  <Input
                    value={editingRoleConfig.label}
                    onChange={(e) => setEditingRoleConfig({ ...editingRoleConfig, label: e.target.value })}
                  />
                </div>

                {/* Permissions */}
                <div className="space-y-3">
                  <Label>Permissions</Label>
                  <div className="space-y-2 border rounded-lg p-3">
                    {editingRoleConfig.permissions.map((perm, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div>
                          <p className="font-medium text-sm">{perm.name}</p>
                          <p className="text-xs text-muted-foreground">{perm.description}</p>
                        </div>
                        <Switch
                          checked={perm.enabled}
                          onCheckedChange={() => toggleEditingPermission(i)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Limits */}
                <div className="space-y-3">
                  <Label>Report Limits</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Triage Reports</Label>
                      <Input
                        value={editingRoleConfig.limits.triageReports}
                        onChange={(e) => updateEditingLimit('triageReports', e.target.value)}
                        placeholder="Number or 'Unlimited'"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">DD Reports</Label>
                      <Input
                        value={editingRoleConfig.limits.ddReports}
                        onChange={(e) => updateEditingLimit('ddReports', e.target.value)}
                        placeholder="Number or 'Unlimited'"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter a number or type &quot;Unlimited&quot; for no limit
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditRoleConfigOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveRoleConfig} disabled={isSavingRoleConfig}>
                {isSavingRoleConfig ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
