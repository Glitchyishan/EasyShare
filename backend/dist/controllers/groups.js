"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addMember = exports.sendMessage = exports.getMyGroups = exports.getMessages = exports.getSettlements = exports.getGroupSummary = exports.addExpense = exports.createGroup = void 0;
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const uuid_1 = require("uuid");
// Helper to simplify debts
function simplifyDebts(transactions) {
    const balances = {};
    transactions.forEach(t => {
        balances[t.from] = (balances[t.from] || 0) - t.amount;
        balances[t.to] = (balances[t.to] || 0) + t.amount;
    });
    const debtors = [];
    const creditors = [];
    Object.entries(balances).forEach(([id, amount]) => {
        if (amount < -0.01)
            debtors.push({ id, amount });
        if (amount > 0.01)
            creditors.push({ id, amount });
    });
    debtors.sort((a, b) => a.amount - b.amount);
    creditors.sort((a, b) => b.amount - a.amount);
    const settlements = [];
    let i = 0;
    let j = 0;
    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];
        const amount = Math.min(Math.abs(debtor.amount), creditor.amount);
        settlements.push({ from: debtor.id, to: creditor.id, amount });
        debtor.amount += amount;
        creditor.amount -= amount;
        if (Math.abs(debtor.amount) < 0.01)
            i++;
        if (creditor.amount < 0.01)
            j++;
    }
    return settlements;
}
const createGroup = async (req, res) => {
    const groupId = (0, uuid_1.v4)();
    const { name, members } = req.body;
    const creatorId = req.user?.userId;
    // Add initial message with creator as participant so getMyGroups works
    await db_1.db.insert(schema_1.expenses).values({
        groupId,
        type: 'message',
        message: `Group "${name}" created`,
        amount: null,
        paidBy: creatorId,
        participants: creatorId ? [creatorId] : null,
    });
    // If members are provided, add them too via dummy messages or just update participants?
    // Use loop to add "User X added" messages with them as participants
    // This is a hack for Two Tables constraint.
    res.json({ id: groupId, name });
};
exports.createGroup = createGroup;
const addExpense = async (req, res) => {
    try {
        const { id: groupId } = req.params;
        const { amount, paidBy, description, participants, type } = req.body;
        const newExpense = await db_1.db.insert(schema_1.expenses).values({
            groupId,
            type: type || 'expense', // Allow overriding type (e.g. for message)
            amount: amount ? amount.toString() : null,
            paidBy,
            participants,
            message: description,
        }).returning();
        const io = req.app.get('io');
        if (io) {
            io.to(groupId).emit('expense:added', newExpense[0]);
        }
        res.status(201).json(newExpense[0]);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.addExpense = addExpense;
const getGroupSummary = async (req, res) => {
    const { id: groupId } = req.params;
    const groupExpenses = await db_1.db.query.expenses.findMany({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.expenses.groupId, groupId), (0, drizzle_orm_1.eq)(schema_1.expenses.type, 'expense')),
        orderBy: (0, drizzle_orm_1.desc)(schema_1.expenses.createdAt),
    });
    res.json({ expenses: groupExpenses });
};
exports.getGroupSummary = getGroupSummary;
const getSettlements = async (req, res) => {
    const { id: groupId } = req.params;
    const groupExpenses = await db_1.db.query.expenses.findMany({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.expenses.groupId, groupId), (0, drizzle_orm_1.eq)(schema_1.expenses.type, 'expense')),
    });
    const transactions = [];
    groupExpenses.forEach(exp => {
        const amount = parseFloat(exp.amount);
        const payer = exp.paidBy;
        const parts = exp.participants;
        if (!parts || parts.length === 0)
            return;
        const splitAmount = amount / parts.length;
        parts.forEach((memberId) => {
            if (memberId !== payer) {
                transactions.push({ from: memberId, to: payer, amount: splitAmount });
            }
        });
    });
    const settlements = simplifyDebts(transactions);
    res.json(settlements);
};
exports.getSettlements = getSettlements;
const getMessages = async (req, res) => {
    const { id: groupId } = req.params;
    const messages = await db_1.db.query.expenses.findMany({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.expenses.groupId, groupId), (0, drizzle_orm_1.eq)(schema_1.expenses.type, 'message')),
        orderBy: (0, drizzle_orm_1.desc)(schema_1.expenses.createdAt), // Newest first?
        limit: 50,
    });
    // Return reversed for chat?
    res.json(messages.reverse());
};
exports.getMessages = getMessages;
const getMyGroups = async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    const result = await db_1.db.execute((0, drizzle_orm_1.sql) `
    SELECT DISTINCT group_id, MAX(created_at) as last_activity 
    FROM ${schema_1.expenses} 
    WHERE participants @> ${JSON.stringify([userId])}::jsonb
    OR paid_by = ${userId}
    GROUP BY group_id
    ORDER BY last_activity DESC
  `);
    res.json(result.rows);
};
exports.getMyGroups = getMyGroups;
const sendMessage = async (req, res) => {
    try {
        const { id: groupId } = req.params;
        const { message } = req.body;
        const userId = req.user?.userId;
        const newMsg = await db_1.db.insert(schema_1.expenses).values({
            groupId,
            type: 'message',
            amount: null,
            paidBy: userId,
            participants: userId ? [userId] : null, // Store sender in participants for `getMyGroups`
            message,
        }).returning();
        const io = req.app.get('io');
        if (io) {
            io.to(groupId).emit('message:receive', newMsg[0]);
        }
        res.status(201).json(newMsg[0]);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.sendMessage = sendMessage;
const addMember = async (req, res) => {
    try {
        const { id: groupId } = req.params;
        const { email } = req.body;
        const user = await db_1.db.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.users.email, email),
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        await db_1.db.insert(schema_1.expenses).values({
            groupId,
            type: 'message',
            message: `${user.name} was added to the group`,
            amount: null,
            paidBy: user.id,
            participants: [user.id],
        });
        const io = req.app.get('io');
        if (io) {
            // Emit as a message so chat updates
            io.to(groupId).emit('message:receive', {
                message: `${user.name} was added to the group`,
                type: 'message',
                createdAt: new Date(),
                // partial object just for UI update if needed, but easier to just emit nothing and let 'expense:added' trigger refresh?
                // But chat expects messages.
                // Let's rely on 'expense:added' which triggers `fetchData` in frontend, 
                // BUT frontend `fetchData` fetches messages too.
                // Does frontend listen to 'expense:added'? Yes.
                // Does it listen to 'message:receive'? Yes.
                // Let's emit both for safety/immediacy.
            });
            io.to(groupId).emit('expense:added'); // Trigger refresh
        }
        res.json({ message: 'User added' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.addMember = addMember;
