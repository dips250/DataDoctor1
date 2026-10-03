export const runtime='nodejs';
export async function POST(){if(!process.env.ELEVENLABS_API_KEY||!process.env.ELEVENLABS_VOICE_ID)return Response.json({error:'Spoken briefings are not enabled.'},{status:503});return Response.json({error:'Spoken briefings are not available in this version.'},{status:503});}
