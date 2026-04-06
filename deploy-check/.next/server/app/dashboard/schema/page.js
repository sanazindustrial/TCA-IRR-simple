(()=>{var e={};e.id=9925,e.ids=[9925],e.modules={3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},19121:e=>{"use strict";e.exports=require("next/dist/server/app-render/action-async-storage.external.js")},21792:(e,s,r)=>{"use strict";r.r(s),r.d(s,{default:()=>C});var a=r(60687),t=r(44493),i=r(85763),n=r(81801),o=r(48206),d=r(36644),l=r(51212),c=r(58369),u=r(21028),E=r(85866);let m=`-- schema/module_configurations.sql

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
`,_=({content:e})=>(0,a.jsx)("pre",{className:"bg-muted/50 p-4 rounded-lg overflow-x-auto text-sm font-mono",children:(0,a.jsx)("code",{children:e})});function p(){return(0,a.jsxs)("div",{children:[(0,a.jsxs)(t.aR,{className:"px-0",children:[(0,a.jsx)(t.ZB,{children:"Module Configurations Schema"}),(0,a.jsx)(t.BT,{children:"Defines tables for saving, versioning, and rolling back analysis module configurations."})]}),(0,a.jsx)(_,{content:m})]})}let A=`-- schema/external_sources.sql

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
`,T=({content:e})=>(0,a.jsx)("pre",{className:"bg-muted/50 p-4 rounded-lg overflow-x-auto text-sm font-mono",children:(0,a.jsx)("code",{children:e})});function R(){return(0,a.jsxs)("div",{children:[(0,a.jsxs)(t.aR,{className:"px-0",children:[(0,a.jsx)(t.ZB,{children:"External Sources Schema"}),(0,a.jsx)(t.BT,{children:"Defines tables for storing and managing configurations for all external data sources."})]}),(0,a.jsx)(T,{content:A})]})}let N=`-- schema/system_configurations.sql

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
`,U=({content:e})=>(0,a.jsx)("pre",{className:"bg-muted/50 p-4 rounded-lg overflow-x-auto text-sm font-mono",children:(0,a.jsx)("code",{children:e})});function f(){return(0,a.jsxs)("div",{children:[(0,a.jsxs)(t.aR,{className:"px-0",children:[(0,a.jsx)(t.ZB,{children:"System Configuration Schema"}),(0,a.jsx)(t.BT,{children:"Defines tables for storing environment variables and API keys securely."})]}),(0,a.jsx)(U,{content:N})]})}let h=`-- schema/users.sql

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
CREATE INDEX idx_app_requests_type ON app_requests(request_type);`,v=({content:e})=>(0,a.jsx)("pre",{className:"bg-muted/50 p-4 rounded-lg overflow-x-auto text-sm font-mono",children:(0,a.jsx)("code",{children:e})});function C(){return(0,a.jsxs)("div",{className:"container mx-auto p-4 md:p-8",children:[(0,a.jsxs)("header",{className:"mb-8",children:[(0,a.jsxs)("h1",{className:"text-2xl font-semibold flex items-center gap-2",children:[(0,a.jsx)(n.A,{className:"text-primary"}),"Database Schema & Models"]}),(0,a.jsx)("p",{className:"text-muted-foreground",children:"PostgreSQL schema definitions for the application's data structures."})]}),(0,a.jsx)(t.Zp,{children:(0,a.jsx)(t.Wu,{className:"p-0",children:(0,a.jsxs)(i.tU,{defaultValue:"evaluations",className:"w-full",children:[(0,a.jsxs)(i.j7,{className:"p-2 h-auto rounded-b-none grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 w-full",children:[(0,a.jsxs)(i.Xi,{value:"users",className:"py-2 flex items-center gap-2",children:[(0,a.jsx)(o.A,{})," Users"]}),(0,a.jsxs)(i.Xi,{value:"evaluations",className:"py-2 flex items-center gap-2",children:[(0,a.jsx)(d.A,{})," Reports"]}),(0,a.jsxs)(i.Xi,{value:"modules",className:"py-2 flex items-center gap-2",children:[(0,a.jsx)(l.A,{})," Modules"]}),(0,a.jsxs)(i.Xi,{value:"system-configs",className:"py-2 flex items-center gap-2",children:[(0,a.jsx)(c.A,{})," System Config"]}),(0,a.jsxs)(i.Xi,{value:"external-sources",className:"py-2 flex items-center gap-2",children:[(0,a.jsx)(u.A,{})," External Sources"]}),(0,a.jsxs)(i.Xi,{value:"requests",className:"py-2 flex items-center gap-2",children:[(0,a.jsx)(E.A,{})," App Requests"]})]}),(0,a.jsxs)("div",{className:"p-6",children:[(0,a.jsxs)(i.av,{value:"users",children:[(0,a.jsxs)(t.aR,{className:"px-0",children:[(0,a.jsx)(t.ZB,{children:"User & Authentication Schema"}),(0,a.jsx)(t.BT,{children:"Defines tables for users, roles, settings, and quotas."})]}),(0,a.jsx)(v,{content:h})]}),(0,a.jsxs)(i.av,{value:"evaluations",children:[(0,a.jsxs)(t.aR,{className:"px-0",children:[(0,a.jsx)(t.ZB,{children:"Evaluations, Reports & Documents Schema"}),(0,a.jsx)(t.BT,{children:"Defines the core tables for evaluation runs, the resulting triage/DD reports, and submitted documents with their extracted metadata."})]}),(0,a.jsx)(v,{content:x})]}),(0,a.jsxs)(i.av,{value:"modules",children:[(0,a.jsxs)(t.aR,{className:"px-0",children:[(0,a.jsx)(t.ZB,{children:"Analysis Modules Schema"}),(0,a.jsx)(t.BT,{children:"Defines the nine dedicated tables for storing detailed results from each analysis module."})]}),(0,a.jsx)(v,{content:x.substring(x.indexOf("-- 9 Module Tables Follow --"))})]}),(0,a.jsx)(i.av,{value:"system-configs",children:(0,a.jsx)(f,{})}),(0,a.jsx)(i.av,{value:"module-configs",children:(0,a.jsx)(p,{})}),(0,a.jsx)(i.av,{value:"external-sources",children:(0,a.jsx)(R,{})}),(0,a.jsxs)(i.av,{value:"requests",children:[(0,a.jsxs)(t.aR,{className:"px-0",children:[(0,a.jsx)(t.ZB,{children:"Application Requests Schema"}),(0,a.jsx)(t.BT,{children:'Defines the table for managing user-submitted requests from the "Submit Request" page.'})]}),(0,a.jsx)(v,{content:g})]})]})]})})})]})}},26955:(e,s,r)=>{Promise.resolve().then(r.bind(r,74056))},27537:(e,s,r)=>{"use strict";r.r(s),r.d(s,{default:()=>a});let a=(0,r(12907).registerClientReference)(function(){throw Error("Attempted to call the default export of \"C:\\\\Users\\\\Allot\\\\OneDrive\\\\Desktop\\\\TCA-IRR-APP-main- simplify\\\\src\\\\app\\\\dashboard\\\\schema\\\\page.tsx\" from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\dashboard\\schema\\page.tsx","default")},29294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},32531:(e,s,r)=>{Promise.resolve().then(r.bind(r,45434))},33873:e=>{"use strict";e.exports=require("path")},44493:(e,s,r)=>{"use strict";r.d(s,{BT:()=>l,Wu:()=>c,ZB:()=>d,Zp:()=>n,aR:()=>o,wL:()=>u});var a=r(60687),t=r(43210),i=r(4780);let n=t.forwardRef(({className:e,...s},r)=>(0,a.jsx)("div",{ref:r,className:(0,i.cn)("rounded-lg border bg-card text-card-foreground shadow-sm",e),...s}));n.displayName="Card";let o=t.forwardRef(({className:e,...s},r)=>(0,a.jsx)("div",{ref:r,className:(0,i.cn)("flex flex-col space-y-1.5 p-6",e),...s}));o.displayName="CardHeader";let d=t.forwardRef(({className:e,...s},r)=>(0,a.jsx)("div",{ref:r,className:(0,i.cn)("text-2xl font-semibold leading-none tracking-tight",e),...s}));d.displayName="CardTitle";let l=t.forwardRef(({className:e,...s},r)=>(0,a.jsx)("div",{ref:r,className:(0,i.cn)("text-sm text-muted-foreground",e),...s}));l.displayName="CardDescription";let c=t.forwardRef(({className:e,...s},r)=>(0,a.jsx)("div",{ref:r,className:(0,i.cn)("p-6 pt-0",e),...s}));c.displayName="CardContent";let u=t.forwardRef(({className:e,...s},r)=>(0,a.jsx)("div",{ref:r,className:(0,i.cn)("flex items-center p-6 pt-0",e),...s}));u.displayName="CardFooter"},45434:(e,s,r)=>{"use strict";r.r(s),r.d(s,{default:()=>a});let a=(0,r(12907).registerClientReference)(function(){throw Error("Attempted to call the default export of \"C:\\\\Users\\\\Allot\\\\OneDrive\\\\Desktop\\\\TCA-IRR-APP-main- simplify\\\\src\\\\app\\\\dashboard\\\\error.tsx\" from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\dashboard\\error.tsx","default")},52577:(e,s,r)=>{Promise.resolve().then(r.bind(r,27537))},55146:(e,s,r)=>{"use strict";r.d(s,{B8:()=>y,UC:()=>b,bL:()=>I,l9:()=>L});var a=r(43210),t=r(70569),i=r(11273),n=r(72942),o=r(46059),d=r(3416),l=r(43),c=r(65551),u=r(96963),E=r(60687),m="Tabs",[_,p]=(0,i.A)(m,[n.RG]),A=(0,n.RG)(),[T,R]=_(m),N=a.forwardRef((e,s)=>{let{__scopeTabs:r,value:a,onValueChange:t,defaultValue:i,orientation:n="horizontal",dir:o,activationMode:_="automatic",...p}=e,A=(0,l.jH)(o),[R,N]=(0,c.i)({prop:a,onChange:t,defaultProp:i??"",caller:m});return(0,E.jsx)(T,{scope:r,baseId:(0,u.B)(),value:R,onValueChange:N,orientation:n,dir:A,activationMode:_,children:(0,E.jsx)(d.sG.div,{dir:A,"data-orientation":n,...p,ref:s})})});N.displayName=m;var U="TabsList",f=a.forwardRef((e,s)=>{let{__scopeTabs:r,loop:a=!0,...t}=e,i=R(U,r),o=A(r);return(0,E.jsx)(n.bL,{asChild:!0,...o,orientation:i.orientation,dir:i.dir,loop:a,children:(0,E.jsx)(d.sG.div,{role:"tablist","aria-orientation":i.orientation,...t,ref:s})})});f.displayName=U;var h="TabsTrigger",x=a.forwardRef((e,s)=>{let{__scopeTabs:r,value:a,disabled:i=!1,...o}=e,l=R(h,r),c=A(r),u=C(l.baseId,a),m=D(l.baseId,a),_=a===l.value;return(0,E.jsx)(n.q7,{asChild:!0,...c,focusable:!i,active:_,children:(0,E.jsx)(d.sG.button,{type:"button",role:"tab","aria-selected":_,"aria-controls":m,"data-state":_?"active":"inactive","data-disabled":i?"":void 0,disabled:i,id:u,...o,ref:s,onMouseDown:(0,t.mK)(e.onMouseDown,e=>{i||0!==e.button||!1!==e.ctrlKey?e.preventDefault():l.onValueChange(a)}),onKeyDown:(0,t.mK)(e.onKeyDown,e=>{[" ","Enter"].includes(e.key)&&l.onValueChange(a)}),onFocus:(0,t.mK)(e.onFocus,()=>{let e="manual"!==l.activationMode;_||i||!e||l.onValueChange(a)})})})});x.displayName=h;var g="TabsContent",v=a.forwardRef((e,s)=>{let{__scopeTabs:r,value:t,forceMount:i,children:n,...l}=e,c=R(g,r),u=C(c.baseId,t),m=D(c.baseId,t),_=t===c.value,p=a.useRef(_);return a.useEffect(()=>{let e=requestAnimationFrame(()=>p.current=!1);return()=>cancelAnimationFrame(e)},[]),(0,E.jsx)(o.C,{present:i||_,children:({present:r})=>(0,E.jsx)(d.sG.div,{"data-state":_?"active":"inactive","data-orientation":c.orientation,role:"tabpanel","aria-labelledby":u,hidden:!r,id:m,tabIndex:0,...l,ref:s,style:{...e.style,animationDuration:p.current?"0s":void 0},children:r&&n})})});function C(e,s){return`${e}-trigger-${s}`}function D(e,s){return`${e}-content-${s}`}v.displayName=g;var I=N,y=f,L=x,b=v},63033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},63144:(e,s,r)=>{"use strict";r.r(s),r.d(s,{default:()=>d});var a=r(37413),t=r(50417),i=r(18862),n=r(30072),o=r(35660);function d({children:e}){return(0,a.jsxs)(t.SidebarProvider,{children:[(0,a.jsxs)(t.Sidebar,{children:[(0,a.jsx)(t.SidebarHeader,{children:(0,a.jsxs)("div",{className:"flex items-center gap-2",children:[(0,a.jsx)(i.Avatar,{className:"size-8 bg-primary/20 text-primary",children:(0,a.jsx)(n.A,{className:"m-1.5"})}),(0,a.jsx)("div",{className:"flex flex-col",children:(0,a.jsx)("span",{className:"text-sm font-semibold text-sidebar-foreground",children:"Startup Compass"})})]})}),(0,a.jsx)(o.SidebarMenuClient,{}),(0,a.jsx)(t.SidebarFooter,{children:(0,a.jsx)(o.SidebarMenuClient,{isFooter:!0})})]}),(0,a.jsx)(t.SidebarInset,{children:e})]})}},74056:(e,s,r)=>{"use strict";r.r(s),r.d(s,{default:()=>u});var a=r(60687);r(43210);var t=r(29523),i=r(14975),n=r(77368),o=r(55817),d=r(24026),l=r(85814),c=r.n(l);function u({error:e,reset:s}){return(0,a.jsx)("div",{className:"flex items-center justify-center min-h-[60vh] p-4",children:(0,a.jsxs)("div",{className:"text-center max-w-md",children:[(0,a.jsx)("div",{className:"flex justify-center mb-6",children:(0,a.jsx)("div",{className:"p-4 rounded-full bg-destructive/10",children:(0,a.jsx)(i.A,{className:"h-12 w-12 text-destructive"})})}),(0,a.jsx)("h1",{className:"text-2xl font-bold text-foreground mb-2",children:"Dashboard Error"}),(0,a.jsx)("p",{className:"text-muted-foreground mb-6",children:"An error occurred while loading this dashboard component."}),!1,(0,a.jsxs)("div",{className:"flex gap-4 justify-center flex-wrap",children:[(0,a.jsxs)(t.$,{variant:"outline",onClick:s,children:[(0,a.jsx)(n.A,{className:"mr-2 h-4 w-4"}),"Try Again"]}),(0,a.jsx)(t.$,{variant:"outline",asChild:!0,children:(0,a.jsxs)(c(),{href:"/dashboard",children:[(0,a.jsx)(o.A,{className:"mr-2 h-4 w-4"}),"Back to Dashboard"]})}),(0,a.jsx)(t.$,{asChild:!0,children:(0,a.jsxs)(c(),{href:"/",children:[(0,a.jsx)(d.A,{className:"mr-2 h-4 w-4"}),"Home"]})})]})]})})}},79551:e=>{"use strict";e.exports=require("url")},85763:(e,s,r)=>{"use strict";r.d(s,{Xi:()=>l,av:()=>c,j7:()=>d,tU:()=>o});var a=r(60687),t=r(43210),i=r(55146),n=r(4780);let o=i.bL,d=t.forwardRef(({className:e,...s},r)=>(0,a.jsx)(i.B8,{ref:r,className:(0,n.cn)("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",e),...s}));d.displayName=i.B8.displayName;let l=t.forwardRef(({className:e,...s},r)=>(0,a.jsx)(i.l9,{ref:r,className:(0,n.cn)("inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",e),...s}));l.displayName=i.l9.displayName;let c=t.forwardRef(({className:e,...s},r)=>(0,a.jsx)(i.UC,{ref:r,className:(0,n.cn)("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",e),...s}));c.displayName=i.UC.displayName},89025:(e,s,r)=>{Promise.resolve().then(r.bind(r,21792))},95162:(e,s,r)=>{"use strict";r.r(s),r.d(s,{GlobalError:()=>n.a,__next_app__:()=>u,pages:()=>c,routeModule:()=>E,tree:()=>l});var a=r(65239),t=r(48088),i=r(88170),n=r.n(i),o=r(30893),d={};for(let e in o)0>["default","tree","pages","GlobalError","__next_app__","routeModule"].indexOf(e)&&(d[e]=()=>o[e]);r.d(s,d);let l={children:["",{children:["dashboard",{children:["schema",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(r.bind(r,27537)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\dashboard\\schema\\page.tsx"]}]},{}]},{layout:[()=>Promise.resolve().then(r.bind(r,63144)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\dashboard\\layout.tsx"],error:[()=>Promise.resolve().then(r.bind(r,45434)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\dashboard\\error.tsx"],metadata:{icon:[async e=>(await Promise.resolve().then(r.bind(r,70440))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]},{layout:[()=>Promise.resolve().then(r.bind(r,94431)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\layout.tsx"],error:[()=>Promise.resolve().then(r.bind(r,54431)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\error.tsx"],loading:[()=>Promise.resolve().then(r.bind(r,65247)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\loading.tsx"],"not-found":[()=>Promise.resolve().then(r.bind(r,54413)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\not-found.tsx"],forbidden:[()=>Promise.resolve().then(r.t.bind(r,89999,23)),"next/dist/client/components/forbidden-error"],unauthorized:[()=>Promise.resolve().then(r.t.bind(r,65284,23)),"next/dist/client/components/unauthorized-error"],metadata:{icon:[async e=>(await Promise.resolve().then(r.bind(r,70440))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]}.children,c=["C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\dashboard\\schema\\page.tsx"],u={require:r,loadChunk:()=>Promise.resolve()},E=new a.AppPageRouteModule({definition:{kind:t.RouteKind.APP_PAGE,page:"/dashboard/schema/page",pathname:"/dashboard/schema",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:l}})}};var s=require("../../../webpack-runtime.js");s.C(e);var r=e=>s(s.s=e),a=s.X(0,[4447,8167,8010,5779,2945,9414,945],()=>r(95162));module.exports=a})();