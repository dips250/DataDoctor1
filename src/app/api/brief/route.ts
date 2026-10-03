import {checkRateLimit} from '@/lib/rateLimit';
export const runtime='nodejs';
export async function POST(req:Request){if(!checkRateLimit(req))return Response.json({error:'Too many requests. Please wait a minute and try again.'},{status:429});if(!process.env.ELEVENLABS_API_KEY||!process.env.ELEVENLABS_VOICE_ID)return Response.json({error:'Spoken briefings are not enabled.'},{status:503});return Response.json({error:'Spoken briefings are not available yet.'},{status:503});}
