import { and, desc, eq, sql } from 'drizzle-orm';
import { getChatGPTUser } from '../../chatgpt-auth';
import { getDb } from '@/db';
import { consultations } from '@/db/schema';
import { getSharedRecordOwner, sharedRecordRole } from '@/db/shared-record-access';
import type { Case } from '@/lib/studio';

function reply(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return reply({ error: '請先登入。' }, 401);
  if (sharedRecordRole(user) !== 'administrator') return reply({ error: '沒有查看權限。' }, 403);

  try {
    const owner = await getSharedRecordOwner();
    const id = new URL(request.url).searchParams.get('id');
    if (!owner) return id ? reply({ error: '找不到此個案。' }, 404) : reply({ linked: false, records: [] });

    const db = getDb();
    if (id) {
      const [row] = await db.select().from(consultations)
        .where(and(eq(consultations.owner, owner), eq(consultations.id, id))).limit(1);
      if (!row) return reply({ error: '找不到此個案。' }, 404);
      const record: Case = JSON.parse(row.payload);
      const { name, date, year, question, birth, chart, transcript, sections, reports, reminders } = record;
      return reply({ record: {
        id: row.id, updatedAt: row.updatedAt, version: row.version,
        name, date, year, question, birth, chart, transcript, sections, reports, reminders,
      } });
    }

    const records = await db.select({
      id: consultations.id,
      name: sql<string>`json_extract(${consultations.payload}, '$.name')`,
      date: sql<string>`json_extract(${consultations.payload}, '$.date')`,
      version: consultations.version,
      updatedAt: consultations.updatedAt,
    }).from(consultations).where(eq(consultations.owner, owner)).orderBy(desc(consultations.updatedAt));
    return reply({ linked: true, records });
  } catch {
    return reply({ error: '暫時無法讀取共享個案，請稍後再試。' }, 503);
  }
}
