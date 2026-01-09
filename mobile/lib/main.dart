import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/index.dart';
import 'screens/auth/index.dart';
import 'screens/home/index.dart';
import 'screens/group/index.dart';
import 'services/index.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => GroupProvider()),
        ChangeNotifierProvider(create: (_) => ExpenseProvider()),
        ChangeNotifierProvider(create: (_) => SettlementProvider()),
      ],
      child: MaterialApp(
        title: 'EasyShare',
        theme: ThemeData(
          useMaterial3: true,
          primaryColor: const Color(0xFF6366F1),
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF6366F1),
          ),
        ),
        home: const _RootPage(),
        routes: {
          '/login': (context) => const LoginScreen(),
          '/signup': (context) => const SignupScreen(),
          '/home': (context) => const HomeScreen(),
          '/group': (context) {
            final groupId =
                ModalRoute.of(context)?.settings.arguments as String?;
            return GroupScreen(groupId: groupId ?? '');
          },
        },
      ),
    );
  }
}

class _RootPage extends StatefulWidget {
  const _RootPage({Key? key}) : super(key: key);

  @override
  State<_RootPage> createState() => _RootPageState();
}

class _RootPageState extends State<_RootPage> {
  @override
  void initState() {
    super.initState();
    _checkAuthStatus();
  }

  Future<void> _checkAuthStatus() async {
    await Future.delayed(const Duration(milliseconds: 500));
    if (mounted) {
      final isAuth = await AuthService.isAuthenticated();
      if (isAuth) {
        Navigator.of(context).pushReplacementNamed('/home');
      } else {
        Navigator.of(context).pushReplacementNamed('/login');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'EasyShare',
              style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF6366F1),
                  ),
            ),
            const SizedBox(height: 24),
            const CircularProgressIndicator(
              valueColor:
                  AlwaysStoppedAnimation<Color>(Color(0xFF6366F1)),
            ),
          ],
        ),
      ),
    );
  }
}
