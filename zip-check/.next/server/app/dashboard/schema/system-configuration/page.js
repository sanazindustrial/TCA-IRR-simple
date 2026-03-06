"use strict";(()=>{var e={};e.id=7820,e.ids=[7820],e.modules={2162:(e,r,s)=>{s.r(r),s.d(r,{default:()=>o});var t=s(37413),a=s(78963);let n=`-- schema/system_configurations.sql

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
`,i=({content:e})=>(0,t.jsx)("pre",{className:"bg-muted/50 p-4 rounded-lg overflow-x-auto text-sm font-mono",children:(0,t.jsx)("code",{children:e})});function o(){return(0,t.jsxs)("div",{children:[(0,t.jsxs)(a.aR,{className:"px-0",children:[(0,t.jsx)(a.ZB,{children:"System Configuration Schema"}),(0,t.jsx)(a.BT,{children:"Defines tables for storing environment variables and API keys securely."})]}),(0,t.jsx)(i,{content:n})]})}},3295:e=>{e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},3515:(e,r,s)=>{s.d(r,{A:()=>d});var t=s(61120);let a=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),n=(...e)=>e.filter((e,r,s)=>!!e&&""!==e.trim()&&s.indexOf(e)===r).join(" ").trim();var i={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};let o=(0,t.forwardRef)(({color:e="currentColor",size:r=24,strokeWidth:s=2,absoluteStrokeWidth:a,className:o="",children:d,iconNode:l,...p},m)=>(0,t.createElement)("svg",{ref:m,...i,width:r,height:r,stroke:e,strokeWidth:a?24*Number(s)/Number(r):s,className:n("lucide",o),...p},[...l.map(([e,r])=>(0,t.createElement)(e,r)),...Array.isArray(d)?d:[d]])),d=(e,r)=>{let s=(0,t.forwardRef)(({className:s,...i},d)=>(0,t.createElement)(o,{ref:d,iconNode:r,className:n(`lucide-${a(e)}`,s),...i}));return s.displayName=`${e}`,s}},10846:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},19121:e=>{e.exports=require("next/dist/server/app-render/action-async-storage.external.js")},29294:e=>{e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},30072:(e,r,s)=>{s.d(r,{A:()=>t});let t=(0,s(3515).A)("Compass",[["path",{d:"m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z",key:"9ktpf1"}],["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]])},33873:e=>{e.exports=require("path")},63033:e=>{e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},79551:e=>{e.exports=require("url")},98776:(e,r,s)=>{s.r(r),s.d(r,{GlobalError:()=>i.a,__next_app__:()=>m,pages:()=>p,routeModule:()=>c,tree:()=>l});var t=s(65239),a=s(48088),n=s(88170),i=s.n(n),o=s(30893),d={};for(let e in o)0>["default","tree","pages","GlobalError","__next_app__","routeModule"].indexOf(e)&&(d[e]=()=>o[e]);s.d(r,d);let l={children:["",{children:["dashboard",{children:["schema",{children:["system-configuration",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,2162)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\dashboard\\schema\\system-configuration\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,63144)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\dashboard\\layout.tsx"],metadata:{icon:[async e=>(await Promise.resolve().then(s.bind(s,70440))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]},{layout:[()=>Promise.resolve().then(s.bind(s,94431)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\layout.tsx"],loading:[()=>Promise.resolve().then(s.bind(s,65247)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\loading.tsx"],"not-found":[()=>Promise.resolve().then(s.bind(s,54413)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\not-found.tsx"],forbidden:[()=>Promise.resolve().then(s.t.bind(s,89999,23)),"next/dist/client/components/forbidden-error"],unauthorized:[()=>Promise.resolve().then(s.t.bind(s,65284,23)),"next/dist/client/components/unauthorized-error"],metadata:{icon:[async e=>(await Promise.resolve().then(s.bind(s,70440))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]}.children,p=["C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\dashboard\\schema\\system-configuration\\page.tsx"],m={require:s,loadChunk:()=>Promise.resolve()},c=new t.AppPageRouteModule({definition:{kind:a.RouteKind.APP_PAGE,page:"/dashboard/schema/system-configuration/page",pathname:"/dashboard/schema/system-configuration",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:l}})}};var r=require("../../../../webpack-runtime.js");r.C(e);var s=e=>r(r.s=e),t=r.X(0,[4447,6493,1172,9635,8730,174,5341,8400,2184],()=>s(98776));module.exports=t})();