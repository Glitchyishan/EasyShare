import { create } from 'zustand';
import api from '../lib/api';

interface Expense {
    id: string;
    amount: string;
    message: string;
    paidBy: string;
    createdAt: string;
}

interface Settlement {
    from: string;
    to: string;
    amount: number;
}

interface GroupState {
    expenses: Expense[];
    settlements: Settlement[];
    messages: any[];
    fetchGroupData: (groupId: string) => Promise<void>;
    addExpense: (groupId: string, data: any) => Promise<void>;
}

export const useGroupStore = create<GroupState>((set) => ({
    expenses: [],
    settlements: [],
    messages: [],
    fetchGroupData: async (groupId) => {
        try {
            const [summaryRes, settlementsRes, messagesRes] = await Promise.all([
                api.get(`/groups/${groupId}/summary`),
                api.get(`/groups/${groupId}/settlements`),
                api.get(`/groups/${groupId}/messages`),
            ]);
            set({
                expenses: summaryRes.data.expenses,
                settlements: settlementsRes.data,
                messages: messagesRes.data
            });
        } catch (error) {
            console.error(error);
        }
    },
    addExpense: async (groupId, data) => {
        await api.post(`/groups/${groupId}/expenses`, data);
        // Refresh data
        useGroupStore.getState().fetchGroupData(groupId);
    }
}));
