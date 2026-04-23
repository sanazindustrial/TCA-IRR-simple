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
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
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
    BrainCircuit,
    Link as LinkIcon,
    GitBranch,
    LogOut,
    FileCode,
    DollarSign,
    User as UserIcon,
    Eye,
    ChevronDown,
    Layers,
    BarChart3,
    Shield,
    TrendingUp,
    Users2,
    Target,
    Calculator,
    Gauge,
    Lightbulb,
    Megaphone,
    Leaf,
    Building2,
    Compass,
    Globe,
    FileSearch,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
    const [modulesOpen, setModulesOpen] = useState(pathname.startsWith('/analysis/modules'));
    const [reportsOpen, setReportsOpen] = useState(pathname.startsWith('/dashboard/reports'));

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
    const isPrivilegedUser = userRole === 'admin' || userRole === 'analyst';
    const isAdmin = userRole === 'admin';

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
                                <Link href="/dashboard/profile"><UserIcon className="mr-2" /> Profile</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/settings"><Settings className="mr-2" /> Settings</Link>
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
                    <SidebarMenuButton href="/dashboard/reports/triage" isActive={pathname === '/dashboard/reports/triage' || pathname === '/dashboard/evaluation'} tooltip="Company Analysis">
                        <Upload />
                        <span>Company Analysis</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <Collapsible open={reportsOpen} onOpenChange={setReportsOpen} className="group/collapsible">
                    <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                            <SidebarMenuButton tooltip="Report Generation" isActive={pathname.startsWith('/dashboard/reports')}>
                                <FileText />
                                <span>Report Generation</span>
                                <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <SidebarMenuSub>
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton href="/dashboard/reports" isActive={pathname === '/dashboard/reports'}>
                                        <FileText className="size-4" />
                                        <span>All Reports</span>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton href="/dashboard/reports/triage" isActive={pathname === '/dashboard/reports/triage'}>
                                        <Activity className="size-4" />
                                        <span>Triage Report</span>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                                {isPrivilegedUser && (
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton href="/dashboard/reports/due-diligence" isActive={pathname === '/dashboard/reports/due-diligence'}>
                                            <BarChart3 className="size-4" />
                                            <span>Due Diligence</span>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                )}
                                {isPrivilegedUser && (
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton href="/dashboard/reports/ssd" isActive={pathname === '/dashboard/reports/ssd'}>
                                            <Layers className="size-4" />
                                            <span>SSD Report</span>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                )}
                            </SidebarMenuSub>
                        </CollapsibleContent>
                    </SidebarMenuItem>
                </Collapsible>
            </SidebarMenu>

            <SidebarSeparator />

            <SidebarGroup>
                <SidebarGroupLabel>Analysis Modules</SidebarGroupLabel>
                <SidebarMenu>
                    <Collapsible open={modulesOpen} onOpenChange={setModulesOpen} className="group/collapsible">
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton tooltip="Analysis Modules">
                                    <Layers />
                                    <span>Modules</span>
                                    <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton href="/analysis/modules/tca" isActive={pathname === '/analysis/modules/tca'}>
                                            <BarChart3 className="size-4" />
                                            <span>TCA Scorecard</span>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton href="/analysis/modules/analyst" isActive={pathname === '/analysis/modules/analyst'}>
                                            <FileSearch className="size-4" />
                                            <span>Analyst Analysis</span>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton href="/analysis/modules/risk" isActive={pathname === '/analysis/modules/risk'}>
                                            <Shield className="size-4" />
                                            <span>Risk Assessment</span>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton href="/analysis/modules/macro" isActive={pathname === '/analysis/modules/macro'}>
                                            <TrendingUp className="size-4" />
                                            <span>Macro Trend Analysis</span>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton href="/analysis/modules/team" isActive={pathname === '/analysis/modules/team'}>
                                            <Users2 className="size-4" />
                                            <span>Team Assessment</span>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton href="/analysis/modules/benchmark" isActive={pathname === '/analysis/modules/benchmark'}>
                                            <Gauge className="size-4" />
                                            <span>Benchmark Comparison</span>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton href="/analysis/modules/growth" isActive={pathname === '/analysis/modules/growth'}>
                                            <Target className="size-4" />
                                            <span>Growth Classifier</span>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton href="/analysis/modules/gap" isActive={pathname === '/analysis/modules/gap'}>
                                            <Calculator className="size-4" />
                                            <span>Gap Analysis</span>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton href="/analysis/modules/founderFit" isActive={pathname === '/analysis/modules/founderFit'}>
                                            <UserIcon className="size-4" />
                                            <span>Founder Fit Analysis</span>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton href="/analysis/modules/strategicFit" isActive={pathname === '/analysis/modules/strategicFit'}>
                                            <Target className="size-4" />
                                            <span>Strategic Fit Matrix</span>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton href="/analysis/modules/financial" isActive={pathname === '/analysis/modules/financial'}>
                                            <DollarSign className="size-4" />
                                            <span>Financial Analysis</span>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton href="/analysis/modules/economic" isActive={pathname === '/analysis/modules/economic'}>
                                            <TrendingUp className="size-4" />
                                            <span>Economic Analysis</span>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton href="/analysis/modules/social" isActive={pathname === '/analysis/modules/social'}>
                                            <Globe className="size-4" />
                                            <span>Social Analysis</span>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton href="/analysis/modules/marketing" isActive={pathname === '/analysis/modules/marketing'}>
                                            <Megaphone className="size-4" />
                                            <span>Marketing Analysis</span>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton href="/analysis/modules/environmental" isActive={pathname === '/analysis/modules/environmental'}>
                                            <Leaf className="size-4" />
                                            <span>Environmental Analysis</span>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton href="/analysis/modules/funder" isActive={pathname === '/analysis/modules/funder'}>
                                            <Building2 className="size-4" />
                                            <span>Funder Analysis</span>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton href="/analysis/modules/strategic" isActive={pathname === '/analysis/modules/strategic'}>
                                            <Compass className="size-4" />
                                            <span>Strategic Analysis</span>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton href="/analysis/what-if" isActive={pathname === '/analysis/what-if'}>
                                            <Lightbulb className="size-4" />
                                            <span>Simulation</span>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup>
                <SidebarGroupLabel>User Tools</SidebarGroupLabel>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton href="/dashboard/request" isActive={pathname === '/dashboard/request'} tooltip="Submit Request to Admin">
                            <Send />
                            <span>Submit Request to Admin</span>
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
                        <SidebarGroupLabel>Analyst Tools</SidebarGroupLabel>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton href="/dashboard/analyst" isActive={pathname === '/dashboard/analyst'} tooltip="Analyst Hub">
                                    <Bell />
                                    <span>Analyst Hub</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton href="/analysis/modules/analyst" isActive={pathname === '/analysis/modules/analyst'} tooltip="Analyst Analysis">
                                    <MessageSquare />
                                    <span>Analyst Analysis</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroup>

                    <SidebarGroup>
                        <SidebarGroupLabel>Administration</SidebarGroupLabel>
                        <SidebarMenu>
                            {isAdmin && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton href="/dashboard/users" isActive={pathname === '/dashboard/users'} tooltip="User Management">
                                        <Users />
                                        <span>User Management</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                            {isAdmin && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton href="/dashboard/user-requests" isActive={pathname === '/dashboard/user-requests'} tooltip="User Requests">
                                        <MessageSquare />
                                        <span>User Requests</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
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
                            {isAdmin && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton href="/dashboard/cost" isActive={pathname === '/dashboard/cost'} tooltip="Cost Management">
                                        <DollarSign />
                                        <span>Cost Management</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                            <SidebarMenuItem>
                                <SidebarMenuButton href="/dashboard/database" isActive={pathname === '/dashboard/database'} tooltip="Database Mining">
                                    <Database />
                                    <span>Database Mining</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            {isAdmin && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton href="/dashboard/database-integration" isActive={pathname === '/dashboard/database-integration'} tooltip="Database Integration">
                                        <GitBranch />
                                        <span>Database Integration</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                            {isAdmin && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton href="/dashboard/remote" isActive={pathname === '/dashboard/remote'} tooltip="Remote Integration">
                                        <GitBranch />
                                        <span>Remote Integration</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                            {isAdmin && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton href="/dashboard/system-config" isActive={pathname === '/dashboard/system-config'} tooltip="System Config">
                                        <Settings />
                                        <span>System Config</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                            {isAdmin && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton href="/dashboard/module-settings" isActive={pathname === '/dashboard/module-settings'} tooltip="Module Settings">
                                        <Layers />
                                        <span>Module Settings</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                            {isAdmin && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton href="/dashboard/schema" isActive={pathname === '/dashboard/schema'} tooltip="Schema & Models">
                                        <FileCode />
                                        <span>Schema & Models</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                            {isAdmin && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton href="/dashboard/reports/configure" isActive={pathname === '/dashboard/reports/configure'} tooltip="Report Configuration">
                                        <FileText />
                                        <span>Report Configuration</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                            <SidebarMenuItem>
                                <SidebarMenuButton href="/dashboard/ssd-audit" isActive={pathname === '/dashboard/ssd-audit'} tooltip="Startup Steroid Audit">
                                    <Activity />
                                    <span>Startup Steroid Audit</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            {isAdmin && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton href="/dashboard/evaluation/modules" isActive={pathname.startsWith('/analysis/modules')} tooltip="Complete Admin Config">
                                        <Settings />
                                        <span>Module Control Deck</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                        </SidebarMenu>
                    </SidebarGroup>
                </>
            )}
        </SidebarContent>
    );
}


