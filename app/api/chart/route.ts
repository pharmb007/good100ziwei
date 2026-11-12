import { getChatGPTUser } from '../../chatgpt-auth';
import { calculate } from '@/lib/calculate';
export async function POST(req:Request){if(!await getChatGPTUser())return Response.json({error:'請先登入後排盤。'},{status:401});try{return Response.json({chart:calculate(await req.json())},{headers:{'Cache-Control':'no-store'}});}catch(e){return Response.json({error:e instanceof Error?e.message:'無法排盤，請檢查資料。'},{status:400});}}
