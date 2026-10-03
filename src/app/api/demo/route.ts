import {demoCase} from '@/fixtures/demoCase';
import {analyzeWithOptionalLlm} from '@/lib/pipeline/optionalLlm';
import {ingestFixture} from '@/lib/pipeline/ingest';
export const runtime='nodejs';
export async function GET(){try{return Response.json(await analyzeWithOptionalLlm(ingestFixture(demoCase)));}catch{return Response.json({error:'The demo case could not be analyzed.'},{status:500});}}
