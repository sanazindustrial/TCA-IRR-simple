
'use client';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  MoreHorizontal,
  Search,
  MessageSquare,
  FileText,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  Lightbulb,
  Bug,
  ShieldCheck,
  RefreshCw,
  Database,
  HelpCircle,
  Send,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: number, icon: React.ElementType, color?: string }) => (
    <Card className="flex-1">
        <CardContent className="p-4 flex items-center gap-4">
            <Icon className={cn('size-8', color || 'text-muted-foreground')} />
            <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-sm text-muted-foreground">{title}</p>
            </div>
        </CardContent>
    </Card>
);

const initialRequests = [
    { id: 'req-1', title: 'Need access to DD reports for Project Alpha', type: 'Due Diligence Access', user: 'Standard User', status: 'Pending', priority: 'High', date: '10/24/2025', description: 'User: Standard User\nCompany: Project Alpha\nRole: User\nReason for Access: Need to conduct deep-dive analysis for investment committee.', resolutionNotes: '' },
    { id: 'req-2', title: 'Bug: Report export to PDF fails', type: 'Bug Report', user: 'Reviewer User', status: 'In Review', priority: 'Critical', date: '10/23/2025', description: 'Page/Feature: "Report Export"\nExpected Behavior: PDF download should start.\nActual Behavior: The button is unresponsive and a console error appears.\nSteps to Reproduce:\n1. Open any completed report.\n2. Click "Export & Share".\n3. Select "PDF".', resolutionNotes: 'Confirmed the bug. The issue seems to be with the PDF generation library on Firefox. A fix is being deployed in v1.2.1.' },
    { id: 'req-3', title: 'Feature: Add custom scoring weights', type: 'Feature Request', user: 'Admin User', status: 'Approved', priority: 'Medium', date: '10/22/2025', description: 'Feature Idea: Allow admins to create and save custom weight profiles for TCA scorecard categories.\nProblem it Solves: Different sectors require different weighting. This would allow us to have a "Tech" profile and a "MedTech" profile.\nPotential Benefit: Increases analysis accuracy and flexibility.', resolutionNotes: 'Excellent idea. This has been approved and added to the Q4 roadmap. ETA for release is end of November.' },
    { id: 'req-4', title: 'Request for 5 more triage reports', type: 'Additional Triage Reports', user: 'Standard User', status: 'Completed', priority: 'Low', date: '10/21/2025', description: 'User: Standard User\nCurrent Limit: 10/month\nReports Needed: 5\nJustification: Have a new batch of startups to screen this month.', resolutionNotes: 'Approved. The report limit for the user has been increased by 5 for the current billing cycle.' },
    { id: 'req-5', title: 'Resubmit evaluation for Innovate Inc.', type: 'Resubmission Request', user: 'Standard User', status: 'Rejected', priority: 'Medium', date: '10/20/2025', description: 'Report ID: rep-1\nCompany: Innovate Inc.\nReason for Resubmission: The company provided an updated pitch deck with new financial projections.\nFiles to Update: Innovate_Pitch_Deck_Q4.pdf', resolutionNotes: 'Rejected. Please create a new evaluation for updated documents. Resubmissions are only for correcting system errors.' },
];

type Request = typeof initialRequests[0];

const requestCategories = [
    { id: 'additional_reports', title: 'Additional Triage Reports', icon: FileText },
    { id: 'due_diligence', title: 'Due Diligence Access', icon: ShieldCheck },
    { id: 'resubmission', title: 'Resubmission Request', icon: RefreshCw },
    { id: 'data_change', title: 'Data Change Request', icon: Database },
    { id: 'feature_request', title: 'Feature Request', icon: Lightbulb },
    { id: 'bug_report', title: 'Bug Report', icon: Bug },
    { id: 'data_quality', title: 'Data Quality Review', icon: Database },
    { id: 'risk_model', title: 'Risk Model Inquiry', icon: ShieldCheck },
    { id: 'compliance', title: 'Compliance Verification', icon: ShieldCheck },
    { id: 'scoring_anomaly', title: 'AI Scoring Anomaly', icon: Lightbulb },
    { id: 'general_question', title: 'General Question', icon: HelpCircle },
    { id: 'other', title: 'Other', icon: Send },
];

const typeIcons: { [key: string]: React.ElementType } = {
    'Feature Request': Lightbulb,
    'Bug Report': Bug,
    'General Question': MessageSquare,
    'Additional Triage Reports': FileText,
    'Due Diligence Access': ShieldCheck,
    'Resubmission Request': RefreshCw,
    'Data Change Request': Database,
    'Data Quality Review': Database,
    'Risk Model Inquiry': ShieldCheck,
    'Compliance Verification': ShieldCheck,
    'AI Scoring Anomaly': Lightbulb,
    'Other': Send,
    'default': FileText
}

const statusColors: { [key: string]: string } = {
    'Pending': 'bg-yellow-500/20 text-yellow-500',
    'In Review': 'bg-blue-500/20 text-blue-500',
    'Approved': 'bg-green-500/20 text-green-500',
    'Completed': 'bg-green-500/20 text-green-500',
    'Rejected': 'bg-red-500/20 text-red-500',
}

const priorityColors: { [key: string]: string } = {
    'Low': 'text-muted-foreground',
    'Medium': 'text-yellow-500',
    'High': 'text-orange-500',
    'Critical': 'text-red-500',
}


export default function UserRequestManagerPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [requests, setRequests] = useState<Request[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedRequests = localStorage.getItem('userRequests');
      if (storedRequests) {
        setRequests(JSON.parse(storedRequests));
      } else {
        localStorage.setItem('userRequests', JSON.stringify(initialRequests));
        setRequests(initialRequests);
      }
    } catch (error) {
      console.error("Could not parse user requests from localStorage", error);
      setRequests(initialRequests);
    }
  }, []);
  
  const handleViewDetails = (request: Request) => {
    setSelectedRequest(request);
    setResolutionNotes(request.resolutionNotes || '');
    setDialogOpen(true);
  };

  const updateRequest = (updatedRequest: Request) => {
    const updatedRequests = requests.map(req => 
      req.id === updatedRequest.id ? updatedRequest : req
    );
    setRequests(updatedRequests);
    localStorage.setItem('userRequests', JSON.stringify(updatedRequests));
  };

  const changeStatus = (requestId: string, newStatus: string) => {
    const request = requests.find(req => req.id === requestId);
    if(request) {
        updateRequest({ ...request, status: newStatus });
        toast({
        title: 'Status Updated',
        description: `Request has been marked as ${newStatus}.`
        });
    }
  }

  const deleteRequest = (requestId: string) => {
    const updatedRequests = requests.filter(req => req.id !== requestId);
    setRequests(updatedRequests);
    localStorage.setItem('userRequests', JSON.stringify(updatedRequests));
    toast({
        variant: 'destructive',
        title: 'Request Deleted',
        description: 'The user request has been permanently deleted.',
    });
  }
  
  const handleSaveNotes = () => {
    if (selectedRequest) {
      updateRequest({ ...selectedRequest, resolutionNotes });
      setDialogOpen(false);
      toast({
        title: 'Response Saved',
        description: `Resolution notes updated and a notification email has been sent to the user.`,
      });
    }
  };


  const filteredRequests = requests.filter(req => {
    const searchMatch = req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        req.user.toLowerCase().includes(searchQuery.toLowerCase());
    const statusMatch = statusFilter === 'all' || req.status === statusFilter;
    const typeMatch = typeFilter === 'all' || req.type === typeFilter;
    return searchMatch && statusMatch && typeMatch;
  });

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-6 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold">User Request Log</h1>
            <p className="text-muted-foreground">Review and manage all incoming user requests.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <Badge variant="outline">{requests.filter(r => r.status === 'Pending').length} Pending</Badge>
            <Badge variant="outline">{requests.filter(r => r.status === 'In Review').length} In Review</Badge>
        </div>
      </header>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <StatCard title="Total Requests" value={requests.length} icon={FileText} color="text-primary"/>
          <StatCard title="Pending" value={requests.filter(r => r.status === 'Pending').length} icon={Clock} color="text-warning"/>
          <StatCard title="In Review" value={requests.filter(r => r.status === 'In Review').length} icon={Eye} color="text-blue-500"/>
          <StatCard title="Approved" value={requests.filter(r => r.status === 'Approved' || r.status === 'Completed').length} icon={CheckCircle} color="text-success"/>
          <StatCard title="Rejected" value={requests.filter(r => r.status === 'Rejected').length} icon={XCircle} color="text-destructive"/>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
           <div className="flex items-center gap-4 mt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search requests by title, user..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="In Review">In Review</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {requestCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.title}>{cat.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length > 0 ? (
                filteredRequests.map(req => {
                  const Icon = typeIcons[req.type] || typeIcons.default;
                  return (
                    <TableRow key={req.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Icon className="size-5 text-muted-foreground"/>
                          <div>
                              <p className="font-medium">{req.title}</p>
                              <p className="text-xs text-muted-foreground">{req.type}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{req.user}</TableCell>
                      <TableCell>
                          <Badge className={cn('font-semibold', statusColors[req.status] || 'bg-gray-500/20 text-gray-500')}>{req.status}</Badge>
                      </TableCell>
                      <TableCell>
                          <p className={cn('font-semibold', priorityColors[req.priority] || 'text-muted-foreground')}>{req.priority}</p>
                      </TableCell>
                      <TableCell>{req.date}</TableCell>
                      <TableCell className="text-right">
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleViewDetails(req)}>View Details</DropdownMenuItem>
                              <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => changeStatus(req.id, 'In Review')}>In Review</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => changeStatus(req.id, 'Approved')}>Approve</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => changeStatus(req.id, 'Completed')}>Complete</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => changeStatus(req.id, 'Rejected')} className="text-destructive">Reject</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => deleteRequest(req.id)} className="text-destructive">
                                Delete Request
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                        <MessageSquare className="mx-auto h-12 w-12" />
                        <h3 className="mt-4 text-lg font-semibold">No requests found</h3>
                        <p>Try adjusting your search or filter criteria.</p>
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedRequest?.title}</DialogTitle>
            <DialogDescription>
              Submitted by {selectedRequest?.user} on {selectedRequest?.date}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-4">
              <div className='flex gap-4'>
                <Badge className={cn('font-semibold', statusColors[selectedRequest?.status || ''] || 'bg-gray-500/20 text-gray-500')}>{selectedRequest?.status}</Badge>
                <p className={cn('font-semibold', priorityColors[selectedRequest?.priority || ''] || 'text-muted-foreground')}>Priority: {selectedRequest?.priority}</p>
              </div>
              <div>
                  <h4 className="font-semibold mb-2">User's Request:</h4>
                  <Textarea
                    readOnly
                    value={selectedRequest?.description}
                    className="h-48 font-mono text-xs bg-muted/50"
                  />
              </div>
               <div>
                  <Label htmlFor="resolution-notes" className="font-semibold mb-2">Resolution Notes & Response:</Label>
                  <Textarea
                    id="resolution-notes"
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Add notes for the user here... This will be visible to them."
                    className="h-32"
                  />
              </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Close</Button>
            <Button onClick={handleSaveNotes}>Save & Notify User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
