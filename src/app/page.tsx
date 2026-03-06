
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function WelcomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="text-center p-8">
         <div className="flex justify-center items-center mb-6">
            <div className="bg-primary/10 border-2 border-primary/20 p-4 rounded-xl">
                 <LogIn className="text-primary size-8" />
            </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary tracking-tight">
          Welcome to TCA-IRR
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Your intelligent partner for comprehensive startup evaluation and risk assessment.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/login">
              <LogIn className="mr-2" />
              Sign In
            </Link>
          </Button>
           <Button asChild size="lg" variant="outline">
            <Link href="/signup">
              <UserPlus className="mr-2" />
              Sign Up
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
