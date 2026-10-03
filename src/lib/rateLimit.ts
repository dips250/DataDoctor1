const windows=new Map<string,number[]>();
export function checkRateLimit(request:Request,now=Date.now()):boolean{const forwarded=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();const ip=forwarded||'unknown';const active=(windows.get(ip)??[]).filter(t=>now-t<60_000);if(active.length>=10){windows.set(ip,active);return false;}active.push(now);windows.set(ip,active);return true;}
export function clearRateLimits(){windows.clear();}
