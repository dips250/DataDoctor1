import type {SourceDoc} from '../types';
export function fileSafetyFlags(doc:SourceDoc){return[...(!doc.safety.typeMatchesExtension?['File type does not match its extension.']:[]),...(doc.safety.encrypted?['/Encrypt']:[]),...doc.safety.pdfFlags];}
