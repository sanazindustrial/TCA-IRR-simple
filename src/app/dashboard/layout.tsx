
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { User, Settings, LogOut, Compass } from 'lucide-react';
import { SidebarMenuClient } from '@/components/dashboard/sidebar/sidebar-menu-client';
import { ServiceHealthIndicator } from '@/components/service-health-indicator';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
             <Link href="/dashboard" className="flex items-center gap-2">
              <Avatar className="size-8 bg-primary/20 text-primary">
                <Compass className="m-1.5"/>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-sidebar-foreground">
                  Startup Compass
                </span>
              </div>
            </Link>
        </SidebarHeader>

        <SidebarMenuClient />
        
        <SidebarFooter>
            <ServiceHealthIndicator />
            <SidebarMenuClient isFooter={true} />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
