export const runtime='nodejs';
export function GET(){return Response.json({llm:!!(process.env.LLM_BASE_URL&&process.env.LLM_API_KEY&&process.env.LLM_MODEL),publicRecords:!!process.env.OPENALEX_MAILTO,voice:!!(process.env.ELEVENLABS_API_KEY&&process.env.ELEVENLABS_VOICE_ID)});}
