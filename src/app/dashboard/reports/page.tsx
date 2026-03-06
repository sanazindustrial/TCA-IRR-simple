
'use client';

import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Download,
  Edit,
  ExternalLink,
  Eye,
  FileText,
  RefreshCw,
  Search,
  Share2,
  AlertTriangle,
  FileUp,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { UserRole } from '@/app/analysis/result/page';
import { useToast } from '@/hooks/use-toast';
import { ExportButtons } from '@/components/evaluation/export-buttons';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


const StatCard = ({
  title,
  value,
  description,
}: {
  title: string;
  value: string | number;
  description?: string;
}) => (
  <Card className="flex-1 bg-card/50">
    <CardContent className="p-4">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </CardContent>
  </Card>
);

const initialReportsData = [
    {
        id: 'rep-1',
        company: 'Innovate Inc.',
        type: 'Triage',
        status: 'Completed',
        approval: 'Approved',
        score: 8.2,
        confidence: 88.1,
        recommendation: 'Recommend',
        user: { name: 'Admin', email: 'admin@tca.com' },
        createdAt: '10/24/2025'
    },
    {
        id: 'rep-2',
        company: 'QuantumLeap AI',
        type: 'Triage',
        status: 'Completed',
        approval: 'Due Diligence',
        score: 7.8,
        confidence: 91.5,
        recommendation: 'Recommend',
        user: { name: 'Reviewer User', email: 'reviewer@tca.com' },
        createdAt: '10/23/2025'
    },
     {
        id: 'rep-3',
        company: 'SustainaTech',
        type: 'Triage',
        status: 'Completed',
        approval: 'Approved',
        score: 6.5,
        confidence: 85.2,
        recommendation: 'Hold',
        user: { name: 'Standard User', email: 'user@tca.com' },
        createdAt: '10/22/2025'
    },
    {
        id: 'rep-4',
        company: 'NextGen Med',
        type: 'Triage',
        status: 'Completed',
        approval: 'Rejected',
        score: 4.5,
        confidence: 90.1,
        recommendation: 'Reject',
        user: { name: 'Admin', email: 'admin@tca.com' },
        createdAt: '10/21/2025'
    },
    {
        id: 'rep-5',
        company: 'CyberSecure',
        type: 'Due Diligence',
        status: 'Completed',
        approval: 'Invested',
        score: 8.9,
        confidence: 94.0,
        recommendation: 'Invest',
        user: { name: 'Reviewer User', email: 'reviewer@tca.com' },
        createdAt: '10/20/2025'
    },
];

type Report = (typeof initialReportsData)[0] & { missingSections?: string[] };

const approvalStatusColors: { [key: string]: string } = {
  'Approved': 'bg-sky-500/20 text-sky-500',
  'Pending': 'bg-yellow-500/20 text-yellow-500',
  'Due Diligence': 'bg-blue-500/20 text-blue-500',
  'Rejected': 'bg-red-500/20 text-red-500',
  'Invested': 'bg-green-500/20 text-green-500',
};


const ReportCard = ({ report, isPrivileged }: { report: Report; isPrivileged: boolean }) => {
    return (
     <Card className="overflow-hidden">
        <div className="p-6 grid grid-cols-1 md:grid-cols-6 lg:grid-cols-8 items-center gap-4">
        <div className="md:col-span-6 lg:col-span-6 flex flex-wrap items-center gap-4">
            <div className="min-w-0">
            <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold truncate">{report.company}</h3>
                <Badge variant="outline">{report.type.toUpperCase()}</Badge>
                <Badge variant={report.status === 'Completed' ? 'success' : 'warning'}>{report.status}</Badge>
                <Badge className={approvalStatusColors[report.approval] || 'bg-gray-500/20'}>{report.approval}</Badge>
                 {isPrivileged && report.missingSections && report.missingSections.length > 0 && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Badge variant="destructive" className="gap-1">
                                    <AlertTriangle className="size-3"/> Missing Data
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>This report was generated with missing sections: {report.missingSections.join(', ')}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                 )}
            </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm">
            <div>
                <p className="text-muted-foreground">Overall Score</p>
                <p className="font-bold text-primary">{report.score}/10</p>
            </div>
            <div>
                <p className="text-muted-foreground">Confidence</p>
                <p className="font-bold">{report.confidence}%</p>
            </div>
            <div>
                <p className="text-muted-foreground">Recommendation</p>
                <p className={`font-bold ${report.recommendation === 'Recommend' || report.recommendation === 'Invest' ? 'text-success' : 'text-warning'}`}>{report.recommendation.toUpperCase()}</p>
            </div>
            <div>
                <p className="text-muted-foreground">User</p>
                <p className="font-semibold truncate">{report.user.name}</p>
            </div>
                <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-bold">{report.createdAt}</p>
            </div>
            </div>
        </div>

        <div className="md:col-span-6 lg:col-span-2 flex flex-col gap-2 self-start">
            {isPrivileged && report.type === 'Triage' && report.approval === 'Due Diligence' && (
                <Button asChild className="bg-blue-600 hover:bg-blue-700 justify-start">
                    <Link href="/dashboard/reports/due-diligence"><FileUp className="mr-2"/> Start Due Diligence</Link>
                </Button>
            )}
            <Button asChild variant="default" className='justify-start'>
                <Link href="/analysis/result"><Eye className="mr-2"/> View Report</Link>
            </Button>
            <div className='w-full'>
                <ExportButtons/>
            </div>
        </div>
        </div>
    </Card>
)};

export default function ReportsPage() {
  const [role, setRole] = useState<UserRole>('user');
  const [isPrivilegedUser, setPrivilegedUser] = useState(false);
  const [allReports, setAllReports] = useState<Report[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const storedUser = localStorage.getItem('loggedInUser');
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            const userRole = user.role?.toLowerCase() || 'user';
            setRole(userRole);
            setPrivilegedUser(userRole === 'admin' || userRole === 'reviewer');
        } catch (e) {
            setRole('user');
            setPrivilegedUser(false);
        }
    } else {
        setRole('user');
        setPrivilegedUser(false);
    }
    
    // Load reports from local storage
    try {
        const storedReports = localStorage.getItem('allReports');
        if (storedReports) {
            setAllReports(JSON.parse(storedReports));
        } else {
            localStorage.setItem('allReports', JSON.stringify(initialReportsData));
            setAllReports(initialReportsData);
        }
    } catch (e) {
        console.error("Failed to load reports from localStorage", e);
        setAllReports(initialReportsData);
    }

  }, []);

  const handleRefresh = () => {
    toast({
      title: "Refreshing Reports",
      description: "The list of reports is being updated.",
    });
  };

  const reportsForUser = allReports.filter(r => isPrivilegedUser || r.user.email === 'user@tca.com');
  const myReports = allReports.filter(r => r.user.email === 'admin@tca.com'); // This would be dynamic
  const pendingReports = allReports.filter(r => r.approval === 'Pending');


  return (
    <main className="bg-muted/20 min-h-screen">
      <div className="container mx-auto p-4 md:p-8">
        <header className="mb-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4"
          >
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </Link>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight flex items-center gap-2">
              <FileText />
              {isPrivilegedUser ? 'Evaluation Reports & Approval Center' : 'My Evaluation Reports'}
            </h1>
            <div className="flex items-center gap-4">
                 {(role === 'admin' || role === 'reviewer') && (
                   <div className="flex items-center space-x-2">
                      <Label htmlFor="role-switcher" className={!isPrivilegedUser ? 'text-primary' : ''}>User</Label>
                      <Switch
                          id="role-switcher"
                          checked={isPrivilegedUser}
                          onCheckedChange={(checked) => {
                            const newRole = checked ? 'admin' : 'user';
                            setRole(newRole);
                            setPrivilegedUser(newRole === 'admin' || newRole === 'reviewer');
                          }}
                      />
                      <Label htmlFor="role-switcher" className={isPrivilegedUser ? 'text-primary' : ''}>Admin / Reviewer</Label>
                  </div>
                 )}
              {isPrivilegedUser && <Button variant="outline" onClick={handleRefresh}><RefreshCw className="mr-2 size-4" /> Refresh</Button>}
            </div>
          </div>
        </header>

        {isPrivilegedUser && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                <StatCard title="Total Reports" value={allReports.length} />
                <StatCard title="Completed" value={allReports.filter(r => r.status === 'Completed').length} />
                <StatCard title="Due Diligence" value={allReports.filter(r => r.approval === 'Due Diligence').length} />
                <StatCard title="Pending Approval" value={pendingReports.length} />
                <StatCard title="Average Score" value={7.3} />
            </div>
        )}

        <Tabs defaultValue={isPrivilegedUser ? "all" : "my-reports"}>
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-4">
            <TabsList>
              {isPrivilegedUser ? (
                <>
                    <TabsTrigger value="all">All Reports ({reportsForUser.length})</TabsTrigger>
                    <TabsTrigger value="pending">Pending Approval ({pendingReports.length})</TabsTrigger>
                    <TabsTrigger value="my-reports">My Reports ({myReports.length})</TabsTrigger>
                </>
              ) : (
                <TabsTrigger value="my-reports">My Reports ({reportsForUser.length})</TabsTrigger>
              )}
            </TabsList>
            <div className="flex-1 w-full md:w-auto flex flex-col md:flex-row gap-2">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search reports by company name..."
                  className="pl-10 w-full"
                  />
              </div>
              {isPrivilegedUser && (
                <>
                <Select>
                    <SelectTrigger className="md:w-[180px]">
                    <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    </SelectContent>
                </Select>
                <Select>
                    <SelectTrigger className="md:w-[180px]">
                    <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="triage">Triage</SelectItem>
                    <SelectItem value="dd">Due Diligence</SelectItem>
                    </SelectContent>
                </Select>
                </>
              )}
            </div>
          </div>
          <TabsContent value="all" className="space-y-4">
             {reportsForUser.map(report => <ReportCard key={report.id} report={report} isPrivileged={isPrivilegedUser}/>)}
          </TabsContent>
          <TabsContent value="pending" className="space-y-4">
            {pendingReports.length > 0 ? pendingReports.map(report => <ReportCard key={report.id} report={report} isPrivileged={isPrivilegedUser}/>) : <p className="text-center text-muted-foreground py-10">No reports are pending approval.</p>}
          </TabsContent>
           <TabsContent value="my-reports" className="space-y-4">
            {myReports.length > 0 ? myReports.map(report => <ReportCard key={report.id} report={report} isPrivileged={isPrivilegedUser}/>) : <p className="text-center text-muted-foreground py-10">You have not created any reports.</p>}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
