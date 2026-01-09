import 'package:http/http.dart' as http;
import 'dart:convert';
import 'auth_service.dart';
import '../models/index.dart';

class ApiService {
  static const String baseUrl = 'https://easyshare-09ya.onrender.com/api';

  static Future<Map<String, String>> _getHeaders() async {
    final token = await AuthService.getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // Groups
  static Future<List<Group>> getMyGroups() async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/groups/my'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data
            .map((json) => Group.fromJson(json as Map<String, dynamic>))
            .toList();
      }
      throw 'Failed to fetch groups';
    } catch (e) {
      throw 'Error: $e';
    }
  }

  static Future<Group> createGroup(String name) async {
    try {
      final headers = await _getHeaders();
      final response = await http.post(
        Uri.parse('$baseUrl/groups'),
        headers: headers,
        body: jsonEncode({'name': name}),
      );

      if (response.statusCode == 201) {
        return Group.fromJson(jsonDecode(response.body));
      }
      throw 'Failed to create group';
    } catch (e) {
      throw 'Error: $e';
    }
  }

  // Expenses
  static Future<List<Expense>> getGroupExpenses(String groupId) async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/groups/$groupId/summary'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List<dynamic> expenses = data['expenses'] ?? [];
        return expenses
            .map((json) => Expense.fromJson(json as Map<String, dynamic>))
            .toList();
      }
      throw 'Failed to fetch expenses';
    } catch (e) {
      throw 'Error: $e';
    }
  }

  static Future<void> addExpense(
    String groupId,
    String description,
    double amount,
    List<String> participants,
  ) async {
    try {
      final headers = await _getHeaders();
      final response = await http.post(
        Uri.parse('$baseUrl/groups/$groupId/expenses'),
        headers: headers,
        body: jsonEncode({
          'description': description,
          'amount': amount,
          'participants': participants,
        }),
      );

      if (response.statusCode != 201) {
        throw 'Failed to add expense';
      }
    } catch (e) {
      throw 'Error: $e';
    }
  }

  // Settlements
  static Future<List<Settlement>> getSettlements(String groupId) async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/groups/$groupId/settlements'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data
            .map((json) => Settlement.fromJson(json as Map<String, dynamic>))
            .toList();
      }
      throw 'Failed to fetch settlements';
    } catch (e) {
      throw 'Error: $e';
    }
  }

  static Future<void> clearSettlements(String groupId) async {
    try {
      final headers = await _getHeaders();
      final response = await http.post(
        Uri.parse('$baseUrl/groups/$groupId/settlements/clear'),
        headers: headers,
      );

      if (response.statusCode != 200) {
        throw 'Failed to clear settlements';
      }
    } catch (e) {
      throw 'Error: $e';
    }
  }

  // Messages
  static Future<List<Message>> getMessages(String groupId) async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/groups/$groupId/messages'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data
            .map((json) => Message.fromJson(json as Map<String, dynamic>))
            .toList();
      }
      throw 'Failed to fetch messages';
    } catch (e) {
      throw 'Error: $e';
    }
  }

  static Future<void> sendMessage(String groupId, String message) async {
    try {
      final headers = await _getHeaders();
      final response = await http.post(
        Uri.parse('$baseUrl/groups/$groupId/messages'),
        headers: headers,
        body: jsonEncode({'message': message}),
      );

      if (response.statusCode != 201) {
        throw 'Failed to send message';
      }
    } catch (e) {
      throw 'Error: $e';
    }
  }

  // Members
  static Future<void> addMember(String groupId, String email) async {
    try {
      final headers = await _getHeaders();
      final response = await http.post(
        Uri.parse('$baseUrl/groups/$groupId/members'),
        headers: headers,
        body: jsonEncode({'email': email}),
      );

      if (response.statusCode != 201) {
        throw 'Failed to add member';
      }
    } catch (e) {
      throw 'Error: $e';
    }
  }
}
