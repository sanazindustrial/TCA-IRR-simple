(()=>{var e={};e.id=6182,e.ids=[6182],e.modules={3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},19121:e=>{"use strict";e.exports=require("next/dist/server/app-render/action-async-storage.external.js")},26955:(e,r,s)=>{Promise.resolve().then(s.bind(s,74056))},29294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},32531:(e,r,s)=>{Promise.resolve().then(s.bind(s,45434))},33873:e=>{"use strict";e.exports=require("path")},45434:(e,r,s)=>{"use strict";s.r(r),s.d(r,{default:()=>t});let t=(0,s(12907).registerClientReference)(function(){throw Error("Attempted to call the default export of \"C:\\\\Users\\\\Allot\\\\OneDrive\\\\Desktop\\\\TCA-IRR-APP-main- simplify\\\\src\\\\app\\\\dashboard\\\\error.tsx\" from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\dashboard\\error.tsx","default")},63033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},63144:(e,r,s)=>{"use strict";s.r(r),s.d(r,{default:()=>l});var t=s(37413),a=s(50417),i=s(18862),n=s(30072),o=s(35660);function l({children:e}){return(0,t.jsxs)(a.SidebarProvider,{children:[(0,t.jsxs)(a.Sidebar,{children:[(0,t.jsx)(a.SidebarHeader,{children:(0,t.jsxs)("div",{className:"flex items-center gap-2",children:[(0,t.jsx)(i.Avatar,{className:"size-8 bg-primary/20 text-primary",children:(0,t.jsx)(n.A,{className:"m-1.5"})}),(0,t.jsx)("div",{className:"flex flex-col",children:(0,t.jsx)("span",{className:"text-sm font-semibold text-sidebar-foreground",children:"Startup Compass"})})]})}),(0,t.jsx)(o.SidebarMenuClient,{}),(0,t.jsx)(a.SidebarFooter,{children:(0,t.jsx)(o.SidebarMenuClient,{isFooter:!0})})]}),(0,t.jsx)(a.SidebarInset,{children:e})]})}},74056:(e,r,s)=>{"use strict";s.r(r),s.d(r,{default:()=>p});var t=s(60687);s(43210);var a=s(29523),i=s(14975),n=s(77368),o=s(55817),l=s(24026),d=s(85814),c=s.n(d);function p({error:e,reset:r}){return(0,t.jsx)("div",{className:"flex items-center justify-center min-h-[60vh] p-4",children:(0,t.jsxs)("div",{className:"text-center max-w-md",children:[(0,t.jsx)("div",{className:"flex justify-center mb-6",children:(0,t.jsx)("div",{className:"p-4 rounded-full bg-destructive/10",children:(0,t.jsx)(i.A,{className:"h-12 w-12 text-destructive"})})}),(0,t.jsx)("h1",{className:"text-2xl font-bold text-foreground mb-2",children:"Dashboard Error"}),(0,t.jsx)("p",{className:"text-muted-foreground mb-6",children:"An error occurred while loading this dashboard component."}),!1,(0,t.jsxs)("div",{className:"flex gap-4 justify-center flex-wrap",children:[(0,t.jsxs)(a.$,{variant:"outline",onClick:r,children:[(0,t.jsx)(n.A,{className:"mr-2 h-4 w-4"}),"Try Again"]}),(0,t.jsx)(a.$,{variant:"outline",asChild:!0,children:(0,t.jsxs)(c(),{href:"/dashboard",children:[(0,t.jsx)(o.A,{className:"mr-2 h-4 w-4"}),"Back to Dashboard"]})}),(0,t.jsx)(a.$,{asChild:!0,children:(0,t.jsxs)(c(),{href:"/",children:[(0,t.jsx)(l.A,{className:"mr-2 h-4 w-4"}),"Home"]})})]})]})})}},79551:e=>{"use strict";e.exports=require("url")},83396:(e,r,s)=>{"use strict";s.r(r),s.d(r,{default:()=>o});var t=s(37413),a=s(78963);let i=`-- schema/external_sources.sql

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
`,n=({content:e})=>(0,t.jsx)("pre",{className:"bg-muted/50 p-4 rounded-lg overflow-x-auto text-sm font-mono",children:(0,t.jsx)("code",{children:e})});function o(){return(0,t.jsxs)("div",{children:[(0,t.jsxs)(a.aR,{className:"px-0",children:[(0,t.jsx)(a.ZB,{children:"External Sources Schema"}),(0,t.jsx)(a.BT,{children:"Defines tables for storing and managing configurations for all external data sources."})]}),(0,t.jsx)(n,{content:i})]})}},89464:(e,r,s)=>{"use strict";s.r(r),s.d(r,{GlobalError:()=>n.a,__next_app__:()=>p,pages:()=>c,routeModule:()=>u,tree:()=>d});var t=s(65239),a=s(48088),i=s(88170),n=s.n(i),o=s(30893),l={};for(let e in o)0>["default","tree","pages","GlobalError","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>o[e]);s.d(r,l);let d={children:["",{children:["dashboard",{children:["schema",{children:["external-sources",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,83396)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\dashboard\\schema\\external-sources\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,63144)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\dashboard\\layout.tsx"],error:[()=>Promise.resolve().then(s.bind(s,45434)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\dashboard\\error.tsx"],metadata:{icon:[async e=>(await Promise.resolve().then(s.bind(s,70440))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]},{layout:[()=>Promise.resolve().then(s.bind(s,94431)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\layout.tsx"],error:[()=>Promise.resolve().then(s.bind(s,54431)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\error.tsx"],loading:[()=>Promise.resolve().then(s.bind(s,65247)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\loading.tsx"],"not-found":[()=>Promise.resolve().then(s.bind(s,54413)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\not-found.tsx"],forbidden:[()=>Promise.resolve().then(s.t.bind(s,89999,23)),"next/dist/client/components/forbidden-error"],unauthorized:[()=>Promise.resolve().then(s.t.bind(s,65284,23)),"next/dist/client/components/unauthorized-error"],metadata:{icon:[async e=>(await Promise.resolve().then(s.bind(s,70440))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]}.children,c=["C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\dashboard\\schema\\external-sources\\page.tsx"],p={require:s,loadChunk:()=>Promise.resolve()},u=new t.AppPageRouteModule({definition:{kind:a.RouteKind.APP_PAGE,page:"/dashboard/schema/external-sources/page",pathname:"/dashboard/schema/external-sources",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})}};var r=require("../../../../webpack-runtime.js");r.C(e);var s=e=>r(r.s=e),t=r.X(0,[4447,8167,8010,5779,2945,9414,945],()=>s(89464));module.exports=t})();