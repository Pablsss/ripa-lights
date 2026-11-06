import {sqliteTable,text,integer,index} from 'drizzle-orm/sqlite-core';
export const attempts=sqliteTable('quiz_attempts',{
 id:text('id').primaryKey(),userId:text('user_id').notNull(),mode:text('mode').notNull(),
 startedAt:text('started_at').notNull(),completedAt:text('completed_at'),
 score:integer('score'),questions:text('questions_json').notNull(),answers:text('answers_json').notNull().default('[]')
},t=>[index('idx_quiz_attempts_user_started').on(t.userId,t.startedAt)]);
