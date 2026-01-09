import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../models/index.dart';

class AuthService {
  static const String baseUrl = 'https://easyshare-09ya.onrender.com/api';
  static const storage = FlutterSecureStorage();

  static Future<Map<String, dynamic>> signup(
    String name,
    String email,
    String password,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/signup'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'name': name,
          'email': email,
          'password': password,
        }),
      );

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        await storage.write(key: 'token', value: data['token']);
        return {
          'success': true,
          'user': User.fromJson(data['user']),
          'token': data['token'],
        };
      } else {
        return {
          'success': false,
          'error': jsonDecode(response.body)['error'] ?? 'Signup failed',
        };
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: $e'};
    }
  }

  static Future<Map<String, dynamic>> login(
    String email,
    String password,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        await storage.write(key: 'token', value: data['token']);
        return {
          'success': true,
          'user': User.fromJson(data['user']),
          'token': data['token'],
        };
      } else {
        return {
          'success': false,
          'error': jsonDecode(response.body)['error'] ?? 'Login failed',
        };
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: $e'};
    }
  }

  static Future<String?> getToken() async {
    return await storage.read(key: 'token');
  }

  static Future<void> logout() async {
    await storage.delete(key: 'token');
  }

  static Future<bool> isAuthenticated() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }
}
