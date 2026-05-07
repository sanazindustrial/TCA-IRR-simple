
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
import { User, Settings, LogOut } from 'lucide-react';
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
          <Link href="/dashboard" className="flex items-center gap-2 px-2 py-1">
            <img src="/icon.jpg" className="h-8 w-8 object-contain flex-shrink-0" alt="TCA Venture Group"/>
            <span className="font-bold text-base group-data-[collapsible=icon]:hidden">TCA-IRR</span>
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
