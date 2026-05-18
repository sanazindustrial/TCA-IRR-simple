/**
 * TCA Data Normalization Utility
 * 
 * This utility ensures TCA categories are properly calculated and validated:
 * - All 12 categories present with correct framework weights
 * - Weighted scores calculated as: rawScore × (weight / 100)
 * - Composite score is sum of weighted scores (0-10 scale)
 */

import type { GenerateTcaScorecardOutput } from '@/ai/flows/schemas';

// Standard 12 TCA categories with framework weights
const GENERAL_FRAMEWORK_WEIGHTS: Record<string, number> = {
    'Leadership': 20,
    'Product-Market Fit': 20,
    'Product Quality': 20,
    'Team Strength': 10,
    'Team Capability': 10,
    'Technology & IP': 10,
    'Technology': 10,
    'Technology Innovation': 10,
    'Business Model & Financials': 10,
    'Business Model': 10,
    'Financial Viability': 10,
    'Financial Health': 10,
    'Financials': 10,
    'Go-to-Market Strategy': 10,
    'GTM': 10,
    'Competition & Moat': 5,
    'Competitive Advantage': 5,
    'Market Potential': 5,
    'Traction': 5,
    'Scalability': 2.5,
    'Risk Assessment': 2.5,
    'Exit Potential': 0,
};

const MEDTECH_FRAMEWORK_WEIGHTS: Record<string, number> = {
    'Leadership': 15,
    'Regulatory/Compliance': 15,
    'Regulatory': 15,
    'Product-Market Fit': 15,
    'Product Quality': 15,
    'Team Strength': 10,
    'Team Capability': 10,
    'Technology & IP': 10,
    'Technology': 10,
    'Technology Innovation': 10,
    'Tech/IP': 10,
    'Business Model & Financials': 10,
    'Business Model': 10,
    'Financial Viability': 10,
    'Financial Health': 10,
    'Financials': 10,
    'Go-to-Market Strategy': 5,
    'GTM': 5,
    'Competition & Moat': 5,
    'Competitive Advantage': 5,
    'Market Potential': 5,
    'Traction': 5,
    'Traction/Testimonials': 5,
    'Scalability': 0,
    'Risk Assessment': 0,
};

/**
 * Normalizes TCA category data to ensure correct calculations
 */
export function normalizeTcaCategories(
    categories: GenerateTcaScorecardOutput['categories'],
    framework: 'general' | 'medtech' = 'general'
): GenerateTcaScorecardOutput['categories'] {
    const weights = framework === 'medtech' ? MEDTECH_FRAMEWORK_WEIGHTS : GENERAL_FRAMEWORK_WEIGHTS;

    return categories.map(cat => {
        // Get the correct weight for this category
        const correctWeight = weights[cat.category] ?? cat.weight;

        // Calculate the correct weighted score: rawScore × (weight / 100)
        // If existing weightedScore seems multiplied by 10, correct it
        let weightedScore = cat.rawScore * (correctWeight / 100);

        // Detect and fix incorrectly calculated weighted scores
        // If weightedScore in data is roughly 10x what it should be, it's wrong
        const expectedWeightedScore = cat.rawScore * (cat.weight / 100);
        if (cat.weightedScore > 0 && Math.abs(cat.weightedScore - expectedWeightedScore * 10) < 0.5) {
            // Data was calculated with weight/10 instead of weight/100, recalculate
            weightedScore = cat.rawScore * (correctWeight / 100);
        } else if (cat.weightedScore > 0 && Math.abs(cat.weightedScore - expectedWeightedScore) < 0.5) {
            // Data was calculated correctly, use provided value but with correct weight
            weightedScore = cat.rawScore * (correctWeight / 100);
        }

        return {
            ...cat,
            weight: correctWeight,
            weightedScore: parseFloat(weightedScore.toFixed(2)),
        };
    });
}

/**
 * Canonical 12 categories per framework. The display layer expects all 12 rows;
 * missing categories are padded with neutral placeholders so the composite is
 * computed over a full 100% weight basis instead of a partial subset.
 */
export const STANDARD_GENERAL_CATEGORIES: ReadonlyArray<string> = [
    'Leadership',
    'Product-Market Fit',
    'Team Strength',
    'Technology & IP',
    'Business Model & Financials',
    'Go-to-Market Strategy',
    'Competition & Moat',
    'Market Potential',
    'Traction',
    'Scalability',
    'Risk Assessment',
    'Exit Potential',
];

export const STANDARD_MEDTECH_CATEGORIES: ReadonlyArray<string> = [
    'Leadership',
    'Regulatory/Compliance',
    'Product-Market Fit',
    'Team Strength',
    'Technology & IP',
    'Business Model & Financials',
    'Go-to-Market Strategy',
    'Competition & Moat',
    'Market Potential',
    'Traction',
    'Scalability',
    'Risk Assessment',
];

// Aliases that should be treated as the same category when matching by name.
const CATEGORY_ALIASES: Record<string, string> = {
    'Team Capability': 'Team Strength',
    'Technology': 'Technology & IP',
    'Technology Innovation': 'Technology & IP',
    'Tech/IP': 'Technology & IP',
    'Business Model': 'Business Model & Financials',
    'Financial Viability': 'Business Model & Financials',
    'Financial Health': 'Business Model & Financials',
    'Financials': 'Business Model & Financials',
    'Market Opportunity': 'Market Potential',
    'GTM': 'Go-to-Market Strategy',
    'Competitive Advantage': 'Competition & Moat',
    'Regulatory': 'Regulatory/Compliance',
    'Traction/Testimonials': 'Traction',
};

function canonicalCategoryName(name: string): string {
    return CATEGORY_ALIASES[name] ?? name;
}

/**
 * Ensures all canonical categories for the framework are present. Missing
 * categories are added as neutral placeholders (rawScore 5.0, yellow flag,
 * "Not assessed" copy) so the table always shows the full set and the
 * composite is calculated over a full 100% weight basis.
 */
export function ensureAllStandardCategories(
    categories: GenerateTcaScorecardOutput['categories'],
    framework: 'general' | 'medtech' = 'general'
): GenerateTcaScorecardOutput['categories'] {
    const standard = framework === 'medtech' ? STANDARD_MEDTECH_CATEGORIES : STANDARD_GENERAL_CATEGORIES;
    const weights = framework === 'medtech' ? MEDTECH_FRAMEWORK_WEIGHTS : GENERAL_FRAMEWORK_WEIGHTS;

    const byCanonical = new Map<string, GenerateTcaScorecardOutput['categories'][number]>();
    for (const cat of categories) {
        const key = canonicalCategoryName(cat.category);
        if (!byCanonical.has(key)) byCanonical.set(key, { ...cat, category: key });
    }

    const result: GenerateTcaScorecardOutput['categories'] = [];
    for (const name of standard) {
        const existing = byCanonical.get(name);
        if (existing) {
            result.push(existing);
        } else {
            const weight = weights[name] ?? 0;
            result.push({
                category: name,
                rawScore: 5.0,
                weight,
                weightedScore: parseFloat((5.0 * (weight / 100)).toFixed(2)),
                interpretation: 'Not assessed in this analysis run.',
                flag: 'yellow',
                pestel: 'N/A',
                description: `${name} was not evaluated; neutral placeholder used so the scorecard shows the full 12-category framework.`,
                strengths: 'Not assessed.',
                concerns: 'Not assessed.',
                aiRecommendation: `Run the ${name} module to populate this category.`,
            });
        }
    }
    return result;
}

/**
 * Calculates the composite score from categories
 * Composite = sum of all weighted scores (0-10 scale)
 */
export function calculateCompositeScore(categories: GenerateTcaScorecardOutput['categories']): number {
    const total = categories.reduce((sum, cat) => sum + cat.weightedScore, 0);
    return parseFloat(total.toFixed(2));
}

/**
 * Validates that weights sum to ~100%
 */
export function validateWeights(categories: GenerateTcaScorecardOutput['categories']): boolean {
    const totalWeight = categories.reduce((sum, cat) => sum + cat.weight, 0);
    return Math.abs(totalWeight - 100) < 1; // Allow 1% tolerance
}

/**
 * Full normalization of TCA output data
 */
export function normalizeTcaOutput(
    data: GenerateTcaScorecardOutput | null,
    framework: 'general' | 'medtech' = 'general'
): GenerateTcaScorecardOutput | null {
    if (!data || !data.categories) return data;

    // 1) Pad to the full 12-category framework so the scorecard always shows 12 rows
    //    and the composite is computed against a full 100% weight basis.
    const padded = ensureAllStandardCategories(data.categories, framework);
    // 2) Reapply canonical weights and recompute weightedScore per category.
    const normalizedCategories = normalizeTcaCategories(padded, framework);
    // 3) Composite = sum of weightedScores (0-10 scale).
    const compositeScore = calculateCompositeScore(normalizedCategories);

    return {
        ...data,
        categories: normalizedCategories,
        compositeScore,
        overallScore: compositeScore,
    };
}

/**
 * Normalize full analysis data including tcaData
 */
export function normalizeAnalysisData<T extends { tcaData?: GenerateTcaScorecardOutput }>(
    data: T,
    framework: 'general' | 'medtech' = 'general'
): T {
    if (!data || !data.tcaData) return data;

    const normalizedTca = normalizeTcaOutput(data.tcaData, framework);

    return {
        ...data,
        tcaData: normalizedTca,
    };
}
