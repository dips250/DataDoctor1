import {z} from 'zod';
import {checkRateLimit} from '@/lib/rateLimit';
import {redactSensitive} from '@/lib/privacy';
export const runtime='nodejs';
const BriefSchema=z.object({text:z.string().min(1).max(4000)});
const purpose='Generate spoken briefing from redacted summary';
export async function POST(req:Request){
 if(!checkRateLimit(req))return Response.json({error:'Too many requests. Please wait a minute and try again.'},{status:429});const declaredLength=Number(req.headers.get('content-length'));if(Number.isFinite(declaredLength)&&declaredLength>64*1024)return Response.json({error:'The briefing text is too large.'},{status:413});
 const key=process.env.ELEVENLABS_API_KEY,voice=process.env.ELEVENLABS_VOICE_ID;if(!key||!voice)return Response.json({error:'Spoken briefings are not enabled.'},{status:503});
 let redactions:Record<string,number>|null=null;let attempted=false;
 try{const parsed=BriefSchema.safeParse(await req.json());if(!parsed.success)return Response.json({error:'Provide a short report summary to narrate.'},{status:400});const redacted=redactSensitive(parsed.data.text);redactions=redacted.counts;const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);try{const endpoint=`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_128`;attempted=true;const response=await fetch(endpoint,{method:'POST',headers:{'xi-api-key':key,'content-type':'application/json','accept':'audio/mpeg'},body:JSON.stringify({text:redacted.text,model_id:'eleven_multilingual_v2',voice_settings:{stability:0.5,similarity_boost:0.75}}),signal:controller.signal});if(!response.ok)return Response.json({error:'The spoken briefing service could not complete the request. Please try again later.',privacy:{service:'ElevenLabs',purpose,redactions}},{status:502});return new Response(await response.arrayBuffer(),{status:200,headers:{'content-type':'audio/mpeg','cache-control':'no-store','x-redaction-counts':JSON.stringify(redacted.counts),'x-privacy-service':'ElevenLabs','x-privacy-purpose':purpose}});}finally{clearTimeout(timer);}}catch{return Response.json({error:'The spoken briefing request timed out or could not be completed.',...(attempted?{privacy:{service:'ElevenLabs',purpose,redactions:redactions??{}}}:{})},{status:504});}
}
