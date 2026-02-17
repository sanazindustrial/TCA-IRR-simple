# Export Report Analysis Steps and E2E Test Plan

Date: 2026-02-14

## Scope

This document lists report types, required data, analysis steps, and end-to-end export test steps for all report formats.

## Report Types

- Triage Report (2 pages)
- Due Diligence (DD) Report (2 pages) - admin/reviewer only
- Comprehensive PDF Report (20+ pages)
- Comprehensive Word Report (DOCX)
- Comprehensive PowerPoint Deck (PPTX)
- Comprehensive Excel Workbook (XLSX, 10 sheets)
- Complete Analysis Package (ZIP with JSON)

## Required Data (minimum)

- analysisResult in localStorage
- companyName
- tcaData (compositeScore, categories[])
- riskData (riskFlags[], riskSummary)

## Report Analysis Steps (by report)

### 1) Triage Report (2 pages)

Data used:

- tcaData.compositeScore
- tcaData.categories
- riskData.riskFlags

Steps:

1. Validate company name and analysis date.
2. Compute composite score and assessment band.
3. Render TCA scorecard table (top 8 categories).
4. Extract top 3 red-flag risks for the summary.
5. Derive recommendation based on score threshold.
6. Render next-step checklist.

Pass criteria:

- 2-page PDF generated with summary, table, risks, recommendation, and next steps.

### 2) DD Report (2 pages)

Data used:

- tcaData.compositeScore
- tcaData.categories
- riskData.riskFlags
- financialsData
- strategicFitData

Steps:

1. Render investment synopsis and score.
2. Build detailed TCA analysis table.
3. Summarize critical red-flag risks.
4. Add financial and strategic fit highlights.
5. Render final recommendation and key terms.

Pass criteria:

- 2-page PDF generated with DD summary and investment decision content.

### 3) Comprehensive PDF Report

Data used:

- All available modules (tcaData, riskData, benchmarkData, financialsData, teamData, growthData, strategicFitData)

Steps:

1. Build title page and executive summary.
2. Generate table of contents.
3. Render detailed scorecard analysis and category narratives.
4. Add risk assessment matrix and mitigation table.
5. Append module sections (benchmark, financials, team, strategic fit, growth).
6. Add final recommendation and due diligence checklist.
7. Add footer with page numbers.

Pass criteria:

- Multi-page PDF generated with TOC, module sections, and footer.

### 4) Comprehensive DOCX Report

Data used:

- Same modules as comprehensive PDF.

Steps:

1. Build title page and executive summary.
2. Create structured headings (H1/H2/H3).
3. Add narrative sections for each module.
4. Append due diligence checklist and appendices.

Pass criteria:

- DOCX generated with hierarchical headings and complete module content.

### 5) Comprehensive PPTX Deck

Data used:

- tcaData, riskData, financialsData, teamData, strategicFitData, growthData

Steps:

1. Build title slide.
2. Add executive summary slide with score and recommendation.
3. Add TCA scorecard slide with table.
4. Add risk assessment slide with key risks.
5. Add financial health slide with metrics.
6. Add team assessment slide.
7. Add recommendation slide and next steps slide.

Pass criteria:

- PPTX generated with 8+ slides and key analysis metrics.

### 6) Comprehensive Excel Workbook (XLSX)

Data used:

- tcaData, riskData, benchmarkData, financialsData, teamData, growthData, strategicFitData

Sheets:

1. Executive Summary
2. TCA Scorecard
3. Risk Analysis
4. Benchmark Comparison
5. Financial Analysis
6. Team Assessment
7. Growth Analysis
8. Strategic Fit
9. Investment Decision
10. Data Summary

Steps:

1. Create workbook and append all 10 sheets.
2. Ensure each sheet has headers and data rows.
3. Export workbook with consistent naming.

Pass criteria:

- XLSX generated with 10 named sheets and populated data.

### 7) Complete Analysis Package (ZIP)

Data used:

- All modules available in analysisResult

Steps:

1. Create analysis summary JSON.
2. Write core and extended analysis JSON files.
3. Write configuration metadata.

Pass criteria:

- ZIP generated with categorized JSON files.

## End-to-End Export Test Steps

Preconditions:

- App running locally.
- analysisResult present in localStorage.
- User role set to admin to test all exports.

Steps:

1. Open evaluation page.
2. Open Export & Share menu.
3. Run each export:
   - Triage Summary (2 pages)
   - DD Summary (2 pages)
   - Complete Analysis PDF
   - Full Word Document
   - Full PowerPoint Deck
   - Comprehensive Data Export (XLSX)
   - Complete Analysis Package (ZIP)
4. Open each file and verify content completeness.
5. Repeat with role=user to confirm restricted DD export is hidden.

Pass criteria:

- All files download successfully and open without errors.
- Content matches expected sections and data.
- Role-based access control enforced.

## Test Script

- test-export-system.js

Run:

- node test-export-system.js
