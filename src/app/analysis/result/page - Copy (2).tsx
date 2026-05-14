"use client";

import { useMemo, useState } from "react";
import styles from "./page.module.css";

type Section = {
	title: string;
	value: string;
};

type AnalysisResult = {
	companyName: string;
	generatedAt: string;
	score: number;
	rating: "Low" | "Medium" | "High" | "Critical";
	summary: string;
	strengths: string[];
	risks: string[];
	recommendations: string[];
	activeSources: string[];
	details: Section[];
};

const FALLBACK_RESULT: AnalysisResult = {
	companyName: "Technology Company",
	generatedAt: new Date().toISOString(),
	score: 72,
	rating: "Medium",
	summary:
		"The company shows strong execution potential with moderate market and operational risk. Product maturity and team quality are positive, while revenue predictability and compliance controls should be improved.",
	strengths: [
		"Clear product-market fit in the primary segment",
		"Healthy gross margin profile compared with peer baseline",
		"Experienced core engineering and leadership team",
	],
	risks: [
		"Revenue concentration among a small number of customers",
		"Go-to-market dependency on founder-led sales",
		"Data governance and security controls need formalization",
	],
	recommendations: [
		"Diversify top-line concentration with multi-segment expansion",
		"Create a repeatable sales process with defined pipeline metrics",
		"Implement formal security policy and quarterly compliance review",
	],
	activeSources: ["Internal Documents", "Financial Signals", "Market Data"],
	details: [
		{ title: "Technology", value: "78" },
		{ title: "Market", value: "70" },
		{ title: "Team", value: "82" },
		{ title: "Financial", value: "66" },
	],
};

const getRiskClass = (rating: AnalysisResult["rating"]): string => {
	if (rating === "Low") return styles.riskLow;
	if (rating === "Medium") return styles.riskMedium;
	if (rating === "High") return styles.riskHigh;
	return styles.riskCritical;
};

const safeParse = (raw: string | null): Partial<AnalysisResult> | null => {
	if (!raw) return null;
	try {
		return JSON.parse(raw) as Partial<AnalysisResult>;
	} catch {
		return null;
	}
};

export default function AnalysisResultPage() {
	const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

	const result = useMemo<AnalysisResult>(() => {
		if (typeof window === "undefined") return FALLBACK_RESULT;

		const fromStorage = safeParse(window.localStorage.getItem("analysis-result"));
		const merged: AnalysisResult = {
			...FALLBACK_RESULT,
			...fromStorage,
			strengths: fromStorage?.strengths ?? FALLBACK_RESULT.strengths,
			risks: fromStorage?.risks ?? FALLBACK_RESULT.risks,
			recommendations: fromStorage?.recommendations ?? FALLBACK_RESULT.recommendations,
			activeSources: fromStorage?.activeSources ?? FALLBACK_RESULT.activeSources,
			details: fromStorage?.details ?? FALLBACK_RESULT.details,
		};

		return merged;
	}, []);

	const scorePercent = Math.max(0, Math.min(100, result.score));
	const riskClass = getRiskClass(result.rating);

	const copyReport = async () => {
		const report = [
			`Company: ${result.companyName}`,
			`Generated: ${new Date(result.generatedAt).toLocaleString()}`,
			`Score: ${result.score}/100 (${result.rating} Risk)`,
			"",
			"Summary:",
			result.summary,
			"",
			"Strengths:",
			...result.strengths.map((s) => `- ${s}`),
			"",
			"Risks:",
			...result.risks.map((r) => `- ${r}`),
			"",
			"Recommendations:",
			...result.recommendations.map((r) => `- ${r}`),
			"",
			"Active Sources:",
			...result.activeSources.map((s) => `- ${s}`),
		].join("\n");

		try {
			await navigator.clipboard.writeText(report);
			setCopyState("copied");
		} catch {
			setCopyState("failed");
		}
	};

	const exportJson = () => {
		const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = `analysis-report-${result.companyName.replace(/\s+/g, "-").toLowerCase()}.json`;
		anchor.click();
		URL.revokeObjectURL(url);
	};

	return (
		<main className={styles.page}>
			<div className={styles.container}>
				<section className={styles.card}>
					<h1 className={styles.title}>Analysis Result</h1>
					<p className={styles.subtitle}>{result.companyName}</p>
					<p className={styles.meta}>
						Generated {new Date(result.generatedAt).toLocaleString()}
					</p>

					<div className={styles.scoreArea}>
						<progress className={styles.scoreProgress} value={scorePercent} max={100} />
						<div className={styles.scoreRow}>
							<strong>Score: {result.score}/100</strong>
							<span className={`${styles.riskBadge} ${riskClass}`}>
								{result.rating} Risk
							</span>
						</div>
					</div>
				</section>

				<section className={styles.card}>
					<h2 className={styles.sectionTitle}>Executive Summary</h2>
					<p className={styles.summaryText}>{result.summary}</p>
				</section>

				<section className={styles.grid3}>
					<article className={`${styles.block} ${styles.blockA}`}>
						<h3>Strengths</h3>
						<ul>
							{result.strengths.map((item) => (
								<li key={item}>{item}</li>
							))}
						</ul>
					</article>

					<article className={`${styles.block} ${styles.blockB}`}>
						<h3>Risks</h3>
						<ul>
							{result.risks.map((item) => (
								<li key={item}>{item}</li>
							))}
						</ul>
					</article>

					<article className={`${styles.block} ${styles.blockC}`}>
						<h3>Recommendations</h3>
						<ul>
							{result.recommendations.map((item) => (
								<li key={item}>{item}</li>
							))}
						</ul>
					</article>
				</section>

				<section className={styles.card}>
					<h2 className={styles.sectionTitle}>Detailed Breakdown</h2>
					<div className={styles.breakdown}>
						{result.details.map((item) => (
							<div key={item.title} className={styles.breakdownRow}>
								<span>{item.title}</span>
								<strong>{item.value}</strong>
							</div>
						))}
					</div>
				</section>

				<section className={styles.card}>
					<h2 className={styles.sectionTitle}>Reporting Controls</h2>
					<p className={styles.muted}>
						Active data sources: {result.activeSources.join(", ")}
					</p>
					<div className={styles.actions}>
						<button type="button" onClick={copyReport} className={styles.btnPrimary}>
							Copy Report
						</button>
						<button type="button" onClick={exportJson} className={styles.btnSecondary}>
							Export JSON
						</button>
						<button type="button" onClick={() => window.print()} className={styles.btnSecondary}>
							Print / Save PDF
						</button>
					</div>
					{copyState === "copied" && <p className={styles.success}>Report copied to clipboard.</p>}
					{copyState === "failed" && (
						<p className={styles.error}>Could not copy automatically. Please use Export JSON.</p>
					)}
				</section>
			</div>
		</main>
	);
}
