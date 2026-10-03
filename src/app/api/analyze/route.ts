import {analyze} from '@/lib/pipeline/analyze';
import {ingestText,IngestError,MAX_FILE,MAX_FILES,MAX_TOTAL} from '@/lib/pipeline/ingest';
import {validateUploadedFile} from '@/lib/pipeline/fileSafety';
import {checkRateLimit} from '@/lib/rateLimit';
export const runtime='nodejs';
export async function POST(req:Request){
 if(!checkRateLimit(req))return Response.json({error:'Too many analysis requests. Please wait a minute and try again.'},{status:429});
 try{const data=await req.formData();const files=data.getAll('files').filter((x):x is File=>x instanceof File);if(!files.length)throw new IngestError('Choose a report to analyze.');if(files.length>MAX_FILES)throw new IngestError('Upload up to 6 files.',413);let total=0;const docs=[];
  for(let i=0;i<files.length;i++){const file=files[i];total+=file.size;if(file.size>MAX_FILE||total>MAX_TOTAL)throw new IngestError('File size limit exceeded. Each file must be under 10 MB and the total under 25 MB.',413);const bytes=new Uint8Array(await file.arrayBuffer());const safety=validateUploadedFile(file.name,bytes);if(safety.type==='pdf')throw new IngestError('PDF parsing is not available yet. Upload a .txt or .md version.');const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);const doc=ingestText(file.name,text,i===Number(data.get('primaryIndex')??0)?'primary':'cited',`doc-${i+1}`);doc.safety={detectedType:'text',typeMatchesExtension:true,pdfFlags:safety.flags,encrypted:safety.encrypted};docs.push(doc);}
  return Response.json(analyze(docs));
 }catch(e){if(e instanceof IngestError)return Response.json({error:e.message},{status:e.status});return Response.json({error:'The document could not be analyzed. Check the file and try again.'},{status:400});}
}
