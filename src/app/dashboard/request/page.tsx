
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Send,
  FileText,
  ShieldCheck,
  RefreshCw,
  Database,
  Lightbulb,
  HelpCircle,
  Bug,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/users';

const requestCategories = [
    { id: 'additional_reports', title: 'Additional Triage Reports', icon: FileText, template: 'User: [Your Name]\nCompany: [Company Name]\nCurrent Limit: [Current Report Limit]\nReports Needed: [Number]\nJustification: [Briefly explain why you need more reports]' },
    { id: 'due_diligence', title: 'Due Diligence Access', icon: ShieldCheck, template: 'User: [Your Name]\nCompany: [Company Name]\nRole: [Your Role]\nReason for Access: [Explain why you need DD report access]' },
    { id: 'resubmission', title: 'Resubmission Request', icon: RefreshCw, template: 'Report ID: [Report ID]\nCompany: [Company Name]\nReason for Resubmission: [e.g., Updated pitch deck, corrected financials]\nFiles to Update: [List files]' },
    { id: 'data_change', title: 'Data Change Request', icon: Database, template: 'Report ID: [Report ID]\nCompany: [Company Name]\nData to Change: [Specify the data point, e.g., "Market Size"]\nOld Value: [Old Value]\nNew Value: [New Value]\nSource/Proof of Change: [Provide link or documentation]' },
    { id: 'feature_request', title: 'Feature Request', icon: Lightbulb, template: 'Feature Idea: [Concisely describe the feature]\nProblem it Solves: [Explain the user pain point]\nPotential Benefit: [How would this improve the platform?]' },
    { id: 'bug_report', title: 'Bug Report', icon: Bug, template: 'Page/Feature: [e.g., "Report Generation", "User Login"]\nExpected Behavior: [What should have happened?]\nActual Behavior: [What actually happened?]\nSteps to Reproduce:\n1. ...\n2. ...\n3. ...' },
    { id: 'data_quality', title: 'Data Quality Review', icon: Database, template: 'Report ID or Company: [Report ID/Name]\nField/Section with Issue: [e.g., "Competitor List", "Financials"]\nDescription of Data Inaccuracy: [Please be specific]' },
    { id: 'risk_model', title: 'Risk Model Inquiry', icon: ShieldCheck, template: 'Report ID or Company: [Report ID/Name]\nRisk Domain in Question: [e.g., "Market Risk", "Regulatory"]\nMy Question: [What do you want to understand about the risk assessment?]' },
    { id: 'compliance', title: 'Compliance Verification', icon: ShieldCheck, template: 'Report ID or Company: [Report ID/Name]\nCompliance Area: [e.g., GDPR, HIPAA]\nRequest: [e.g., "Please verify data handling for GDPR."]' },
    { id: 'scoring_anomaly', title: 'AI Scoring Anomaly', icon: Lightbulb, template: 'Report ID or Company: [Report ID/Name]\nCategory with Anomaly: [e.g., "TCA Scorecard - Team"]\nObserved Anomaly: [Describe why you believe the score is incorrect]' },
    { id: 'general_question', title: 'General Question', icon: HelpCircle, template: 'My Question: [Type your question here]' },
    { id: 'other', title: 'Other', icon: Send, template: 'Subject: [Your Subject]\n\n[Please provide details of your request here.]' },
];


export default function SubmitRequestPage() {
    const [requestTitle, setRequestTitle] = useState('general_question');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [user, setUser] = useState<User | null>(null);

    const { toast } = useToast();

    useEffect(() => {
        const selectedCategory = requestCategories.find(rt => rt.id === requestTitle);
        if (selectedCategory) {
            setDescription(selectedCategory.template);
        } else {
            setDescription('');
        }
    }, [requestTitle]);

    useEffect(() => {
        const storedUser = localStorage.getItem('loggedInUser');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const handleRequestTitleChange = (newTitle: string) => {
        setRequestTitle(newTitle);
    };

    const handleSubmit = () => {
        const selectedCategory = requestCategories.find(c => c.id === requestTitle);
        if (!selectedCategory || !description.trim() || !priority.trim()) {
            toast({
                variant: 'destructive',
                title: 'Missing Information',
                description: 'Please select a request category, fill out the description, and set a priority.',
            });
            return;
        }

        try {
            const existingRequests = JSON.parse(localStorage.getItem('userRequests') || '[]');
            const newRequest = {
                id: `req-${Date.now()}`,
                title: selectedCategory.title,
                type: selectedCategory.title, // For consistency with log page
                user: user?.name || 'Unknown User',
                status: 'Pending',
                priority: priority,
                date: new Date().toLocaleDateString(),
                description: description, // Save the full description
            };

            const updatedRequests = [newRequest, ...existingRequests];
            localStorage.setItem('userRequests', JSON.stringify(updatedRequests));

            toast({
                title: 'Request Submitted',
                description: 'Your request has been sent to the admin team for review.',
            });
            
            // Reset form
            setRequestTitle('general_question');
            setPriority('Medium');
        } catch (error) {
            console.error('Failed to save request to localStorage:', error);
            toast({
                variant: 'destructive',
                title: 'Submission Failed',
                description: 'There was an error saving your request. Please try again.',
            });
        }
    };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Send />
            User Submit Request
          </CardTitle>
          <CardDescription>
            Request additional reports, features, support, or report issues.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="request-title">Request Title *</Label>
                    <Select value={requestTitle} onValueChange={handleRequestTitleChange}>
                        <SelectTrigger id="request-title">
                            <SelectValue placeholder="Select a request category..." />
                        </SelectTrigger>
                        <SelectContent>
                            {requestCategories.map(category => (
                                <SelectItem key={category.id} value={category.id}>
                                  <div className="flex items-center gap-2">
                                    <category.icon className="size-4 text-muted-foreground" />
                                    <span>{category.title}</span>
                                  </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="priority">Priority Level</Label>
                    <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger id="priority">
                        <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="description">Detailed Description *</Label>
                <Textarea id="description" placeholder="Please provide detailed information about your question/request..." rows={10} value={description} onChange={e => setDescription(e.target.value)} />
                <p className="text-xs text-muted-foreground">Selecting a request title will populate this field with a helpful template.</p>
            </div>
        </CardContent>
        <CardFooter>
            <Button size="lg" className="w-full" onClick={handleSubmit}>
                <Send className="mr-2"/>
                Submit Request
            </Button>
        </CardFooter>
       </Card>
    </div>
  );
}
