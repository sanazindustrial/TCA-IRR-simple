import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';

export default function Loading() {
  return (
    <div className="container mx-auto p-4 md:p-8 animate-pulse">
        <div className="flex flex-col items-center justify-center mb-12">
            <Skeleton className="h-10 w-3/4 md:w-1/2" />
            <Skeleton className="h-4 w-full max-w-lg mt-4" />
        </div>

        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/4" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                             <Skeleton className="h-4 w-1/4" />
                             <Skeleton className="h-10 w-full" />
                        </div>
                         <div className="space-y-2">
                             <Skeleton className="h-4 w-1/4" />
                             <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/4" />
                </CardHeader>
                <CardContent>
                     <Skeleton className="h-32 w-full" />
                </CardContent>
            </Card>
            <div className="flex justify-end">
                <Skeleton className="h-12 w-32" />
            </div>
        </div>
    </div>
  );
}
