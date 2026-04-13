
import { DashboardCard } from '@/components/shared/dashboard-card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { ExportButtons } from './export-buttons';
import { ClipboardList } from 'lucide-react';

export function QuickSummary() {
  return (
    <DashboardCard title="Quick Summary" icon={ClipboardList} description="Key details about this evaluation run.">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-8 gap-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Company</p>
            <p className="font-bold text-lg">Innovate Inc.</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Sector</p>
            <p className="font-bold text-lg">General Tech/SaaS</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Date</p>
            <p className="font-bold text-lg">
              {new Date().toLocaleDateString()}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Valuation</p>
            <p className="font-bold text-lg">$10M</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Round</p>
            <p className="font-bold text-lg">Seed</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Report Version
            </p>
            <p className="font-bold text-lg">1.0.0</p>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}
