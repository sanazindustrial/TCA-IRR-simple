# E2E Report Run

Date: 2026-02-15T11:33:47.139Z

## Inputs
- Upload file: test-report-upload-analysis.json
- Backend: http://localhost:8000

## Steps Executed
1. Health check
2. File upload (metadata)
3. Comprehensive analysis

## Results
- Health status: healthy
- File upload: success (files processed: 1)
- Analysis score: 78.5
- Recommendation: Proceed with due diligence
- Categories evaluated: 5
- Risk flags: 2

## Notes
- File upload and analysis endpoints are simulated in main.py; no persistent DB write occurs.
- Analysis response saved to e2e-analysis-result.json for export validation.
