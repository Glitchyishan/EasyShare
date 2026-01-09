"use client";

import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import api from "@/lib/api";
import Card from "@/components/Card";
import Button from "@/components/Button";
import AddExpenseModal from "@/components/AddExpenseModal";
import AddMemberModal from "@/components/AddMemberModal";
import Navbar from "@/components/Navbar";
import { useParams } from "next/navigation";
import {
  MessageCircle,
  Receipt,
  Split,
  Plus,
  Send,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSocket } from "@/hooks/useSocket";

export default function GroupPage() {
  const { id } = useParams();
  const groupId = id as string;
  const [activeTab, setActiveTab] = useState<
    "expenses" | "chat" | "settlements"
  >("expenses");
  const [expenses, setExpenses] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [clearing, setClearing] = useState(false);
  const user = useAuthStore((state) => state.user);
  const socket = useSocket(groupId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    try {
      const [expRes, setRes, msgRes] = await Promise.all([
        api.get(`/groups/${groupId}/summary`),
        api.get(`/groups/${groupId}/settlements`),
        api.get(`/groups/${groupId}/messages`),
      ]);
      setExpenses(expRes.data.expenses);
      setSettlements(setRes.data);
      setMessages(msgRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [groupId]);

  useEffect(() => {
    if (!socket) return;

    socket.on("message:receive", (msg: any) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Also listen for expense added to refresh summary?
    // Backend should emit 'expense:added'
    socket.on("expense:added", () => {
      fetchData(); // Refresh all data
    });

    return () => {
      socket.off("message:receive");
      socket.off("expense:added");
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    try {
      await api.post(`/groups/${groupId}/messages`, {
        message: chatInput,
      });
      setChatInput("");
    } catch (err) {
      console.error(err);
    }
  };

  const clearSettlements = async () => {
    try {
      setClearing(true);
      await api.post(`/groups/${groupId}/settlements/clear`);
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setClearing(false);
    }
  };

  const tabs = [
    { id: "expenses" as const, label: "Expenses", icon: Receipt },
    { id: "chat" as const, label: "Chat", icon: MessageCircle },
    { id: "settlements" as const, label: "Settle Up", icon: Split },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar title={`Group #${groupId.slice(0, 6)}`} showBackButton />

      {/* Action Buttons */}
      <div className="max-w-3xl mx-auto px-4 pt-4">
        <div className="flex justify-end gap-2 mb-4">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowAddMember(true)}
          >
            <UserPlus className="w-4 h-4 mr-1" /> Member
          </Button>
          <Button size="sm" onClick={() => setShowAddExpense(true)}>
            <Plus className="w-4 h-4 mr-1" /> Expense
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-3xl mx-auto px-4 pt-4">
        <div className="flex space-x-1 rounded-xl bg-gray-200/50 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all flex items-center justify-center gap-2",
                "focus:outline-none focus:ring-2 ring-primary/60 ring-offset-2",
                activeTab === tab.id
                  ? "bg-white shadow text-primary"
                  : "text-gray-600 hover:bg-white/50 hover:text-gray-800"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Expenses Tab */}
        {activeTab === "expenses" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-lg font-semibold text-gray-800">
              Recent Expenses
            </h3>
            {expenses.length === 0 ? (
              <Card className="p-8 text-center">
                <Receipt className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No expenses yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Add your first expense to get started
                </p>
              </Card>
            ) : (
              expenses.map((exp) => (
                <Card key={exp.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {exp.message || "Expense"}
                        </p>
                        <p className="text-sm text-gray-500">
                          Paid by{" "}
                          {exp.paidBy === user?.id
                            ? "You"
                            : `User ${exp.paidBy?.slice(0, 6)}`}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-lg text-gray-900">
                      ${parseFloat(exp.amount || 0).toFixed(2)}
                    </span>
                  </div>
                  {exp.participants && exp.participants.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        Split between {exp.participants.length} people
                        {" • "}$
                        {(
                          parseFloat(exp.amount || 0) / exp.participants.length
                        ).toFixed(2)}{" "}
                        each
                      </p>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === "chat" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Chat Messages */}
              <div className="h-[400px] overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <MessageCircle className="w-12 h-12 mb-3" />
                    <p>No messages yet</p>
                    <p className="text-sm">Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isSystemMessage =
                      m.message?.includes("created") ||
                      m.message?.includes("was added to the group");
                    const isMyMessage = m.paidBy === user?.id;

                    return (
                      <div
                        key={m.id}
                        className={cn(
                          "flex flex-col",
                          isSystemMessage
                            ? "items-center"
                            : isMyMessage
                            ? "items-end"
                            : "items-start"
                        )}
                      >
                        {!isSystemMessage && (
                          <span className="text-xs text-gray-500 mb-1 px-2">
                            {isMyMessage
                              ? "You"
                              : m.sender?.name ||
                                `User ${m.paidBy?.slice(0, 6) || "Unknown"}`}
                          </span>
                        )}
                        <div
                          className={cn(
                            "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                            isSystemMessage
                              ? "bg-gray-100 text-gray-500 text-xs"
                              : isMyMessage
                              ? "bg-primary text-white"
                              : "bg-gray-200 text-gray-900"
                          )}
                        >
                          {m.message}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="border-t border-gray-100 p-4">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <input
                    className="flex-1 bg-gray-50 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Type a message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                  />
                  <Button type="submit" size="sm" disabled={!chatInput.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Settlements Tab */}
        {activeTab === "settlements" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Who Owes What
              </h3>
              <Button
                size="sm"
                variant="secondary"
                onClick={clearSettlements}
                disabled={clearing || settlements.length === 0}
              >
                {clearing ? "Clearing..." : "Clear All"}
              </Button>
            </div>

            {settlements.length === 0 ? (
              <Card className="p-8 text-center">
                <Split className="w-12 h-12 mx-auto text-green-400 mb-3" />
                <p className="text-gray-900 font-medium">All settled up! 🎉</p>
                <p className="text-sm text-gray-500 mt-1">
                  No outstanding balances
                </p>
              </Card>
            ) : (
              <>
                <p className="text-sm text-gray-500">
                  Simplified settlements to minimize transactions:
                </p>
                {settlements.map((s, i) => (
                  <Card
                    key={i}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 text-sm font-bold">
                        {(s.fromName || s.from).slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {s.from === user?.id ? (
                            <span className="text-amber-700">You</span>
                          ) : (
                            s.fromName || `User ${s.from.slice(0, 6)}`
                          )}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          pays →{" "}
                          {s.to === user?.id ? (
                            <span className="text-green-600 font-medium">
                              You
                            </span>
                          ) : (
                            s.toName || `User ${s.to.slice(0, 6)}`
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="font-bold text-lg text-amber-700">
                      ${s.amount.toFixed(2)}
                    </span>
                  </Card>
                ))}
              </>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {showAddExpense && (
        <AddExpenseModal
          groupId={groupId}
          onClose={() => setShowAddExpense(false)}
          onAdded={fetchData}
        />
      )}
      {showAddMember && (
        <AddMemberModal
          groupId={groupId}
          onClose={() => setShowAddMember(false)}
        />
      )}
    </div>
  );
}
