import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const consultations=sqliteTable('consultations',{id:text('id').primaryKey(),owner:text('owner').notNull(),payload:text('payload').notNull(),version:integer('version').notNull().default(1),updatedAt:text('updated_at').notNull()});

export const sharedRecordAccounts = sqliteTable('shared_record_accounts', {
  email: text('email').primaryKey(),
  userId: text('user_id').notNull(),
});
