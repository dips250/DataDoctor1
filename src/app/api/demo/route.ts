import {demoCase} from '@/fixtures/demoCase';
import {analyze} from '@/lib/pipeline/analyze';
import {ingestFixture} from '@/lib/pipeline/ingest';
export const runtime='nodejs';
export function GET(){try{return Response.json(analyze(ingestFixture(demoCase)));}catch{return Response.json({error:'The demo case could not be analyzed.'},{status:500});}}
