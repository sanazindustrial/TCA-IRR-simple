import React, { useState } from 'react';
import styles from './BackendTestComponent.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

function timeoutFetch(url: string, opts: RequestInit = {}, ms = 5000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), ms);
    return fetch(url, { signal: controller.signal, ...opts })
        .finally(() => clearTimeout(id));
}

function BackendTestComponent() {
    const [health, setHealth] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const base = API_BASE || '';

    const testBackend = async () => {
        setError(null);
        setHealth(null);

        try {
            const res = await timeoutFetch(`${base}/api/health`, {}, 4000);
            if (!res.ok) throw new Error(`Status ${res.status}`);
            const data = await res.json();
            setHealth(JSON.stringify(data, null, 2));
        } catch (err: any) {
            if (err.name === 'AbortError') setError('Health check timed out');
            else setError(`Health check failed: ${err.message || err}`);
        }
    };

    const testAnalysis = async () => {
        setError(null);
        setAnalysisResult(null);

        try {
            const payload = {
                company_name: 'DemoCo',
                sector: 'technology',
                role_mode: 'user'
            };

            const res = await timeoutFetch(`${base}/api/analysis/comprehensive`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }, 8000);

            if (!res.ok) throw new Error(`Status ${res.status}`);
            const data = await res.json();
            setAnalysisResult(JSON.stringify(data, null, 2));
        } catch (err: any) {
            if (err.name === 'AbortError') setError('Analysis request timed out');
            else setError(`Analysis failed: ${err.message || err}`);
        }
    };
    return (
        <div className={styles.container}>
            <h3>Backend Connectivity Test</h3>

            <div className={styles.buttonContainer}>
                <button onClick={testBackend}>Test Health</button>
                <button onClick={testAnalysis} className={styles.analysisButton}>Test Analysis</button>
            </div>

            {error && <div className={styles.error}>Error: {error}</div>}

            {health && (
                <div>
                    <h4>Health Response</h4>
                    <pre>{health}</pre>
                </div>
            )}

            {analysisResult && (
                <div>
                    <h4>Analysis Response</h4>
                    <pre>{analysisResult}</pre>
                </div>
            )}
        </div>
    );
}

export default BackendTestComponent;
export { BackendTestComponent };
