"use strict";(()=>{var e={};e.id=5674,e.ids=[5674],e.modules={1036:(e,r,o)=>{o.r(r),o.d(r,{GlobalError:()=>a.a,__next_app__:()=>c,pages:()=>u,routeModule:()=>m,tree:()=>l});var i=o(65239),t=o(48088),n=o(88170),a=o.n(n),s=o(30893),d={};for(let e in s)0>["default","tree","pages","GlobalError","__next_app__","routeModule"].indexOf(e)&&(d[e]=()=>s[e]);o.d(r,d);let l={children:["",{children:["dashboard",{children:["schema",{children:["module-configurations",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(o.bind(o,81674)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\dashboard\\schema\\module-configurations\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(o.bind(o,63144)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\dashboard\\layout.tsx"],metadata:{icon:[async e=>(await Promise.resolve().then(o.bind(o,70440))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]},{layout:[()=>Promise.resolve().then(o.bind(o,94431)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\layout.tsx"],loading:[()=>Promise.resolve().then(o.bind(o,65247)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\loading.tsx"],"not-found":[()=>Promise.resolve().then(o.bind(o,54413)),"C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\not-found.tsx"],forbidden:[()=>Promise.resolve().then(o.t.bind(o,89999,23)),"next/dist/client/components/forbidden-error"],unauthorized:[()=>Promise.resolve().then(o.t.bind(o,65284,23)),"next/dist/client/components/unauthorized-error"],metadata:{icon:[async e=>(await Promise.resolve().then(o.bind(o,70440))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]}.children,u=["C:\\Users\\Allot\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\dashboard\\schema\\module-configurations\\page.tsx"],c={require:o,loadChunk:()=>Promise.resolve()},m=new i.AppPageRouteModule({definition:{kind:t.RouteKind.APP_PAGE,page:"/dashboard/schema/module-configurations/page",pathname:"/dashboard/schema/module-configurations",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:l}})},3295:e=>{e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},3515:(e,r,o)=>{o.d(r,{A:()=>d});var i=o(61120);let t=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),n=(...e)=>e.filter((e,r,o)=>!!e&&""!==e.trim()&&o.indexOf(e)===r).join(" ").trim();var a={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};let s=(0,i.forwardRef)(({color:e="currentColor",size:r=24,strokeWidth:o=2,absoluteStrokeWidth:t,className:s="",children:d,iconNode:l,...u},c)=>(0,i.createElement)("svg",{ref:c,...a,width:r,height:r,stroke:e,strokeWidth:t?24*Number(o)/Number(r):o,className:n("lucide",s),...u},[...l.map(([e,r])=>(0,i.createElement)(e,r)),...Array.isArray(d)?d:[d]])),d=(e,r)=>{let o=(0,i.forwardRef)(({className:o,...a},d)=>(0,i.createElement)(s,{ref:d,iconNode:r,className:n(`lucide-${t(e)}`,o),...a}));return o.displayName=`${e}`,o}},10846:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},19121:e=>{e.exports=require("next/dist/server/app-render/action-async-storage.external.js")},29294:e=>{e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},30072:(e,r,o)=>{o.d(r,{A:()=>i});let i=(0,o(3515).A)("Compass",[["path",{d:"m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z",key:"9ktpf1"}],["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]])},33873:e=>{e.exports=require("path")},63033:e=>{e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},79551:e=>{e.exports=require("url")},81674:(e,r,o)=>{o.r(r),o.d(r,{default:()=>s});var i=o(37413),t=o(78963);let n=`-- schema/module_configurations.sql

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
`,a=({content:e})=>(0,i.jsx)("pre",{className:"bg-muted/50 p-4 rounded-lg overflow-x-auto text-sm font-mono",children:(0,i.jsx)("code",{children:e})});function s(){return(0,i.jsxs)("div",{children:[(0,i.jsxs)(t.aR,{className:"px-0",children:[(0,i.jsx)(t.ZB,{children:"Module Configurations Schema"}),(0,i.jsx)(t.BT,{children:"Defines tables for saving, versioning, and rolling back analysis module configurations."})]}),(0,i.jsx)(a,{content:n})]})}}};var r=require("../../../../webpack-runtime.js");r.C(e);var o=e=>r(r.s=e),i=r.X(0,[4447,6493,1172,9635,8730,174,5341,8400,2184],()=>o(1036));module.exports=i})();