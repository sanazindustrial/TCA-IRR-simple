
'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { UserPlus, Mail, Lock, User, Eye, EyeOff, Loader2, Shield, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tcairrapiccontainer.azurewebsites.net';

function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  const [inviteData, setInviteData] = useState<{ email: string; role: string } | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Validate invite token on mount
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setInviteToken(token);
      validateInviteToken(token);
    }
  }, [searchParams]);

  const validateInviteToken = async (token: string) => {
    setIsValidatingToken(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/validate-invite?token=${encodeURIComponent(token)}`);
      if (response.ok) {
        const data = await response.json();
        setInviteData({ email: data.email, role: data.role });
        setEmail(data.email);
        toast({
          title: 'Invitation Valid',
          description: `You've been invited as ${data.role}. Complete your registration below.`,
        });
      } else {
        const error = await response.json();
        toast({
          variant: 'destructive',
          title: 'Invalid Invitation',
          description: error.detail || 'This invitation link is invalid or has expired.',
        });
        setInviteToken(null);
      }
    } catch (error) {
      console.error('Token validation error:', error);
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Unable to validate invitation. Please try again.',
      });
      setInviteToken(null);
    } finally {
      setIsValidatingToken(false);
    }
  };


  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!email || !password || !firstName || !lastName) {
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: 'Please fill out all fields.',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: 'Passwords do not match.',
      });
      return;
    }

    if (password.length < 8) {
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: 'Password must be at least 8 characters.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const fullName = `${firstName} ${lastName}`.trim();
      let response;

      if (inviteToken && inviteData) {
        // Complete invite registration - uses role from invite
        response = await fetch(`${API_BASE_URL}/auth/complete-invite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: inviteToken,
            full_name: fullName,
            password,
          }),
        });
      } else {
        // Regular registration - default User role
        const username = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 50);
        response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            email,
            password,
            confirm_password: confirmPassword,
            full_name: fullName,
          }),
        });
      }

      if (response.ok) {
        const data = await response.json();

        // Store user session - for registration, user needs to login
        toast({
          title: 'Signup Successful',
          description: inviteData 
            ? `Your ${inviteData.role} account has been created. Please sign in.`
            : 'Your account has been created. Please sign in.',
        });

        // Redirect to login page
        router.push('/login');
      } else {
        const error = await response.json();
        let errorMessage = 'Registration failed. Please try again.';

        // Handle password policy errors
        if (error.detail?.password_errors) {
          errorMessage = error.detail.password_errors.join('. ');
        } else if (typeof error.detail === 'string') {
          errorMessage = error.detail;
        }

        toast({
          variant: 'destructive',
          title: 'Signup Failed',
          description: errorMessage,
        });
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: 'Unable to connect to server. Please try again later.',
      });
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
              {inviteData ? <Shield className="text-primary size-8" /> : <UserPlus className="text-primary size-8" />}
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">
            {inviteData ? 'Complete Your Registration' : 'Create an Account'}
          </CardTitle>
          <CardDescription>
            {inviteData 
              ? `You've been invited to join as ${inviteData.role}`
              : 'Join TCA-IRR APP to get started.'
            }
          </CardDescription>
          {inviteData && (
            <Badge variant="secondary" className="mt-2 mx-auto">
              <CheckCircle className="w-3 h-3 mr-1" />
              Invited as {inviteData.role}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {isValidatingToken ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Validating your invitation...</p>
            </div>
          ) : (
            <>
              {!inviteData && (
                <Alert className="mb-4 bg-blue-50 border-blue-200">
                  <AlertDescription className="text-blue-800 text-sm">
                    Normal users can sign up here. For Admin or Analyst access, please contact your administrator for an invitation.
                  </AlertDescription>
                </Alert>
              )}
              {inviteData && (
                <Alert className="mb-4 bg-green-50 border-green-200">
                  <AlertDescription className="text-green-800 text-sm">
                    <CheckCircle className="inline w-4 h-4 mr-1" />
                    You've been invited as <strong>{inviteData.role}</strong>. Complete your registration below.
                  </AlertDescription>
                </Alert>
              )}

          <form onSubmit={handleSignup} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstname">First Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                  <Input
                    id="firstname"
                    name="firstName"
                    type="text"
                    placeholder="John"
                    required
                    className="pl-10"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastname">Last Name</Label>
                <Input
                  id="lastname"
                  name="lastName"
                  type="text"
                  placeholder="Doe"
                  required
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  required
                  className={`pl-10 ${inviteData ? 'bg-muted' : ''}`}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={!!inviteData}
                  readOnly={!!inviteData}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  className="pl-10 pr-10"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                <Input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  className="pl-10 pr-10"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-accent text-lg h-12"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Sign Up'
              )}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign In
            </Link>
          </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
