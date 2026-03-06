
'use client';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileCode, Database, Users, FileText, Send, Settings, Link as LinkIcon, BrainCircuit } from 'lucide-react';
import ModuleConfigurationsSchema from './module-configurations/page';
import ExternalSourcesSchema from './external-sources/page';
import SystemConfigurationSchema from './system-configuration/page';

const usersSchema = `-- schema/users.sql

-- Enum type for user roles to ensure data consistency
CREATE TYPE user_role AS ENUM ('Admin', 'Reviewer', 'User', 'AI Adopter');

-- Main table for storing user information
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Store hashed passwords, never plaintext
    role user_role NOT NULL DEFAULT 'User',
    avatar_url VARCHAR(1024),
    status VARCHAR(20) DEFAULT 'Active', -- 'Active', 'Inactive', 'Suspended'
    last_activity TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Indexes for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- Table for user-specific settings or preferences
CREATE TABLE user_settings (
    setting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'dark',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    monthly_summary_enabled BOOLEAN DEFAULT TRUE
);

-- Table for managing user report quotas
CREATE TABLE report_quotas (
    quota_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    triage_reports_limit INTEGER, -- NULL for unlimited
    dd_reports_limit INTEGER, -- NULL for unlimited
    triage_reports_used INTEGER DEFAULT 0,
    dd_reports_used INTEGER DEFAULT 0,
    cycle_start_date DATE DEFAULT CURRENT_DATE
);`;

const evaluationsSchema = `-- schema/evaluations_and_reports.sql

-- Enum type for report types
CREATE TYPE report_type AS ENUM ('triage', 'dd');

-- Main table for companies
CREATE TABLE companies (
    company_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sector VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (name)
);

-- Central table for each evaluation run
CREATE TABLE evaluations (
    evaluation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(company_id),
    user_id UUID REFERENCES users(user_id),
    framework VARCHAR(50) NOT NULL, -- 'general' or 'medtech'
    report_type report_type NOT NULL, -- Explicitly define the report type for this evaluation run
    status VARCHAR(50) NOT NULL DEFAULT 'processing', -- 'processing', 'completed', 'failed'
    recommendation VARCHAR(50),
    overall_score NUMERIC(5, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
CREATE INDEX idx_evaluations_status ON evaluations(status);
CREATE INDEX idx_evaluations_user_id ON evaluations(user_id);
CREATE INDEX idx_evaluations_company_id ON evaluations(company_id);

-- Documents submitted for an evaluation
CREATE TABLE documents (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID REFERENCES evaluations(evaluation_id) ON DELETE CASCADE,
    file_name VARCHAR(255),
    file_type VARCHAR(50),
    storage_path VARCHAR(1024) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Metadata extracted from documents
CREATE TABLE document_metadata (
    metadata_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID UNIQUE REFERENCES documents(document_id) ON DELETE CASCADE,
    company_name VARCHAR(255),
    sector VARCHAR(100),
    stage VARCHAR(50),
    key_personnel JSONB,
    extracted_metrics JSONB,
    summary TEXT
);

-- A central table to manage all generated reports
CREATE TABLE reports (
    report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID UNIQUE REFERENCES evaluations(evaluation_id) ON DELETE CASCADE,
    report_type report_type NOT NULL,
    version VARCHAR(10) DEFAULT '2.0',
    final_summary TEXT,
    final_recommendation TEXT,
    triage_report_id UUID UNIQUE REFERENCES triage_reports(triage_report_id),
    dd_report_id UUID UNIQUE REFERENCES dd_reports(dd_report_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Ensures that a report is either a triage OR a dd report, but not both.
    CONSTRAINT chk_report_type CHECK (
        (report_type = 'triage' AND triage_report_id IS NOT NULL AND dd_report_id IS NULL) OR
        (report_type = 'dd' AND dd_report_id IS NOT NULL AND triage_report_id IS NULL)
    )
);
CREATE INDEX idx_reports_report_type ON reports(report_type);

-- Triage reports (high-level summary)
CREATE TABLE triage_reports (
    triage_report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    executive_summary TEXT,
    key_findings JSONB, -- Stores 20 sections of findings as a flexible JSONB object
    ai_recommendation TEXT,
    overall_triage_score NUMERIC(5, 2)
);

-- Due Diligence reports (links to all module data)
CREATE TABLE dd_reports (
    dd_report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Foreign keys to each of the 9 module data tables will be here
    tca_scorecard_id UUID UNIQUE,
    risk_flags_id UUID UNIQUE,
    benchmark_id UUID UNIQUE,
    macro_id UUID UNIQUE,
    gap_analysis_id UUID UNIQUE,
    growth_classifier_id UUID UNIQUE,
    funder_fit_id UUID UNIQUE,
    team_assessment_id UUID UNIQUE,
    strategic_fit_id UUID UNIQUE
);

-- 9 Module Tables Follow --

-- 1. TCA Scorecard Module Data
CREATE TABLE module_tca_scorecard (
    tca_scorecard_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID UNIQUE REFERENCES evaluations(evaluation_id) ON DELETE CASCADE,
    composite_score NUMERIC(5, 2),
    summary TEXT,
    categories JSONB, -- Array of category objects
    interpretation TEXT,
    ai_recommendation TEXT
);

-- 2. Risk Flags Module Data
CREATE TABLE module_risk_flags (
    risk_flags_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID UNIQUE REFERENCES evaluations(evaluation_id) ON DELETE CASCADE,
    risk_summary TEXT,
    risk_flags JSONB, -- Array of risk flag objects
    interpretation TEXT,
    ai_recommendation TEXT
);

-- 3. Benchmark Comparison Module Data
CREATE TABLE module_benchmark_comparison (
    benchmark_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID UNIQUE REFERENCES evaluations(evaluation_id) ON DELETE CASCADE,
    performance_summary TEXT,
    overlay_score NUMERIC(4, 2),
    benchmark_data JSONB, -- For percentile ranks
    competitor_analysis JSONB, -- For spider chart
    interpretation TEXT,
    ai_recommendation TEXT
);

-- 4. Macro Trend Alignment Module Data
CREATE TABLE module_macro_trend (
    macro_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID UNIQUE REFERENCES evaluations(evaluation_id) ON DELETE CASCADE,
    trend_overlay_score NUMERIC(4, 2),
    summary TEXT,
    pestel_dashboard JSONB,
    trend_signals TEXT[],
    interpretation TEXT,
    ai_recommendation TEXT
);

-- 5. Gap Analysis Module Data
CREATE TABLE module_gap_analysis (
    gap_analysis_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID UNIQUE REFERENCES evaluations(evaluation_id) ON DELETE CASCADE,
    overall_readiness_score NUMERIC(5, 2),
    summary TEXT,
    gap_heatmap JSONB,
    action_roadmap JSONB,
    interpretation TEXT,
    ai_recommendation TEXT
);

-- 6. Growth Classifier Module Data
CREATE TABLE module_growth_classifier (
    growth_classifier_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID UNIQUE REFERENCES evaluations(evaluation_id) ON DELETE CASCADE,
    growth_tier INTEGER,
    confidence_score NUMERIC(5, 2),
    analysis TEXT,
    scenario_simulations JSONB,
    interpretation TEXT,
    ai_recommendation TEXT
);

-- 7. Funder Fit Module Data
CREATE TABLE module_funder_fit (
    funder_fit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID UNIQUE REFERENCES evaluations(evaluation_id) ON DELETE CASCADE,
    funding_readiness_score NUMERIC(5, 2),
    investor_shortlist JSONB,
    interpretation TEXT,
    ai_recommendation TEXT
);

-- 8. Team Assessment Module Data
CREATE TABLE module_team_assessment (
    team_assessment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID UNIQUE REFERENCES evaluations(evaluation_id) ON DELETE CASCADE,
    team_score NUMERIC(5, 2),
    summary TEXT,
    team_members JSONB,
    interpretation TEXT,
    ai_recommendation TEXT
);

-- 9. Strategic Fit Module Data
CREATE TABLE module_strategic_fit (
    strategic_fit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID UNIQUE REFERENCES evaluations(evaluation_id) ON DELETE CASCADE,
    overall_fit_score NUMERIC(5, 2),
    fit_matrix JSONB,
    summary TEXT,
    interpretation TEXT,
    ai_recommendation TEXT
);
`;

const requestsSchema = `-- schema/app_requests.sql

-- Table to store user-submitted requests (e.g., support, features, data changes)
CREATE TABLE app_requests (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id),
    request_type VARCHAR(50) NOT NULL, -- 'feature_request', 'bug_report', etc.
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'in_review', 'approved', 'rejected', 'completed'
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    reviewer_id UUID REFERENCES users(user_id) -- User who is handling the request
);

CREATE INDEX idx_app_requests_user_id ON app_requests(user_id);
CREATE INDEX idx_app_requests_status ON app_requests(status);
CREATE INDEX idx_app_requests_type ON app_requests(request_type);`;


const SchemaViewer = ({ content }: { content: string }) => {
  return (
    <pre className="bg-muted/50 p-4 rounded-lg overflow-x-auto text-sm font-mono">
      <code>{content}</code>
    </pre>
  );
};

export default function SchemaPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Database className="text-primary" />
          Database Schema & Models
        </h1>
        <p className="text-muted-foreground">
          PostgreSQL schema definitions for the application's data structures.
        </p>
      </header>

      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="evaluations" className="w-full">
            <TabsList className="p-2 h-auto rounded-b-none grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 w-full">
              <TabsTrigger value="users" className="py-2 flex items-center gap-2">
                <Users /> Users
              </TabsTrigger>
              <TabsTrigger value="evaluations" className="py-2 flex items-center gap-2">
                <FileText /> Reports
              </TabsTrigger>
              <TabsTrigger value="modules" className="py-2 flex items-center gap-2">
                <BrainCircuit /> Modules
              </TabsTrigger>
              <TabsTrigger value="system-configs" className="py-2 flex items-center gap-2">
                <Settings /> System Config
              </TabsTrigger>
               <TabsTrigger value="external-sources" className="py-2 flex items-center gap-2">
                <LinkIcon /> External Sources
              </TabsTrigger>
              <TabsTrigger value="requests" className="py-2 flex items-center gap-2">
                <Send /> App Requests
              </TabsTrigger>
            </TabsList>
            <div className="p-6">
                <TabsContent value="users">
                    <CardHeader className="px-0">
                        <CardTitle>User & Authentication Schema</CardTitle>
                        <CardDescription>
                            Defines tables for users, roles, settings, and quotas.
                        </CardDescription>
                    </CardHeader>
                    <SchemaViewer content={usersSchema} />
                </TabsContent>
                <TabsContent value="evaluations">
                     <CardHeader className="px-0">
                        <CardTitle>Evaluations, Reports & Documents Schema</CardTitle>
                        <CardDescription>
                            Defines the core tables for evaluation runs, the resulting triage/DD reports, and submitted documents with their extracted metadata.
                        </CardDescription>
                    </CardHeader>
                    <SchemaViewer content={evaluationsSchema} />
                </TabsContent>
                 <TabsContent value="modules">
                     <CardHeader className="px-0">
                        <CardTitle>Analysis Modules Schema</CardTitle>
                        <CardDescription>
                            Defines the nine dedicated tables for storing detailed results from each analysis module.
                        </CardDescription>
                    </CardHeader>
                    <SchemaViewer content={evaluationsSchema.substring(evaluationsSchema.indexOf("-- 9 Module Tables Follow --"))} />
                </TabsContent>
                 <TabsContent value="system-configs">
                    <SystemConfigurationSchema />
                </TabsContent>
                <TabsContent value="module-configs">
                    <ModuleConfigurationsSchema />
                </TabsContent>
                <TabsContent value="external-sources">
                    <ExternalSourcesSchema />
                </TabsContent>
                <TabsContent value="requests">
                     <CardHeader className="px-0">
                        <CardTitle>Application Requests Schema</CardTitle>
                        <CardDescription>
                            Defines the table for managing user-submitted requests from the "Submit Request" page.
                        </CardDescription>
                    </CardHeader>
                    <SchemaViewer content={requestsSchema} />
                </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
