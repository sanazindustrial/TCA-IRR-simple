
'use client';
import { useState } from 'react';
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

const initialUsers = [
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
    name: 'Reviewer User',
    email: 'reviewer@tca.com',
    role: 'Reviewer',
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
    name: 'Reviewer One',
    email: 'reviewer1@startupcompass.ai',
    role: 'Reviewer',
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
  const { toast } = useToast();

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
                  const isUnlimited = typeof value === 'string' && value.toLowerCase() === 'unlimited';
                  const numericValue = typeof value === 'string' ? parseInt(value, 10) : value;

                  if (type === 'triage') {
                      return { ...user, triageReports: isUnlimited ? 'Unlimited' : (isNaN(numericValue) ? user.triageReports : numericValue) };
                  } else {
                      return { ...user, ddReports: isUnlimited ? 'Unlimited' : (isNaN(numericValue) ? user.ddReports : numericValue) };
                  }
              }
              return user;
          })
      );
  };
  
  const handleSendInvite = () => {
    if (inviteEmail && inviteRole) {
      toast({
        title: 'Invitation Sent',
        description: `An invitation has been sent to ${inviteEmail} for the ${inviteRole} role.`,
      });
      setInviteDialogOpen(false);
      setInviteEmail('');
      setInviteRole('User');
    } else {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide a valid email and select a role.',
      });
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
                        <Input id="invite-email" type="email" placeholder="new.user@example.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="invite-role">Role</Label>
                         <Select value={inviteRole} onValueChange={setInviteRole}>
                            <SelectTrigger id="invite-role">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Admin">Admin</SelectItem>
                                <SelectItem value="Reviewer">Reviewer</SelectItem>
                                <SelectItem value="User">User</SelectItem>
                                <SelectItem value="AI Adopter">AI Adopter</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSendInvite}>Send Invitation</Button>
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
                <SelectItem value="reviewer">Reviewer</SelectItem>
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
                    : user.role === 'Reviewer' 
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
