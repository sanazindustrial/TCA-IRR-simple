'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, ArrowLeft, FileText, Plus } from 'lucide-react';
import Link from 'next/link';

export default function ReportsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console
    console.error('Reports Error:', error);
    
    // Clear any corrupted localStorage data that might be causing issues
    try {
      const problematicKeys = ['tca_reports', 'pending_report_sync', 'unified_records'];
      for (const key of problematicKeys) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            JSON.parse(data);
          } catch {
            console.warn(`Clearing corrupted localStorage key: ${key}`);
            localStorage.removeItem(key);
          }
        }
      }
    } catch (e) {
      console.warn('Could not check localStorage:', e);
    }
  }, [error]);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="size-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight flex items-center gap-2">
          <FileText />
          Evaluation Reports
        </h1>
      </header>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-destructive/10">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-center text-xl">
            Unable to Load Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground">
            There was an error loading your reports. This may be due to a temporary issue or corrupted local data.
          </p>

          {process.env.NODE_ENV === 'development' && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-mono text-destructive break-words">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-muted-foreground mt-2">
                  Digest: {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-4 justify-center flex-wrap">
            <Button onClick={() => {
              // Clear potentially corrupted data and retry
              try {
                localStorage.removeItem('tca_reports_error');
              } catch {}
              reset();
            }}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/evaluation">
                <Plus className="mr-2 h-4 w-4" />
                New Report
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-center text-muted-foreground">
              If this issue persists, try clearing your browser cache or contact support.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
