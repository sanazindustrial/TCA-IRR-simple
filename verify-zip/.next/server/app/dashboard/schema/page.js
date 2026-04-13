(()=>{var e={};e.id=9925,e.ids=[9925],e.modules={3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},3515:(e,a,t)=>{"use strict";t.d(a,{A:()=>d});var s=t(61120);let r=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),i=(...e)=>e.filter((e,a,t)=>!!e&&""!==e.trim()&&t.indexOf(e)===a).join(" ").trim();var o={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};let n=(0,s.forwardRef)(({color:e="currentColor",size:a=24,strokeWidth:t=2,absoluteStrokeWidth:r,className:n="",children:d,iconNode:l,...c},u)=>(0,s.createElement)("svg",{ref:u,...o,width:a,height:a,stroke:e,strokeWidth:r?24*Number(t)/Number(a):t,className:i("lucide",n),...c},[...l.map(([e,a])=>(0,s.createElement)(e,a)),...Array.isArray(d)?d:[d]])),d=(e,a)=>{let t=(0,s.forwardRef)(({className:t,...o},d)=>(0,s.createElement)(n,{ref:d,iconNode:a,className:i(`lucide-${r(e)}`,t),...o}));return t.displayName=`${e}`,t}},10453:(e,a,t)=>{"use strict";t.d(a,{A:()=>s});let s=(0,t(2146).A)("Moon",[["path",{d:"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z",key:"a7tn18"}]])},10846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},19121:e=>{"use strict";e.exports=require("next/dist/server/app-render/action-async-storage.external.js")},21028:(e,a,t)=>{"use strict";t.d(a,{A:()=>s});let s=(0,t(2146).A)("Link",[["path",{d:"M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",key:"1cjeqo"}],["path",{d:"M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",key:"19qd67"}]])},21792:(e,a,t)=>{"use strict";t.r(a),t.d(a,{default:()=>x});var s=t(60687),r=t(44493),i=t(85763),o=t(81801),n=t(48206),d=t(36644),l=t(51212),c=t(58369),u=t(21028),E=t(85866);let m=`-- schema/module_configurations.sql

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
`,_=({content:e})=>(0,s.jsx)("pre",{className:"bg-muted/50 p-4 rounded-lg overflow-x-auto text-sm font-mono",children:(0,s.jsx)("code",{children:e})});function p(){return(0,s.jsxs)("div",{children:[(0,s.jsxs)(r.aR,{className:"px-0",children:[(0,s.jsx)(r.ZB,{children:"Module Configurations Schema"}),(0,s.jsx)(r.BT,{children:"Defines tables for saving, versioning, and rolling back analysis module configurations."})]}),(0,s.jsx)(_,{content:m})]})}let A=`-- schema/external_sources.sql

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
`,T=({content:e})=>(0,s.jsx)("pre",{className:"bg-muted/50 p-4 rounded-lg overflow-x-auto text-sm font-mono",children:(0,s.jsx)("code",{children:e})});function R(){return(0,s.jsxs)("div",{children:[(0,s.jsxs)(r.aR,{className:"px-0",children:[(0,s.jsx)(r.ZB,{children:"External Sources Schema"}),(0,s.jsx)(r.BT,{children:"Defines tables for storing and managing configurations for all external data sources."})]}),(0,s.jsx)(T,{content:A})]})}let U=`-- schema/system_configurations.sql

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
`,h=({content:e})=>(0,s.jsx)("pre",{className:"bg-muted/50 p-4 rounded-lg overflow-x-auto text-sm font-mono",children:(0,s.jsx)("code",{children:e})});function N(){return(0,s.jsxs)("div",{children:[(0,s.jsxs)(r.aR,{className:"px-0",children:[(0,s.jsx)(r.ZB,{children:"System Configuration Schema"}),(0,s.jsx)(r.BT,{children:"Defines tables for storing environment variables and API keys securely."})]}),(0,s.jsx)(h,{content:U})]})}let f=`-- schema/users.sql

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
);`,y=`-- schema/evaluations_and_reports.sql

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
`,g=`-- schema/app_requests.sql

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
CREATE INDEX idx_app_requests_type ON app_requests(request_type);`,v=({content:e})=>(0,s.jsx)("pre",{className:"bg-muted/50 p-4 rounded-lg overflow-x-auto text-sm font-mono",children:(0,s.jsx)("code",{children:e})});function x(){return(0,s.jsxs)("div",{className:"container mx-auto p-4 md:p-8",children:[(0,s.jsxs)("header",{className:"mb-8",children:[(0,s.jsxs)("h1",{className:"text-2xl font-semibold flex items-center gap-2",children:[(0,s.jsx)(o.A,{className:"text-primary"}),"Database Schema & Models"]}),(0,s.jsx)("p",{className:"text-muted-foreground",children:"PostgreSQL schema definitions for the application's data structures."})]}),(0,s.jsx)(r.Zp,{children:(0,s.jsx)(r.Wu,{className:"p-0",children:(0,s.jsxs)(i.tU,{defaultValue:"evaluations",className:"w-full",children:[(0,s.jsxs)(i.j7,{className:"p-2 h-auto rounded-b-none grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 w-full",children:[(0,s.jsxs)(i.Xi,{value:"users",className:"py-2 flex items-center gap-2",children:[(0,s.jsx)(n.A,{})," Users"]}),(0,s.jsxs)(i.Xi,{value:"evaluations",className:"py-2 flex items-center gap-2",children:[(0,s.jsx)(d.A,{})," Reports"]}),(0,s.jsxs)(i.Xi,{value:"modules",className:"py-2 flex items-center gap-2",children:[(0,s.jsx)(l.A,{})," Modules"]}),(0,s.jsxs)(i.Xi,{value:"system-configs",className:"py-2 flex items-center gap-2",children:[(0,s.jsx)(c.A,{})," System Config"]}),(0,s.jsxs)(i.Xi,{value:"external-sources",className:"py-2 flex items-center gap-2",children:[(0,s.jsx)(u.A,{})," External Sources"]}),(0,s.jsxs)(i.Xi,{value:"requests",className:"py-2 flex items-center gap-2",children:[(0,s.jsx)(E.A,{})," App Requests"]})]}),(0,s.jsxs)("div",{className:"p-6",children:[(0,s.jsxs)(i.av,{value:"users",children:[(0,s.jsxs)(r.aR,{className:"px-0",children:[(0,s.jsx)(r.ZB,{children:"User & Authentication Schema"}),(0,s.jsx)(r.BT,{children:"Defines tables for users, roles, settings, and quotas."})]}),(0,s.jsx)(v,{content:f})]}),(0,s.jsxs)(i.av,{value:"evaluations",children:[(0,s.jsxs)(r.aR,{className:"px-0",children:[(0,s.jsx)(r.ZB,{children:"Evaluations, Reports & Documents Schema"}),(0,s.jsx)(r.BT,{children:"Defines the core tables for evaluation runs, the resulting triage/DD reports, and submitted documents with their extracted metadata."})]}),(0,s.jsx)(v,{content:y})]}),(0,s.jsxs)(i.av,{value:"modules",children:[(0,s.jsxs)(r.aR,{className:"px-0",children:[(0,s.jsx)(r.ZB,{children:"Analysis Modules Schema"}),(0,s.jsx)(r.BT,{children:"Defines the nine dedicated tables for storing detailed results from each analysis module."})]}),(0,s.jsx)(v,{content:y.substring(y.indexOf("-- 9 Module Tables Follow --"))})]}),(0,s.jsx)(i.av,{value:"system-configs",children:(0,s.jsx)(N,{})}),(0,s.jsx)(i.av,{value:"module-configs",children:(0,s.jsx)(p,{})}),(0,s.jsx)(i.av,{value:"external-sources",children:(0,s.jsx)(R,{})}),(0,s.jsxs)(i.av,{value:"requests",children:[(0,s.jsxs)(r.aR,{className:"px-0",children:[(0,s.jsx)(r.ZB,{children:"Application Requests Schema"}),(0,s.jsx)(r.BT,{children:'Defines the table for managing user-submitted requests from the "Submit Request" page.'})]}),(0,s.jsx)(v,{content:g})]})]})]})})})]})}},27537:(e,a,t)=>{"use strict";t.r(a),t.d(a,{default:()=>s});let s=(0,t(12907).registerClientReference)(function(){throw Error("Attempted to call the default export of \"C:\\\\Users\\\\Allot\\\\OneDrive\\\\Desktop\\\\TCA-IRR-APP-main- simplify\\\\src\\\\app\\\\dashboard\\\\schema\\\\page.tsx\" from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\dashboard\\schema\\page.tsx","default")},28399:(e,a,t)=>{"use strict";t.d(a,{A:()=>s});let s=(0,t(2146).A)("UsersRound",[["path",{d:"M18 21a8 8 0 0 0-16 0",key:"3ypg7q"}],["circle",{cx:"10",cy:"8",r:"5",key:"o932ke"}],["path",{d:"M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3",key:"10s06x"}]])},29294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},29848:(e,a,t)=>{"use strict";t.d(a,{A:()=>s});let s=(0,t(2146).A)("Sun",[["circle",{cx:"12",cy:"12",r:"4",key:"4exip2"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"m4.93 4.93 1.41 1.41",key:"149t6j"}],["path",{d:"m17.66 17.66 1.41 1.41",key:"ptbguv"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"m6.34 17.66-1.41 1.41",key:"1m8zz5"}],["path",{d:"m19.07 4.93-1.41 1.41",key:"1shlcs"}]])},30072:(e,a,t)=>{"use strict";t.d(a,{A:()=>s});let s=(0,t(3515).A)("Compass",[["path",{d:"m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z",key:"9ktpf1"}],["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]])},33873:e=>{"use strict";e.exports=require("path")},44493:(e,a,t)=>{"use strict";t.d(a,{BT:()=>l,Wu:()=>c,ZB:()=>d,Zp:()=>o,aR:()=>n,wL:()=>u});var s=t(60687),r=t(43210),i=t(4780);let o=r.forwardRef(({className:e,...a},t)=>(0,s.jsx)("div",{ref:t,className:(0,i.cn)("rounded-lg border bg-card text-card-foreground shadow-sm",e),...a}));o.displayName="Card";let n=r.forwardRef(({className:e,...a},t)=>(0,s.jsx)("div",{ref:t,className:(0,i.cn)("flex flex-col space-y-1.5 p-6",e),...a}));n.displayName="CardHeader";let d=r.forwardRef(({className:e,...a},t)=>(0,s.jsx)("div",{ref:t,className:(0,i.cn)("text-2xl font-semibold leading-none tracking-tight",e),...a}));d.displayName="CardTitle";let l=r.forwardRef(({className:e,...a},t)=>(0,s.jsx)("div",{ref:t,className:(0,i.cn)("text-sm text-muted-foreground",e),...a}));l.displayName="CardDescription";let c=r.forwardRef(({className:e,...a},t)=>(0,s.jsx)("div",{ref:t,className:(0,i.cn)("p-6 pt-0",e),...a}));c.displayName="CardContent";let u=r.forwardRef(({className:e,...a},t)=>(0,s.jsx)("div",{ref:t,className:(0,i.cn)("flex items-center p-6 pt-0",e),...a}));u.displayName="CardFooter"},49497:(e,a,t)=>{"use strict";t.d(a,{A:()=>s});let s=(0,t(2146).A)("LogOut",[["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}],["polyline",{points:"16 17 21 12 16 7",key:"1gabdz"}],["line",{x1:"21",x2:"9",y1:"12",y2:"12",key:"1uyos4"}]])},51212:(e,a,t)=>{"use strict";t.d(a,{A:()=>s});let s=(0,t(2146).A)("BrainCircuit",[["path",{d:"M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z",key:"l5xja"}],["path",{d:"M9 13a4.5 4.5 0 0 0 3-4",key:"10igwf"}],["path",{d:"M6.003 5.125A3 3 0 0 0 6.401 6.5",key:"105sqy"}],["path",{d:"M3.477 10.896a4 4 0 0 1 .585-.396",key:"ql3yin"}],["path",{d:"M6 18a4 4 0 0 1-1.967-.516",key:"2e4loj"}],["path",{d:"M12 13h4",key:"1ku699"}],["path",{d:"M12 18h6a2 2 0 0 1 2 2v1",key:"105ag5"}],["path",{d:"M12 8h8",key:"1lhi5i"}],["path",{d:"M16 8V5a2 2 0 0 1 2-2",key:"u6izg6"}],["circle",{cx:"16",cy:"13",r:".5",key:"ry7gng"}],["circle",{cx:"18",cy:"3",r:".5",key:"1aiba7"}],["circle",{cx:"20",cy:"21",r:".5",key:"yhc1fs"}],["circle",{cx:"20",cy:"8",r:".5",key:"1e43v0"}]])},52577:(e,a,t)=>{Promise.resolve().then(t.bind(t,27537))},54690:(e,a,t)=>{"use strict";t.d(a,{A:()=>s});let s=(0,t(2146).A)("FileCode",[["path",{d:"M10 12.5 8 15l2 2.5",key:"1tg20x"}],["path",{d:"m14 12.5 2 2.5-2 2.5",key:"yinavb"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z",key:"1mlx9k"}]])},55146:(e,a,t)=>{"use strict";t.d(a,{B8:()=>I,UC:()=>b,bL:()=>C,l9:()=>L});var s=t(43210),r=t(70569),i=t(11273),o=t(72942),n=t(46059),d=t(3416),l=t(43),c=t(65551),u=t(96963),E=t(60687),m="Tabs",[_,p]=(0,i.A)(m,[o.RG]),A=(0,o.RG)(),[T,R]=_(m),U=s.forwardRef((e,a)=>{let{__scopeTabs:t,value:s,onValueChange:r,defaultValue:i,orientation:o="horizontal",dir:n,activationMode:_="automatic",...p}=e,A=(0,l.jH)(n),[R,U]=(0,c.i)({prop:s,onChange:r,defaultProp:i??"",caller:m});return(0,E.jsx)(T,{scope:t,baseId:(0,u.B)(),value:R,onValueChange:U,orientation:o,dir:A,activationMode:_,children:(0,E.jsx)(d.sG.div,{dir:A,"data-orientation":o,...p,ref:a})})});U.displayName=m;var h="TabsList",N=s.forwardRef((e,a)=>{let{__scopeTabs:t,loop:s=!0,...r}=e,i=R(h,t),n=A(t);return(0,E.jsx)(o.bL,{asChild:!0,...n,orientation:i.orientation,dir:i.dir,loop:s,children:(0,E.jsx)(d.sG.div,{role:"tablist","aria-orientation":i.orientation,...r,ref:a})})});N.displayName=h;var f="TabsTrigger",y=s.forwardRef((e,a)=>{let{__scopeTabs:t,value:s,disabled:i=!1,...n}=e,l=R(f,t),c=A(t),u=x(l.baseId,s),m=D(l.baseId,s),_=s===l.value;return(0,E.jsx)(o.q7,{asChild:!0,...c,focusable:!i,active:_,children:(0,E.jsx)(d.sG.button,{type:"button",role:"tab","aria-selected":_,"aria-controls":m,"data-state":_?"active":"inactive","data-disabled":i?"":void 0,disabled:i,id:u,...n,ref:a,onMouseDown:(0,r.mK)(e.onMouseDown,e=>{i||0!==e.button||!1!==e.ctrlKey?e.preventDefault():l.onValueChange(s)}),onKeyDown:(0,r.mK)(e.onKeyDown,e=>{[" ","Enter"].includes(e.key)&&l.onValueChange(s)}),onFocus:(0,r.mK)(e.onFocus,()=>{let e="manual"!==l.activationMode;_||i||!e||l.onValueChange(s)})})})});y.displayName=f;var g="TabsContent",v=s.forwardRef((e,a)=>{let{__scopeTabs:t,value:r,forceMount:i,children:o,...l}=e,c=R(g,t),u=x(c.baseId,r),m=D(c.baseId,r),_=r===c.value,p=s.useRef(_);return s.useEffect(()=>{let e=requestAnimationFrame(()=>p.current=!1);return()=>cancelAnimationFrame(e)},[]),(0,E.jsx)(n.C,{present:i||_,children:({present:t})=>(0,E.jsx)(d.sG.div,{"data-state":_?"active":"inactive","data-orientation":c.orientation,role:"tabpanel","aria-labelledby":u,hidden:!t,id:m,tabIndex:0,...l,ref:a,style:{...e.style,animationDuration:p.current?"0s":void 0},children:t&&o})})});function x(e,a){return`${e}-trigger-${a}`}function D(e,a){return`${e}-content-${a}`}v.displayName=g;var C=U,I=N,L=y,b=v},58369:(e,a,t)=>{"use strict";t.d(a,{A:()=>s});let s=(0,t(2146).A)("Settings",[["path",{d:"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",key:"1qme2f"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]])},58595:(e,a,t)=>{"use strict";t.d(a,{A:()=>s});let s=(0,t(2146).A)("User",[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]])},59059:(e,a,t)=>{"use strict";t.d(a,{A:()=>s});let s=(0,t(2146).A)("LayoutDashboard",[["rect",{width:"7",height:"9",x:"3",y:"3",rx:"1",key:"10lvy0"}],["rect",{width:"7",height:"5",x:"14",y:"3",rx:"1",key:"16une8"}],["rect",{width:"7",height:"9",x:"14",y:"12",rx:"1",key:"1hutg5"}],["rect",{width:"7",height:"5",x:"3",y:"16",rx:"1",key:"ldoo1y"}]])},63033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},64181:(e,a,t)=>{"use strict";t.d(a,{A:()=>s});let s=(0,t(2146).A)("Bell",[["path",{d:"M10.268 21a2 2 0 0 0 3.464 0",key:"vwvbt9"}],["path",{d:"M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326",key:"11g9vi"}]])},73952:(e,a,t)=>{"use strict";t.d(a,{A:()=>s});let s=(0,t(2146).A)("DatabaseBackup",[["ellipse",{cx:"12",cy:"5",rx:"9",ry:"3",key:"msslwz"}],["path",{d:"M3 12a9 3 0 0 0 5 2.69",key:"1ui2ym"}],["path",{d:"M21 9.3V5",key:"6k6cib"}],["path",{d:"M3 5v14a9 3 0 0 0 6.47 2.88",key:"i62tjy"}],["path",{d:"M12 12v4h4",key:"1bxaet"}],["path",{d:"M13 20a5 5 0 0 0 9-3 4.5 4.5 0 0 0-4.5-4.5c-1.33 0-2.54.54-3.41 1.41L12 16",key:"1f4ei9"}]])},79551:e=>{"use strict";e.exports=require("url")},81801:(e,a,t)=>{"use strict";t.d(a,{A:()=>s});let s=(0,t(2146).A)("Database",[["ellipse",{cx:"12",cy:"5",rx:"9",ry:"3",key:"msslwz"}],["path",{d:"M3 5V19A9 3 0 0 0 21 19V5",key:"1wlel7"}],["path",{d:"M3 12A9 3 0 0 0 21 12",key:"mv7ke4"}]])},83729:(e,a,t)=>{"use strict";t.d(a,{A:()=>s});let s=(0,t(2146).A)("Upload",[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"17 8 12 3 7 8",key:"t8dd8p"}],["line",{x1:"12",x2:"12",y1:"3",y2:"15",key:"widbto"}]])},85763:(e,a,t)=>{"use strict";t.d(a,{Xi:()=>l,av:()=>c,j7:()=>d,tU:()=>n});var s=t(60687),r=t(43210),i=t(55146),o=t(4780);let n=i.bL,d=r.forwardRef(({className:e,...a},t)=>(0,s.jsx)(i.B8,{ref:t,className:(0,o.cn)("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",e),...a}));d.displayName=i.B8.displayName;let l=r.forwardRef(({className:e,...a},t)=>(0,s.jsx)(i.l9,{ref:t,className:(0,o.cn)("inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",e),...a}));l.displayName=i.l9.displayName;let c=r.forwardRef(({className:e,...a},t)=>(0,s.jsx)(i.UC,{ref:t,className:(0,o.cn)("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",e),...a}));c.displayName=i.UC.displayName},89025:(e,a,t)=>{Promise.resolve().then(t.bind(t,21792))},90746:(e,a,t)=>{"use strict";t.d(a,{A:()=>s});let s=(0,t(2146).A)("Layers",[["path",{d:"M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z",key:"zw3jo"}],["path",{d:"M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12",key:"1wduqc"}],["path",{d:"M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17",key:"kqbvx6"}]])},92978:(e,a,t)=>{"use strict";t.d(a,{A:()=>s});let s=(0,t(2146).A)("CircleHelp",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",key:"1u773s"}],["path",{d:"M12 17h.01",key:"p32p05"}]])},95162:(e,a,t)=>{"use strict";t.r(a),t.d(a,{GlobalError:()=>o.a,__next_app__:()=>u,pages:()=>c,routeModule:()=>E,tree:()=>l});var s=t(65239),r=t(48088),i=t(88170),o=t.n(i),n=t(30893),d={};for(let e in n)0>["default","tree","pages","GlobalError","__next_app__","routeModule"].indexOf(e)&&(d[e]=()=>n[e]);t.d(a,d);let l={children:["",{children:["dashboard",{children:["schema",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(t.bind(t,27537)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\dashboard\\schema\\page.tsx"]}]},{}]},{layout:[()=>Promise.resolve().then(t.bind(t,63144)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\dashboard\\layout.tsx"],error:[()=>Promise.resolve().then(t.bind(t,45434)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\dashboard\\error.tsx"],metadata:{icon:[async e=>(await Promise.resolve().then(t.bind(t,70440))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]},{layout:[()=>Promise.resolve().then(t.bind(t,94431)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\layout.tsx"],error:[()=>Promise.resolve().then(t.bind(t,54431)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\error.tsx"],loading:[()=>Promise.resolve().then(t.bind(t,65247)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\loading.tsx"],"not-found":[()=>Promise.resolve().then(t.bind(t,54413)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\not-found.tsx"],forbidden:[()=>Promise.resolve().then(t.t.bind(t,89999,23)),"next/dist/client/components/forbidden-error"],unauthorized:[()=>Promise.resolve().then(t.t.bind(t,65284,23)),"next/dist/client/components/unauthorized-error"],metadata:{icon:[async e=>(await Promise.resolve().then(t.bind(t,70440))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]}.children,c=["C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\dashboard\\schema\\page.tsx"],u={require:t,loadChunk:()=>Promise.resolve()},E=new s.AppPageRouteModule({definition:{kind:r.RouteKind.APP_PAGE,page:"/dashboard/schema/page",pathname:"/dashboard/schema",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:l}})},96556:(e,a,t)=>{"use strict";t.d(a,{A:()=>s});let s=(0,t(2146).A)("PanelLeft",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}],["path",{d:"M9 3v18",key:"fh3hqa"}]])}};var a=require("../../../webpack-runtime.js");a.C(e);var t=e=>a(a.s=e),s=a.X(0,[9965,9277,8010,2459,9854,8730,5313,4245,9414,4028],()=>t(95162));module.exports=s})();