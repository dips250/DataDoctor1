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
    deductions: { sampling_limitation: 38, causal_language: 12 },
    guidance: 'Screens for narrow samples and causal wording that may affect interpretation. These signals do not establish that a report is biased.',
    emptyReason: 'No bias-related signal was found by the current sample and study-design checks.',
  },
  {
    name: 'False claims',
    status: 'not_assessed',
    score: null,
    deductions: {},
    guidance: 'DataDoctor does not independently fact-check claims against authoritative references. An untraced claim is unresolved, not automatically false.',
    emptyReason: 'Independent fact-checking is not available in this review.',
  },
  {
    name: 'False evidence',
    status: 'partial',
    score: 100,
    deductions: { file_safety: 38, hidden_instruction: 45 },
    guidance: 'Screens for hidden instructions and risky file features. It cannot authenticate a quotation, detect fabricated evidence reliably, or prove that a source was altered.',
    emptyReason: 'No hidden-instruction or file-safety signal was found. Evidence authenticity was not established.',
  },
  {
    name: 'Corrupt data',
    status: 'not_assessed',
    score: null,
    deductions: {},
    guidance: 'DataDoctor does not validate raw datasets, reproduce statistical analyses, or inspect data provenance for tampering.',
    emptyReason: 'Raw data validation is not available in this review.',
  },
  {
    name: 'AI-based claims',
    status: 'partial',
    score: null,
    deductions: {},
    guidance: 'May surface explicit statements that AI tools were used and checks for hidden instructions aimed at AI reviewers. It cannot reliably determine whether prose or claims were AI-generated, or whether AI-assisted claims are true.',
    emptyReason: 'AI authorship cannot be reliably detected from writing style alone.',
  },
  {
    name: 'Author & conflict check',
    status: 'partial',
    score: 100,
    deductions: { funding_conflict: 48, funding_not_disclosed: 24 },
    guidance: 'Extracts author and affiliation statements and screens for disclosed funding or commercial relationships. These heuristics may miss names, affiliations, or undisclosed interests; they are not background checks.',
    emptyReason: 'No funding or commercial-conflict signal was identified by the current disclosure checks.',
  },
  {
    name: 'Source quality',
    status: 'partial',
    score: 100,
    deductions: { untraced_statistic: 24, evidence_dependency: 25 },
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
