import {describe,it,expect} from 'vitest';
import {demoCase,cleanCase} from '@/fixtures/demoCase';
import {ingestFixture} from '@/lib/pipeline/ingest';
import {analyze,validateFindings} from '@/lib/pipeline/analyze';
import {lintLanguage} from '@/lib/lintLanguage';
describe('EvidenceDoctor pipeline',()=>{
 it('finds expected issues in the fictional demo',()=>{const r=analyze(ingestFixture(demoCase));const types=r.findings.map(f=>f.type);for(const t of ['hidden_instruction','funding_conflict','evidence_dependency','sampling_limitation','untraced_statistic','causal_language'])expect(types).toContain(t);expect(r.score.overall).toBeGreaterThanOrEqual(35);expect(r.score.overall).toBeLessThanOrEqual(65);});
 it('keeps clean fictional case free of concerns',()=>{const r=analyze(ingestFixture(cleanCase));expect(r.findings.some(f=>f.label==='POTENTIAL_CONCERN')).toBe(false);expect(r.score.overall).toBeGreaterThanOrEqual(85);});
 it('rejects unsupported finding evidence',()=>expect(validateFindings([{id:'x',type:'file_safety',label:'UNKNOWN',severity:'low',title:'x',whatWasFound:'x',whyItMatters:'x',uncertainty:'x',recommendedActions:[],evidence:[],graphNodeIds:[]}],[])).toHaveLength(0));
 it('records measured pipeline stage times',()=>{const r=analyze(ingestFixture(demoCase));expect(r.labLog.length).toBeGreaterThanOrEqual(7);expect(r.labLog.every(l=>Number.isFinite(l.ms)&&l.ms>=0)).toBe(true);});
 it('links citations through cited documents to shared source roots',()=>{const r=analyze(ingestFixture(demoCase));expect(JSON.stringify(r.graph.nodes)).toContain('Nimbusweld 2025 Customer Survey');expect(JSON.stringify(r.graph.nodes)).toContain('\"shared\":true');expect(JSON.stringify(r.graph.edges)).toContain('derived_from');expect(JSON.stringify(r.graph.edges)).toContain('cites');expect(r.findings.every(f=>f.graphNodeIds.length>0)).toBe(true);});
 it('enforces language',()=>{expect(lintLanguage('The researcher is corrupt.')).toBe(false);expect(lintLanguage('Potential conflict identified.')).toBe(true);});
});
