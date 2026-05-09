(()=>{var a={};a.id=9925,a.ids=[9925],a.modules={261:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/app-paths")},3295:a=>{"use strict";a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},5736:(a,b,c)=>{"use strict";c.r(b),c.d(b,{default:()=>d});let d=(0,c(97954).registerClientReference)(function(){throw Error("Attempted to call the default export of \"C:\\\\Users\\\\verso\\\\OneDrive\\\\Desktop\\\\TCA-IRR-simple-src\\\\src\\\\app\\\\dashboard\\\\schema\\\\page.tsx\" from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"C:\\Users\\verso\\OneDrive\\Desktop\\TCA-IRR-simple-src\\src\\app\\dashboard\\schema\\page.tsx","default")},10846:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},19121:a=>{"use strict";a.exports=require("next/dist/server/app-render/action-async-storage.external.js")},26713:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/is-bot")},28354:a=>{"use strict";a.exports=require("util")},29294:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},33873:a=>{"use strict";a.exports=require("path")},35543:(a,b,c)=>{Promise.resolve().then(c.bind(c,56511))},41025:a=>{"use strict";a.exports=require("next/dist/server/app-render/dynamic-access-async-storage.external.js")},44928:(a,b,c)=>{"use strict";c.d(b,{Xi:()=>j,av:()=>k,j7:()=>i,tU:()=>h});var d=c(21124),e=c(38301),f=c(89989),g=c(44943);let h=f.bL,i=e.forwardRef(({className:a,...b},c)=>(0,d.jsx)(f.B8,{ref:c,className:(0,g.cn)("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",a),...b}));i.displayName=f.B8.displayName;let j=e.forwardRef(({className:a,...b},c)=>(0,d.jsx)(f.l9,{ref:c,className:(0,g.cn)("inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",a),...b}));j.displayName=f.l9.displayName;let k=e.forwardRef(({className:a,...b},c)=>(0,d.jsx)(f.UC,{ref:c,className:(0,g.cn)("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",a),...b}));k.displayName=f.UC.displayName},56511:(a,b,c)=>{"use strict";c.r(b),c.d(b,{default:()=>d});let d=(0,c(97954).registerClientReference)(function(){throw Error("Attempted to call the default export of \"C:\\\\Users\\\\verso\\\\OneDrive\\\\Desktop\\\\TCA-IRR-simple-src\\\\src\\\\app\\\\dashboard\\\\error.tsx\" from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"C:\\Users\\verso\\OneDrive\\Desktop\\TCA-IRR-simple-src\\src\\app\\dashboard\\error.tsx","default")},59359:(a,b,c)=>{"use strict";c.r(b),c.d(b,{default:()=>A});var d=c(21124),e=c(62186),f=c(44928),g=c(61454),h=c(84407),i=c(77249),j=c(59865),k=c(51886),l=c(52679),m=c(94429);let n=`-- schema/module_configurations.sql

-- Table to store versioned configurations for each analysis module
CREATE TABLE module_configurations (
    config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id VARCHAR(50) NOT NULL, -- e.g., 'tca', 'risk', 'benchmark'
    version INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL, -- e.g., "Q3 2024 Default", "MedTech Optimized v2"
    description TEXT,
    configuration_data JSONB NOT NULL, -- The actual JSON configuration object
    is_default BOOLEAN DEFAULT FALSE, -- Marks the factory default config
    is_active BOOLEAN DEFAULT FALSE, -- The currently active config for a module
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(user_id),

    -- Ensure only one active and one default config per module
    UNIQUE (module_id, version)
);

CREATE INDEX idx_module_configurations_module_id ON module_configurations(module_id);
CREATE INDEX idx_module_configurations_active ON module_configurations(module_id) WHERE is_active = TRUE;
CREATE INDEX idx_module_configurations_default ON module_configurations(module_id) WHERE is_default = TRUE;


-- Table to log all changes to configurations for audit purposes
CREATE TABLE config_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID REFERENCES module_configurations(config_id),
    changed_by UUID REFERENCES users(user_id),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    change_description TEXT NOT NULL,
    previous_configuration_data JSONB
);

CREATE INDEX idx_config_history_config_id ON config_history(config_id);
`,o=({content:a})=>(0,d.jsx)("pre",{className:"bg-muted/50 p-4 rounded-lg overflow-x-auto text-sm font-mono",children:(0,d.jsx)("code",{children:a})});function p(){return(0,d.jsxs)("div",{children:[(0,d.jsxs)(e.aR,{className:"px-0",children:[(0,d.jsx)(e.ZB,{children:"Module Configurations Schema"}),(0,d.jsx)(e.BT,{children:"Defines tables for saving, versioning, and rolling back analysis module configurations."})]}),(0,d.jsx)(o,{content:n})]})}let q=`-- schema/external_sources.sql

-- Create an enum type for source types for data consistency
CREATE TYPE source_type AS ENUM ('API', 'Website', 'Database');

-- Create an enum type for pricing tiers
CREATE TYPE pricing_tier AS ENUM ('Free', 'Freemium', 'Premium', 'Enterprise');

-- Main table to store all external data source configurations
CREATE TABLE external_sources (
    source_id VARCHAR(255) PRIMARY KEY, -- A unique identifier string for the source, e.g., 'crunchbase'
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    description TEXT,
    url VARCHAR(1024),
    api_url VARCHAR(1024),
    api_key_encrypted VARCHAR(1024), -- API keys should always be stored encrypted at rest
    source_type source_type,
    pricing pricing_tier,
    rate_limit VARCHAR(100),
    success_rate NUMERIC(5, 2), -- e.g., 99.50
    avg_response_ms INTEGER, -- Average response time in milliseconds
    tags TEXT[], -- Array of text tags for better searching
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    
    UNIQUE (name)
);

CREATE INDEX idx_external_sources_category ON external_sources(category);
CREATE INDEX idx_external_sources_tags ON external_sources USING GIN(tags);

-- Table to log connection tests and their outcomes
CREATE TABLE source_connection_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id VARCHAR(255) REFERENCES external_sources(source_id) ON DELETE CASCADE,
    test_timestamp TIMESTAMPTZ DEFAULT NOW(),
    was_successful BOOLEAN NOT NULL,
    response_code INTEGER,
    error_message TEXT
);

CREATE INDEX idx_source_connection_logs_source_id ON source_connection_logs(source_id);
`,r=({content:a})=>(0,d.jsx)("pre",{className:"bg-muted/50 p-4 rounded-lg overflow-x-auto text-sm font-mono",children:(0,d.jsx)("code",{children:a})});function s(){return(0,d.jsxs)("div",{children:[(0,d.jsxs)(e.aR,{className:"px-0",children:[(0,d.jsx)(e.ZB,{children:"External Sources Schema"}),(0,d.jsx)(e.BT,{children:"Defines tables for storing and managing configurations for all external data sources."})]}),(0,d.jsx)(r,{content:q})]})}let t=`-- schema/system_configurations.sql

-- Enum type for variable scope
CREATE TYPE env_var_scope AS ENUM ('frontend', 'backend');

-- Table to store system-wide environment variables
CREATE TABLE system_env_variables (
    var_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    value_encrypted VARCHAR(2048) NOT NULL, -- Always store encrypted
    scope env_var_scope NOT NULL,
    description TEXT,
    is_secret BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE INDEX idx_system_env_variables_name ON system_env_variables(name);
CREATE INDEX idx_system_env_variables_scope ON system_env_variables(scope);

-- Table to store API keys for various services
CREATE TABLE system_api_keys (
    key_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'OpenAI', 'Gemini', 'Crunchbase'
    key_value_encrypted VARCHAR(2048) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_tested_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE INDEX idx_system_api_keys_service_name ON system_api_keys(service_name);
`,u=({content:a})=>(0,d.jsx)("pre",{className:"bg-muted/50 p-4 rounded-lg overflow-x-auto text-sm font-mono",children:(0,d.jsx)("code",{children:a})});function v(){return(0,d.jsxs)("div",{children:[(0,d.jsxs)(e.aR,{className:"px-0",children:[(0,d.jsx)(e.ZB,{children:"System Configuration Schema"}),(0,d.jsx)(e.BT,{children:"Defines tables for storing environment variables and API keys securely."})]}),(0,d.jsx)(u,{content:t})]})}let w=`-- schema/users.sql

-- Enum type for user roles to ensure data consistency
CREATE TYPE user_role AS ENUM ('Admin', 'Analyst', 'User', 'AI Adopter');

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
);`,x=`-- schema/evaluations_and_reports.sql

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
`,y=`-- schema/app_requests.sql

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
CREATE INDEX idx_app_requests_type ON app_requests(request_type);`,z=({content:a})=>(0,d.jsx)("pre",{className:"bg-muted/50 p-4 rounded-lg overflow-x-auto text-sm font-mono",children:(0,d.jsx)("code",{children:a})});function A(){return(0,d.jsxs)("div",{className:"container mx-auto p-4 md:p-8",children:[(0,d.jsxs)("header",{className:"mb-8",children:[(0,d.jsxs)("h1",{className:"text-2xl font-semibold flex items-center gap-2",children:[(0,d.jsx)(g.A,{className:"text-primary"}),"Database Schema & Models"]}),(0,d.jsx)("p",{className:"text-muted-foreground",children:"PostgreSQL schema definitions for the application's data structures."})]}),(0,d.jsx)(e.Zp,{children:(0,d.jsx)(e.Wu,{className:"p-0",children:(0,d.jsxs)(f.tU,{defaultValue:"evaluations",className:"w-full",children:[(0,d.jsxs)(f.j7,{className:"p-2 h-auto rounded-b-none grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 w-full",children:[(0,d.jsxs)(f.Xi,{value:"users",className:"py-2 flex items-center gap-2",children:[(0,d.jsx)(h.A,{})," Users"]}),(0,d.jsxs)(f.Xi,{value:"evaluations",className:"py-2 flex items-center gap-2",children:[(0,d.jsx)(i.A,{})," Reports"]}),(0,d.jsxs)(f.Xi,{value:"modules",className:"py-2 flex items-center gap-2",children:[(0,d.jsx)(j.A,{})," Modules"]}),(0,d.jsxs)(f.Xi,{value:"system-configs",className:"py-2 flex items-center gap-2",children:[(0,d.jsx)(k.A,{})," System Config"]}),(0,d.jsxs)(f.Xi,{value:"external-sources",className:"py-2 flex items-center gap-2",children:[(0,d.jsx)(l.A,{})," External Sources"]}),(0,d.jsxs)(f.Xi,{value:"requests",className:"py-2 flex items-center gap-2",children:[(0,d.jsx)(m.A,{})," App Requests"]})]}),(0,d.jsxs)("div",{className:"p-6",children:[(0,d.jsxs)(f.av,{value:"users",children:[(0,d.jsxs)(e.aR,{className:"px-0",children:[(0,d.jsx)(e.ZB,{children:"User & Authentication Schema"}),(0,d.jsx)(e.BT,{children:"Defines tables for users, roles, settings, and quotas."})]}),(0,d.jsx)(z,{content:w})]}),(0,d.jsxs)(f.av,{value:"evaluations",children:[(0,d.jsxs)(e.aR,{className:"px-0",children:[(0,d.jsx)(e.ZB,{children:"Evaluations, Reports & Documents Schema"}),(0,d.jsx)(e.BT,{children:"Defines the core tables for evaluation runs, the resulting triage/DD reports, and submitted documents with their extracted metadata."})]}),(0,d.jsx)(z,{content:x})]}),(0,d.jsxs)(f.av,{value:"modules",children:[(0,d.jsxs)(e.aR,{className:"px-0",children:[(0,d.jsx)(e.ZB,{children:"Analysis Modules Schema"}),(0,d.jsx)(e.BT,{children:"Defines the nine dedicated tables for storing detailed results from each analysis module."})]}),(0,d.jsx)(z,{content:x.substring(x.indexOf("-- 9 Module Tables Follow --"))})]}),(0,d.jsx)(f.av,{value:"system-configs",children:(0,d.jsx)(v,{})}),(0,d.jsx)(f.av,{value:"module-configs",children:(0,d.jsx)(p,{})}),(0,d.jsx)(f.av,{value:"external-sources",children:(0,d.jsx)(s,{})}),(0,d.jsxs)(f.av,{value:"requests",children:[(0,d.jsxs)(e.aR,{className:"px-0",children:[(0,d.jsx)(e.ZB,{children:"Application Requests Schema"}),(0,d.jsx)(e.BT,{children:'Defines the table for managing user-submitted requests from the "Submit Request" page.'})]}),(0,d.jsx)(z,{content:y})]})]})]})})})]})}},62186:(a,b,c)=>{"use strict";c.d(b,{BT:()=>j,Wu:()=>k,ZB:()=>i,Zp:()=>g,aR:()=>h,wL:()=>l});var d=c(21124),e=c(38301),f=c(44943);let g=e.forwardRef(({className:a,...b},c)=>(0,d.jsx)("div",{ref:c,className:(0,f.cn)("rounded-lg border bg-card text-card-foreground shadow-sm",a),...b}));g.displayName="Card";let h=e.forwardRef(({className:a,...b},c)=>(0,d.jsx)("div",{ref:c,className:(0,f.cn)("flex flex-col space-y-1.5 p-6",a),...b}));h.displayName="CardHeader";let i=e.forwardRef(({className:a,...b},c)=>(0,d.jsx)("div",{ref:c,className:(0,f.cn)("text-2xl font-semibold leading-none tracking-tight",a),...b}));i.displayName="CardTitle";let j=e.forwardRef(({className:a,...b},c)=>(0,d.jsx)("div",{ref:c,className:(0,f.cn)("text-sm text-muted-foreground",a),...b}));j.displayName="CardDescription";let k=e.forwardRef(({className:a,...b},c)=>(0,d.jsx)("div",{ref:c,className:(0,f.cn)("p-6 pt-0",a),...b}));k.displayName="CardContent";let l=e.forwardRef(({className:a,...b},c)=>(0,d.jsx)("div",{ref:c,className:(0,f.cn)("flex items-center p-6 pt-0",a),...b}));l.displayName="CardFooter"},63033:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},63229:(a,b,c)=>{Promise.resolve().then(c.bind(c,59359))},67965:(a,b,c)=>{Promise.resolve().then(c.bind(c,5736))},68895:(a,b,c)=>{"use strict";c.r(b),c.d(b,{default:()=>j});var d=c(75338),e=c(11840),f=c(65169),g=c.n(f),h=c(80151),i=c(7075);function j({children:a}){return(0,d.jsxs)(e.SidebarProvider,{children:[(0,d.jsxs)(e.Sidebar,{children:[(0,d.jsx)(e.SidebarHeader,{children:(0,d.jsxs)(g(),{href:"/dashboard",className:"flex items-center gap-2 px-2 py-1",children:[(0,d.jsx)("img",{src:"/icon.jpg",className:"h-8 w-8 object-contain flex-shrink-0",alt:"TCA Venture Group"}),(0,d.jsx)("span",{className:"font-bold text-base group-data-[collapsible=icon]:hidden",children:"TCA-IRR"})]})}),(0,d.jsx)(h.SidebarMenuClient,{}),(0,d.jsxs)(e.SidebarFooter,{children:[(0,d.jsx)(i.ServiceHealthIndicator,{}),(0,d.jsx)(h.SidebarMenuClient,{isFooter:!0})]})]}),(0,d.jsx)(e.SidebarInset,{children:a})]})}},76517:(a,b,c)=>{"use strict";c.r(b),c.d(b,{default:()=>l});var d=c(21124);c(38301);var e=c(35284),f=c(92080),g=c(9987),h=c(66782),i=c(98123),j=c(3991),k=c.n(j);function l({error:a,reset:b}){return(0,d.jsx)("div",{className:"flex items-center justify-center min-h-[60vh] p-4",children:(0,d.jsxs)("div",{className:"text-center max-w-md",children:[(0,d.jsx)("div",{className:"flex justify-center mb-6",children:(0,d.jsx)("div",{className:"p-4 rounded-full bg-destructive/10",children:(0,d.jsx)(f.A,{className:"h-12 w-12 text-destructive"})})}),(0,d.jsx)("h1",{className:"text-2xl font-bold text-foreground mb-2",children:"Dashboard Error"}),(0,d.jsx)("p",{className:"text-muted-foreground mb-6",children:"An error occurred while loading this dashboard component."}),!1,(0,d.jsxs)("div",{className:"flex gap-4 justify-center flex-wrap",children:[(0,d.jsxs)(e.$,{variant:"outline",onClick:b,children:[(0,d.jsx)(g.A,{className:"mr-2 h-4 w-4"}),"Try Again"]}),(0,d.jsx)(e.$,{variant:"outline",asChild:!0,children:(0,d.jsxs)(k(),{href:"/dashboard",children:[(0,d.jsx)(h.A,{className:"mr-2 h-4 w-4"}),"Back to Dashboard"]})}),(0,d.jsx)(e.$,{asChild:!0,children:(0,d.jsxs)(k(),{href:"/",children:[(0,d.jsx)(i.A,{className:"mr-2 h-4 w-4"}),"Home"]})})]})]})})}},82723:(a,b,c)=>{"use strict";c.r(b),c.d(b,{GlobalError:()=>D.a,__next_app__:()=>J,handler:()=>L,pages:()=>I,routeModule:()=>K,tree:()=>H});var d=c(49754),e=c(9117),f=c(46595),g=c(32324),h=c(39326),i=c(38928),j=c(20175),k=c(12),l=c(54290),m=c(12696),n=c(82802),o=c(77533),p=c(45229),q=c(32822),r=c(261),s=c(26453),t=c(52474),u=c(26713),v=c(51356),w=c(62685),x=c(36225),y=c(63446),z=c(2762),A=c(45742),B=c(86439),C=c(81170),D=c.n(C),E=c(62506),F=c(91203),G={};for(let a in E)0>["default","tree","pages","GlobalError","__next_app__","routeModule","handler"].indexOf(a)&&(G[a]=()=>E[a]);c.d(b,G);let H={children:["",{children:["dashboard",{children:["schema",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(c.bind(c,5736)),"C:\\Users\\verso\\OneDrive\\Desktop\\TCA-IRR-simple-src\\src\\app\\dashboard\\schema\\page.tsx"]}]},{}]},{layout:[()=>Promise.resolve().then(c.bind(c,68895)),"C:\\Users\\verso\\OneDrive\\Desktop\\TCA-IRR-simple-src\\src\\app\\dashboard\\layout.tsx"],error:[()=>Promise.resolve().then(c.bind(c,56511)),"C:\\Users\\verso\\OneDrive\\Desktop\\TCA-IRR-simple-src\\src\\app\\dashboard\\error.tsx"],metadata:{icon:[async a=>(await Promise.resolve().then(c.bind(c,70440))).default(a),async a=>(await Promise.resolve().then(c.bind(c,59645))).default(a)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]},{layout:[()=>Promise.resolve().then(c.bind(c,51472)),"C:\\Users\\verso\\OneDrive\\Desktop\\TCA-IRR-simple-src\\src\\app\\layout.tsx"],error:[()=>Promise.resolve().then(c.bind(c,5682)),"C:\\Users\\verso\\OneDrive\\Desktop\\TCA-IRR-simple-src\\src\\app\\error.tsx"],loading:[()=>Promise.resolve().then(c.bind(c,23296)),"C:\\Users\\verso\\OneDrive\\Desktop\\TCA-IRR-simple-src\\src\\app\\loading.tsx"],"global-error":[()=>Promise.resolve().then(c.t.bind(c,81170,23)),"next/dist/client/components/builtin/global-error.js"],"not-found":[()=>Promise.resolve().then(c.bind(c,59732)),"C:\\Users\\verso\\OneDrive\\Desktop\\TCA-IRR-simple-src\\src\\app\\not-found.tsx"],forbidden:[()=>Promise.resolve().then(c.t.bind(c,90461,23)),"next/dist/client/components/builtin/forbidden.js"],unauthorized:[()=>Promise.resolve().then(c.t.bind(c,32768,23)),"next/dist/client/components/builtin/unauthorized.js"],metadata:{icon:[async a=>(await Promise.resolve().then(c.bind(c,70440))).default(a),async a=>(await Promise.resolve().then(c.bind(c,59645))).default(a)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]}.children,I=["C:\\Users\\verso\\OneDrive\\Desktop\\TCA-IRR-simple-src\\src\\app\\dashboard\\schema\\page.tsx"],J={require:c,loadChunk:()=>Promise.resolve()},K=new d.AppPageRouteModule({definition:{kind:e.RouteKind.APP_PAGE,page:"/dashboard/schema/page",pathname:"/dashboard/schema",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:H},distDir:".next",relativeProjectDir:""});async function L(a,b,d){var C;let G="/dashboard/schema/page";"/index"===G&&(G="/");let M=(0,h.getRequestMeta)(a,"postponed"),N=(0,h.getRequestMeta)(a,"minimalMode"),O=await K.prepare(a,b,{srcPage:G,multiZoneDraftMode:!1});if(!O)return b.statusCode=400,b.end("Bad Request"),null==d.waitUntil||d.waitUntil.call(d,Promise.resolve()),null;let{buildId:P,query:Q,params:R,parsedUrl:S,pageIsDynamic:T,buildManifest:U,nextFontManifest:V,reactLoadableManifest:W,serverActionsManifest:X,clientReferenceManifest:Y,subresourceIntegrityManifest:Z,prerenderManifest:$,isDraftMode:_,resolvedPathname:aa,revalidateOnlyGenerated:ab,routerServerContext:ac,nextConfig:ad,interceptionRoutePatterns:ae}=O,af=S.pathname||"/",ag=(0,r.normalizeAppPath)(G),{isOnDemandRevalidate:ah}=O,ai=K.match(af,$),aj=!!$.routes[aa],ak=!!(ai||aj||$.routes[ag]),al=a.headers["user-agent"]||"",am=(0,u.getBotType)(al),an=(0,p.isHtmlBotRequest)(a),ao=(0,h.getRequestMeta)(a,"isPrefetchRSCRequest")??"1"===a.headers[t.NEXT_ROUTER_PREFETCH_HEADER],ap=(0,h.getRequestMeta)(a,"isRSCRequest")??!!a.headers[t.RSC_HEADER],aq=(0,s.getIsPossibleServerAction)(a),ar=(0,m.checkIsAppPPREnabled)(ad.experimental.ppr)&&(null==(C=$.routes[ag]??$.dynamicRoutes[ag])?void 0:C.renderingMode)==="PARTIALLY_STATIC",as=!1,at=!1,au=ar?M:void 0,av=ar&&ap&&!ao,aw=(0,h.getRequestMeta)(a,"segmentPrefetchRSCRequest"),ax=!al||(0,p.shouldServeStreamingMetadata)(al,ad.htmlLimitedBots);an&&ar&&(ak=!1,ax=!1);let ay=!0===K.isDev||!ak||"string"==typeof M||av,az=an&&ar,aA=null;_||!ak||ay||aq||au||av||(aA=aa);let aB=aA;!aB&&K.isDev&&(aB=aa),K.isDev||_||!ak||!ap||av||(0,k.d)(a.headers);let aC={...E,tree:H,pages:I,GlobalError:D(),handler:L,routeModule:K,__next_app__:J};X&&Y&&(0,o.setReferenceManifestsSingleton)({page:G,clientReferenceManifest:Y,serverActionsManifest:X,serverModuleMap:(0,q.createServerModuleMap)({serverActionsManifest:X})});let aD=a.method||"GET",aE=(0,g.getTracer)(),aF=aE.getActiveScopeSpan();try{let f=K.getVaryHeader(aa,ae);b.setHeader("Vary",f);let k=async(c,d)=>{let e=new l.NodeNextRequest(a),f=new l.NodeNextResponse(b);return K.render(e,f,d).finally(()=>{if(!c)return;c.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let d=aE.getRootSpanAttributes();if(!d)return;if(d.get("next.span_type")!==i.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${d.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=d.get("next.route");if(e){let a=`${aD} ${e}`;c.setAttributes({"next.route":e,"http.route":e,"next.span_name":a}),c.updateName(a)}else c.updateName(`${aD} ${a.url}`)})},m=async({span:e,postponed:f,fallbackRouteParams:g})=>{let i={query:Q,params:R,page:ag,sharedContext:{buildId:P},serverComponentsHmrCache:(0,h.getRequestMeta)(a,"serverComponentsHmrCache"),fallbackRouteParams:g,renderOpts:{App:()=>null,Document:()=>null,pageConfig:{},ComponentMod:aC,Component:(0,j.T)(aC),params:R,routeModule:K,page:G,postponed:f,shouldWaitOnAllReady:az,serveStreamingMetadata:ax,supportsDynamicResponse:"string"==typeof f||ay,buildManifest:U,nextFontManifest:V,reactLoadableManifest:W,subresourceIntegrityManifest:Z,serverActionsManifest:X,clientReferenceManifest:Y,setIsrStatus:null==ac?void 0:ac.setIsrStatus,dir:c(33873).join(process.cwd(),K.relativeProjectDir),isDraftMode:_,isRevalidate:ak&&!f&&!av,botType:am,isOnDemandRevalidate:ah,isPossibleServerAction:aq,assetPrefix:ad.assetPrefix,nextConfigOutput:ad.output,crossOrigin:ad.crossOrigin,trailingSlash:ad.trailingSlash,previewProps:$.preview,deploymentId:ad.deploymentId,enableTainting:ad.experimental.taint,htmlLimitedBots:ad.htmlLimitedBots,devtoolSegmentExplorer:ad.experimental.devtoolSegmentExplorer,reactMaxHeadersLength:ad.reactMaxHeadersLength,multiZoneDraftMode:!1,incrementalCache:(0,h.getRequestMeta)(a,"incrementalCache"),cacheLifeProfiles:ad.experimental.cacheLife,basePath:ad.basePath,serverActions:ad.experimental.serverActions,...as?{nextExport:!0,supportsDynamicResponse:!1,isStaticGeneration:!0,isRevalidate:!0,isDebugDynamicAccesses:as}:{},experimental:{isRoutePPREnabled:ar,expireTime:ad.expireTime,staleTimes:ad.experimental.staleTimes,cacheComponents:!!ad.experimental.cacheComponents,clientSegmentCache:!!ad.experimental.clientSegmentCache,clientParamParsing:!!ad.experimental.clientParamParsing,dynamicOnHover:!!ad.experimental.dynamicOnHover,inlineCss:!!ad.experimental.inlineCss,authInterrupts:!!ad.experimental.authInterrupts,clientTraceMetadata:ad.experimental.clientTraceMetadata||[]},waitUntil:d.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:()=>{},onInstrumentationRequestError:(b,c,d)=>K.onRequestError(a,b,d,ac),err:(0,h.getRequestMeta)(a,"invokeError"),dev:K.isDev}},l=await k(e,i),{metadata:m}=l,{cacheControl:n,headers:o={},fetchTags:p}=m;if(p&&(o[y.NEXT_CACHE_TAGS_HEADER]=p),a.fetchMetrics=m.fetchMetrics,ak&&(null==n?void 0:n.revalidate)===0&&!K.isDev&&!ar){let a=m.staticBailoutInfo,b=Object.defineProperty(Error(`Page changed from static to dynamic at runtime ${aa}${(null==a?void 0:a.description)?`, reason: ${a.description}`:""}
see more here https://nextjs.org/docs/messages/app-static-to-dynamic-error`),"__NEXT_ERROR_CODE",{value:"E132",enumerable:!1,configurable:!0});if(null==a?void 0:a.stack){let c=a.stack;b.stack=b.message+c.substring(c.indexOf("\n"))}throw b}return{value:{kind:v.CachedRouteKind.APP_PAGE,html:l,headers:o,rscData:m.flightData,postponed:m.postponed,status:m.statusCode,segmentData:m.segmentData},cacheControl:n}},o=async({hasResolved:c,previousCacheEntry:f,isRevalidating:g,span:i})=>{let j,k=!1===K.isDev,l=c||b.writableEnded;if(ah&&ab&&!f&&!N)return(null==ac?void 0:ac.render404)?await ac.render404(a,b):(b.statusCode=404,b.end("This page could not be found")),null;if(ai&&(j=(0,w.parseFallbackField)(ai.fallback)),j===w.FallbackMode.PRERENDER&&(0,u.isBot)(al)&&(!ar||an)&&(j=w.FallbackMode.BLOCKING_STATIC_RENDER),(null==f?void 0:f.isStale)===-1&&(ah=!0),ah&&(j!==w.FallbackMode.NOT_FOUND||f)&&(j=w.FallbackMode.BLOCKING_STATIC_RENDER),!N&&j!==w.FallbackMode.BLOCKING_STATIC_RENDER&&aB&&!l&&!_&&T&&(k||!aj)){let b;if((k||ai)&&j===w.FallbackMode.NOT_FOUND)throw new B.NoFallbackError;if(ar&&!ap){let c="string"==typeof(null==ai?void 0:ai.fallback)?ai.fallback:k?ag:null;if(b=await K.handleResponse({cacheKey:c,req:a,nextConfig:ad,routeKind:e.RouteKind.APP_PAGE,isFallback:!0,prerenderManifest:$,isRoutePPREnabled:ar,responseGenerator:async()=>m({span:i,postponed:void 0,fallbackRouteParams:k||at?(0,n.u)(ag):null}),waitUntil:d.waitUntil}),null===b)return null;if(b)return delete b.cacheControl,b}}let o=ah||g||!au?void 0:au;if(as&&void 0!==o)return{cacheControl:{revalidate:1,expire:void 0},value:{kind:v.CachedRouteKind.PAGES,html:x.default.EMPTY,pageData:{},headers:void 0,status:void 0}};let p=T&&ar&&((0,h.getRequestMeta)(a,"renderFallbackShell")||at)?(0,n.u)(af):null;return m({span:i,postponed:o,fallbackRouteParams:p})},p=async c=>{var f,g,i,j,k;let l,n=await K.handleResponse({cacheKey:aA,responseGenerator:a=>o({span:c,...a}),routeKind:e.RouteKind.APP_PAGE,isOnDemandRevalidate:ah,isRoutePPREnabled:ar,req:a,nextConfig:ad,prerenderManifest:$,waitUntil:d.waitUntil});if(_&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate"),K.isDev&&b.setHeader("Cache-Control","no-store, must-revalidate"),!n){if(aA)throw Object.defineProperty(Error("invariant: cache entry required but not generated"),"__NEXT_ERROR_CODE",{value:"E62",enumerable:!1,configurable:!0});return null}if((null==(f=n.value)?void 0:f.kind)!==v.CachedRouteKind.APP_PAGE)throw Object.defineProperty(Error(`Invariant app-page handler received invalid cache entry ${null==(i=n.value)?void 0:i.kind}`),"__NEXT_ERROR_CODE",{value:"E707",enumerable:!1,configurable:!0});let p="string"==typeof n.value.postponed;ak&&!av&&(!p||ao)&&(N||b.setHeader("x-nextjs-cache",ah?"REVALIDATED":n.isMiss?"MISS":n.isStale?"STALE":"HIT"),b.setHeader(t.NEXT_IS_PRERENDER_HEADER,"1"));let{value:q}=n;if(au)l={revalidate:0,expire:void 0};else if(N&&ap&&!ao&&ar)l={revalidate:0,expire:void 0};else if(!K.isDev)if(_)l={revalidate:0,expire:void 0};else if(ak){if(n.cacheControl)if("number"==typeof n.cacheControl.revalidate){if(n.cacheControl.revalidate<1)throw Object.defineProperty(Error(`Invalid revalidate configuration provided: ${n.cacheControl.revalidate} < 1`),"__NEXT_ERROR_CODE",{value:"E22",enumerable:!1,configurable:!0});l={revalidate:n.cacheControl.revalidate,expire:(null==(j=n.cacheControl)?void 0:j.expire)??ad.expireTime}}else l={revalidate:y.CACHE_ONE_YEAR,expire:void 0}}else b.getHeader("Cache-Control")||(l={revalidate:0,expire:void 0});if(n.cacheControl=l,"string"==typeof aw&&(null==q?void 0:q.kind)===v.CachedRouteKind.APP_PAGE&&q.segmentData){b.setHeader(t.NEXT_DID_POSTPONE_HEADER,"2");let c=null==(k=q.headers)?void 0:k[y.NEXT_CACHE_TAGS_HEADER];N&&ak&&c&&"string"==typeof c&&b.setHeader(y.NEXT_CACHE_TAGS_HEADER,c);let d=q.segmentData.get(aw);return void 0!==d?(0,A.sendRenderResult)({req:a,res:b,generateEtags:ad.generateEtags,poweredByHeader:ad.poweredByHeader,result:x.default.fromStatic(d,t.RSC_CONTENT_TYPE_HEADER),cacheControl:n.cacheControl}):(b.statusCode=204,(0,A.sendRenderResult)({req:a,res:b,generateEtags:ad.generateEtags,poweredByHeader:ad.poweredByHeader,result:x.default.EMPTY,cacheControl:n.cacheControl}))}let r=(0,h.getRequestMeta)(a,"onCacheEntry");if(r&&await r({...n,value:{...n.value,kind:"PAGE"}},{url:(0,h.getRequestMeta)(a,"initURL")}))return null;if(p&&au)throw Object.defineProperty(Error("Invariant: postponed state should not be present on a resume request"),"__NEXT_ERROR_CODE",{value:"E396",enumerable:!1,configurable:!0});if(q.headers){let a={...q.headers};for(let[c,d]of(N&&ak||delete a[y.NEXT_CACHE_TAGS_HEADER],Object.entries(a)))if(void 0!==d)if(Array.isArray(d))for(let a of d)b.appendHeader(c,a);else"number"==typeof d&&(d=d.toString()),b.appendHeader(c,d)}let s=null==(g=q.headers)?void 0:g[y.NEXT_CACHE_TAGS_HEADER];if(N&&ak&&s&&"string"==typeof s&&b.setHeader(y.NEXT_CACHE_TAGS_HEADER,s),!q.status||ap&&ar||(b.statusCode=q.status),!N&&q.status&&F.RedirectStatusCode[q.status]&&ap&&(b.statusCode=200),p&&b.setHeader(t.NEXT_DID_POSTPONE_HEADER,"1"),ap&&!_){if(void 0===q.rscData){if(q.postponed)throw Object.defineProperty(Error("Invariant: Expected postponed to be undefined"),"__NEXT_ERROR_CODE",{value:"E372",enumerable:!1,configurable:!0});return(0,A.sendRenderResult)({req:a,res:b,generateEtags:ad.generateEtags,poweredByHeader:ad.poweredByHeader,result:q.html,cacheControl:av?{revalidate:0,expire:void 0}:n.cacheControl})}return(0,A.sendRenderResult)({req:a,res:b,generateEtags:ad.generateEtags,poweredByHeader:ad.poweredByHeader,result:x.default.fromStatic(q.rscData,t.RSC_CONTENT_TYPE_HEADER),cacheControl:n.cacheControl})}let u=q.html;if(!p||N||ap)return(0,A.sendRenderResult)({req:a,res:b,generateEtags:ad.generateEtags,poweredByHeader:ad.poweredByHeader,result:u,cacheControl:n.cacheControl});if(as)return u.push(new ReadableStream({start(a){a.enqueue(z.ENCODED_TAGS.CLOSED.BODY_AND_HTML),a.close()}})),(0,A.sendRenderResult)({req:a,res:b,generateEtags:ad.generateEtags,poweredByHeader:ad.poweredByHeader,result:u,cacheControl:{revalidate:0,expire:void 0}});let w=new TransformStream;return u.push(w.readable),m({span:c,postponed:q.postponed,fallbackRouteParams:null}).then(async a=>{var b,c;if(!a)throw Object.defineProperty(Error("Invariant: expected a result to be returned"),"__NEXT_ERROR_CODE",{value:"E463",enumerable:!1,configurable:!0});if((null==(b=a.value)?void 0:b.kind)!==v.CachedRouteKind.APP_PAGE)throw Object.defineProperty(Error(`Invariant: expected a page response, got ${null==(c=a.value)?void 0:c.kind}`),"__NEXT_ERROR_CODE",{value:"E305",enumerable:!1,configurable:!0});await a.value.html.pipeTo(w.writable)}).catch(a=>{w.writable.abort(a).catch(a=>{console.error("couldn't abort transformer",a)})}),(0,A.sendRenderResult)({req:a,res:b,generateEtags:ad.generateEtags,poweredByHeader:ad.poweredByHeader,result:u,cacheControl:{revalidate:0,expire:void 0}})};if(!aF)return await aE.withPropagatedContext(a.headers,()=>aE.trace(i.BaseServerSpan.handleRequest,{spanName:`${aD} ${a.url}`,kind:g.SpanKind.SERVER,attributes:{"http.method":aD,"http.target":a.url}},p));await p(aF)}catch(b){throw b instanceof B.NoFallbackError||await K.onRequestError(a,b,{routerKind:"App Router",routePath:G,routeType:"render",revalidateReason:(0,f.c)({isRevalidate:ak,isOnDemandRevalidate:ah})},ac),b}}},86439:a=>{"use strict";a.exports=require("next/dist/shared/lib/no-fallback-error.external")},88687:(a,b,c)=>{Promise.resolve().then(c.bind(c,76517))},89989:(a,b,c)=>{"use strict";c.d(b,{B8:()=>D,UC:()=>F,bL:()=>C,l9:()=>E});var d=c(38301),e=c(87868),f=c(2332),g=c(88617),h=c(29988),i=c(99978),j=c(10498),k=c(11720),l=c(75656),m=c(21124),n="Tabs",[o,p]=(0,f.A)(n,[g.RG]),q=(0,g.RG)(),[r,s]=o(n),t=d.forwardRef((a,b)=>{let{__scopeTabs:c,value:d,onValueChange:e,defaultValue:f,orientation:g="horizontal",dir:h,activationMode:o="automatic",...p}=a,q=(0,j.jH)(h),[s,t]=(0,k.i)({prop:d,onChange:e,defaultProp:f??"",caller:n});return(0,m.jsx)(r,{scope:c,baseId:(0,l.B)(),value:s,onValueChange:t,orientation:g,dir:q,activationMode:o,children:(0,m.jsx)(i.sG.div,{dir:q,"data-orientation":g,...p,ref:b})})});t.displayName=n;var u="TabsList",v=d.forwardRef((a,b)=>{let{__scopeTabs:c,loop:d=!0,...e}=a,f=s(u,c),h=q(c);return(0,m.jsx)(g.bL,{asChild:!0,...h,orientation:f.orientation,dir:f.dir,loop:d,children:(0,m.jsx)(i.sG.div,{role:"tablist","aria-orientation":f.orientation,...e,ref:b})})});v.displayName=u;var w="TabsTrigger",x=d.forwardRef((a,b)=>{let{__scopeTabs:c,value:d,disabled:f=!1,...h}=a,j=s(w,c),k=q(c),l=A(j.baseId,d),n=B(j.baseId,d),o=d===j.value;return(0,m.jsx)(g.q7,{asChild:!0,...k,focusable:!f,active:o,children:(0,m.jsx)(i.sG.button,{type:"button",role:"tab","aria-selected":o,"aria-controls":n,"data-state":o?"active":"inactive","data-disabled":f?"":void 0,disabled:f,id:l,...h,ref:b,onMouseDown:(0,e.mK)(a.onMouseDown,a=>{f||0!==a.button||!1!==a.ctrlKey?a.preventDefault():j.onValueChange(d)}),onKeyDown:(0,e.mK)(a.onKeyDown,a=>{[" ","Enter"].includes(a.key)&&j.onValueChange(d)}),onFocus:(0,e.mK)(a.onFocus,()=>{let a="manual"!==j.activationMode;o||f||!a||j.onValueChange(d)})})})});x.displayName=w;var y="TabsContent",z=d.forwardRef((a,b)=>{let{__scopeTabs:c,value:e,forceMount:f,children:g,...j}=a,k=s(y,c),l=A(k.baseId,e),n=B(k.baseId,e),o=e===k.value,p=d.useRef(o);return d.useEffect(()=>{let a=requestAnimationFrame(()=>p.current=!1);return()=>cancelAnimationFrame(a)},[]),(0,m.jsx)(h.C,{present:f||o,children:({present:c})=>(0,m.jsx)(i.sG.div,{"data-state":o?"active":"inactive","data-orientation":k.orientation,role:"tabpanel","aria-labelledby":l,hidden:!c,id:n,tabIndex:0,...j,ref:b,style:{...a.style,animationDuration:p.current?"0s":void 0},children:c&&g})})});function A(a,b){return`${a}-trigger-${b}`}function B(a,b){return`${a}-content-${b}`}z.displayName=y;var C=t,D=v,E=x,F=z}};var b=require("../../../webpack-runtime.js");b.C(a);var c=b.X(0,[1331,8298,8309,8409,4992,2827,9201],()=>b(b.s=82723));module.exports=c})();