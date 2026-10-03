export function fundingNotDisclosed(text:string){return !/funding|funded|support(?:ed)? by|grant|acknowledg|conflict of interest/i.test(text);}
