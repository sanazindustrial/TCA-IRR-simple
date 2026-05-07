import {
    SidebarProvider,
    Sidebar,
    SidebarHeader,
    SidebarFooter,
    SidebarInset,
} from '@/components/ui/sidebar';
import { Avatar } from '@/components/ui/avatar';
import Link from 'next/link';
import { SidebarMenuClient } from '@/components/dashboard/sidebar/sidebar-menu-client';
import { ServiceHealthIndicator } from '@/components/service-health-indicator';

export default function AnalysisLayout({
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
