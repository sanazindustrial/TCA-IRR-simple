import {
    SidebarProvider,
    Sidebar,
    SidebarHeader,
    SidebarFooter,
    SidebarInset,
} from '@/components/ui/sidebar';
import { Avatar } from '@/components/ui/avatar';
import { Compass } from 'lucide-react';
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
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <Avatar className="size-8 bg-primary/20 text-primary">
                            <Compass className="m-1.5" />
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
