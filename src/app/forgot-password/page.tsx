
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { KeyRound, Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            toast({
                variant: 'destructive',
                title: 'Request Failed',
                description: 'Please enter your email address.',
            });
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();
            
            toast({
                title: 'Reset Link Sent',
                description: data.message || 'If an account exists for that email, a password reset link has been sent.',
            });
            router.push('/login');
        } catch (error) {
            // Always show success message to prevent email enumeration
            toast({
                title: 'Reset Link Sent',
                description: 'If an account exists for that email, a password reset link has been sent.',
            });
            router.push('/login');
        } finally {
            setIsLoading(false);
        }
    };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-4">
                <div className="bg-primary/10 border-2 border-primary/20 p-4 rounded-xl">
                     <KeyRound className="text-primary size-8" />
                </div>
            </div>
          <CardTitle className="text-3xl font-bold tracking-tight">Forgot Password?</CardTitle>
          <CardDescription>No worries, we'll send you reset instructions.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordReset} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                 <Input id="email" type="email" placeholder="Enter your email" required className="pl-10" value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} />
              </div>
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent text-lg h-12" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </form>
           <div className="mt-6 text-center text-sm">
                <Link href="/login" className="font-semibold text-primary hover:underline flex items-center justify-center gap-2">
                    <ArrowLeft className="size-4" />
                    Back to Sign In
                </Link>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
