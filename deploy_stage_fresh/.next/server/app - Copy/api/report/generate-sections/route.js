(()=>{var e={};e.id=2047,e.ids=[2047],e.modules={3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},29294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},44870:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},55228:(e,t,n)=>{"use strict";n.r(t),n.d(t,{patchFetch:()=>u,routeModule:()=>l,serverHooks:()=>p,workAsyncStorage:()=>d,workUnitAsyncStorage:()=>m});var a={};n.r(a),n.d(a,{POST:()=>c});var s=n(96559),i=n(48088),r=n(37719),o=n(32190);async function c(e){try{let t=await e.json(),{selected_sections:n,module_results:a,final_score:s,company_data:i,recommendation:r}=t,c=t.what_if_analysis??t.whatIfScenarios??null,l=Array.isArray(c)?{base_case:c[0],best_case:c[1],worst_case:c[2],sensitivity_range:null}:c,d=Number(s??t.compositeScore??5),m=String(i?.company_name??t.companyName??"the company"),p=String(i?.sector??t.sector??"Technology"),u=String(i?.stage??t.stage??"Early Stage"),$=a??t.moduleResults??[],g=n??t.selectedSections??[],v=new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"}),y=e=>{let t={};$.forEach(e=>{t[e.module]=e});let n=e=>t[e]?.score?.toFixed(1)??"N/A",a=e=>t[e]?.explanation??"";return({executive_summary:{title:"Executive Summary",content:`**${m}** — TCA Investment Triage Report

Date: ${v} | Stage: ${u} | Sector: ${p}

Composite Score: **${d.toFixed(1)}/10**

${r?.recommendation??""}

This report provides a comprehensive assessment of ${m} across ${$.length} analysis modules using the TCA-IRR framework.`},company_overview:{title:"Company Overview",content:`**Company:** ${m}
**Sector:** ${p}
**Stage:** ${u}
**Location:** ${i?.location??"Not specified"}
**Website:** ${i?.website??"Not specified"}

**Product/Service Description:**
${i?.product_description??"See pitch deck for full product description."}

**Key Metrics:**
${i?.key_metrics??"Financial details available in data room."}`},tca_scorecard:{title:"TCA Scorecard",content:`**Composite TCA Score: ${d.toFixed(1)}/10**

Module Scores:
${$.map(e=>`• **${e.module.toUpperCase()}**: ${e.score.toFixed(1)}/10 (${e.risk})`).join("\n")}

Overall Risk Rating: ${d>=6.5?"GREEN":d>=4.5?"YELLOW":"RED"}`},financial_analysis:{title:"Financial Analysis",content:`**Financial Module Score: ${n("financial")}/10**

${a("financial")||`Financial analysis for ${m} reveals ${d>=6.5?"solid":"developing"} revenue foundations. Key financial indicators assessed include revenue growth trajectory, burn rate, unit economics, and path to profitability.`}

**Key Financial Indicators:**
• Revenue model viability assessed
• Unit economics reviewed
• Burn rate and runway analyzed
• Capital efficiency evaluated`},risk_assessment:{title:"Risk Assessment",content:`**Risk Module Score: ${n("risk")}/10**

${a("risk")||`Comprehensive risk assessment across 14 domains for ${m}.`}

Red Flags: ${$.filter(e=>"RED"===e.risk).map(e=>e.module).join(", ")||"None identified"}

**Risk Categories Assessed:**
• Market risk
• Execution risk
• Financial risk
• Regulatory risk
• Competitive risk`},team_evaluation:{title:"Team Evaluation",content:`**Team Module Score: ${n("team")}/10**

${a("team")||`Team assessment for ${m} evaluating leadership, domain expertise, and execution track record.`}

**Team Dimensions Assessed:**
• Founder background and expertise
• Team completeness
• Execution history
• Advisory board quality
• Culture and values alignment`},market_analysis:{title:"Market Analysis",content:`**Growth Module Score: ${n("growth")}/10** | **Economic Module Score: ${n("economic")}/10**

${a("growth")||`Market analysis for ${m} in the ${p} sector.`}

**Market Assessment:**
• TAM/SAM/SOM analysis
• Growth rate assessment
• Competitive landscape mapping
• Market timing evaluation`},competitive_landscape:{title:"Competitive Landscape",content:`**Strategic Module Score: ${n("strategic")}/10** | **Benchmark Score: ${n("benchmark")}/10**

${a("strategic")||`Competitive analysis for ${m} against sector peers.`}

**Competitive Position:**
• Direct competitors identified
• Differentiation factors assessed
• Moat strength evaluated
• Market share opportunity sized`},macro_trends:{title:"Macro Trends & PESTEL",content:`**Macro Trend Score: ${n("macro")}/10**

${a("macro")||`PESTEL analysis for ${m} in current market environment.`}

**PESTEL Analysis:**
• Political: regulatory environment
• Economic: macro indicators
• Social: demographic trends
• Technological: tech adoption
• Environmental: ESG factors
• Legal: compliance landscape`},esg_impact:{title:"ESG & Social Impact",content:`**Environmental Score: ${n("environmental")}/10** | **Social Score: ${n("social")}/10**

${a("environmental")||`ESG assessment for ${m}.`}

**ESG Framework Assessment:**
• Environmental footprint
• Social impact metrics
• Governance structure
• SDG alignment
• Impact measurement`},what_if_analysis:{title:"What-If Scenario Analysis",content:`**Scenario Analysis for ${m}**

**Base Case (${l?.base_case?.score??d.toFixed(1)}/10):** ${l?.base_case?.narrative??"Current trajectory maintained."}

**Best Case (${l?.best_case?.score??"N/A"}/10):** ${l?.best_case?.narrative??"Favorable execution and market conditions."}

**Worst Case (${l?.worst_case?.score??"N/A"}/10):** ${l?.worst_case?.narrative??"Challenging market environment and execution risks materialize."}`},investment_recommendation:{title:"Investment Recommendation",content:r?.recommendation??`Based on the TCA-IRR analysis, the composite score of ${d.toFixed(1)}/10 supports a **${d>=7.5?"Proceed":d>=6?"Conditional":d>=4.5?"Monitor":"Pass"}** recommendation.

**Next Steps:**
${(r?.action_items??[]).map(e=>`• ${e}`).join("\n")}`},founder_fit:{title:"Founder Fit Assessment",content:`**Founder Fit Score: ${n("founderFit")}/10**

${a("founderFit")||`Founder fit analysis for the ${m} leadership team.`}

**Assessment Dimensions:**
• Domain expertise alignment
• Prior startup experience
• Market understanding
• Coachability indicators
• Mission-founder alignment`},gap_analysis:{title:"Gap Analysis",content:`**Gap Analysis Score: ${n("gap")}/10**

${a("gap")||`Gap analysis identifying improvement areas for ${m}.`}

**Identified Gaps:**
${$.filter(e=>e.score<6).map(e=>`• ${e.module}: Score ${e.score.toFixed(1)} — ${e.explanation.split(".")[0]}`).join("\n")||"• No significant gaps identified"}`},funder_readiness:{title:"Funder Readiness Assessment",content:`**Funder Readiness Score: ${n("funder")}/10**

${a("funder")||`Assessment of ${m}'s readiness for investor engagement.`}

**Readiness Checklist:**
• Investment materials
• Data room completeness
• Due diligence preparation
• Board governance
• Cap table clarity`},simulation_results:{title:"Simulation Results",content:`**Simulation Score: ${n("simulation")}/10**

${a("simulation")||`Monte Carlo simulation results for ${m}.`}

**Simulation Output:**
• Base case: ${l?.base_case?.score??d.toFixed(1)}
• Best case: ${l?.best_case?.score??"N/A"}
• Worst case: ${l?.worst_case?.score??"N/A"}
• Sensitivity range: ${l?.sensitivity_range?.spread??"N/A"} points`},appendix:{title:"Appendix",content:`**Appendix: Full Module Scores**

${$.map(e=>`**${e.module.toUpperCase()}**
Score: ${e.score.toFixed(1)}/10 | Risk: ${e.risk} | Confidence: ${(e.confidence??.7).toFixed(2)}
${e.explanation}
`).join("\n")}

---
Report generated by TCA-IRR Framework v2.0 | ${v}`}})[e]??{title:e.replace(/_/g," ").replace(/\b\w/g,e=>e.toUpperCase()),content:`Section content for ${e} has been generated based on the analysis data.`}},f=g.map(e=>({id:e,...y(e),generated_at:new Date().toISOString()}));return o.NextResponse.json({report_sections:f,sections:f,sections_generated:g.length,company_name:m,status:"generated"})}catch(e){return console.error("[report/generate-sections]",e),o.NextResponse.json({error:"Section generation failed"},{status:500})}}let l=new s.AppRouteRouteModule({definition:{kind:i.RouteKind.APP_ROUTE,page:"/api/report/generate-sections/route",pathname:"/api/report/generate-sections",filename:"route",bundlePath:"app/api/report/generate-sections/route"},resolvedPagePath:"C:\\Users\\Allot\\Desktop\\TCA-IRR-APP-main- simplify\\TCA-IRR-simple\\src\\app\\api\\report\\generate-sections\\route.ts",nextConfigOutput:"standalone",userland:a}),{workAsyncStorage:d,workUnitAsyncStorage:m,serverHooks:p}=l;function u(){return(0,r.patchFetch)({workAsyncStorage:d,workUnitAsyncStorage:m})}},63033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},78335:()=>{},96487:()=>{}};var t=require("../../../../webpack-runtime.js");t.C(e);var n=e=>t(t.s=e),a=t.X(0,[4447,580],()=>n(55228));module.exports=a})();