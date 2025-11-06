
'use client';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User } from '@/lib/users';
import Link from 'next/link';

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

export default function MyRequestsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [myRequests, setMyRequests] = useState<Request[]>([]);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('loggedInUser');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        const allRequests = JSON.parse(localStorage.getItem('userRequests') || '[]');
        const userRequests = allRequests.filter((req: Request) => req.user === parsedUser.name);
        setMyRequests(userRequests);
      }
    } catch (error) {
      console.error("Failed to load user data or requests:", error);
    }
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <div className="flex items-center gap-2">
          <Eye className="size-6 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold">My Requests</h1>
            <p className="text-muted-foreground">Track the status and resolution of your submitted requests.</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Submitted" value={myRequests.length} icon={FileText} color="text-primary"/>
          <StatCard title="Pending / In Review" value={myRequests.filter(r => r.status === 'Pending' || r.status === 'In Review').length} icon={Clock} color="text-warning"/>
          <StatCard title="Completed" value={myRequests.filter(r => r.status === 'Completed' || r.status === 'Approved').length} icon={CheckCircle} color="text-success"/>
          <StatCard title="Rejected" value={myRequests.filter(r => r.status === 'Rejected').length} icon={XCircle} color="text-destructive"/>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>My Request History</CardTitle>
          <CardDescription>
            Here you can see all your past and current requests. Click on a request to see the admin's response.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {myRequests.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {myRequests.map((req) => (
                <AccordionItem value={req.id} key={req.id}>
                  <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="text-left">
                            <p className="font-semibold">{req.title}</p>
                            <p className="text-sm text-muted-foreground">{req.date}</p>
                        </div>
                        <Badge className={cn('font-semibold', statusColors[req.status] || 'bg-gray-500/20 text-gray-500')}>{req.status}</Badge>
                      </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 bg-muted/30 rounded-b-lg">
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-muted-foreground text-sm">Your Request:</h4>
                            <p className="text-sm whitespace-pre-wrap font-mono bg-background/50 p-2 rounded-md mt-1">{req.description}</p>
                        </div>
                        {req.resolutionNotes ? (
                             <div>
                                <h4 className="font-semibold text-muted-foreground text-sm">Admin Response:</h4>
                                <div className="text-sm mt-1 whitespace-pre-wrap bg-muted p-3 rounded-md border-l-4 border-primary">
                                    <p className="text-foreground">{req.resolutionNotes}</p>
                                </div>
                            </div>
                        ) : (
                             <p className="text-sm text-muted-foreground italic text-center py-4">No response from admin yet.</p>
                        )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-lg font-semibold">No requests found.</h3>
              <p className="text-muted-foreground">You haven't submitted any requests yet.</p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/request">Submit a New Request</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
