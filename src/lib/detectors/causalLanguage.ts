export function containsCausalLanguage(text:string){return/\b(?:improves|causes|increases|reduces|leads to|improve|cause|increase|reduce)\b/i.test(text);}
export function designSupportsCausalLanguage(design:'experiment'|'observational'|'survey'|'unknown'){return design==='survey'||design==='observational';}
