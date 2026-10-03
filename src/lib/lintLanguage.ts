const banned=/\b(?:is corrupt|is lying|is fake|is fraudulent|is biased|is definitely biased)\b/i;
export function lintLanguage(text:string){return !banned.test(text);}
