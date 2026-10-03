import type {Finding} from './types';
export const scoreDeductions:Record<string,Record<string,number>>={
 'Document integrity':{hidden_instruction:60,file_safety:50},
 'Source transparency':{funding_not_disclosed:22},
 'Evidence traceability':{evidence_dependency:40,untraced_statistic:18},
 'Methodological strength':{sampling_limitation:40,causal_language:14},
 'Independence':{funding_conflict:50},
 'Conflict transparency':{funding_conflict:32,funding_not_disclosed:24},
 'Verification':{untraced_statistic:32,evidence_dependency:20}
};
const severityFactor:Record<Finding['severity'],number>={high:1,medium:.8,low:.5,info:.35};
export function scoreFindings(findings:Finding[]){const categories=Object.entries(scoreDeductions).map(([name,table])=>{const reasons:string[]=[];let score=100;for(const f of findings){const base=table[f.type]??0;if(base){const points=Math.round(base*severityFactor[f.severity]);score-=points;reasons.push(`${f.title} (${f.severity}: -${points})`);}}return{name,score:Math.max(0,score),reasons};});return{overall:Math.round(categories.reduce((s,c)=>s+c.score,0)/categories.length),categories,meaning:'This score summarizes what the investigation found. It is not a measure of truth and has not been scientifically validated.'};}
