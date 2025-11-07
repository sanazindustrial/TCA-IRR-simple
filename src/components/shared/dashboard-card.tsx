import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import React, { type ReactNode } from 'react';

type DashboardCardProps = {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
  description?: string;
};

export function DashboardCard({
  title,
  icon: Icon,
  children,
  className,
  description,
}: DashboardCardProps) {
  return (
    <Card className={cn('h-full shadow-lg border-border/50', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
            <Icon className="size-5 text-primary" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <CardTitle className="text-lg font-semibold leading-tight">{title}</CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}
