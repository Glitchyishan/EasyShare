# EasyShare Flutter Mobile App

A beautiful and intuitive Flutter mobile application for splitting expenses with friends.

## Features

- 🔐 User Authentication (Login/Signup)
- 👥 Create and manage groups
- 💰 Add and split expenses
- 📊 View settlements
- 💬 Real-time chat (coming soon)
- 📱 Offline support with local storage

## Tech Stack

- **Framework**: Flutter 3.x
- **Language**: Dart
- **State Management**: Provider
- **API Integration**: HTTP + Socket.IO
- **Storage**: Flutter Secure Storage

## Getting Started

### Prerequisites

- Flutter SDK >= 3.0.0
- Dart >= 3.0.0
- Android Studio or Xcode

### Installation

1. Clone the repository

```bash
cd mobile
```

2. Install dependencies

```bash
flutter pub get
```

3. Run the app

```bash
flutter run
```

## Project Structure

```
lib/
├── main.dart                 # App entry point
├── models/                   # Data models
├── services/                 # API & Auth services
├── providers/                # State management
├── screens/                  # App screens
│   ├── auth/                # Login/Signup
│   ├── home/                # Groups list
│   └── group/               # Group details
├── widgets/                  # Reusable widgets
└── utils/                    # Utilities
```

## Backend Integration

The app connects to the EasyShare backend at:

```
https://easyshare-09ya.onrender.com/api
```

All API calls and WebSocket connections are configured in:

- `lib/services/api_service.dart`
- `lib/services/socket_service.dart`

## Build & Release

### Android

```bash
flutter build apk
```

### iOS

```bash
flutter build ios
```

## Contributing

Pull requests are welcome!

## License

MIT
