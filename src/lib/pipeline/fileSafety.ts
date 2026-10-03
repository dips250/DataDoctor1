import {IngestError} from './ingest';
export type Detected={type:'pdf'|'text';flags:string[];encrypted:boolean};
export function validateUploadedFile(fileName:string,bytes:Uint8Array):Detected{
 const ext=fileName.toLowerCase().split('.').pop();
 if(bytes.length===0)throw new IngestError('This file is empty.');
 const startsPdf=new TextDecoder().decode(bytes.slice(0,5))==='%PDF-';
 const isText=ext==='txt'||ext==='md';
 if(ext==='pdf'&&!startsPdf)throw new IngestError('This file has a .pdf extension but is not a PDF.');
 if(isText&&startsPdf)throw new IngestError('This PDF file has a text extension. Rename it to .pdf and upload again.');
 if(!startsPdf&&!isText)throw new IngestError('Upload a PDF, .txt, or .md file.');
 if(!startsPdf){if(bytes.includes(0))throw new IngestError('Text files cannot contain NUL bytes.');try{new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{throw new IngestError('The text file is not valid UTF-8.');}}
 const raw=new TextDecoder('latin1').decode(bytes);const flags=['/JavaScript','/JS','/OpenAction','/Launch','/EmbeddedFile'].filter(flag=>raw.includes(flag));const encrypted=raw.includes('/Encrypt');if(encrypted)throw new IngestError('This PDF is encrypted and cannot be analyzed.');
 return{type:startsPdf?'pdf':'text',flags,encrypted};
}
