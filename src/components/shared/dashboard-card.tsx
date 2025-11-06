import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import React from 'react';

type DashboardCardProps = {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
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
    <Card className={cn('h-full shadow-lg', className)}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Icon className="size-6 text-primary" />
          <div className="flex flex-col">
            <CardTitle>{title}</CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
