"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expenses = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.uuid)('id').default((0, drizzle_orm_1.sql) `gen_random_uuid()`).primaryKey(),
    name: (0, pg_core_1.text)('name').notNull(),
    email: (0, pg_core_1.text)('email').notNull().unique(),
    password: (0, pg_core_1.text)('password').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
exports.expenses = (0, pg_core_1.pgTable)('expenses', {
    id: (0, pg_core_1.uuid)('id').default((0, drizzle_orm_1.sql) `gen_random_uuid()`).primaryKey(),
    groupId: (0, pg_core_1.text)('group_id').notNull(),
    type: (0, pg_core_1.text)('type').notNull(), // "expense" | "message"
    amount: (0, pg_core_1.numeric)('amount'), // Nullable for messages
    paidBy: (0, pg_core_1.uuid)('paid_by'), // Nullable for messages
    participants: (0, pg_core_1.jsonb)('participants'), // Nullable
    message: (0, pg_core_1.text)('message'), // Nullable for expenses
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
