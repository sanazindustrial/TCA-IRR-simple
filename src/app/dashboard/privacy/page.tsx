'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Shield } from 'lucide-react';

export default function PrivacyStatementPage() {
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Privacy Statement</h1>
      </div>
      <p className="text-muted-foreground text-sm">Last updated: January 2025</p>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">1. Overview</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2 leading-relaxed">
          <p>
            This Privacy Statement explains how the TCA-IRR Analysis Platform ("Platform") collects,
            uses, stores, and protects information about its users. We are committed to handling your
            data responsibly and in compliance with applicable privacy laws.
          </p>
          <p>
            This statement applies to all users of the Platform and governs information collected
            through your use of the Platform's features, including authentication, document uploads,
            analysis workflows, and reports.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">2. Information We Collect</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2 leading-relaxed">
          <p>We collect the following categories of information:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              <strong>Account information:</strong> Name, email address, role, and profile picture.
            </li>
            <li>
              <strong>Authentication data:</strong> Hashed passwords, session tokens, and login timestamps.
            </li>
            <li>
              <strong>Usage data:</strong> Pages visited, features used, actions performed, and session duration.
            </li>
            <li>
              <strong>Uploaded documents:</strong> Financial statements, data files, and other documents
              submitted for analysis.
            </li>
            <li>
              <strong>Analysis outputs:</strong> Extracted data, evaluation results, reports, and AI-generated
              summaries.
            </li>
            <li>
              <strong>Audit logs:</strong> Records of significant actions for security and compliance purposes.
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">3. How We Use Your Information</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2 leading-relaxed">
          <p>Information collected is used for the following purposes:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Authenticating your identity and maintaining your session.</li>
            <li>Providing analysis, evaluation, and reporting features.</li>
            <li>Personalizing your experience (e.g., saved preferences, profile settings).</li>
            <li>Monitoring system performance and detecting security incidents.</li>
            <li>Generating audit trails for compliance and governance requirements.</li>
            <li>Improving Platform functionality based on aggregated usage patterns.</li>
          </ul>
          <p>
            We do not sell, rent, or trade your personal information to third parties.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">4. Data Storage and Security</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2 leading-relaxed">
          <p>
            All data is stored on secure cloud infrastructure (Microsoft Azure). We employ the following
            security measures:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Encryption in transit (TLS 1.2+) for all data transmissions.</li>
            <li>Encryption at rest for databases and file storage.</li>
            <li>Role-based access controls limiting data access to authorized personnel.</li>
            <li>Regular security audits and vulnerability assessments.</li>
            <li>Session token expiry (8 hours) to reduce unauthorized access risk.</li>
            <li>Automatic account lockout after repeated failed login attempts.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">5. Data Retention</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2 leading-relaxed">
          <p>
            We retain data for as long as necessary to fulfill the purposes described in this statement
            or as required by applicable law. Specifically:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Account data is retained while your account is active.</li>
            <li>Uploaded documents and analysis results are retained per your organization's data policy.</li>
            <li>Audit logs are retained for a minimum of 90 days for security and compliance.</li>
            <li>Deleted accounts have personal data removed within 30 days.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">6. Cookies and Local Storage</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2 leading-relaxed">
          <p>
            The Platform uses browser local storage (not cookies) to store session tokens, user
            preferences, and profile data on your device. This data is:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Stored only on your browser — not transmitted to third parties.</li>
            <li>Cleared on explicit logout (session tokens) or browser data clearing.</li>
            <li>Limited to operational data required for Platform functionality.</li>
          </ul>
          <p>
            No third-party tracking cookies or analytics scripts are used on this Platform.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">7. AI Processing</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2 leading-relaxed">
          <p>
            Documents and data submitted for analysis may be processed by AI/ML systems to extract
            information, generate insights, and produce reports. By using the analysis features, you
            acknowledge and consent to this processing. AI-processed data is:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Used only for the analysis requested and not for AI model training without consent.</li>
            <li>Subject to the same security and confidentiality controls as all Platform data.</li>
            <li>Retained only as long as necessary per the data retention policy above.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">8. Your Rights</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2 leading-relaxed">
          <p>Depending on applicable law, you may have the right to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Access the personal information we hold about you.</li>
            <li>Request correction of inaccurate personal information.</li>
            <li>Request deletion of your personal information.</li>
            <li>Object to or restrict certain processing of your data.</li>
            <li>Receive a copy of your data in a portable format.</li>
          </ul>
          <p>
            To exercise these rights, contact your system administrator or data protection officer.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">9. Changes to This Statement</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2 leading-relaxed">
          <p>
            This Privacy Statement may be updated periodically to reflect changes in our practices or
            applicable law. Material changes will be communicated to users via the Platform. Continued use
            of the Platform after notification of changes constitutes acceptance of the updated statement.
          </p>
        </CardContent>
      </Card>

      <Separator />
      <p className="text-xs text-muted-foreground text-center pb-4">
        For privacy inquiries, contact your system administrator or data protection officer.
      </p>
    </div>
  );
}
