import type {Claim} from '../types';
export function statisticNeedsTrace(claim:Claim,hasMatchedCitation:boolean){return Boolean(claim.statistic)&&(!claim.citationKeys.length||!hasMatchedCitation);}
