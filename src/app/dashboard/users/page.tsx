
'use client';
import { useState, useEffect } from 'react';
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
  UserPlus
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

// User interface with proper types
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  triageReports: number | 'Unlimited';
  ddReports: number | 'Unlimited';
  permissions: string;
  status: string;
  lastActivity: string;
  cost: { ytd: number; mtd: number };
  avatarId: string;
}

const initialUsers: User[] = [
  {
    id: 'usr_4',
    name: 'Admin User',
    email: 'admin@tca.com',
    role: 'Admin',
    triageReports: 'Unlimited',
    ddReports: 'Unlimited',
    permissions: 'Full system administration',
    status: 'Active',
    lastActivity: '5 minutes ago',
    cost: { ytd: 0.00, mtd: 0.00 },
    avatarId: 'avatar1'
  },
  {
    id: 'usr_5',
    name: 'Analyst User',
    email: 'analyst@tca.com',
    role: 'analyst',
    triageReports: 25,
    ddReports: 5,
    permissions: 'Review and analysis functions',
    status: 'Active',
    lastActivity: '30 minutes ago',
    cost: { ytd: 0.00, mtd: 0.00 },
    avatarId: 'avatar2'
  },
  {
    id: 'usr_6',
    name: 'Standard User',
    email: 'user@tca.com',
    role: 'User',
    triageReports: 10,
    ddReports: 0,
    permissions: 'Basic user functionality',
    status: 'Active',
    lastActivity: '1 hour ago',
    cost: { ytd: 0.00, mtd: 0.00 },
    avatarId: 'avatar3'
  },
  {
    id: 'usr_1',
    name: 'Admin User',
    email: 'admin@startupcompass.ai',
    role: 'Admin',
    triageReports: 'Unlimited',
    ddReports: 'Unlimited',
    permissions: 'All',
    status: 'Active',
    lastActivity: '2 hours ago',
    cost: { ytd: 125.50, mtd: 45.20 },
    avatarId: 'avatar1'
  },
  {
    id: 'usr_2',
    name: 'Analyst One',
    email: 'Analyst1@startupcompass.ai',
    role: 'analyst',
    triageReports: 10,
    ddReports: 2,
    permissions: 'View, Edit',
    status: 'Active',
    lastActivity: '1 day ago',
    cost: { ytd: 87.00, mtd: 12.75 },
    avatarId: 'avatar2'
  },
  {
    id: 'usr_7',
    name: 'AI Adopter',
    email: 'adopter@startupcompass.ai',
    role: 'AI Adopter',
    triageReports: 15,
    ddReports: 1,
    permissions: 'AI module interaction',
    status: 'Active',
    lastActivity: '3 hours ago',
    cost: { ytd: 42.00, mtd: 5.50 },
    avatarId: 'avatar3'
  },
  {
    id: 'usr_3',
    name: 'Standard User',
    email: 'user@startupcompass.ai',
    role: 'User',
    triageReports: 5,
    ddReports: 0,
    permissions: 'View Only',
    status: 'Inactive',
    lastActivity: '3 weeks ago',
    cost: { ytd: 25.00, mtd: 0.00 },
    avatarId: 'avatar3'
  },
];


export default function UserManagementPage() {
  const [users, setUsers] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('User');
  const [isInviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [isInviteLoading, setInviteLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  // Load users from backend on mount
  useEffect(() => {
    const loadBackendUsers = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://tcairrapiccontainer.azurewebsites.net';
        const token = localStorage.getItem('authToken');

        const response = await fetch(`${backendUrl}/api/v1/users`, {
          headers: {
            'Accept': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
        });

        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const backendUsers = await response.json();

            if (Array.isArray(backendUsers) && backendUsers.length > 0) {
              // Merge backend users with initial users, avoiding duplicates
              const mergedUsers = [...initialUsers];
              backendUsers.forEach((bu: { id?: string; email: string; name?: string; role?: string; status?: string }) => {
                const exists = mergedUsers.some(u => u.email.toLowerCase() === bu.email.toLowerCase());
                if (!exists) {
                  mergedUsers.push({
                    id: bu.id || `usr_${Date.now()}`,
                    name: bu.name || bu.email.split('@')[0],
                    email: bu.email,
                    role: bu.role || 'User',
                    triageReports: bu.role === 'admin' ? 'Unlimited' : 10,
                    ddReports: bu.role === 'admin' ? 'Unlimited' : 2,
                    permissions: bu.role === 'admin' ? 'Full system administration' : 'Standard',
                    status: bu.status || 'Active',
                    lastActivity: 'Recently',
                    cost: { ytd: 0, mtd: 0 },
                    avatarId: 'avatar1',
                  });
                }
              });
              setUsers(mergedUsers);
            }
          }
        }
      } catch (error) {
        console.warn('Could not load users from backend:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    loadBackendUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePermissionChange = (userId: string, newPermissions: string) => {
    setUsers(currentUsers =>
      currentUsers.map(user =>
        user.id === userId ? { ...user, permissions: newPermissions } : user
      )
    );
  };

  const handleReportChange = (userId: string, type: 'triage' | 'dd', value: string | number) => {
    setUsers(currentUsers =>
      currentUsers.map(user => {
        if (user.id === userId) {
          const strValue = String(value).trim();
          const isUnlimited = strValue.toLowerCase() === 'unlimited';
          const numericValue = parseInt(strValue, 10);
          const newValue: number | 'Unlimited' = isUnlimited ? 'Unlimited' : (isNaN(numericValue) ? (typeof user.triageReports === 'number' ? user.triageReports : 0) : numericValue);

          if (type === 'triage') {
            return { ...user, triageReports: newValue };
          } else {
            const ddValue: number | 'Unlimited' = isUnlimited ? 'Unlimited' : (isNaN(numericValue) ? (typeof user.ddReports === 'number' ? user.ddReports : 0) : numericValue);
            return { ...user, ddReports: ddValue };
          }
        }
        return user;
      })
    );
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

    // Ensure current user is logged in
    if (!currentUser?.email) {
      toast({
        variant: 'destructive',
        title: 'Not Authenticated',
        description: 'You must be logged in to invite users.',
      });
      return;
    }

    setInviteLoading(true);
    try {
      // Use Next.js API route to avoid CSRF issues
      const response = await fetch('/api/users/invite', {
        method: 'POST',
        credentials: 'include', // Include cookies for session
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole.toLowerCase(),
          invited_by_email: currentUser.email, // Include inviter's email for backend
        }),
      });

      // Safe response handling - parse text first, then try JSON
      const responseText = await response.text();
      let userData;

      try {
        userData = JSON.parse(responseText);
      } catch {
        // Non-JSON response - log and create locally
        console.warn('Non-JSON response from invite API:', responseText);
        userData = {
          id: `usr_${Date.now()}`,
          email: inviteEmail,
          role: inviteRole,
          status: 'pending',
          local: true,
          message: responseText,
        };
      }

      if (!response.ok) {
        throw new Error(userData.message || userData.detail || 'Failed to send invitation');
      }

      // Add new user to the list
      setUsers(currentUsers => [
        ...currentUsers,
        {
          id: userData.id || `usr_${Date.now()}`,
          name: userData.name || inviteEmail.split('@')[0],
          email: inviteEmail,
          role: inviteRole,
          triageReports: inviteRole === 'Admin' ? 'Unlimited' : 10,
          ddReports: inviteRole === 'Admin' ? 'Unlimited' : 2,
          permissions: inviteRole === 'Admin' ? 'Full system administration' : 'Standard',
          status: userData.local ? 'Pending (Local)' : 'Active',
          lastActivity: 'Just now',
          cost: { ytd: 0, mtd: 0 },
          avatarId: 'avatar1',
        } as User,
      ]);

      toast({
        title: userData.local ? 'User Created Locally' : 'User Created',
        description: userData.local
          ? `${inviteEmail} added locally. Backend sync pending.`
          : `${inviteEmail} has been registered as ${inviteRole}.`,
      });
      setInviteDialogOpen(false);
      setInviteEmail('');
      setInviteRole('User');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Invitation Failed',
        description: error instanceof Error ? error.message : 'Failed to send invitation. Please try again.',
      });
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <Users className="size-6 text-primary" />
          <h1 className="text-2xl font-semibold">User Management</h1>
          <Badge variant="outline">{filteredUsers.length} Total Users</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Upload className="mr-2" /> Export Users
          </Button>
          <Dialog open={isInviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2" /> Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite New User</DialogTitle>
                <DialogDescription>Send an email invitation to a new user and assign them a role.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email Address</Label>
                  <Input id="invite-email" name="email" type="email" placeholder="new.user@example.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-role">Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole} name="role">
                    <SelectTrigger id="invite-role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Analyst">Analyst</SelectItem>
                      <SelectItem value="User">User</SelectItem>
                      <SelectItem value="AI Adopter">AI Adopter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteDialogOpen(false)} disabled={isInviteLoading}>Cancel</Button>
                <Button onClick={handleSendInvite} disabled={isInviteLoading}>
                  {isInviteLoading ? 'Sending...' : 'Send Invitation'}
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
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="Analyst">Analyst</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="ai-adopter">AI Adopter</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
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
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => {
                  const avatar = PlaceHolderImages.find(p => p.id === user.avatarId);
                  const roleVariant = user.role === 'Admin'
                    ? 'destructive'
                    : user.role === 'analyst'
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
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
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
                        <Input
                          value={user.triageReports}
                          onChange={(e) => handleReportChange(user.id, 'triage', e.target.value)}
                          className="h-8 w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={user.ddReports}
                          onChange={(e) => handleReportChange(user.id, 'dd', e.target.value)}
                          className="h-8 w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={user.permissions}
                          onChange={(e) => handlePermissionChange(user.id, e.target.value)}
                          className="h-8"
                        />
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
                            <DropdownMenuItem>Edit User</DropdownMenuItem>
                            <DropdownMenuItem>View Costs</DropdownMenuItem>
                            <DropdownMenuItem>Reset Password</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Suspend User
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


