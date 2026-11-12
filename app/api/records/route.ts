import { getChatGPTUser } from '../../chatgpt-auth';
import { getDb } from '@/db';
import { registerSharedRecordAccount, sharedRecordRole } from '@/db/shared-record-access';
import { consultations } from '@/db/schema';
import { eq,and,desc } from 'drizzle-orm';
import { z } from 'zod';
import { birthSchema } from '@/lib/birth';
import { calculate } from '@/lib/calculate';
import type { Case,Report } from '@/lib/studio';
const section=z.object({id:z.string().max(50),source:z.string().max(50000),text:z.string().max(50000),topic:z.enum(['本命特質','事業與工作','財務與資源','關係與家庭','年度流年','五行觀點','行動與結語','客戶背景','待分類']),confirmed:z.boolean()});
const schema=z.object({id:z.string().uuid(),name:z.string().min(1).max(100),date:z.string().max(20),year:z.number().int().min(1900).max(2100),question:z.string().max(10000),birth:birthSchema,chart:z.unknown().nullable(),transcript:z.string().max(150000),sections:z.array(section).max(500),reminders:z.array(z.object({id:z.string().max(100),month:z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),period:z.string().min(1).max(300),text:z.string().min(1).max(3000),approved:z.boolean()})).max(200),version:z.number().int().min(0),sample:z.boolean()});
function json(v:unknown,status=200){return Response.json(v,{status,headers:{'Cache-Control':'no-store'}});}
export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return json({ error: '請先登入。' }, 401);
  try {
    const role = sharedRecordRole(user);
    const sharedLinked = await registerSharedRecordAccount(user);
    const rows = await getDb().select().from(consultations)
      .where(eq(consultations.owner, user.userId)).orderBy(desc(consultations.updatedAt));
    return json({
      canViewShared: role === 'administrator',
      account: { email: user.email, role, sharedLinked },
      records: rows.map(row => ({ ...JSON.parse(row.payload), version: row.version, updatedAt: row.updatedAt })),
    });
  } catch {
    return json({ error: '暫時無法讀取資料，請稍後再試。' }, 503);
  }
}
export async function POST(req:Request){const u=await getChatGPTUser();if(!u)return json({error:'請先登入。'},401);if(req.headers.get('sec-fetch-site')==='cross-site')return json({error:'來源驗證失敗'},403);
try{const body=await req.text();if(body.length>800000)return json({error:'內容過大，請分次整理。'},413);const input=JSON.parse(body),data=schema.parse(input.record);const db=getDb();const [existing]=await db.select().from(consultations).where(eq(consultations.id,data.id));if(existing&&existing.owner!==u.userId)return json({error:'無法存取此檔案。'},404);if((existing?.version||0)!==data.version)return json({error:'資料已在其他頁面更新，請重新載入再編輯。'},409);
await registerSharedRecordAccount(u);
const previous=existing?JSON.parse(existing.payload):null;
const old:Case|null=previous;
const transcriptHistory=[...(previous?.transcriptHistory||[])];if(old&&old.transcript!==data.transcript)transcriptHistory.push({savedAt:old.updatedAt,transcript:old.transcript,sections:old.sections});
const changed=old&&(old.transcript!==data.transcript||old.year!==data.year||JSON.stringify(old.birth)!==JSON.stringify(data.birth));
if(changed){data.sections=data.sections.map(s=>({...s,confirmed:false}));data.reminders=data.reminders.map(r=>({...r,approved:false}));}
const record={...data,transcriptHistory,reports:old?.reports||[],updatedAt:new Date().toISOString(),version:data.version+1} as Case;
if(record.chart)record.chart=calculate(record.birth);
if(input.action==='finalize'){
if(!record.chart||!record.birth.verified||!record.sections.length||record.sections.some(s=>!s.confirmed||s.topic==='待分類'||!s.text.trim()))return json({error:'請完成排盤，並確認所有段落與分類後再定稿。'},400);
const snapshot:Report={id:crypto.randomUUID(),created:record.updatedAt,consultationDate:record.date,reminders:record.reminders.filter(r=>r.approved),name:record.name,year:record.year,sections:record.sections,chart:record.chart,birth:record.birth,question:record.question};record.reports=[...record.reports,snapshot];}
if(existing){const updated=await db.update(consultations).set({payload:JSON.stringify(record),version:record.version,updatedAt:record.updatedAt}).where(and(eq(consultations.id,record.id),eq(consultations.owner,u.userId),eq(consultations.version,data.version))).returning({id:consultations.id});if(!updated.length)return json({error:'儲存衝突，請重新載入。'},409);}else await db.insert(consultations).values({id:record.id,owner:u.userId,payload:JSON.stringify(record),version:record.version,updatedAt:record.updatedAt});return json({record});
}catch(e){return json({error:e instanceof z.ZodError?'資料欄位不完整，請檢查姓名、日期與提醒內容。':e instanceof Error?e.message:'儲存失敗。'},400);}}
