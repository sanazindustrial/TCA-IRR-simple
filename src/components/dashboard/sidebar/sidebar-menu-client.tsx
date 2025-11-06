
'use client';
import { usePathname, useRouter } from 'next/navigation';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  Settings,
  FileText,
  Activity,
  DatabaseBackup,
  Database,
  Send,
  Upload,
  Bell,
  MessageSquare,
  HelpCircle,
  Cpu,
  BrainCircuit,
  Link as LinkIcon,
  GitBranch,
  LogOut,
  FileCode,
  DollarSign,
  User as UserIcon,
  Eye,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import type { User as AppUser } from '@/lib/users';
import { ThemeToggle } from '@/components/theme-toggle';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';

export function SidebarMenuClient({ isFooter = false }: { isFooter?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const updateUser = () => {
      const storedUser = localStorage.getItem('loggedInUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else if (pathname !== '/login' && pathname !== '/signup' && pathname !== '/forgot-password' && pathname !== '/') {
        router.push('/login');
      }
      setIsLoading(false);
    };

    updateUser();

    // Listen for storage changes to update user info
    window.addEventListener('storage', updateUser);

    return () => {
      window.removeEventListener('storage', updateUser);
    };
  }, [router, pathname]);

  if (isLoading && !isFooter) {
    return null; // Don't render main menu during loading to avoid flicker
  }
  
  if (isFooter && !user) {
    return null; // Don't render footer if no user
  }

  const userRole = user?.role.toLowerCase() || 'user';
  const isPrivilegedUser = userRole === 'admin' || userRole === 'reviewer';
  
  if (isFooter) {
    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton href="/dashboard/help" isActive={pathname === '/dashboard/help'} tooltip="Help & Support">
                    <HelpCircle />
                    <span>Help & Support</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start gap-2 px-2">
                     <Avatar className="size-6">
                        <AvatarImage src={user?.avatar || "https://images.unsplash.com/photo-1513279922550-250c2ce8a813?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1080&fit=max&ixid=eyJhcHBfaWQiOjM3NDE5OH0"} />
                        <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sidebar-foreground text-sm group-data-[collapsible=icon]:hidden">{user?.name || 'Current User'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start">
                    <DropdownMenuItem asChild>
                       <Link href="/dashboard/profile"><UserIcon className="mr-2"/> Profile</Link>
                    </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                       <Link href="/dashboard/settings"><Settings className="mr-2"/> Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <div className='px-2 py-1.5 text-sm'>
                       <div className='w-full flex justify-between items-center'>
                           <span>Theme</span>
                           <ThemeToggle />
                        </div>
                    </div>
                </DropdownMenuContent>
               </DropdownMenu>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton href="/logout" tooltip="Logout">
                <LogOut />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
    );
  }

  return (
    <SidebarContent>
        <SidebarMenu>
             <SidebarMenuItem>
                <SidebarMenuButton href="/dashboard" isActive={pathname === '/dashboard'} tooltip="Dashboard">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton href="/dashboard/evaluation" isActive={pathname === '/dashboard/evaluation'} tooltip="New Evaluation">
                    <Upload />
                    <span>New Evaluation</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton href="/dashboard/reports" isActive={pathname === '/dashboard/reports'} tooltip="Reports">
                    <FileText />
                    <span>Reports</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
          
        <SidebarSeparator />

        <SidebarGroup>
        <SidebarGroupLabel>User Tools</SidebarGroupLabel>
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton href="/dashboard/request" isActive={pathname === '/dashboard/request'} tooltip="Submit Request">
                    <Send />
                    <span>Submit Request</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton href="/dashboard/my-requests" isActive={pathname === '/dashboard/my-requests'} tooltip="My Requests">
                    <Eye />
                    <span>My Requests</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
        </SidebarGroup>
        
        {isPrivilegedUser && (
            <>
            <SidebarGroup>
                <SidebarGroupLabel>Reviewer Tools</SidebarGroupLabel>
                    <SidebarMenu>
                        <SidebarMenuItem>
                        <SidebarMenuButton href="/dashboard/reviewer" isActive={pathname === '/dashboard/reviewer'} tooltip="Reviewer Hub">
                            <Bell />
                            <span>Reviewer Hub</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton href="/analysis/modules/reviewer" isActive={pathname === '/analysis/modules/reviewer'} tooltip="Reviewer Analysis">
                            <MessageSquare />
                            <span>Reviewer Analysis</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup>
                <SidebarGroupLabel>Administration</SidebarGroupLabel>
                <SidebarMenu>
                        <SidebarMenuItem>
                        <SidebarMenuButton href="/dashboard/users" isActive={pathname === '/dashboard/users'} tooltip="User Management">
                            <Users />
                            <span>User Management</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                        <SidebarMenuItem>
                        <SidebarMenuButton href="/dashboard/user-requests" isActive={pathname === '/dashboard/user-requests'} tooltip="User Requests">
                            <MessageSquare />
                            <span>User Requests</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                        <SidebarMenuItem>
                        <SidebarMenuButton href="/dashboard/system-health" isActive={pathname === '/dashboard/system-health'} tooltip="System Health">
                            <Activity />
                            <span>System Health</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton href="/dashboard/ai-training" isActive={pathname === '/dashboard/ai-training'} tooltip="AI Training">
                            <BrainCircuit />
                            <span>AI Training</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                        <SidebarMenuItem>
                        <SidebarMenuButton href="/dashboard/backup" isActive={pathname === '/dashboard/backup'} tooltip="Backup & Recovery">
                            <DatabaseBackup />
                            <span>Backup & Recovery</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                        <SidebarMenuItem>
                        <SidebarMenuButton href="/data-sources" isActive={pathname === '/data-sources'} tooltip="External Links">
                            <LinkIcon />
                            <span>External Links</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                        <SidebarMenuItem>
                        <SidebarMenuButton href="/dashboard/cost" isActive={pathname === '/dashboard/cost'} tooltip="Cost Management">
                            <DollarSign />
                            <span>Cost Management</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                        <SidebarMenuItem>
                        <SidebarMenuButton href="/dashboard/database" isActive={pathname === '/dashboard/database'} tooltip="Database Mining">
                            <Database />
                            <span>Database Mining</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                            <SidebarMenuButton href="/dashboard/database-integration" isActive={pathname === '/dashboard/database-integration'} tooltip="Database Integration">
                            <GitBranch />
                            <span>Database Integration</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                        <SidebarMenuItem>
                        <SidebarMenuButton href="/dashboard/remote" isActive={pathname === '/dashboard/remote'} tooltip="Remote Integration">
                            <GitBranch />
                            <span>Remote Integration</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                        <SidebarMenuItem>
                        <SidebarMenuButton href="/dashboard/system-config" isActive={pathname === '/dashboard/system-config'} tooltip="System Config">
                            <Settings />
                            <span>System Config</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton href="/dashboard/schema" isActive={pathname === '/dashboard/schema'} tooltip="Schema & Models">
                            <FileCode />
                            <span>Schema & Models</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton href="/dashboard/reports/configure" isActive={pathname === '/dashboard/reports/configure'} tooltip="Report Configuration">
                            <FileText />
                            <span>Report Configuration</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton href="/dashboard/evaluation/modules" isActive={pathname.startsWith('/analysis/modules')} tooltip="Complete Admin Config">
                            <Settings />
                            <span>Module Control Deck</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>
            </>
        )}
    </SidebarContent>
  );
}
