
'use client';
import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
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
  Upload,
  Users,
  UserPlus,
  Trash2,
  RefreshCw,
  Loader2
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
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

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
  triage_report_limit: number | null;
  dd_report_limit: number | null;
}

// User interface for UI display
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  triageReports: number | 'Unlimited';
  ddReports: number | 'Unlimited';
  triageLimitCustom: number | null;
  ddLimitCustom: number | null;
  permissions: string;
  status: string;
  lastActivity: string;
  cost: { ytd: number; mtd: number };
  avatarId: string;
  backendId?: number; // Store backend ID for API calls
}

function getRoleConfig(role: string) {
  const normalizedRole = (role || 'user').toLowerCase();

  switch (normalizedRole) {
    case 'admin':
      return {
        display: 'Admin',
        triageReports: 'Unlimited' as const,
        ddReports: 'Unlimited' as const,
        permissions: 'Full system administration',
        avatarId: 'avatar1',
      };
    case 'analyst':
      return {
        display: 'Analyst',
        triageReports: 25,
        ddReports: 5,
        permissions: 'Review and analysis functions',
        avatarId: 'avatar2',
      };
    default:
      return {
        display: 'User',
        triageReports: 10,
        ddReports: 2,
        permissions: 'Basic user functionality',
        avatarId: 'avatar3',
      };
  }
}

// Convert backend user to UI user format
function mapBackendUser(bu: BackendUser): User {
  const roleConfig = getRoleConfig(bu.role);
  // Use per-user custom limit when set, otherwise fall back to role default
  const triageReports = bu.triage_report_limit != null ? bu.triage_report_limit : roleConfig.triageReports;
  const ddReports = bu.dd_report_limit != null ? bu.dd_report_limit : roleConfig.ddReports;
  return {
    id: `usr_${bu.id}`,
    backendId: bu.id,
    name: bu.full_name || bu.username,
    email: bu.email,
    role: roleConfig.display,
    triageReports,
    ddReports,
    triageLimitCustom: bu.triage_report_limit ?? null,
    ddLimitCustom: bu.dd_report_limit ?? null,
    permissions: roleConfig.permissions,
    status: bu.is_active ? 'Active' : 'Inactive',
    lastActivity: bu.updated_at ? formatTimeAgo(new Date(bu.updated_at)) : formatTimeAgo(new Date(bu.created_at)),
    cost: { ytd: 0, mtd: 0 },
    avatarId: roleConfig.avatarId,
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
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
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
  const [inviteRole, setInviteRole] = useState('analyst');
  const [isInviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [isInviteLoading, setInviteLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCostDialogOpen, setIsCostDialogOpen] = useState(false);
  const [editRole, setEditRole] = useState('user');
  const [editStatus, setEditStatus] = useState('active');
  const [editTriageLimit, setEditTriageLimit] = useState<string>('');
  const [editDdLimit, setEditDdLimit] = useState<string>('');
  const [isSavingUser, setIsSavingUser] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  // Get auth token
  const getAuthToken = () => localStorage.getItem('authToken');
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://tcairrapiccontainer.azurewebsites.net';

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
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`${backendUrl}/api/v1/users/?${params.toString()}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const usersList = data.items || data.users || [];
        const mappedUsers = Array.isArray(usersList) ? usersList.map(mapBackendUser) : [];

        let enrichedUsers = mappedUsers;
        try {
          const costResponse = await fetch(`${backendUrl}/api/v1/cost/summary`, {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });

          if (costResponse.ok) {
            const costData = await costResponse.json();
            const costEntries = Array.isArray(costData?.aiBreakdown?.costByUser) ? costData.aiBreakdown.costByUser : [];
            const costMap = new Map<string, number>(
              costEntries.map((entry: any) => [String(entry.name).toLowerCase(), Number(entry.cost || 0)])
            );

            enrichedUsers = mappedUsers.map((user): User => {
              const nameKey = user.name.toLowerCase();
              const emailKey = user.email.split('@')[0].toLowerCase();
              const matchedCost = Number(costMap.get(nameKey) ?? costMap.get(emailKey) ?? 0);
              const safeCost = Number.isFinite(matchedCost) ? matchedCost : 0;

              return {
                ...user,
                cost: {
                  mtd: safeCost,
                  ytd: safeCost,
                },
              };
            });
          }
        } catch (costError) {
          console.warn('Unable to load dynamic cost data:', costError);
        }

        setUsers(enrichedUsers);
        setTotalUsers(data.total ?? data.pagination?.total ?? enrichedUsers.length);
      } else if (response.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('loggedInUser');
        localStorage.removeItem('currentUser');
        window.location.href = '/login';
        return;
      } else if (response.status === 403) {
        toast({
          variant: 'destructive',
          title: 'Access Denied',
          description: 'Only admins can view the user list.',
        });
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

  // Use users directly since search is now server-side
  const filteredUsers = users;

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditRole(user.role.toLowerCase());
    setEditStatus(user.status === 'Active' ? 'active' : 'inactive');
    setEditTriageLimit(user.triageLimitCustom != null ? String(user.triageLimitCustom) : '');
    setEditDdLimit(user.ddLimitCustom != null ? String(user.ddLimitCustom) : '');
    setIsEditDialogOpen(true);
  };

  const openCostDialog = (user: User) => {
    setSelectedUser(user);
    setIsCostDialogOpen(true);
  };

  const handleSendInvite = async () => {
    if (!inviteEmail || !inviteRole) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide a valid email and select a role.',
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

    // Validate role for invite endpoint (only admin/analyst)
    const role = inviteRole.toLowerCase();
    if (role !== 'admin' && role !== 'analyst') {
      toast({
        variant: 'destructive',
        title: 'Invalid Role',
        description: 'Only admin and analyst users can be invited. Regular users must sign up.',
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
          role: role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to invite user');
      }

      if (data.email_sent === false && data.invite_token) {
        // Email failed — show copyable invite link
        const inviteUrl = `${window.location.origin}/accept-invite?token=${data.invite_token}`;
        toast({
          title: 'Invite Created (Email Failed)',
          description: `Email could not be sent. Share this link manually: ${inviteUrl}`,
          duration: 15000,
        });
        // Also copy to clipboard silently
        try { await navigator.clipboard.writeText(inviteUrl); } catch {}
      } else {
        toast({
          title: 'Invitation Sent',
          description: `An invitation email has been sent to ${inviteEmail}. They will receive a link to create their account.`,
        });
      }
      setInviteDialogOpen(false);
      setInviteEmail('');
      setInviteRole('analyst');
      // Reload users after invite
      loadUsers();
    } catch (error) {
      console.error('Invite error:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Send Invitation',
        description: error instanceof Error ? error.message : 'Failed to send invitation. Please try again.',
      });
    } finally {
      setInviteLoading(false);
    }
  };

  // Delete user handler
  const handleDeleteUser = async (user: User) => {
    if (!user.backendId) {
      toast({
        variant: 'destructive',
        title: 'Cannot Delete',
        description: 'User ID not found.',
      });
      return;
    }

    const token = getAuthToken();
    if (!token) {
      toast({
        variant: 'destructive',
        title: 'Not Authenticated',
        description: 'You must be logged in to delete users.',
      });
      return;
    }

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
        title: 'User Deleted',
        description: `${user.email} has been removed.`,
      });
      setDeleteUserId(null);
      // Reload users after delete
      loadUsers();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Delete User',
        description: error instanceof Error ? error.message : 'Failed to delete user.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Suspend/Activate user handler
  const handleToggleUserStatus = async (user: User) => {
    if (!user.backendId) return;

    const token = getAuthToken();
    if (!token) {
      toast({ variant: 'destructive', title: 'Not Authenticated', description: 'Please log in.' });
      return;
    }

    const nextIsActive = user.status !== 'Active';
    try {
      const response = await fetch(`${backendUrl}/api/v1/users/${user.backendId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: nextIsActive }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || `Failed to update user status`);
      }

      toast({ title: 'User Updated', description: `${user.email} has been ${nextIsActive ? 'activated' : 'suspended'}.` });
      loadUsers();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'Failed to update user status.' });
    }
  };

  // Reset password handler
  const handleResetPassword = async (user: User) => {
    const token = getAuthToken();
    if (!token) {
      toast({ variant: 'destructive', title: 'Not Authenticated', description: 'Please log in.' });
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to send reset password email');
      }

      toast({ title: 'Reset Email Sent', description: data.message || `Password reset instructions sent to ${user.email}.` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'Failed to reset password.' });
    }
  };

  // Export users handler
  const handleExportUsers = async () => {
    const token = getAuthToken();
    if (!token) {
      toast({ variant: 'destructive', title: 'Not Authenticated', description: 'Please log in.' });
      return;
    }

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

      toast({ title: 'Export Complete', description: 'Users exported successfully.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Export Failed', description: error instanceof Error ? error.message : 'Failed to export users.' });
    }
  };

  // Edit user handler (update role/status)
  const handleEditUser = async (user: User, updates: { role?: string; is_active?: boolean; triage_report_limit?: number; dd_report_limit?: number }) => {
    if (!user.backendId) return;

    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${backendUrl}/api/v1/users/${user.backendId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || 'Failed to update user');

      toast({ title: 'User Updated', description: 'Role and permission settings updated successfully.' });
      loadUsers();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'Failed to update user.' });
    }
  };

  const handleSaveUserEdits = async () => {
    if (!selectedUser) return;

    setIsSavingUser(true);
    try {
      await handleEditUser(selectedUser, {
        role: editRole,
        is_active: editStatus === 'active',
        triage_report_limit: editTriageLimit !== '' ? (parseInt(editTriageLimit) || 0) : 0,
        dd_report_limit: editDdLimit !== '' ? (parseInt(editDdLimit) || 0) : 0,
      });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    } finally {
      setIsSavingUser(false);
    }
  };

  // Get user to delete
  const userToDelete = deleteUserId ? users.find(u => u.id === deleteUserId) : null;

  return (
    <div className="container mx-auto p-4 md:p-8">
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{userToDelete?.email}</strong>? This action cannot be undone.
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
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update the selected user's role and access status. Permissions and report limits update automatically.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>User</Label>
                <Input value={`${selectedUser.name} (${selectedUser.email})`} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="analyst">Analyst</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Triage Report Limit</Label>
                <Input
                  type="number"
                  placeholder={`Leave empty for role default (${getRoleConfig(editRole).triageReports})`}
                  value={editTriageLimit}
                  onChange={(e) => setEditTriageLimit(e.target.value)}
                  min={0}
                />
                <p className="text-xs text-muted-foreground">Role default: {getRoleConfig(editRole).triageReports}. Leave empty or set 0 to use the role default.</p>
              </div>
              <div className="space-y-2">
                <Label>DD Report Limit</Label>
                <Input
                  type="number"
                  placeholder={`Leave empty for role default (${getRoleConfig(editRole).ddReports})`}
                  value={editDdLimit}
                  onChange={(e) => setEditDdLimit(e.target.value)}
                  min={0}
                />
                <p className="text-xs text-muted-foreground">Role default: {getRoleConfig(editRole).ddReports}. Leave empty or set 0 to use the role default.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSavingUser}>Cancel</Button>
            <Button onClick={handleSaveUserEdits} disabled={isSavingUser}>
              {isSavingUser ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCostDialogOpen} onOpenChange={setIsCostDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Cost Summary</DialogTitle>
            <DialogDescription>
              Current dynamic cost usage for the selected user.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-3 py-2 text-sm">
              <p><strong>User:</strong> {selectedUser.name}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Role:</strong> {selectedUser.role}</p>
              <p><strong>Month to Date:</strong> ${selectedUser.cost.mtd.toFixed(2)}</p>
              <p><strong>Year to Date:</strong> ${selectedUser.cost.ytd.toFixed(2)}</p>
              <p><strong>Permissions:</strong> {selectedUser.permissions}</p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsCostDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <Users className="size-6 text-primary" />
          <h1 className="text-2xl font-semibold">User Management</h1>
          <Badge variant="outline">{totalUsers} Total Users</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadUsers} disabled={isLoadingUsers}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingUsers ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button variant="outline" onClick={handleExportUsers}>
            <Upload className="mr-2" /> Export Users
          </Button>
          <Dialog open={isInviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2" /> Invite User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite New User</DialogTitle>
                <DialogDescription>
                  Send an invitation email for admin or analyst access. The user will receive a link to create their account with a secure password.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email Address</Label>
                  <Input id="invite-email" name="email" type="email" placeholder="user@example.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-role">Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole} name="role">
                    <SelectTrigger id="invite-role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="analyst">Analyst</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Regular users can sign up directly at /signup</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteDialogOpen(false)} disabled={isInviteLoading}>Cancel</Button>
                <Button onClick={handleSendInvite} disabled={isInviteLoading}>
                  {isInviteLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : 'Send Invitation'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users by name, email, or department..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="analyst">Analyst</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Triage Reports</TableHead>
                <TableHead>DD Reports</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Cost (MTD/YTD)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingUsers ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-48 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-12 w-12 animate-spin" />
                    <p className="mt-4">Loading users...</p>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map(user => {
                  const avatar = PlaceHolderImages.find(p => p.id === user.avatarId);
                  const roleVariant = user.role.toLowerCase() === 'admin'
                    ? 'destructive'
                    : user.role.toLowerCase() === 'analyst'
                      ? 'warning'
                      : user.role === 'AI Adopter'
                        ? 'default'
                        : 'secondary';
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className='size-8'>
                            <AvatarImage src={avatar?.imageUrl} alt={user.name} data-ai-hint={avatar?.imageHint} />
                            <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={roleVariant}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{user.triageReports}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{user.ddReports}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{user.permissions}</span>
                      </TableCell>
                      <TableCell>
                        <p>${user.cost.mtd.toFixed(2)} / ${user.cost.ytd.toFixed(2)}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'Active' ? 'success' : 'secondary'}>{user.status}</Badge>
                      </TableCell>
                      <TableCell>{user.lastActivity}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); openEditDialog(user); }}>Edit User</DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); openCostDialog(user); }}>View Costs</DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleResetPassword(user); }}>Reset Password</DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleToggleUserStatus(user); }}>
                              {user.status === 'Active' ? 'Suspend User' : 'Activate User'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              disabled={currentUser?.email === user.email}
                              onSelect={(e) => { e.preventDefault(); setDeleteUserId(user.id); }}
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
                  <TableCell colSpan={9} className="h-48 text-center text-muted-foreground">
                    <Users className="mx-auto h-12 w-12" />
                    <h3 className="mt-4 text-lg font-semibold">No users found</h3>
                    <p>Try adjusting your search or filter criteria.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


