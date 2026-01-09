/**
 * Splitwise-style debt simplification algorithm.
 *
 * Given a map of userId → netBalance:
 *   - Positive value → user should RECEIVE money (creditor)
 *   - Negative value → user OWES money (debtor)
 *
 * Returns the MINIMUM number of transactions needed to settle all balances.
 *
 * Algorithm: Greedy matching
 *   1. Separate users into creditors (balance > 0) and debtors (balance < 0)
 *   2. Always match the largest creditor with the largest debtor
 *   3. Transfer min(credit, abs(debt))
 *   4. Update balances and remove any user whose balance becomes zero
 *   5. Repeat until all balances are zero
 *
 * Time complexity: O(n log n) due to sorting
 * Does NOT mutate input data
 * Uses integer arithmetic (cents) internally to avoid floating point errors
 */

export interface Settlement {
    from: string;   // debtor userId
    to: string;     // creditor userId
    amount: number;
}

export interface Expense {
    paidBy: string;
    amount: number;         // in cents or dollars (will be normalized)
    participants: string[];
}

/**
 * Convert a dollar amount to integer cents to avoid floating point errors.
 * Rounds to nearest cent.
 */
function toCents(amount: number): number {
    return Math.round(amount * 100);
}

/**
 * Convert cents back to dollars with fixed precision.
 */
function toDollars(cents: number): number {
    return cents / 100;
}

/**
 * Compute minimum transactions to settle all debts.
 *
 * @param balances - Map of userId to net balance (positive = receive, negative = owes)
 * @returns Array of settlement transactions
 */
export function settleDebts(balances: Record<string, number>): Settlement[] {
    // Convert to cents and separate into creditors and debtors
    // Do NOT mutate input - create new arrays
    const creditors: { id: string; amount: number }[] = [];
    const debtors: { id: string; amount: number }[] = [];

    for (const [id, balance] of Object.entries(balances)) {
        const cents = toCents(balance);
        if (cents > 0) {
            creditors.push({ id, amount: cents });
        } else if (cents < 0) {
            debtors.push({ id, amount: -cents }); // Store as positive for easier math
        }
        // Skip users with zero balance
    }

    // Sort by amount descending (largest first) for greedy matching
    // Secondary sort by id for deterministic output
    creditors.sort((a, b) => b.amount - a.amount || a.id.localeCompare(b.id));
    debtors.sort((a, b) => b.amount - a.amount || a.id.localeCompare(b.id));

    const settlements: Settlement[] = [];

    // Use indices to track current position (simulating removal)
    let creditorIdx = 0;
    let debtorIdx = 0;

    while (creditorIdx < creditors.length && debtorIdx < debtors.length) {
        const creditor = creditors[creditorIdx];
        const debtor = debtors[debtorIdx];

        // Transfer the minimum of what debtor owes and what creditor needs
        const transferAmount = Math.min(creditor.amount, debtor.amount);

        if (transferAmount > 0) {
            settlements.push({
                from: debtor.id,
                to: creditor.id,
                amount: toDollars(transferAmount),
            });
        }

        // Update balances
        creditor.amount -= transferAmount;
        debtor.amount -= transferAmount;

        // Move to next if balance is settled (zero)
        if (creditor.amount === 0) {
            creditorIdx++;
        }
        if (debtor.amount === 0) {
            debtorIdx++;
        }
    }

    return settlements;
}

/**
 * Calculate net balances from a list of expenses.
 *
 * BUSINESS RULE:
 * Each expense increases the payer's balance and decreases
 * every participant's balance by their equal share.
 *
 * EXAMPLE:
 * User1 pays $100 split between User1, User2:
 *   - share = 100 / 2 = 50
 *   - User1: +100 (paid) - 50 (share) = +50
 *   - User2: -50 (share)
 *
 * @param expenses - Array of expenses with paidBy, amount, and participants
 * @returns Map of userId to net balance (positive = creditor, negative = debtor)
 */
export function calculateBalances(expenses: Expense[]): Record<string, number> {
    const balances: Record<string, number> = {};

    for (const expense of expenses) {
        const { paidBy, amount, participants } = expense;

        // Skip invalid expenses
        if (!paidBy || !participants || participants.length === 0 || amount <= 0) {
            continue;
        }

        // Use integer cents internally to avoid floating point errors
        const amountCents = toCents(amount);
        const participantCount = participants.length;

        // Calculate equal share per participant (integer division with remainder handling)
        const sharePerPerson = Math.floor(amountCents / participantCount);
        const remainder = amountCents % participantCount;

        // Initialize balances for all participants if not present
        if (!(paidBy in balances)) {
            balances[paidBy] = 0;
        }

        // Payer receives the full amount (they paid for everyone)
        balances[paidBy] += amountCents;

        // Each participant owes their share
        // Sort participants for deterministic remainder distribution
        const sortedParticipants = [...participants].sort();

        sortedParticipants.forEach((participant, idx) => {
            if (!(participant in balances)) {
                balances[participant] = 0;
            }

            // Distribute remainder cents to first N participants (deterministic)
            const extraCent = idx < remainder ? 1 : 0;
            balances[participant] -= (sharePerPerson + extraCent);
        });
    }

    // Convert back to dollars
    const result: Record<string, number> = {};
    for (const [id, cents] of Object.entries(balances)) {
        const dollars = toDollars(cents);
        // Only include non-zero balances
        if (Math.abs(dollars) >= 0.01) {
            result[id] = dollars;
        }
    }

    return result;
}

/**
 * Calculate minimum settlements from a list of expenses.
 *
 * This is the main entry point for expense-to-settlement conversion.
 *
 * ALGORITHM:
 * 1. Initialize all user balances to 0
 * 2. For each expense:
 *    - Calculate share = amount / number of participants
 *    - Subtract share from each participant's balance
 *    - Add full amount to payer's balance
 * 3. Use settleDebts() to compute minimum transactions
 *
 * @param expenses - Array of expenses
 * @returns Array of settlement transactions with minimum count
 *
 * @example
 * const expenses = [
 *   { paidBy: 'user1', amount: 100, participants: ['user1', 'user2'] },
 *   { paidBy: 'user2', amount: 50, participants: ['user1', 'user2'] },
 * ];
 * calculateSettlements(expenses);
 * // Returns: [{ from: 'user2', to: 'user1', amount: 25 }]
 */
export function calculateSettlements(expenses: Expense[]): Settlement[] {
    const balances = calculateBalances(expenses);
    return settleDebts(balances);
}

export default settleDebts;
