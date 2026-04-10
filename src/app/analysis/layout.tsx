import {
    SidebarProvider,
    Sidebar,
    SidebarHeader,
    SidebarFooter,
    SidebarInset,
} from '@/components/ui/sidebar';
import { Avatar } from '@/components/ui/avatar';
import { Compass } from 'lucide-react';
import { SidebarMenuClient } from '@/components/dashboard/sidebar/sidebar-menu-client';

export default function AnalysisLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader>
                    <div className="flex items-center gap-2">
                        <Avatar className="size-8 bg-primary/20 text-primary">
                            <Compass className="m-1.5" />
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-sidebar-foreground">
                                Startup Compass
                            </span>
                        </div>
                    </div>
                </SidebarHeader>

                <SidebarMenuClient />

                <SidebarFooter>
                    <SidebarMenuClient isFooter={true} />
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
    );
}
