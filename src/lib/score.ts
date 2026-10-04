import type { Finding } from './types';

type ReviewDimension = {
  name: string;
  status: 'partial' | 'not_assessed';
  score: number | null;
  deductions: Partial<Record<Finding['type'], number>>;
  guidance: string;
  emptyReason: string;
};

const dimensions: ReviewDimension[] = [
  {
    name: 'Bias',
    status: 'partial',
    score: 100,
    deductions: { sampling_limitation: 60, causal_language: 14 },
    guidance: 'Screens for narrow samples and causal wording that may affect interpretation. These signals do not establish that a report is biased.',
    emptyReason: 'No bias-related signal was found by the current sample and study-design checks.',
  },
  {
    name: 'False claims',
    status: 'partial',
    score: 100,
    deductions: { claim_source_discrepancy: 78 },
    guidance: 'Compares numeric chemistry claims with the supplied cited documents when both contain a matching measurement. A discrepancy needs human review; this is not independent fact-checking.',
    emptyReason: 'No numeric disagreement was detected in the supplied cited documents. Other claims were not independently fact-checked.',
  },
  {
    name: 'False evidence',
    status: 'partial',
    score: 100,
    deductions: { file_safety: 38, hidden_instruction: 28, untraced_statistic: 14, claim_source_discrepancy: 15 },
    guidance: 'Screens for hidden instructions, risky file features, unmatched statistics and disagreement with supplied sources. It cannot authenticate evidence or prove a source was fabricated or altered.',
    emptyReason: 'No evidence-integrity signal was found by these checks. Evidence authenticity was not established.',
  },
  {
    name: 'Corrupt data',
    status: 'partial',
    score: 100,
    deductions: { data_count_inconsistency: 68 },
    guidance: 'Checks simple totals against their itemized counts in the report. It does not validate raw datasets, reproduce analyses, or inspect data provenance for tampering.',
    emptyReason: 'No total-versus-itemized count mismatch was detected. Raw data validation was not performed.',
  },
  {
    name: 'AI-based claims',
    status: 'partial',
    score: 100,
    deductions: { hidden_instruction: 68 },
    guidance: 'Checks for hidden instructions aimed at AI reviewers and may surface explicit AI-use disclosures. It cannot reliably determine whether prose or claims were AI-generated, or whether AI-assisted claims are true.',
    emptyReason: 'No hidden instruction aimed at AI review was found. AI authorship cannot be reliably inferred from writing style.',
  },
  {
    name: 'Author & conflict check',
    status: 'partial',
    score: 100,
    deductions: { funding_conflict: 64, funding_not_disclosed: 24 },
    guidance: 'Extracts author and affiliation statements and screens for disclosed funding or commercial relationships. These heuristics may miss names, affiliations, or undisclosed interests; they are not background checks.',
    emptyReason: 'No funding or commercial-conflict signal was identified by the current disclosure checks.',
  },
  {
    name: 'Source quality',
    status: 'partial',
    score: 100,
    deductions: { untraced_statistic: 50, evidence_dependency: 28, claim_source_discrepancy: 30 },
    guidance: 'Checks whether citations match supplied documents and whether multiple citations share an underlying source. It does not rate a source as authoritative, trustworthy, or reputable.',
    emptyReason: 'No source-traceability signal was found in the available documents and metadata.',
  },
];

const severityFactor: Record<Finding['severity'], number> = { high: 1, medium: .8, low: .5, info: .35 };

export function scoreFindings(findings: Finding[]) {
  const categories = dimensions.map((dimension) => {
    const reasons: string[] = [];
    let score = dimension.score;
    for (const item of findings) {
      const base = dimension.deductions[item.type] ?? 0;
      if (base > 0 && score !== null) {
        const points = Math.round(base * severityFactor[item.severity]);
        score -= points;
        reasons.push(`${item.title} (${item.severity}: -${points})`);
      }
      if (dimension.name === 'AI-based claims' && (item.type === 'ai_authorship_disclosed' || item.type === 'hidden_instruction')) {
        reasons.push(item.title);
      }
    }
    if (!reasons.length) reasons.push(dimension.emptyReason);
    return {
      name: dimension.name,
      status: dimension.status,
      score: score === null ? null : Math.max(0, score),
      reasons,
      guidance: dimension.guidance,
    };
  });
  const scored = categories.filter((category): category is typeof category & { score: number } => category.score !== null);
  const overall = Math.round(scored.reduce((sum, category) => sum + category.score, 0) / Math.max(1, scored.length));
  return {
    overall,
    categories,
    meaning: 'This screening signal summarizes only the automated checks listed below. Unassessed factors are excluded; it does not determine truth, bias, data integrity, or source trustworthiness.',
  };
}
