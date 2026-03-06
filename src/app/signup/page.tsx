
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { UserPlus, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const { toast } = useToast();


    const handleSignup = (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast({
                variant: 'destructive',
                title: 'Signup Failed',
                description: 'Passwords do not match.',
            });
            return;
        }
        if (email && password && fullName) {
            toast({
                title: 'Signup Successful',
                description: 'Redirecting to your dashboard...',
            });
            router.push('/dashboard');
        } else {
             toast({
                variant: 'destructive',
                title: 'Signup Failed',
                description: 'Please fill out all fields.',
            });
        }
    };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-4">
                <div className="bg-primary/10 border-2 border-primary/20 p-4 rounded-xl">
                     <UserPlus className="text-primary size-8" />
                </div>
            </div>
          <CardTitle className="text-3xl font-bold tracking-tight">Create an Account</CardTitle>
          <CardDescription>Join TCA-IRR APP to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullname">Full Name</Label>
              <div className="relative">
                 <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                 <Input id="fullname" type="text" placeholder="John Doe" required className="pl-10" value={fullName} onChange={e => setFullName(e.target.value)} />
              </div>
            </div>
             <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                 <Input id="email" type="email" placeholder="john.doe@example.com" required className="pl-10" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  className="pl-10 pr-10"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>
             <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  className="pl-10 pr-10"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent text-lg h-12">
              Sign Up
            </Button>
          </form>
           <div className="mt-6 text-center text-sm">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Sign In
              </Link>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
