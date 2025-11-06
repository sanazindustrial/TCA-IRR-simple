
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="w-full max-w-md p-8 space-y-4">
                 <div className="flex justify-center">
                    <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h2 className="text-center text-xl font-semibold">Logging Out...</h2>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mx-auto" />
            </div>
        </div>
    );
}


export default function LogoutPage() {
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        // Clear the logged-in user from localStorage
        localStorage.removeItem('loggedInUser');
        
        toast({
            title: 'Logging Out',
            description: 'You have been successfully logged out.',
        });
        
        // Redirect to the welcome page after a short delay
        const timer = setTimeout(() => {
            router.push('/');
        }, 1500);

        return () => clearTimeout(timer);
    }, [router, toast]);

  return <LoadingSpinner />;
}
