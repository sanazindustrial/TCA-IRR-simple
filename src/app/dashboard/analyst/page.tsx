
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Bell,
  MessageSquare,
  Clock,
  Check,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  FileSearch,
  ClipboardCheck,
  Send,
  Database,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

type Review = {
  id: string;
  company: string;
  reportType: 'Triage Report' | 'Due Diligence';
  status: 'Pending Review' | 'In Progress' | 'Completed';
  assigned: string;
  due: string;
  progress?: number;
  lastActivity?: string;
};

type ConnectionStatus = 'checking' | 'connected' | 'disconnected';

type WorkflowStep = {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
  status: 'completed' | 'current' | 'pending';
};


const initialReviews: Review[] = [
  {
    id: 'notif-1',
    company: 'Innovate Inc.',
    reportType: 'Triage Report',
    status: 'Pending Review',
    assigned: '2 hours ago',
    due: 'in 3 days',
    progress: 0,
    lastActivity: 'Awaiting analyst review',
  },
  {
    id: 'notif-2',
    company: 'QuantumLeap AI',
    reportType: 'Due Diligence',
    status: 'Pending Review',
    assigned: '1 day ago',
    due: 'in 6 days',
    progress: 0,
    lastActivity: 'NLP analysis completed',
  },
  {
    id: 'notif-3',
    company: 'BioSynth',
    reportType: 'Triage Report',
    status: 'Completed',
    assigned: '3 days ago',
    due: '-',
    progress: 100,
    lastActivity: 'Approved by reviewer',
  },
  {
    id: 'notif-4',
    company: 'GreenTech Solutions',
    reportType: 'Due Diligence',
    status: 'In Progress',
    assigned: '4 hours ago',
    due: 'in 5 days',
    progress: 45,
    lastActivity: 'Qualitative insights in progress',
  },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tcairrapiccontainer.azurewebsites.net';

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
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('checking');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [manualOnlineMode, setManualOnlineMode] = useState<boolean | null>(null); // null = auto, true = force online, false = force offline
  const router = useRouter();
  const { toast } = useToast();

  // Effective connection status - considers manual override
  const effectiveStatus = manualOnlineMode !== null
    ? (manualOnlineMode ? 'connected' : 'disconnected')
    : connectionStatus;

  // Define workflow steps for the analyst process
  const workflowSteps: WorkflowStep[] = [
    { id: 1, title: 'Review Queue', description: 'Select a report from the queue', icon: FileSearch, status: 'current' },
    { id: 2, title: 'Start Analysis', description: 'Begin qualitative review', icon: ClipboardCheck, status: 'pending' },
    { id: 3, title: 'Add Insights', description: 'Input analyst observations', icon: MessageSquare, status: 'pending' },
    { id: 4, title: 'Submit', description: 'Submit for final approval', icon: Send, status: 'pending' },
  ];

  // Test backend connection
  const testConnection = useCallback(async () => {
    setConnectionStatus('checking');
    try {
      const response = await fetch('/api/test-backend', {
        method: 'GET',
        cache: 'no-store'
      });
      if (response.ok) {
        setConnectionStatus('connected');
        return true;
      }
      setConnectionStatus('disconnected');
      return false;
    } catch {
      setConnectionStatus('disconnected');
      return false;
    }
  }, []);

  // Fetch reviews from API or localStorage
  const fetchReviews = useCallback(async (showToast = false) => {
    setIsRefreshing(true);
    try {
      // Attempt real API fetch - use the correct endpoint
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const response = await fetch(`${API_URL}/api/v1/analysis/analyst-reviews`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.reviews) && data.reviews.length > 0) {
          // Map backend reviews to frontend format
          const mappedReviews = data.reviews.map((r: {
            id: string;
            company: string;
            reportType: string;
            status: string;
            assigned: string;
            progress: number;
            lastActivity: string;
          }) => ({
            id: r.id,
            company: r.company,
            reportType: r.reportType as 'Triage Report' | 'Due Diligence',
            status: r.status as 'Pending Review' | 'In Progress' | 'Completed',
            assigned: r.assigned || 'Now',
            due: 'in 3 days',
            progress: r.progress || 0,
            lastActivity: r.lastActivity,
          }));
          setReviews(mappedReviews);
          localStorage.setItem('reviewerAssignments', JSON.stringify(mappedReviews));
          if (showToast) {
            toast({
              title: "Data Synced",
              description: `${mappedReviews.length} reviews fetched from server.`,
            });
          }
          return;
        }
      }
    } catch (error) {
      console.log("API fetch failed, using local data:", error);
    }

    // Fallback to localStorage
    try {
      const storedReviews = localStorage.getItem('reviewerAssignments');
      if (storedReviews) {
        setReviews(JSON.parse(storedReviews));
      } else {
        localStorage.setItem('reviewerAssignments', JSON.stringify(initialReviews));
        setReviews(initialReviews);
      }
      if (showToast) {
        toast({
          title: "Using Local Data",
          description: "Displaying cached review data.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Could not parse reviewer assignments from localStorage", error);
      setReviews(initialReviews);
    }
    setIsRefreshing(false);
  }, [toast]);

  useEffect(() => {
    const storedUser = localStorage.getItem('loggedInUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      const role = user.role?.toLowerCase();
      if (role !== 'admin' && role !== 'reviewer' && role !== 'analyst') {
        router.push('/unauthorized');
      }
    } else {
      router.push('/login');
    }

    // Initialize data loading
    const initializeDashboard = async () => {
      setIsLoading(true);
      await testConnection();
      await fetchReviews();
      setIsLoading(false);
    };

    initializeDashboard();
  }, [router, testConnection, fetchReviews]);

  const handleRefresh = async () => {
    await testConnection();
    await fetchReviews(true);
    setIsRefreshing(false);
  };

  const handleStartReview = (reviewId: string) => {
    setReviews(currentReviews => {
      const updatedReviews = currentReviews.map(r =>
        r.id === reviewId ? { ...r, status: 'In Progress' as const, progress: 10, lastActivity: 'Review started by analyst' } : r
      );
      localStorage.setItem('reviewerAssignments', JSON.stringify(updatedReviews));
      // Store current review context
      const currentReview = updatedReviews.find(r => r.id === reviewId);
      if (currentReview) {
        localStorage.setItem('currentAnalystReview', JSON.stringify(currentReview));
      }
      return updatedReviews;
    });

    toast({
      title: "Review Started",
      description: "The review is now marked as 'In Progress'. Redirecting to analysis...",
    });

    router.push('/analysis/modules/analyst');
  };

  const handleTestData = () => {
    // Simulate fetching test data
    toast({
      title: "Test Mode",
      description: "Loading sample test data for demonstration...",
    });

    const testReviews: Review[] = [
      ...initialReviews,
      {
        id: 'test-' + Date.now(),
        company: 'Test Company ' + Math.floor(Math.random() * 100),
        reportType: Math.random() > 0.5 ? 'Triage Report' : 'Due Diligence',
        status: 'Pending Review',
        assigned: 'Just now',
        due: 'in 7 days',
        progress: 0,
        lastActivity: 'Generated for testing',
      }
    ];

    setReviews(testReviews);
    localStorage.setItem('reviewerAssignments', JSON.stringify(testReviews));
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
      {/* Loading State */}
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="text-center space-y-4">
            <Loader2 className="size-12 mx-auto animate-spin text-primary" />
            <p className="text-muted-foreground">Loading analyst dashboard...</p>
          </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-6 text-primary" />
          <h1 className="text-2xl font-semibold">Analyst Hub</h1>
          {/* Connection Status Indicator - Clickable to toggle */}
          <div className="flex items-center gap-1.5 ml-2">
            {connectionStatus === 'checking' && manualOnlineMode === null && (
              <Badge variant="outline" className="gap-1">
                <Loader2 className="size-3 animate-spin" />
                Checking...
              </Badge>
            )}
            {effectiveStatus === 'connected' && (
              <Badge
                variant="outline"
                className="gap-1 text-green-600 border-green-300 cursor-pointer hover:bg-green-50 transition-colors"
                onClick={() => {
                  setManualOnlineMode(manualOnlineMode === true ? null : false);
                  toast({ title: "Switched to Offline Mode", description: "Using local data only." });
                }}
              >
                <Wifi className="size-3" />
                {manualOnlineMode === true ? 'Online (Manual)' : 'API Connected'}
              </Badge>
            )}
            {effectiveStatus === 'disconnected' && connectionStatus !== 'checking' && (
              <Badge
                variant="outline"
                className="gap-1 text-amber-600 border-amber-300 cursor-pointer hover:bg-amber-50 transition-colors"
                onClick={() => {
                  setManualOnlineMode(true);
                  toast({ title: "Switched to Online Mode", description: "Attempting to use API data." });
                  testConnection();
                }}
                title="Click to try online mode"
              >
                <WifiOff className="size-3" />
                {manualOnlineMode === false ? 'Offline (Manual)' : 'Offline Mode'}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? (
              <Loader2 className="size-4 animate-spin mr-1" />
            ) : (
              <RefreshCw className="size-4 mr-1" />
            )}
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleTestData}>
            <Database className="size-4 mr-1" />
            Add Test Data
          </Button>
          <Badge variant="outline">{pendingCount} Pending</Badge>
          <Badge variant="outline">{inProgressCount} In Progress</Badge>
        </div>
      </header>

      {/* Workflow Guide Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardCheck className="size-5 text-primary" />
            Analyst Workflow Guide
          </CardTitle>
          <CardDescription>Follow these steps to complete your analysis review</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-0">
            {workflowSteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${step.status === 'current' ? 'bg-primary/20 text-primary' :
                  step.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
                  }`}>
                  <div className={`size-8 rounded-full flex items-center justify-center ${step.status === 'current' ? 'bg-primary text-primary-foreground' :
                    step.status === 'completed' ? 'bg-green-500 text-white' : 'bg-muted-foreground/30'
                    }`}>
                    {step.status === 'completed' ? <Check className="size-4" /> : <step.icon className="size-4" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{step.title}</p>
                    <p className="text-xs opacity-80">{step.description}</p>
                  </div>
                </div>
                {index < workflowSteps.length - 1 && (
                  <ArrowRight className="hidden md:block size-5 mx-2 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
                  className={`flex flex-col gap-4 p-4 rounded-lg border ${review.status === 'In Progress' ? 'border-primary/50 bg-primary/5' :
                    review.status === 'Completed' ? 'border-green-200 bg-green-50/50' : 'bg-muted/30'
                    }`}
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${review.status === 'Completed' ? 'bg-green-100' :
                        review.status === 'In Progress' ? 'bg-primary/20' : 'bg-primary/10'
                        }`}>
                        {review.status === 'Completed' ? (
                          <CheckCircle2 className="size-5 text-green-600" />
                        ) : review.status === 'In Progress' ? (
                          <RefreshCw className="size-5 text-primary" />
                        ) : (
                          <Bell className="size-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          {review.company}
                          {review.status === 'In Progress' && (
                            <span className="text-xs text-primary">(Active)</span>
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {review.reportType}
                        </p>
                        {review.lastActivity && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Last: {review.lastActivity}
                          </p>
                        )}
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
                          <Button variant="default" onClick={() => handleStartReview(review.id)}>
                            <ArrowRight className="size-4 mr-1" />
                            Start Review
                          </Button>
                        )}
                        {review.status === 'In Progress' && (
                          <Button variant="default" asChild>
                            <Link href="/analysis/modules/analyst">
                              <RefreshCw className="size-4 mr-1" />
                              Continue Review
                            </Link>
                          </Button>
                        )}
                        <Button variant="outline" asChild>
                          <Link href="/analysis/result">View Report</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                  {/* Progress Bar for In Progress items */}
                  {review.status === 'In Progress' && review.progress !== undefined && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Analysis Progress</span>
                        <span>{review.progress}%</span>
                      </div>
                      <Progress value={review.progress} className="h-2" />
                    </div>
                  )}
                </div>
              ))}
              {filteredReviews.length === 0 && (
                <div className='text-center py-12 text-muted-foreground'>
                  <Check className='mx-auto mb-2 size-8' />
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
