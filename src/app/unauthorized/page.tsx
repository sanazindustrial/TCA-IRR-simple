
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="text-center p-8">
         <div className="flex justify-center items-center mb-6">
            <div className="bg-destructive/10 border-2 border-destructive/20 p-4 rounded-xl">
                 <ShieldAlert className="text-destructive size-8" />
            </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-destructive tracking-tight">
          Access Denied
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          You do not have the necessary permissions to access this page. Please contact your administrator if you believe this is an error.
        </p>
        <div className="mt-8">
          <Button asChild size="lg">
            <Link href="/dashboard">Return to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
