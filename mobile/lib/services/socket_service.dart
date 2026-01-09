import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'auth_service.dart';

class SocketService {
  static const String baseUrl = 'https://easyshare-09ya.onrender.com';
  static IO.Socket? _socket;

  static Future<IO.Socket> connect() async {
    if (_socket != null && _socket!.connected) {
      return _socket!;
    }

    final token = await AuthService.getToken();
    
    _socket = IO.io(
      baseUrl,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .setAuth({'token': token})
          .build(),
    );

    _socket!.connect();

    return _socket!;
  }

  static void joinGroup(String groupId) {
    if (_socket?.connected ?? false) {
      _socket!.emit('group:join', groupId);
    }
  }

  static void leaveGroup(String groupId) {
    if (_socket?.connected ?? false) {
      _socket!.emit('group:leave', groupId);
    }
  }

  static void onMessageReceived(Function(dynamic) callback) {
    _socket?.on('message:receive', callback);
  }

  static void onExpenseAdded(Function(dynamic) callback) {
    _socket?.on('expense:added', callback);
  }

  static void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }

  static IO.Socket? get socket => _socket;
}
