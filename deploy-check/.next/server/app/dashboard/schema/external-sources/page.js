"use strict";(()=>{var e={};e.id=6182,e.ids=[6182],e.modules={3295:e=>{e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},3515:(e,r,s)=>{s.d(r,{A:()=>l});var t=s(61120);let a=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),o=(...e)=>e.filter((e,r,s)=>!!e&&""!==e.trim()&&s.indexOf(e)===r).join(" ").trim();var n={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};let i=(0,t.forwardRef)(({color:e="currentColor",size:r=24,strokeWidth:s=2,absoluteStrokeWidth:a,className:i="",children:l,iconNode:d,...c},p)=>(0,t.createElement)("svg",{ref:p,...n,width:r,height:r,stroke:e,strokeWidth:a?24*Number(s)/Number(r):s,className:o("lucide",i),...c},[...d.map(([e,r])=>(0,t.createElement)(e,r)),...Array.isArray(l)?l:[l]])),l=(e,r)=>{let s=(0,t.forwardRef)(({className:s,...n},l)=>(0,t.createElement)(i,{ref:l,iconNode:r,className:o(`lucide-${a(e)}`,s),...n}));return s.displayName=`${e}`,s}},10846:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},19121:e=>{e.exports=require("next/dist/server/app-render/action-async-storage.external.js")},29294:e=>{e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},30072:(e,r,s)=>{s.d(r,{A:()=>t});let t=(0,s(3515).A)("Compass",[["path",{d:"m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z",key:"9ktpf1"}],["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]])},33873:e=>{e.exports=require("path")},63033:e=>{e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},79551:e=>{e.exports=require("url")},83396:(e,r,s)=>{s.r(r),s.d(r,{default:()=>i});var t=s(37413),a=s(78963);let o=`-- schema/external_sources.sql

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
`,n=({content:e})=>(0,t.jsx)("pre",{className:"bg-muted/50 p-4 rounded-lg overflow-x-auto text-sm font-mono",children:(0,t.jsx)("code",{children:e})});function i(){return(0,t.jsxs)("div",{children:[(0,t.jsxs)(a.aR,{className:"px-0",children:[(0,t.jsx)(a.ZB,{children:"External Sources Schema"}),(0,t.jsx)(a.BT,{children:"Defines tables for storing and managing configurations for all external data sources."})]}),(0,t.jsx)(n,{content:o})]})}},89464:(e,r,s)=>{s.r(r),s.d(r,{GlobalError:()=>n.a,__next_app__:()=>p,pages:()=>c,routeModule:()=>u,tree:()=>d});var t=s(65239),a=s(48088),o=s(88170),n=s.n(o),i=s(30893),l={};for(let e in i)0>["default","tree","pages","GlobalError","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>i[e]);s.d(r,l);let d={children:["",{children:["dashboard",{children:["schema",{children:["external-sources",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,83396)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\dashboard\\schema\\external-sources\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,63144)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\dashboard\\layout.tsx"],metadata:{icon:[async e=>(await Promise.resolve().then(s.bind(s,70440))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]},{layout:[()=>Promise.resolve().then(s.bind(s,94431)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\layout.tsx"],loading:[()=>Promise.resolve().then(s.bind(s,65247)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\loading.tsx"],"not-found":[()=>Promise.resolve().then(s.bind(s,54413)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\not-found.tsx"],forbidden:[()=>Promise.resolve().then(s.t.bind(s,89999,23)),"next/dist/client/components/forbidden-error"],unauthorized:[()=>Promise.resolve().then(s.t.bind(s,65284,23)),"next/dist/client/components/unauthorized-error"],metadata:{icon:[async e=>(await Promise.resolve().then(s.bind(s,70440))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]}.children,c=["C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\dashboard\\schema\\external-sources\\page.tsx"],p={require:s,loadChunk:()=>Promise.resolve()},u=new t.AppPageRouteModule({definition:{kind:a.RouteKind.APP_PAGE,page:"/dashboard/schema/external-sources/page",pathname:"/dashboard/schema/external-sources",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})}};var r=require("../../../../webpack-runtime.js");r.C(e);var s=e=>r(r.s=e),t=r.X(0,[4447,6493,1172,9635,8730,174,5341,8400,2184],()=>s(89464));module.exports=t})();