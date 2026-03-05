(()=>{var e={};e.id=9925,e.ids=[9925],e.modules={3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},3515:(e,a,s)=>{"use strict";s.d(a,{A:()=>d});var r=s(61120);let t=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),i=(...e)=>e.filter((e,a,s)=>!!e&&""!==e.trim()&&s.indexOf(e)===a).join(" ").trim();var o={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};let n=(0,r.forwardRef)(({color:e="currentColor",size:a=24,strokeWidth:s=2,absoluteStrokeWidth:t,className:n="",children:d,iconNode:l,...E},u)=>(0,r.createElement)("svg",{ref:u,...o,width:a,height:a,stroke:e,strokeWidth:t?24*Number(s)/Number(a):s,className:i("lucide",n),...E},[...l.map(([e,a])=>(0,r.createElement)(e,a)),...Array.isArray(d)?d:[d]])),d=(e,a)=>{let s=(0,r.forwardRef)(({className:s,...o},d)=>(0,r.createElement)(n,{ref:d,iconNode:a,className:i(`lucide-${t(e)}`,s),...o}));return s.displayName=`${e}`,s}},10846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},19121:e=>{"use strict";e.exports=require("next/dist/server/app-render/action-async-storage.external.js")},21792:(e,a,s)=>{"use strict";s.r(a),s.d(a,{default:()=>x});var r=s(60687),t=s(44493),i=s(29844),o=s(81801),n=s(48206),d=s(36644),l=s(51212),E=s(58369),u=s(21028),c=s(85866);let _=`-- schema/module_configurations.sql

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
`,m=({content:e})=>(0,r.jsx)("pre",{className:"bg-muted/50 p-4 rounded-lg overflow-x-auto text-sm font-mono",children:(0,r.jsx)("code",{children:e})});function T(){return(0,r.jsxs)("div",{children:[(0,r.jsxs)(t.aR,{className:"px-0",children:[(0,r.jsx)(t.ZB,{children:"Module Configurations Schema"}),(0,r.jsx)(t.BT,{children:"Defines tables for saving, versioning, and rolling back analysis module configurations."})]}),(0,r.jsx)(m,{content:_})]})}let A=`-- schema/external_sources.sql

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
`,p=({content:e})=>(0,r.jsx)("pre",{className:"bg-muted/50 p-4 rounded-lg overflow-x-auto text-sm font-mono",children:(0,r.jsx)("code",{children:e})});function R(){return(0,r.jsxs)("div",{children:[(0,r.jsxs)(t.aR,{className:"px-0",children:[(0,r.jsx)(t.ZB,{children:"External Sources Schema"}),(0,r.jsx)(t.BT,{children:"Defines tables for storing and managing configurations for all external data sources."})]}),(0,r.jsx)(p,{content:A})]})}let U=`-- schema/system_configurations.sql

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
`,N=({content:e})=>(0,r.jsx)("pre",{className:"bg-muted/50 p-4 rounded-lg overflow-x-auto text-sm font-mono",children:(0,r.jsx)("code",{children:e})});function f(){return(0,r.jsxs)("div",{children:[(0,r.jsxs)(t.aR,{className:"px-0",children:[(0,r.jsx)(t.ZB,{children:"System Configuration Schema"}),(0,r.jsx)(t.BT,{children:"Defines tables for storing environment variables and API keys securely."})]}),(0,r.jsx)(N,{content:U})]})}let g=`-- schema/users.sql

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
);`,v=`-- schema/evaluations_and_reports.sql

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
`,h=`-- schema/app_requests.sql

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
CREATE INDEX idx_app_requests_type ON app_requests(request_type);`,D=({content:e})=>(0,r.jsx)("pre",{className:"bg-muted/50 p-4 rounded-lg overflow-x-auto text-sm font-mono",children:(0,r.jsx)("code",{children:e})});function x(){return(0,r.jsxs)("div",{className:"container mx-auto p-4 md:p-8",children:[(0,r.jsxs)("header",{className:"mb-8",children:[(0,r.jsxs)("h1",{className:"text-2xl font-semibold flex items-center gap-2",children:[(0,r.jsx)(o.A,{className:"text-primary"}),"Database Schema & Models"]}),(0,r.jsx)("p",{className:"text-muted-foreground",children:"PostgreSQL schema definitions for the application's data structures."})]}),(0,r.jsx)(t.Zp,{children:(0,r.jsx)(t.Wu,{className:"p-0",children:(0,r.jsxs)(i.tU,{defaultValue:"evaluations",className:"w-full",children:[(0,r.jsxs)(i.j7,{className:"p-2 h-auto rounded-b-none grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 w-full",children:[(0,r.jsxs)(i.Xi,{value:"users",className:"py-2 flex items-center gap-2",children:[(0,r.jsx)(n.A,{})," Users"]}),(0,r.jsxs)(i.Xi,{value:"evaluations",className:"py-2 flex items-center gap-2",children:[(0,r.jsx)(d.A,{})," Reports"]}),(0,r.jsxs)(i.Xi,{value:"modules",className:"py-2 flex items-center gap-2",children:[(0,r.jsx)(l.A,{})," Modules"]}),(0,r.jsxs)(i.Xi,{value:"system-configs",className:"py-2 flex items-center gap-2",children:[(0,r.jsx)(E.A,{})," System Config"]}),(0,r.jsxs)(i.Xi,{value:"external-sources",className:"py-2 flex items-center gap-2",children:[(0,r.jsx)(u.A,{})," External Sources"]}),(0,r.jsxs)(i.Xi,{value:"requests",className:"py-2 flex items-center gap-2",children:[(0,r.jsx)(c.A,{})," App Requests"]})]}),(0,r.jsxs)("div",{className:"p-6",children:[(0,r.jsxs)(i.av,{value:"users",children:[(0,r.jsxs)(t.aR,{className:"px-0",children:[(0,r.jsx)(t.ZB,{children:"User & Authentication Schema"}),(0,r.jsx)(t.BT,{children:"Defines tables for users, roles, settings, and quotas."})]}),(0,r.jsx)(D,{content:g})]}),(0,r.jsxs)(i.av,{value:"evaluations",children:[(0,r.jsxs)(t.aR,{className:"px-0",children:[(0,r.jsx)(t.ZB,{children:"Evaluations, Reports & Documents Schema"}),(0,r.jsx)(t.BT,{children:"Defines the core tables for evaluation runs, the resulting triage/DD reports, and submitted documents with their extracted metadata."})]}),(0,r.jsx)(D,{content:v})]}),(0,r.jsxs)(i.av,{value:"modules",children:[(0,r.jsxs)(t.aR,{className:"px-0",children:[(0,r.jsx)(t.ZB,{children:"Analysis Modules Schema"}),(0,r.jsx)(t.BT,{children:"Defines the nine dedicated tables for storing detailed results from each analysis module."})]}),(0,r.jsx)(D,{content:v.substring(v.indexOf("-- 9 Module Tables Follow --"))})]}),(0,r.jsx)(i.av,{value:"system-configs",children:(0,r.jsx)(f,{})}),(0,r.jsx)(i.av,{value:"module-configs",children:(0,r.jsx)(T,{})}),(0,r.jsx)(i.av,{value:"external-sources",children:(0,r.jsx)(R,{})}),(0,r.jsxs)(i.av,{value:"requests",children:[(0,r.jsxs)(t.aR,{className:"px-0",children:[(0,r.jsx)(t.ZB,{children:"Application Requests Schema"}),(0,r.jsx)(t.BT,{children:'Defines the table for managing user-submitted requests from the "Submit Request" page.'})]}),(0,r.jsx)(D,{content:h})]})]})]})})})]})}},27537:(e,a,s)=>{"use strict";s.r(a),s.d(a,{default:()=>r});let r=(0,s(12907).registerClientReference)(function(){throw Error("Attempted to call the default export of \"C:\\\\Users\\\\Allot\\\\OneDrive\\\\Desktop\\\\TCA-IRR-APP-main- simplify\\\\src\\\\app\\\\dashboard\\\\schema\\\\page.tsx\" from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\dashboard\\schema\\page.tsx","default")},29294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},29844:(e,a,s)=>{"use strict";s.d(a,{tU:()=>L,av:()=>O,j7:()=>y,Xi:()=>b});var r=s(60687),t=s(43210),i=s(70569),o=s(11273),n=s(72942),d=s(46059),l=s(3416),E=s(43),u=s(65551),c=s(96963),_="Tabs",[m,T]=(0,o.A)(_,[n.RG]),A=(0,n.RG)(),[p,R]=m(_),U=t.forwardRef((e,a)=>{let{__scopeTabs:s,value:t,onValueChange:i,defaultValue:o,orientation:n="horizontal",dir:d,activationMode:m="automatic",...T}=e,A=(0,E.jH)(d),[R,U]=(0,u.i)({prop:t,onChange:i,defaultProp:o??"",caller:_});return(0,r.jsx)(p,{scope:s,baseId:(0,c.B)(),value:R,onValueChange:U,orientation:n,dir:A,activationMode:m,children:(0,r.jsx)(l.sG.div,{dir:A,"data-orientation":n,...T,ref:a})})});U.displayName=_;var N="TabsList",f=t.forwardRef((e,a)=>{let{__scopeTabs:s,loop:t=!0,...i}=e,o=R(N,s),d=A(s);return(0,r.jsx)(n.bL,{asChild:!0,...d,orientation:o.orientation,dir:o.dir,loop:t,children:(0,r.jsx)(l.sG.div,{role:"tablist","aria-orientation":o.orientation,...i,ref:a})})});f.displayName=N;var g="TabsTrigger",v=t.forwardRef((e,a)=>{let{__scopeTabs:s,value:t,disabled:o=!1,...d}=e,E=R(g,s),u=A(s),c=x(E.baseId,t),_=C(E.baseId,t),m=t===E.value;return(0,r.jsx)(n.q7,{asChild:!0,...u,focusable:!o,active:m,children:(0,r.jsx)(l.sG.button,{type:"button",role:"tab","aria-selected":m,"aria-controls":_,"data-state":m?"active":"inactive","data-disabled":o?"":void 0,disabled:o,id:c,...d,ref:a,onMouseDown:(0,i.mK)(e.onMouseDown,e=>{o||0!==e.button||!1!==e.ctrlKey?e.preventDefault():E.onValueChange(t)}),onKeyDown:(0,i.mK)(e.onKeyDown,e=>{[" ","Enter"].includes(e.key)&&E.onValueChange(t)}),onFocus:(0,i.mK)(e.onFocus,()=>{let e="manual"!==E.activationMode;m||o||!e||E.onValueChange(t)})})})});v.displayName=g;var h="TabsContent",D=t.forwardRef((e,a)=>{let{__scopeTabs:s,value:i,forceMount:o,children:n,...E}=e,u=R(h,s),c=x(u.baseId,i),_=C(u.baseId,i),m=i===u.value,T=t.useRef(m);return t.useEffect(()=>{let e=requestAnimationFrame(()=>T.current=!1);return()=>cancelAnimationFrame(e)},[]),(0,r.jsx)(d.C,{present:o||m,children:({present:s})=>(0,r.jsx)(l.sG.div,{"data-state":m?"active":"inactive","data-orientation":u.orientation,role:"tabpanel","aria-labelledby":c,hidden:!s,id:_,tabIndex:0,...E,ref:a,style:{...e.style,animationDuration:T.current?"0s":void 0},children:s&&n})})});function x(e,a){return`${e}-trigger-${a}`}function C(e,a){return`${e}-content-${a}`}D.displayName=h;var I=s(4780);let L=U,y=t.forwardRef(({className:e,...a},s)=>(0,r.jsx)(f,{ref:s,className:(0,I.cn)("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",e),...a}));y.displayName=f.displayName;let b=t.forwardRef(({className:e,...a},s)=>(0,r.jsx)(v,{ref:s,className:(0,I.cn)("inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",e),...a}));b.displayName=v.displayName;let O=t.forwardRef(({className:e,...a},s)=>(0,r.jsx)(D,{ref:s,className:(0,I.cn)("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",e),...a}));O.displayName=D.displayName},30072:(e,a,s)=>{"use strict";s.d(a,{A:()=>r});let r=(0,s(3515).A)("Compass",[["path",{d:"m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z",key:"9ktpf1"}],["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]])},33873:e=>{"use strict";e.exports=require("path")},44493:(e,a,s)=>{"use strict";s.d(a,{BT:()=>l,Wu:()=>E,ZB:()=>d,Zp:()=>o,aR:()=>n,wL:()=>u});var r=s(60687),t=s(43210),i=s(4780);let o=t.forwardRef(({className:e,...a},s)=>(0,r.jsx)("div",{ref:s,className:(0,i.cn)("rounded-lg border bg-card text-card-foreground shadow-sm",e),...a}));o.displayName="Card";let n=t.forwardRef(({className:e,...a},s)=>(0,r.jsx)("div",{ref:s,className:(0,i.cn)("flex flex-col space-y-1.5 p-6",e),...a}));n.displayName="CardHeader";let d=t.forwardRef(({className:e,...a},s)=>(0,r.jsx)("div",{ref:s,className:(0,i.cn)("text-2xl font-semibold leading-none tracking-tight",e),...a}));d.displayName="CardTitle";let l=t.forwardRef(({className:e,...a},s)=>(0,r.jsx)("div",{ref:s,className:(0,i.cn)("text-sm text-muted-foreground",e),...a}));l.displayName="CardDescription";let E=t.forwardRef(({className:e,...a},s)=>(0,r.jsx)("div",{ref:s,className:(0,i.cn)("p-6 pt-0",e),...a}));E.displayName="CardContent";let u=t.forwardRef(({className:e,...a},s)=>(0,r.jsx)("div",{ref:s,className:(0,i.cn)("flex items-center p-6 pt-0",e),...a}));u.displayName="CardFooter"},52577:(e,a,s)=>{Promise.resolve().then(s.bind(s,27537))},63033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},79551:e=>{"use strict";e.exports=require("url")},89025:(e,a,s)=>{Promise.resolve().then(s.bind(s,21792))},95162:(e,a,s)=>{"use strict";s.r(a),s.d(a,{GlobalError:()=>o.a,__next_app__:()=>u,pages:()=>E,routeModule:()=>c,tree:()=>l});var r=s(65239),t=s(48088),i=s(88170),o=s.n(i),n=s(30893),d={};for(let e in n)0>["default","tree","pages","GlobalError","__next_app__","routeModule"].indexOf(e)&&(d[e]=()=>n[e]);s.d(a,d);let l={children:["",{children:["dashboard",{children:["schema",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,27537)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\dashboard\\schema\\page.tsx"]}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,63144)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\dashboard\\layout.tsx"],metadata:{icon:[async e=>(await Promise.resolve().then(s.bind(s,70440))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]},{layout:[()=>Promise.resolve().then(s.bind(s,94431)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\layout.tsx"],loading:[()=>Promise.resolve().then(s.bind(s,65247)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\loading.tsx"],"not-found":[()=>Promise.resolve().then(s.bind(s,54413)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\not-found.tsx"],forbidden:[()=>Promise.resolve().then(s.t.bind(s,89999,23)),"next/dist/client/components/forbidden-error"],unauthorized:[()=>Promise.resolve().then(s.t.bind(s,65284,23)),"next/dist/client/components/unauthorized-error"],metadata:{icon:[async e=>(await Promise.resolve().then(s.bind(s,70440))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]}.children,E=["C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\dashboard\\schema\\page.tsx"],u={require:s,loadChunk:()=>Promise.resolve()},c=new r.AppPageRouteModule({definition:{kind:t.RouteKind.APP_PAGE,page:"/dashboard/schema/page",pathname:"/dashboard/schema",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:l}})}};var a=require("../../../webpack-runtime.js");a.C(e);var s=e=>a(a.s=e),r=a.X(0,[4447,6493,1172,9635,8730,174,5341,8400,2184],()=>s(95162));module.exports=r})();