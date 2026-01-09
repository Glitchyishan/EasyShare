import 'package:flutter/material.dart';
import '../models/index.dart';
import '../services/index.dart';

class ExpenseProvider extends ChangeNotifier {
  List<Expense> _expenses = [];
  bool _isLoading = false;
  String? _error;
  String? _currentGroupId;

  List<Expense> get expenses => _expenses;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchExpenses(String groupId) async {
    _currentGroupId = groupId;
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _expenses = await ApiService.getGroupExpenses(groupId);
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> addExpense(
    String groupId,
    String description,
    double amount,
    List<String> participants,
  ) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await ApiService.addExpense(groupId, description, amount, participants);
      await fetchExpenses(groupId);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }
}
