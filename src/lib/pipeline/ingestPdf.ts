import {getDocumentProxy} from 'unpdf';
import type {SourceDoc} from '../types';
import {IngestError} from './ingest';
import type {Detected} from './fileSafety';
export const MAX_PDF_PAGES=40;
type TextItem={str?:string;transform?:number[];height?:number;hasEOL?:boolean};
export async function ingestPdf(fileName:string,bytes:Uint8Array,role:'primary'|'cited',id:string,safety:Detected):Promise<SourceDoc>{
 let pdf;try{pdf=await getDocumentProxy(bytes);}catch{throw new IngestError('This PDF could not be opened. It may be damaged or use unsupported encryption.');}
 const total=pdf.numPages;const count=Math.min(total,MAX_PDF_PAGES);const pages:SourceDoc['pages']=[];const hiddenSpans:SourceDoc['hiddenSpans']=[];
 try{for(let pageNo=1;pageNo<=count;pageNo++){const page=await pdf.getPage(pageNo);const content=await page.getTextContent();const items=content.items as TextItem[];let text='';for(const item of items){if(typeof item.str!=='string')continue;text+=item.str+(item.hasEOL?'\n':' ');if(item.str.trim()){const height=typeof item.height==='number'?item.height:Math.abs(item.transform?.[3]??0);if(height>0&&height<3)hiddenSpans.push({page:pageNo,text:item.str,method:'tiny font'});}}pages.push({page:pageNo,text:text.trim()});}
 }catch{throw new IngestError('The PDF could not be parsed. Try exporting a new copy.');}
 if(pages.every(p=>!p.text.trim()))throw new IngestError("This PDF has no text layer (it's a scanned image). OCR isn't supported yet.");
 return{id,fileName,role,pages,hiddenSpans,safety:{detectedType:'pdf',typeMatchesExtension:true,pdfFlags:safety.flags,encrypted:safety.encrypted},ingestNotes:total>count?[`Only the first ${count} of ${total} PDF pages were processed.`]:[]};
}
