export type RedactionCounts=Record<string,number>;
export function redactSensitive(input:string):{text:string;counts:RedactionCounts}{
 const counts:RedactionCounts={email:0,phone:0,address:0,idNumber:0};let text=input;
 const replace=(name:keyof RedactionCounts,re:RegExp)=>{text=text.replace(re,()=>{counts[name]++;return `[REDACTED_${name.toUpperCase()}]`;});};
 replace('email',/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi);
 replace('phone',/(?<!\w)(?:\+?\d{1,3}[ .-]?)?(?:\(?\d{3}\)?[ .-]?)\d{3}[ .-]?\d{4}(?!\w)/g);
 replace('address',/\b\d{1,6}\s+[\w.' -]{2,50}\s(?:Street|St\.?|Avenue|Ave\.?|Road|Rd\.?|Boulevard|Blvd\.?|Lane|Ln\.?|Drive|Dr\.?|Way)\b/gi);
 replace('idNumber',/(?<!\w)\d{8,}(?!\w)/g);
 return{text,counts};
}
