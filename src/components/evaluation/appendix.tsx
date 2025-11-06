'use client';
import { DashboardCard } from '@/components/shared/dashboard-card';
import { BookCopy, FileJson, MessageSquare, Users } from 'lucide-react';
import { useEvaluationContext } from './evaluation-provider';
import { Textarea } from '../ui/textarea';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

const initialAppendixData = {
  ceoCallNotes: "Q1: What's your biggest challenge?\nA1: Scaling our sales team effectively.\n\nQ2: How do you plan to use the new funding?\nA2: 40% on R&D for new AI features, 40% on sales & marketing, 20% on G&A.",
  customerInterviews: "Customer A (Enterprise): Loves the product's ROI but finds the UI a bit complex for new users.\n\nCustomer B (Mid-Market): Huge fan of the customer support. Wants more integration options.",
  uploadedDocs: [
    { name: 'Pitch_Deck_Q4.pdf', type: 'Pitch Deck' },
    { name: 'Financials_2-Year_Projections.xlsx', type: 'Financials' },
    { name: 'IP_Patent_Filing.pdf', type: 'IP Document' },
    { name: 'Market_Analysis_Report.docx', type: 'Research' },
  ],
  configSnapshot: {
    "tca_scorecard": {
      "version": "3.2",
      "weights": { "medtech": { "leadership": 15, "regulatory": 15, "pmf": 15, "team": 10 } }
    },
    "risk_flags": {
      "framework": "medtech",
      "penalties": { "red": -6.0 }
    }
  }
};

export function Appendix() {
  const { isEditable } = useEvaluationContext();
  const [data, setData] = useState(initialAppendixData);

  const handleTextChange = (field: 'ceoCallNotes' | 'customerInterviews', value: string) => {
    setData(prev => ({...prev, [field]: value}));
  };

  return (
    <DashboardCard
      title="Appendix: DD Artifacts & Config Snapshot"
      icon={BookCopy}
      description="CEO call notes, customer interviews, uploaded documents, and a snapshot of the evaluation configuration."
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2 text-muted-foreground"><MessageSquare /> CEO Call Notes</h4>
            {isEditable ? (
              <Textarea value={data.ceoCallNotes} onChange={e => handleTextChange('ceoCallNotes', e.target.value)} rows={6} />
            ) : (
              <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg whitespace-pre-wrap">{data.ceoCallNotes}</p>
            )}
          </div>
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2 text-muted-foreground"><Users /> Customer Interview Summaries</h4>
            {isEditable ? (
              <Textarea value={data.customerInterviews} onChange={e => handleTextChange('customerInterviews', e.target.value)} rows={6} />
            ) : (
              <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg whitespace-pre-wrap">{data.customerInterviews}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Uploaded Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.uploadedDocs.map(doc => (
                  <li key={doc.name} className="flex items-center justify-between text-sm">
                    <span>{doc.name}</span>
                    <Badge variant="secondary">{doc.type}</Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><FileJson/>Config Snapshot</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                readOnly
                value={JSON.stringify(data.configSnapshot, null, 2)}
                className="h-40 bg-muted/50 font-mono text-xs"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardCard>
  );
}
