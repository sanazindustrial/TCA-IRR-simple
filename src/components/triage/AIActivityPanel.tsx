import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle2, Clock3 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ActivityItem = {
  id: string;
  text: string;
  tone: 'success' | 'warning' | 'info';
};

type AIActivityPanelProps = {
  items: ActivityItem[];
};

export default function AIActivityPanel({ items }: AIActivityPanelProps) {
  return (
    <Card className="h-full lg:sticky lg:top-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">AI Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">No AI activity yet. Start extraction to populate this feed.</p>
        ) : (
          items.map((item) => {
            const Icon = item.tone === 'success' ? CheckCircle2 : item.tone === 'warning' ? AlertTriangle : Clock3;
            return (
              <div
                key={item.id}
                className={cn(
                  'flex items-start gap-2 rounded-md border p-2 text-sm',
                  item.tone === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-800',
                  item.tone === 'warning' && 'border-amber-200 bg-amber-50 text-amber-800',
                  item.tone === 'info' && 'border-blue-200 bg-blue-50 text-blue-800'
                )}
              >
                <Icon className="mt-0.5 size-4 shrink-0" />
                <span>{item.text}</span>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
