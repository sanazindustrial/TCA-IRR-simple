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

// Permission definitions for each role
const ROLE_PERMISSIONS = {
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
    limits: { triageReports: 'Unlimited', ddReports: 'Unlimited' },
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
    limits: { triageReports: 25, ddReports: 5 },
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
    limits: { triageReports: 10, ddReports: 2 },
  },
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
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

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
  const formatLastRefresh = (date: Date) => {
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
  const handleChangeRole = async (user: User, newRole: string) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${backendUrl}/api/v1/users/${user.backendId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to change role');
      }

      toast({
        title: '👤 Role Updated',
        description: `${user.name}'s role has been changed to ${newRole}.`
      });
      setEditDialogOpen(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to change role.'
      });
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

        {/* Edit Role Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                Change User Role
              </DialogTitle>
              <DialogDescription>
                Update the role for <strong>{selectedUser?.name}</strong>. This will change their permissions immediately.
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-6 py-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className={ROLE_PERMISSIONS[selectedUser.role].bgColor}>
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedUser.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Select New Role</Label>
                  <div className="grid gap-3">
                    {Object.entries(ROLE_PERMISSIONS).map(([role, config]) => {
                      const Icon = config.icon;
                      return (
                        <div
                          key={role}
                          onClick={() => setEditRole(role)}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${editRole === role
                              ? `${config.borderColor} ${config.bgColor}`
                              : 'border-border hover:border-muted-foreground/50'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${config.bgColor}`}>
                              <Icon className={`h-5 w-5 ${config.color}`} />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{config.label}</p>
                              <p className="text-xs text-muted-foreground">
                                {role === 'admin' && 'Full system access'}
                                {role === 'analyst' && 'Analysis and reporting access'}
                                {role === 'user' && 'Basic access only'}
                              </p>
                            </div>
                            {editRole === role && (
                              <CheckCircle2 className={`h-5 w-5 ${config.color}`} />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={() => selectedUser && handleChangeRole(selectedUser, editRole)}
                disabled={!editRole || editRole === selectedUser?.role}
              >
                Save Changes
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
                        const config = ROLE_PERMISSIONS[role];
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
                    <TableHead className="font-semibold">Report Limits</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Last Active</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingUsers ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-48 text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="mt-2 text-muted-foreground">Loading users...</p>
                      </TableCell>
                    </TableRow>
                  ) : users.length > 0 ? (
                    users.map(user => {
                      const roleConfig = ROLE_PERMISSIONS[user.role];
                      const RoleIcon = roleConfig.icon;
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
                            <div className="text-sm">
                              <span className="text-muted-foreground">Triage:</span>{' '}
                              <span className="font-medium">{roleConfig.limits.triageReports}</span>
                              <br />
                              <span className="text-muted-foreground">DD:</span>{' '}
                              <span className="font-medium">{roleConfig.limits.ddReports}</span>
                            </div>
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
                                <DropdownMenuItem onClick={() => {
                                  setSelectedUser(user);
                                  setEditRole(user.role);
                                  setEditDialogOpen(true);
                                }}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Change Role
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
                      <TableCell colSpan={7} className="h-48 text-center">
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

        {/* Permissions Reference */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Role Permissions Reference
            </CardTitle>
            <CardDescription>
              Overview of permissions granted to each role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              {Object.entries(ROLE_PERMISSIONS).map(([role, config]) => {
                const Icon = config.icon;
                return (
                  <div key={role} className={`p-4 rounded-lg border ${config.borderColor} ${config.bgColor}`}>
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
                      <p><span className="text-muted-foreground">Triage Reports:</span> <strong>{config.limits.triageReports}</strong></p>
                      <p><span className="text-muted-foreground">DD Reports:</span> <strong>{config.limits.ddReports}</strong></p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
