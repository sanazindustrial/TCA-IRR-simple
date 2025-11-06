
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Bell,
  MessageSquare,
  Clock,
  Check,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

type Review = {
  id: string;
  company: string;
  reportType: 'Triage Report' | 'Due Diligence';
  status: 'Pending Review' | 'In Progress' | 'Completed';
  assigned: string;
  due: string;
};


const initialReviews: Review[] = [
  {
    id: 'notif-1',
    company: 'Innovate Inc.',
    reportType: 'Triage Report',
    status: 'Pending Review',
    assigned: '2 hours ago',
    due: 'in 3 days',
  },
  {
    id: 'notif-2',
    company: 'QuantumLeap AI',
    reportType: 'Due Diligence',
    status: 'Pending Review',
    assigned: '1 day ago',
    due: 'in 6 days',
  },
  {
    id: 'notif-3',
    company: 'BioSynth',
    reportType: 'Triage Report',
    status: 'Completed',
    assigned: '3 days ago',
    due: '-',
  },
];

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
    <Card className="flex-1 bg-card/50">
      <CardContent className="p-4 flex items-center gap-4">
        <Icon className="size-8 text-muted-foreground" />
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
);


export default function ReviewerDashboardPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState('pending-review');
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const storedUser = localStorage.getItem('loggedInUser');
    if (storedUser) {
        const user = JSON.parse(storedUser);
        const role = user.role?.toLowerCase();
        if (role !== 'admin' && role !== 'reviewer') {
            router.push('/unauthorized');
        }
    } else {
        router.push('/login');
    }
    
    // Load reviews from localStorage or set initial ones
    try {
      const storedReviews = localStorage.getItem('reviewerAssignments');
      if (storedReviews) {
        setReviews(JSON.parse(storedReviews));
      } else {
        localStorage.setItem('reviewerAssignments', JSON.stringify(initialReviews));
        setReviews(initialReviews);
      }
    } catch (error) {
      console.error("Could not parse reviewer assignments from localStorage", error);
      setReviews(initialReviews);
    }
  }, [router]);

  const handleStartReview = (reviewId: string) => {
    setReviews(currentReviews => {
      const updatedReviews = currentReviews.map(r => 
        r.id === reviewId ? { ...r, status: 'In Progress' } : r
      );
      localStorage.setItem('reviewerAssignments', JSON.stringify(updatedReviews));
      return updatedReviews;
    });

    toast({
      title: "Review Started",
      description: "The review is now marked as 'In Progress'.",
    });

    router.push('/analysis/modules/reviewer');
  };

  const filteredReviews = reviews.filter(n => {
    if (filter === 'all') return true;
    return n.status.toLowerCase().replace(/ /g, '-') === filter;
  });
  
  const pendingCount = reviews.filter(n => n.status === 'Pending Review').length;
  const inProgressCount = reviews.filter(n => n.status === 'In Progress').length;
  const completedCount = reviews.filter(n => n.status === 'Completed').length;

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-6 text-primary" />
          <h1 className="text-2xl font-semibold">Reviewer Hub</h1>
        </div>
        <div className="flex items-center gap-2">
            <Badge variant="outline">{pendingCount} Pending</Badge>
            <Badge variant="outline">{inProgressCount} In Progress</Badge>
        </div>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Pending Review" value={pendingCount} icon={Clock} />
          <StatCard title="In Progress" value={inProgressCount} icon={RefreshCw} />
          <StatCard title="Completed (All Time)" value={completedCount} icon={Check} />
          <StatCard title="Avg. Time-to-Review" value={"2.1 days"} icon={Clock} />
      </div>

      <div className="space-y-8">
        <Card>
            <CardHeader>
            <CardTitle>Review Queue</CardTitle>
            <CardDescription>
                Analyses awaiting your review.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <div className="flex justify-end mb-4">
                <Select onValueChange={setFilter} defaultValue="pending-review">
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="pending-review">Pending Review</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-4">
                {filteredReviews.map(review => (
                <div
                    key={review.id}
                    className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-lg border bg-muted/30"
                >
                    <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-full">
                        <Bell className="size-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold">
                        {review.company}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                        {review.reportType}
                        </p>
                    </div>
                    </div>
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8">
                    <Badge variant={review.status === 'Completed' ? 'success' : (review.status === 'In Progress' ? 'default' : 'warning')}>{review.status}</Badge>
                    <div className='text-sm text-muted-foreground'>
                            <p>Assigned: {review.assigned}</p>
                            <p>Due: {review.due}</p>
                    </div>
                    <div className='flex gap-2'>
                            {review.status === 'Pending Review' && (
                                <Button variant="outline" onClick={() => handleStartReview(review.id)}>Start Review</Button>
                            )}
                            <Button asChild>
                                <Link href="/analysis/result">View Report</Link>
                            </Button>
                    </div>
                    </div>
                </div>
                ))}
                {filteredReviews.length === 0 && (
                    <div className='text-center py-12 text-muted-foreground'>
                        <Check className='mx-auto mb-2 size-8'/>
                        <h3 className="font-semibold">All caught up!</h3>
                        <p>There are no notifications matching your filter.</p>
                    </div>
                )}
            </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
