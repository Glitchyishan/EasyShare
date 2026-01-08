import { pgTable, uuid, text, timestamp, numeric, jsonb } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';

export const users = pgTable('users', {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    password: text('password').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const expenses = pgTable('expenses', {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    groupId: text('group_id').notNull(),
    type: text('type').notNull(), // "expense" | "message"
    amount: numeric('amount'), // Nullable for messages
    paidBy: uuid('paid_by'), // Nullable for messages
    participants: jsonb('participants'), // Nullable
    message: text('message'), // Nullable for expenses
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const expensesRelations = relations(expenses, ({ one }) => ({
    sender: one(users, {
        fields: [expenses.paidBy],
        references: [users.id],
    }),
}));
