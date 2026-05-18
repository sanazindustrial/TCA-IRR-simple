(()=>{var a={};a.id=2047,a.ids=[2047],a.modules={261:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/app-paths")},3295:a=>{"use strict";a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},17187:(a,b,c)=>{"use strict";c.r(b),c.d(b,{handler:()=>B,patchFetch:()=>A,routeModule:()=>w,serverHooks:()=>z,workAsyncStorage:()=>x,workUnitAsyncStorage:()=>y});var d={};c.r(d),c.d(d,{POST:()=>v});var e=c(95736),f=c(9117),g=c(4044),h=c(39326),i=c(32324),j=c(261),k=c(54290),l=c(85328),m=c(38928),n=c(46595),o=c(3421),p=c(17679),q=c(41681),r=c(63446),s=c(86439),t=c(51356),u=c(10641);async function v(a){try{let b=await a.json(),{selected_sections:c,module_results:d,final_score:e,company_data:f,recommendation:g}=b,h=b.what_if_analysis??b.whatIfScenarios??null,i=Array.isArray(h)?{base_case:h[0],best_case:h[1],worst_case:h[2],sensitivity_range:null}:h,j=Number(e??b.compositeScore??5),k=String(f?.company_name??b.companyName??"the company"),l=String(f?.sector??b.sector??"Technology"),m=String(f?.stage??b.stage??"Early Stage"),n=d??b.moduleResults??[],o=c??b.selectedSections??[],p=new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"}),q=o.map(a=>({id:a,...(a=>{let b={};n.forEach(a=>{b[a.module]=a});let c=a=>b[a]?.score?.toFixed(1)??"N/A",d=a=>b[a]?.explanation??"";return({executive_summary:{title:"Executive Summary",content:`**${k}** — TCA Investment Triage Report

Date: ${p} | Stage: ${m} | Sector: ${l}

Composite Score: **${j.toFixed(1)}/10**

${g?.recommendation??""}

This report provides a comprehensive assessment of ${k} across ${n.length} analysis modules using the TCA-IRR framework.`},company_overview:{title:"Company Overview",content:`**Company:** ${k}
**Sector:** ${l}
**Stage:** ${m}
**Location:** ${f?.location??"Not specified"}
**Website:** ${f?.website??"Not specified"}

**Product/Service Description:**
${f?.product_description??"See pitch deck for full product description."}

**Key Metrics:**
${f?.key_metrics??"Financial details available in data room."}`},tca_scorecard:{title:"TCA Scorecard",content:`**Composite TCA Score: ${j.toFixed(1)}/10**

Module Scores:
${n.map(a=>`• **${a.module.toUpperCase()}**: ${a.score.toFixed(1)}/10 (${a.risk})`).join("\n")}

Overall Risk Rating: ${j>=6.5?"GREEN":j>=4.5?"YELLOW":"RED"}`},financial_analysis:{title:"Financial Analysis",content:`**Financial Module Score: ${c("financial")}/10**

${d("financial")||`Financial analysis for ${k} reveals ${j>=6.5?"solid":"developing"} revenue foundations. Key financial indicators assessed include revenue growth trajectory, burn rate, unit economics, and path to profitability.`}

**Key Financial Indicators:**
• Revenue model viability assessed
• Unit economics reviewed
• Burn rate and runway analyzed
• Capital efficiency evaluated`},risk_assessment:{title:"Risk Assessment",content:`**Risk Module Score: ${c("risk")}/10**

${d("risk")||`Comprehensive risk assessment across 14 domains for ${k}.`}

Red Flags: ${n.filter(a=>"RED"===a.risk).map(a=>a.module).join(", ")||"None identified"}

**Risk Categories Assessed:**
• Market risk
• Execution risk
• Financial risk
• Regulatory risk
• Competitive risk`},team_evaluation:{title:"Team Evaluation",content:`**Team Module Score: ${c("team")}/10**

${d("team")||`Team assessment for ${k} evaluating leadership, domain expertise, and execution track record.`}

**Team Dimensions Assessed:**
• Founder background and expertise
• Team completeness
• Execution history
• Advisory board quality
• Culture and values alignment`},market_analysis:{title:"Market Analysis",content:`**Growth Module Score: ${c("growth")}/10** | **Economic Module Score: ${c("economic")}/10**

${d("growth")||`Market analysis for ${k} in the ${l} sector.`}

**Market Assessment:**
• TAM/SAM/SOM analysis
• Growth rate assessment
• Competitive landscape mapping
• Market timing evaluation`},competitive_landscape:{title:"Competitive Landscape",content:`**Strategic Module Score: ${c("strategic")}/10** | **Benchmark Score: ${c("benchmark")}/10**

${d("strategic")||`Competitive analysis for ${k} against sector peers.`}

**Competitive Position:**
• Direct competitors identified
• Differentiation factors assessed
• Moat strength evaluated
• Market share opportunity sized`},macro_trends:{title:"Macro Trends & PESTEL",content:`**Macro Trend Score: ${c("macro")}/10**

${d("macro")||`PESTEL analysis for ${k} in current market environment.`}

**PESTEL Analysis:**
• Political: regulatory environment
• Economic: macro indicators
• Social: demographic trends
• Technological: tech adoption
• Environmental: ESG factors
• Legal: compliance landscape`},esg_impact:{title:"ESG & Social Impact",content:`**Environmental Score: ${c("environmental")}/10** | **Social Score: ${c("social")}/10**

${d("environmental")||`ESG assessment for ${k}.`}

**ESG Framework Assessment:**
• Environmental footprint
• Social impact metrics
• Governance structure
• SDG alignment
• Impact measurement`},what_if_analysis:{title:"What-If Scenario Analysis",content:`**Scenario Analysis for ${k}**

**Base Case (${i?.base_case?.score??j.toFixed(1)}/10):** ${i?.base_case?.narrative??"Current trajectory maintained."}

**Best Case (${i?.best_case?.score??"N/A"}/10):** ${i?.best_case?.narrative??"Favorable execution and market conditions."}

**Worst Case (${i?.worst_case?.score??"N/A"}/10):** ${i?.worst_case?.narrative??"Challenging market environment and execution risks materialize."}`},investment_recommendation:{title:"Investment Recommendation",content:g?.recommendation??`Based on the TCA-IRR analysis, the composite score of ${j.toFixed(1)}/10 supports a **${j>=7.5?"Proceed":j>=6?"Conditional":j>=4.5?"Monitor":"Pass"}** recommendation.

**Next Steps:**
${(g?.action_items??[]).map(a=>`• ${a}`).join("\n")}`},founder_fit:{title:"Founder Fit Assessment",content:`**Founder Fit Score: ${c("founderFit")}/10**

${d("founderFit")||`Founder fit analysis for the ${k} leadership team.`}

**Assessment Dimensions:**
• Domain expertise alignment
• Prior startup experience
• Market understanding
• Coachability indicators
• Mission-founder alignment`},gap_analysis:{title:"Gap Analysis",content:`**Gap Analysis Score: ${c("gap")}/10**

${d("gap")||`Gap analysis identifying improvement areas for ${k}.`}

**Identified Gaps:**
${n.filter(a=>a.score<6).map(a=>`• ${a.module}: Score ${a.score.toFixed(1)} — ${a.explanation.split(".")[0]}`).join("\n")||"• No significant gaps identified"}`},funder_readiness:{title:"Funder Readiness Assessment",content:`**Funder Readiness Score: ${c("funder")}/10**

${d("funder")||`Assessment of ${k}'s readiness for investor engagement.`}

**Readiness Checklist:**
• Investment materials
• Data room completeness
• Due diligence preparation
• Board governance
• Cap table clarity`},simulation_results:{title:"Simulation Results",content:`**Simulation Score: ${c("simulation")}/10**

${d("simulation")||`Monte Carlo simulation results for ${k}.`}

**Simulation Output:**
• Base case: ${i?.base_case?.score??j.toFixed(1)}
• Best case: ${i?.best_case?.score??"N/A"}
• Worst case: ${i?.worst_case?.score??"N/A"}
• Sensitivity range: ${i?.sensitivity_range?.spread??"N/A"} points`},appendix:{title:"Appendix",content:`**Appendix: Full Module Scores**

${n.map(a=>`**${a.module.toUpperCase()}**
Score: ${a.score.toFixed(1)}/10 | Risk: ${a.risk} | Confidence: ${(a.confidence??.7).toFixed(2)}
${a.explanation}
`).join("\n")}

---
Report generated by TCA-IRR Framework v2.0 | ${p}`}})[a]??{title:a.replace(/_/g," ").replace(/\b\w/g,a=>a.toUpperCase()),content:`Section content for ${a} has been generated based on the analysis data.`}})(a),generated_at:new Date().toISOString()}));return u.NextResponse.json({report_sections:q,sections:q,sections_generated:o.length,company_name:k,status:"generated"})}catch(a){return console.error("[report/generate-sections]",a),u.NextResponse.json({error:"Section generation failed"},{status:500})}}let w=new e.AppRouteRouteModule({definition:{kind:f.RouteKind.APP_ROUTE,page:"/api/report/generate-sections/route",pathname:"/api/report/generate-sections",filename:"route",bundlePath:"app/api/report/generate-sections/route"},distDir:".next",relativeProjectDir:"",resolvedPagePath:"C:\\Users\\verso\\OneDrive\\Desktop\\TCA-IRR-APP-main- simplify\\src\\app\\api\\report\\generate-sections\\route.ts",nextConfigOutput:"standalone",userland:d}),{workAsyncStorage:x,workUnitAsyncStorage:y,serverHooks:z}=w;function A(){return(0,g.patchFetch)({workAsyncStorage:x,workUnitAsyncStorage:y})}async function B(a,b,c){var d;let e="/api/report/generate-sections/route";"/index"===e&&(e="/");let g=await w.prepare(a,b,{srcPage:e,multiZoneDraftMode:!1});if(!g)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:u,params:v,nextConfig:x,isDraftMode:y,prerenderManifest:z,routerServerContext:A,isOnDemandRevalidate:B,revalidateOnlyGenerated:C,resolvedPathname:D}=g,E=(0,j.normalizeAppPath)(e),F=!!(z.dynamicRoutes[E]||z.routes[D]);if(F&&!y){let a=!!z.routes[D],b=z.dynamicRoutes[E];if(b&&!1===b.fallback&&!a)throw new s.NoFallbackError}let G=null;!F||w.isDev||y||(G="/index"===(G=D)?"/":G);let H=!0===w.isDev||!F,I=F&&!H,J=a.method||"GET",K=(0,i.getTracer)(),L=K.getActiveScopeSpan(),M={params:v,prerenderManifest:z,renderOpts:{experimental:{cacheComponents:!!x.experimental.cacheComponents,authInterrupts:!!x.experimental.authInterrupts},supportsDynamicResponse:H,incrementalCache:(0,h.getRequestMeta)(a,"incrementalCache"),cacheLifeProfiles:null==(d=x.experimental)?void 0:d.cacheLife,isRevalidate:I,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d)=>w.onRequestError(a,b,d,A)},sharedContext:{buildId:u}},N=new k.NodeNextRequest(a),O=new k.NodeNextResponse(b),P=l.NextRequestAdapter.fromNodeNextRequest(N,(0,l.signalFromNodeResponse)(b));try{let d=async c=>w.handle(P,M).finally(()=>{if(!c)return;c.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let d=K.getRootSpanAttributes();if(!d)return;if(d.get("next.span_type")!==m.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${d.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=d.get("next.route");if(e){let a=`${J} ${e}`;c.setAttributes({"next.route":e,"http.route":e,"next.span_name":a}),c.updateName(a)}else c.updateName(`${J} ${a.url}`)}),g=async g=>{var i,j;let k=async({previousCacheEntry:f})=>{try{if(!(0,h.getRequestMeta)(a,"minimalMode")&&B&&C&&!f)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let e=await d(g);a.fetchMetrics=M.renderOpts.fetchMetrics;let i=M.renderOpts.pendingWaitUntil;i&&c.waitUntil&&(c.waitUntil(i),i=void 0);let j=M.renderOpts.collectedTags;if(!F)return await (0,o.I)(N,O,e,M.renderOpts.pendingWaitUntil),null;{let a=await e.blob(),b=(0,p.toNodeOutgoingHttpHeaders)(e.headers);j&&(b[r.NEXT_CACHE_TAGS_HEADER]=j),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==M.renderOpts.collectedRevalidate&&!(M.renderOpts.collectedRevalidate>=r.INFINITE_CACHE)&&M.renderOpts.collectedRevalidate,d=void 0===M.renderOpts.collectedExpire||M.renderOpts.collectedExpire>=r.INFINITE_CACHE?void 0:M.renderOpts.collectedExpire;return{value:{kind:t.CachedRouteKind.APP_ROUTE,status:e.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:d}}}}catch(b){throw(null==f?void 0:f.isStale)&&await w.onRequestError(a,b,{routerKind:"App Router",routePath:e,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:I,isOnDemandRevalidate:B})},A),b}},l=await w.handleResponse({req:a,nextConfig:x,cacheKey:G,routeKind:f.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:z,isRoutePPREnabled:!1,isOnDemandRevalidate:B,revalidateOnlyGenerated:C,responseGenerator:k,waitUntil:c.waitUntil});if(!F)return null;if((null==l||null==(i=l.value)?void 0:i.kind)!==t.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==l||null==(j=l.value)?void 0:j.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});(0,h.getRequestMeta)(a,"minimalMode")||b.setHeader("x-nextjs-cache",B?"REVALIDATED":l.isMiss?"MISS":l.isStale?"STALE":"HIT"),y&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let m=(0,p.fromNodeOutgoingHttpHeaders)(l.value.headers);return(0,h.getRequestMeta)(a,"minimalMode")&&F||m.delete(r.NEXT_CACHE_TAGS_HEADER),!l.cacheControl||b.getHeader("Cache-Control")||m.get("Cache-Control")||m.set("Cache-Control",(0,q.getCacheControlHeader)(l.cacheControl)),await (0,o.I)(N,O,new Response(l.value.body,{headers:m,status:l.value.status||200})),null};L?await g(L):await K.withPropagatedContext(a.headers,()=>K.trace(m.BaseServerSpan.handleRequest,{spanName:`${J} ${a.url}`,kind:i.SpanKind.SERVER,attributes:{"http.method":J,"http.target":a.url}},g))}catch(b){if(b instanceof s.NoFallbackError||await w.onRequestError(a,b,{routerKind:"App Router",routePath:E,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:I,isOnDemandRevalidate:B})}),F)throw b;return await (0,o.I)(N,O,new Response(null,{status:500})),null}}},19121:a=>{"use strict";a.exports=require("next/dist/server/app-render/action-async-storage.external.js")},29294:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},44870:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},63033:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},78335:()=>{},86439:a=>{"use strict";a.exports=require("next/dist/shared/lib/no-fallback-error.external")},96487:()=>{}};var b=require("../../../../webpack-runtime.js");b.C(a);var c=b.X(0,[1331,1692],()=>b(b.s=17187));module.exports=c})();