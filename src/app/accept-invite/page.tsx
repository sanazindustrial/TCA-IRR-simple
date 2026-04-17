'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { UserPlus, Lock, User, ArrowLeft, Loader2, CheckCircle, XCircle, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://tcairrapiccontainer.azurewebsites.net').replace(/\/$/, '');
const API_PREFIX = '/api/v1';

function AcceptInviteContent() {
    const [username, setUsername] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isValidating, setIsValidating] = useState(true);
    const [isTokenValid, setIsTokenValid] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [inviteInfo, setInviteInfo] = useState<{ email: string; role: string; invited_by: string } | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const { toast } = useToast();

    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setIsValidating(false);
                setIsTokenValid(false);
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}${API_PREFIX}/auth/invite/validate/${token}`);
                const data = await response.json();

                if (response.ok && data.valid) {
                    setIsTokenValid(true);
                    setInviteInfo({
                        email: data.email,
                        role: data.role,
                        invited_by: data.invited_by,
                    });
                } else {
                    setIsTokenValid(false);
                }
            } catch {
                setIsTokenValid(false);
            } finally {
                setIsValidating(false);
            }
        };

        validateToken();
    }, [token]);

    const handleAcceptInvite = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username || !password || !confirmPassword) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Please fill in all required fields.',
            });
            return;
        }

        if (username.length < 3 || username.length > 50) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Username must be between 3 and 50 characters.',
            });
            return;
        }

        if (password !== confirmPassword) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Passwords do not match.',
            });
            return;
        }

        if (password.length < 8) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Password must be at least 8 characters long.',
            });
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}${API_PREFIX}/auth/accept-invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    username,
                    password,
                    confirm_password: confirmPassword,
                    full_name: fullName || undefined,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setIsSuccess(true);
                toast({
                    title: 'Account Created',
                    description: 'Your account has been created. You can now sign in.',
                });
            } else {
                const detail = data.detail;
                const message =
                    typeof detail === 'object' && detail?.password_errors
                        ? detail.password_errors.join(', ')
                        : typeof detail === 'string'
                        ? detail
                        : 'Failed to create account. Please try again.';
                toast({
                    variant: 'destructive',
                    title: 'Account Creation Failed',
                    description: message,
                });
            }
        } catch {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'An error occurred. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isValidating) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background p-4">
                <Card className="w-full max-w-md shadow-2xl">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">Validating invitation...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!isTokenValid) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background p-4">
                <Card className="w-full max-w-md shadow-2xl">
                    <CardHeader className="text-center">
                        <div className="flex justify-center items-center mb-4">
                            <div className="bg-destructive/10 border-2 border-destructive/20 p-4 rounded-xl">
                                <XCircle className="text-destructive size-8" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold tracking-tight">Invalid or Expired Invitation</CardTitle>
                        <CardDescription>
                            This invitation link is invalid or has expired. Please contact your administrator for a new invitation.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="mt-2 text-center text-sm">
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

    if (isSuccess) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background p-4">
                <Card className="w-full max-w-md shadow-2xl">
                    <CardHeader className="text-center">
                        <div className="flex justify-center items-center mb-4">
                            <div className="bg-primary/10 border-2 border-primary/20 p-4 rounded-xl">
                                <CheckCircle className="text-primary size-8" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold tracking-tight">Account Created!</CardTitle>
                        <CardDescription>
                            Your {inviteInfo?.role} account has been successfully created. You can now sign in.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            className="w-full bg-gradient-to-r from-primary to-accent text-lg h-12"
                            onClick={() => router.push('/login')}
                        >
                            Sign In
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-md shadow-2xl">
                <CardHeader className="text-center">
                    <div className="flex justify-center items-center mb-4">
                        <div className="bg-primary/10 border-2 border-primary/20 p-4 rounded-xl">
                            <UserPlus className="text-primary size-8" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight">Accept Invitation</CardTitle>
                    <CardDescription>
                        You&apos;ve been invited as <span className="font-semibold capitalize text-primary">{inviteInfo?.role}</span>
                        {inviteInfo?.email && (
                            <span className="flex items-center justify-center gap-1 mt-1 text-xs">
                                <Mail className="size-3" /> {inviteInfo.email}
                            </span>
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAcceptInvite} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username <span className="text-destructive">*</span></Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="Choose a username"
                                    required
                                    className="pl-10"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    disabled={isLoading}
                                    minLength={3}
                                    maxLength={50}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name <span className="text-muted-foreground text-xs">(optional)</span></Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                                <Input
                                    id="fullName"
                                    type="text"
                                    placeholder="Your full name"
                                    className="pl-10"
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Create a password"
                                    required
                                    className="pl-10"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    disabled={isLoading}
                                    minLength={8}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                At least 8 characters with uppercase, lowercase, number, and special character
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password <span className="text-destructive">*</span></Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Confirm your password"
                                    required
                                    className="pl-10"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    disabled={isLoading}
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
                                'Create Account'
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

export default function AcceptInvitePage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-background p-4">
                <Card className="w-full max-w-md shadow-2xl">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">Loading...</p>
                    </CardContent>
                </Card>
            </div>
        }>
            <AcceptInviteContent />
        </Suspense>
    );
}
