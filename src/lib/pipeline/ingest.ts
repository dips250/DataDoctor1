import type {SourceDoc} from '../types';
export const MAX_FILE=10*1024*1024, MAX_TOTAL=25*1024*1024, MAX_FILES=6;
export class IngestError extends Error{status:number;constructor(message:string,status=400){super(message);this.status=status}}
export function ingestText(fileName:string,text:string,role:'primary'|'cited',id=fileName):SourceDoc {
 if(!text.trim()) throw new IngestError('This file is empty.');
 const normalized=text.replace(/\r\n?/g,'\n'); const chunks:string[]=[]; let buf='';
 for(const p of normalized.split(/\n\s*\n/)){if(buf.length+p.length>3000&&buf){chunks.push(buf);buf='';}buf+=(buf?'\n\n':'')+p;}
 if(buf)chunks.push(buf);
 return {id,fileName,role,pages:chunks.map((t,i)=>({page:i+1,text:t})),hiddenSpans:[],safety:{detectedType:'text',typeMatchesExtension:/\.(txt|md)$/i.test(fileName),pdfFlags:[],encrypted:false}};
}
export function ingestFixture(files:{fileName:string;role:'primary'|'cited';text:string}[]):SourceDoc[]{if(files.length>MAX_FILES)throw new IngestError('Upload up to 6 files.',413);return files.map((f,i)=>ingestText(f.fileName,f.text,f.role,`doc-${i+1}`));}
