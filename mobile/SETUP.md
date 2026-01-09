# Flutter Mobile App Setup Guide

## Initial Setup

### 1. Get Flutter

If you don't have Flutter installed:

```bash
# Download from: https://flutter.dev/docs/get-started/install
# Add Flutter to your PATH

flutter --version
```

### 2. Create the Flutter Project

The project structure has already been created. To set it up:

```bash
cd mobile
flutter pub get
```

### 3. Run the App

#### On Android Emulator

```bash
flutter emulators
flutter run
```

#### On iOS Simulator (macOS only)

```bash
flutter run -d "iPhone 15"
```

#### On Physical Device

```bash
# Connect your device via USB
flutter devices
flutter run -d <device-id>
```

## Project Structure

```
mobile/
├── lib/
│   ├── main.dart                 # App entry point & routing
│   ├── models/                   # Data models (JSON serializable)
│   ├── services/                 # API, Auth, Socket services
│   ├── providers/                # State management (Provider)
│   ├── screens/                  # UI screens
│   │   ├── auth/                # Login/Signup
│   │   ├── home/                # Groups list
│   │   └── group/               # Group details
│   ├── widgets/                  # Reusable widgets
│   └── utils/                    # Constants, styles, helpers
├── pubspec.yaml                  # Dependencies
├── analysis_options.yaml         # Lint rules
└── README.md
```

## Dependencies

### Core

- **provider**: State management
- **http**: API requests
- **socket_io_client**: Real-time WebSockets

### Storage

- **flutter_secure_storage**: Secure token storage
- **shared_preferences**: Local preferences

### Utilities

- **intl**: Internationalization
- **json_annotation**: JSON serialization

## Important Endpoints

All API calls use:

```
Base URL: https://easyshare-09ya.onrender.com/api
```

Routes configured in `services/api_service.dart`:

- `POST /auth/login`
- `POST /auth/signup`
- `GET /groups/my`
- `POST /groups`
- `GET /groups/{id}/summary`
- `GET /groups/{id}/settlements`
- `POST /groups/{id}/expenses`
- `GET /groups/{id}/messages`
- `POST /groups/{id}/messages`

## Authentication Flow

1. User logs in/signs up
2. Token stored in **FlutterSecureStorage**
3. Token attached to all API requests via Authorization header
4. Token used for Socket.IO connection

## State Management (Provider)

The app uses **Provider** for state management:

- **AuthProvider**: Handles login, signup, logout
- **GroupProvider**: Manages groups list
- **ExpenseProvider**: Handles expenses
- **SettlementProvider**: Manages settlements

Usage:

```dart
// Read
final user = context.read<AuthProvider>().user;

// Listen & update UI
Consumer<AuthProvider>(
  builder: (context, authProvider, _) {
    return Text(authProvider.user?.name ?? 'Guest');
  },
)
```

## Building for Release

### Android APK

```bash
flutter build apk
```

### Android App Bundle (for Play Store)

```bash
flutter build appbundle
```

### iOS

```bash
flutter build ios
```

## Testing

### Unit Tests

```bash
flutter test
```

### Run with Logs

```bash
flutter run -v
```

## Debugging

### Hot Reload

Press `r` in terminal while app is running

### Hot Restart

Press `R` in terminal

### Debugging Tools

```bash
# Open DevTools
flutter pub global activate devtools
devtools

# Then navigate to http://localhost:9100
```

## Common Issues

### Port Already in Use

```bash
flutter run --observatory-port=0
```

### Cache Issues

```bash
flutter clean
flutter pub get
flutter run
```

### Build Issues

```bash
flutter doctor
flutter doctor -v
```

## Next Steps

1. Generate JSON serialization files:

```bash
flutter pub run build_runner build
```

2. Test authentication flow
3. Implement chat feature
4. Add image handling for profiles
5. Implement notifications

## Frontend Backend Connection Test

Test the connection by:

1. Run the app
2. Try to sign up/login
3. Check logs for API calls
4. Verify groups appear after login

If APIs fail:

- Check internet connectivity
- Verify backend URL is correct in `services/api_service.dart`
- Check backend is running on Render
- Review browser DevTools Network tab (if testing on web)

## Resources

- [Flutter Documentation](https://flutter.dev/docs)
- [Provider Package](https://pub.dev/packages/provider)
- [HTTP Package](https://pub.dev/packages/http)
- [Socket.IO Client](https://pub.dev/packages/socket_io_client)
