import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/index.dart';
import '../../providers/index.dart';

class GroupScreen extends StatefulWidget {
  final String groupId;

  const GroupScreen({Key? key, required this.groupId}) : super(key: key);

  @override
  State<GroupScreen> createState() => _GroupScreenState();
}

class _GroupScreenState extends State<GroupScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ExpenseProvider>().fetchExpenses(widget.groupId);
      context.read<SettlementProvider>().fetchSettlements(widget.groupId);
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF6366F1),
        title: Text('Group #${widget.groupId.substring(0, 6)}'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(icon: Icon(Icons.receipt_outlined), text: 'Expenses'),
            Tab(icon: Icon(Icons.money_off_outlined), text: 'Settle'),
            Tab(icon: Icon(Icons.message_outlined), text: 'Chat'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _ExpensesTab(groupId: widget.groupId),
          _SettlementsTab(groupId: widget.groupId),
          _ChatTab(groupId: widget.groupId),
        ],
      ),
    );
  }
}

class _ExpensesTab extends StatelessWidget {
  final String groupId;

  const _ExpensesTab({required this.groupId});

  @override
  Widget build(BuildContext context) {
    return Consumer<ExpenseProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        if (provider.expenses.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.receipt_outlined,
                  size: 64,
                  color: Colors.grey,
                ),
                const SizedBox(height: 16),
                const Text('No expenses yet'),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: provider.expenses.length,
          itemBuilder: (context, index) {
            final expense = provider.expenses[index];
            return _ExpenseCard(expense: expense);
          },
        );
      },
    );
  }
}

class _ExpenseCard extends StatelessWidget {
  final Expense expense;

  const _ExpenseCard({required this.expense});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              expense.message,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '\$${expense.amount}',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF6366F1),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Split between ${expense.participants.length} people',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SettlementsTab extends StatelessWidget {
  final String groupId;

  const _SettlementsTab({required this.groupId});

  @override
  Widget build(BuildContext context) {
    return Consumer<SettlementProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        if (provider.settlements.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.check_circle_outline,
                  size: 64,
                  color: Colors.green,
                ),
                const SizedBox(height: 16),
                const Text('All settled up! 🎉'),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: provider.settlements.length,
          itemBuilder: (context, index) {
            final settlement = provider.settlements[index];
            return _SettlementCard(settlement: settlement);
          },
        );
      },
    );
  }
}

class _SettlementCard extends StatelessWidget {
  final Settlement settlement;

  const _SettlementCard({required this.settlement});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      color: Colors.amber[50],
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    '${settlement.fromName ?? settlement.from} pays',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
                Text(
                  '\$${settlement.amount.toStringAsFixed(2)}',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.amber,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'to ${settlement.toName ?? settlement.to}',
              style: TextStyle(color: Colors.grey[600]),
            ),
          ],
        ),
      ),
    );
  }
}

class _ChatTab extends StatelessWidget {
  final String groupId;

  const _ChatTab({required this.groupId});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.chat_outlined,
            size: 64,
            color: Colors.grey,
          ),
          const SizedBox(height: 16),
          const Text('Chat feature coming soon'),
        ],
      ),
    );
  }
}
