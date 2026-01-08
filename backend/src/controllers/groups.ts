import { Request, Response } from 'express';
import { db } from '../db';
import { expenses, users } from '../db/schema';
import { eq, and, desc, sql, inArray, gte } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// Derive current group members from any expense/message participation
async function getGroupMembers(groupId: string): Promise<string[]> {
    const participantRows = await db.execute(sql`
        SELECT DISTINCT jsonb_array_elements_text(participants) AS user_id
        FROM ${expenses}
        WHERE group_id = ${groupId} AND participants IS NOT NULL
    `);

    const payerRows = await db.execute(sql`
        SELECT DISTINCT paid_by AS user_id
        FROM ${expenses}
        WHERE group_id = ${groupId} AND paid_by IS NOT NULL
    `);

    const ids = new Set<string>();
    participantRows.rows.forEach((r: any) => r.user_id && ids.add(r.user_id as string));
    payerRows.rows.forEach((r: any) => r.user_id && ids.add(r.user_id as string));

    return Array.from(ids);
}

// Helper to simplify debts
function simplifyDebts(transactions: { from: string, to: string, amount: number }[]) {
    const balances: Record<string, number> = {};

    transactions.forEach(t => {
        balances[t.from] = (balances[t.from] || 0) - t.amount;
        balances[t.to] = (balances[t.to] || 0) + t.amount;
    });

    const debtors: { id: string, amount: number }[] = [];
    const creditors: { id: string, amount: number }[] = [];

    Object.entries(balances).forEach(([id, amount]) => {
        if (amount < -0.01) debtors.push({ id, amount });
        if (amount > 0.01) creditors.push({ id, amount });
    });

    debtors.sort((a, b) => a.amount - b.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const settlements: { from: string, to: string, amount: number }[] = [];

    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];

        const amount = Math.min(Math.abs(debtor.amount), creditor.amount);

        settlements.push({ from: debtor.id, to: creditor.id, amount });

        debtor.amount += amount;
        creditor.amount -= amount;

        if (Math.abs(debtor.amount) < 0.01) i++;
        if (creditor.amount < 0.01) j++;
    }

    return settlements;
}

// Last settlement reset timestamp for a group
async function getSettlementAnchor(groupId: string): Promise<Date | null> {
    const lastReset = await db.query.expenses.findFirst({
        where: and(eq(expenses.groupId, groupId), eq(expenses.type, 'reset')),
        orderBy: desc(expenses.createdAt),
    });
    return lastReset?.createdAt ?? null;
}

export const createGroup = async (req: Request, res: Response) => {
    const groupId = uuidv4();
    const { name, members } = req.body;
    const creatorId = (req as any).user?.userId;

    // Add initial message with creator as participant so getMyGroups works
    await db.insert(expenses).values({
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

export const addExpense = async (req: Request, res: Response) => {
    try {
        const { id: groupId } = req.params;
        const { amount, paidBy, description, participants, type } = req.body;

        const payerId = paidBy || (req as any).user?.userId;
        let participantIds: string[] = (participants || []).filter(Boolean);

        // If participants not provided, default to all known group members + payer
        if (!participantIds.length) {
            const inferred = await getGroupMembers(groupId);
            participantIds = inferred;
        }

        if (payerId && !participantIds.includes(payerId)) {
            participantIds.push(payerId);
        }

        if (!payerId) {
            return res.status(400).json({ error: 'Missing payer' });
        }

        const newExpense = await db.insert(expenses).values({
            groupId,
            type: type || 'expense', // Allow overriding type (e.g. for message)
            amount: amount ? amount.toString() : null,
            paidBy: payerId,
            participants: participantIds,
            message: description,
        }).returning();

        const io = req.app.get('io');
        if (io) {
            io.to(groupId).emit('expense:added', newExpense[0]);
        }

        res.status(201).json(newExpense[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getGroupSummary = async (req: Request, res: Response) => {
    const { id: groupId } = req.params;

    const groupExpenses = await db.query.expenses.findMany({
        where: and(eq(expenses.groupId, groupId), eq(expenses.type, 'expense')),
        orderBy: desc(expenses.createdAt),
    });

    res.json({ expenses: groupExpenses });
};

export const getSettlements = async (req: Request, res: Response) => {
    const { id: groupId } = req.params;

    const anchor = await getSettlementAnchor(groupId);

    const conditions = [eq(expenses.groupId, groupId), eq(expenses.type, 'expense')] as any[];
    if (anchor) {
        conditions.push(gte(expenses.createdAt, anchor));
    }

    const groupExpenses = await db.query.expenses.findMany({
        where: and(...conditions),
    });

    const transactions: { from: string, to: string, amount: number }[] = [];

    groupExpenses.forEach(exp => {
        const amount = exp.amount ? parseFloat(exp.amount) : 0;
        const payer = exp.paidBy!;
        const parts = exp.participants as string[];

        if (!amount || Number.isNaN(amount)) return;
        if (!payer || !parts || parts.length === 0) return;

        // Split equally among ALL participants (including payer)
        const sharePerPerson = amount / parts.length;
        
        // Each participant (except payer) owes the payer their share
        parts.forEach((memberId: string) => {
            if (memberId !== payer) {
                transactions.push({ from: memberId, to: payer, amount: sharePerPerson });
            }
        });
    });

    const settlements = simplifyDebts(transactions);

    // Attach user names for display
    const userIds = Array.from(new Set(settlements.flatMap(s => [s.from, s.to])));
    let usersList: { id: string, name: string }[] = [];
    if (userIds.length) {
        const rows = await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, userIds));
        usersList = rows;
    }
    const nameMap = new Map(usersList.map((u) => [u.id, u.name]));

    res.json(settlements.map(s => ({
        ...s,
        fromName: nameMap.get(s.from) || s.from,
        toName: nameMap.get(s.to) || s.to,
    })));
};

export const getMessages = async (req: Request, res: Response) => {
    const { id: groupId } = req.params;

    const messages = await db.query.expenses.findMany({
        where: and(eq(expenses.groupId, groupId), eq(expenses.type, 'message')),
        orderBy: desc(expenses.createdAt), // Newest first?
        limit: 50,
        with: {
            sender: true, // Include sender details
        },
    });

    // Return reversed for chat?
    res.json(messages.reverse());
};

export const getMyGroups = async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await db.execute(sql`
    SELECT DISTINCT group_id, MAX(created_at) as last_activity 
    FROM ${expenses} 
    WHERE participants @> ${JSON.stringify([userId])}::jsonb
    OR paid_by = ${userId}
    GROUP BY group_id
    ORDER BY last_activity DESC
  `);

    res.json(result.rows);
};

export const sendMessage = async (req: Request, res: Response) => {
    try {
        const { id: groupId } = req.params;
        const { message } = req.body;
        const userId = (req as any).user?.userId;

        const newMsg = await db.insert(expenses).values({
            groupId,
            type: 'message',
            amount: null,
            paidBy: userId,
            participants: userId ? [userId] : null, // Store sender in participants for `getMyGroups`
            message,
        }).returning();

        // Get sender name to emit with message
        const sender = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        const io = req.app.get('io');
        if (io) {
            io.to(groupId).emit('message:receive', {
                ...newMsg[0],
                sender: sender ? { id: sender.id, name: sender.name, email: sender.email } : null,
            });
        }

        res.status(201).json(newMsg[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export const clearSettlements = async (req: Request, res: Response) => {
    const { id: groupId } = req.params;

    await db.insert(expenses).values({
        groupId,
        type: 'reset',
        amount: null,
        paidBy: null,
        participants: null,
        message: 'Settlements cleared',
    });

    const io = req.app.get('io');
    if (io) {
        io.to(groupId).emit('expense:added');
    }

    res.json({ message: 'Settlements cleared' });
}

export const addMember = async (req: Request, res: Response) => {
    try {
        const { id: groupId } = req.params;
        const { email } = req.body;

        const user = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await db.insert(expenses).values({
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
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
