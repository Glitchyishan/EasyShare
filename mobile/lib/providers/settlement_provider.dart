import 'package:flutter/material.dart';
import '../models/index.dart';
import '../services/index.dart';

class SettlementProvider extends ChangeNotifier {
  List<Settlement> _settlements = [];
  bool _isLoading = false;
  String? _error;

  List<Settlement> get settlements => _settlements;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchSettlements(String groupId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _settlements = await ApiService.getSettlements(groupId);
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> clearSettlements(String groupId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await ApiService.clearSettlements(groupId);
      _settlements.clear();
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
