'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollText } from 'lucide-react';

export default function TermsOfUsePage() {
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-3">
        <ScrollText className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Terms of Use</h1>
      </div>
      <p className="text-muted-foreground text-sm">Last updated: January 2025</p>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">1. Acceptance of Terms</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2 leading-relaxed">
          <p>
            By accessing or using the TCA-IRR Analysis Platform ("Platform"), you agree to be bound by
            these Terms of Use ("Terms"). If you do not agree to these Terms, you may not access or use
            the Platform.
          </p>
          <p>
            These Terms apply to all users, including administrators, analysts, and read-only viewers.
            Your continued use of the Platform constitutes acceptance of any updates to these Terms.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">2. Authorized Use</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2 leading-relaxed">
          <p>
            The Platform is provided exclusively for internal investment analysis, due diligence, and
            reporting purposes by authorized personnel. You agree to:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Use the Platform only for lawful, authorized business purposes.</li>
            <li>Not share your credentials with any unauthorized person.</li>
            <li>Not attempt to access data or features beyond your assigned role permissions.</li>
            <li>Not reverse-engineer, copy, or redistribute any part of the Platform.</li>
            <li>Report suspected security vulnerabilities or unauthorized access immediately.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">3. Data and Confidentiality</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2 leading-relaxed">
          <p>
            All data processed through the Platform — including uploaded documents, extracted financial
            metrics, analysis results, and generated reports — is confidential and proprietary. You agree to:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Treat all Platform outputs as confidential information.</li>
            <li>Not disclose analysis results or reports to unauthorized third parties.</li>
            <li>Comply with applicable data protection laws and your organization's data policies.</li>
            <li>Not upload personally identifiable information (PII) beyond what is strictly necessary.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">4. AI-Generated Analysis Disclaimer</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2 leading-relaxed">
          <p>
            The Platform utilizes artificial intelligence and machine learning models to generate analysis
            and recommendations. These outputs are provided for informational purposes only and do not
            constitute financial, legal, or investment advice.
          </p>
          <p>
            All AI-generated outputs should be reviewed and validated by qualified professionals before
            being used in investment decisions. The Platform operators make no warranty as to the accuracy,
            completeness, or fitness for purpose of any AI-generated content.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">5. Account Responsibility</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2 leading-relaxed">
          <p>
            You are responsible for all activity conducted through your account. If you believe your
            account has been compromised, you must notify your system administrator immediately. Accounts
            showing suspicious activity may be suspended without notice.
          </p>
          <p>
            Session tokens expire after 8 hours of inactivity. You are responsible for logging out from
            shared or public devices.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">6. Intellectual Property</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2 leading-relaxed">
          <p>
            All software, models, interfaces, and methodologies comprising the Platform are the exclusive
            intellectual property of the operating organization. No license, ownership, or rights are
            transferred to users beyond the limited right to use the Platform for authorized purposes.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">7. Limitation of Liability</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2 leading-relaxed">
          <p>
            To the fullest extent permitted by law, the Platform operators shall not be liable for any
            indirect, incidental, consequential, or punitive damages arising from your use of the Platform,
            including but not limited to losses from reliance on AI-generated analysis outputs.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">8. Modifications</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2 leading-relaxed">
          <p>
            These Terms may be updated at any time. Material changes will be communicated to users via
            the Platform or by email. Continued use of the Platform after such notification constitutes
            acceptance of the revised Terms.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">9. Governing Law</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2 leading-relaxed">
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the applicable
            jurisdiction. Any disputes shall be subject to the exclusive jurisdiction of the competent
            courts of that jurisdiction.
          </p>
        </CardContent>
      </Card>

      <Separator />
      <p className="text-xs text-muted-foreground text-center pb-4">
        For questions about these Terms, contact your system administrator.
      </p>
    </div>
  );
}
