import {describe,it,expect} from 'vitest';
import {redactSensitive} from '@/lib/privacy';
import {validateUploadedFile} from '@/lib/pipeline/fileSafety';
import {ingestText} from '@/lib/pipeline/ingest';
import {analyze} from '@/lib/pipeline/analyze';
describe('privacy and upload validation',()=>{
 it('redacts contact details and identifiers but keeps author names',()=>{const r=redactSensitive('Authors: Ada Example. Contact ada@example.org or 415-555-0123 at 12 Oak Street; record 123456789012.');expect(r.text).toContain('Ada Example');expect(r.text).not.toContain('ada@example.org');expect(r.text).not.toContain('415-555-0123');expect(r.text).not.toContain('12 Oak Street');expect(r.text).not.toContain('123456789012');expect(Object.values(r.counts).reduce((a,b)=>a+b,0)).toBe(4);});
 it('rejects a text file with a PDF extension mismatch',()=>expect(()=>validateUploadedFile('report.pdf',new TextEncoder().encode('not a PDF'))).toThrow(/not a PDF/));
 it('finds active PDF action bytes',()=>expect(validateUploadedFile('x.pdf',new TextEncoder().encode('%PDF-1.7 /JavaScript')).flags).toContain('/JavaScript'));
 it('creates evidence-backed file safety findings',()=>{const d=ingestText('x.pdf','/JavaScript','primary');d.safety={detectedType:'pdf',typeMatchesExtension:true,pdfFlags:['/JavaScript'],encrypted:false};expect(analyze([d]).findings.some(f=>f.type==='file_safety')).toBe(true);});
});
