import { env } from 'cloudflare:workers';
import { eq } from 'drizzle-orm';
import type { ChatGPTUser } from '@/app/chatgpt-auth';
import { recordAccessRole } from '@/lib/record-access';
import { getDb } from './index';
import { sharedRecordAccounts } from './schema';

export function sharedRecordRole(user: ChatGPTUser) {
  return recordAccessRole(user.email, env.RECORDS_ADMIN_EMAIL, env.RECORDS_SHARED_EMAIL);
}

export async function registerSharedRecordAccount(user: ChatGPTUser) {
  if (sharedRecordRole(user) !== 'shared') return undefined;
  await getDb().insert(sharedRecordAccounts)
    .values({ email: user.email.trim().toLowerCase(), userId: user.userId })
    .onConflictDoNothing();
  return (await getSharedRecordOwner()) === user.userId;
}

export async function getSharedRecordOwner() {
  const email = env.RECORDS_SHARED_EMAIL?.trim().toLowerCase();
  if (!email) return undefined;
  const [account] = await getDb().select({ userId: sharedRecordAccounts.userId })
    .from(sharedRecordAccounts).where(eq(sharedRecordAccounts.email, email)).limit(1);
  return account?.userId;
}
