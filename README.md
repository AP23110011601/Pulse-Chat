# ⚡ PulseChat — Next-Generation Real-Time Communication Platform

PulseChat is a startup-grade mobile communication platform built with **React Native (Expo)**, **Node.js + Express.js**, **Socket.io**, and **MongoDB Atlas**, featuring a glassmorphism theme, AI smart features, gamification, admin moderation, offline synchronization, and an Android APK generation pipeline.

---

## 🌟 Key Highlights

- **Visual Identity**: Glassmorphism cards with Deep Indigo (`#6366F1`), Royal Purple (`#8B5CF6`), Electric Blue (`#3B82F6`), and Cyan (`#06B6D4`) accent palette over Midnight Obsidian (`#0B0F19`) backdrop.
- **Dynamic Theme Switcher**: Full Dark Navy & Light Lavender theme switching with `AsyncStorage` persistence.
- **Real-Time Communication**: 1:1 Direct Messages, Group Chats, typing indicators, presence status (`🟢 Online` / `Last seen today at 2:30 PM`), and message status receipts (`✓` Sent, `✓✓` Delivered, `🔵✓✓` Read).
- **Advanced Message Controls**: Floating emoji reactions (`👍`, `❤️`, `😂`, `😮`, `🔥`), quoted message replies, message forwarding, and deletion (`Delete for me` / `Delete for everyone`).
- **Rich Media & File Sharing**: Image upload, Audio Voice message player UI (🎤 0:15), and Document card previews (📄 Resume.pdf).
- **AI Features Engine**: AI Smart Reply suggestion chips, 1-tap Message Translation, Spam Content Detection, AI Chat Summary generator, Grammar Check, and Sentiment Analysis.
- **Gamification System**: XP-based leveling, achievement badges, daily streaks, leaderboards, and discovery feed for user engagement.
- **Admin Command Center**: Real-time platform analytics (users, messages, groups count) and User Block/Unblock moderation controls.
- **Offline Sync & Caching**: Local message caching with `AsyncStorage` and automatic outbox sync when connection is restored.
- **Android APK Build Pipeline**: Single-click script `build-apk.bat` for EAS Cloud & Local Gradle compilation.
- **Enhanced Security**: Rate limiting, Helmet.js security headers, input validation, and JWT-based authentication.

---

## 🏗️ Enhanced Architecture

### Backend Architecture
- **Service Layer Pattern**: Business logic separated into dedicated services (authService, messageService, userService, groupService, gamificationService, aiService)
- **Validation Middleware**: Express-validator for input validation and sanitization
- **Rate Limiting**: Configurable rate limiters for different endpoint types (auth, messages, uploads, AI)
- **Security**: Helmet.js for HTTP security headers, CORS configuration, and request size limits

### Frontend Architecture
- **Custom Hooks**: Reusable logic hooks (useMessages, useFriends, useGroups) for state management
- **Context Providers**: Global state management with AuthContext and ThemeContext
- **Component Architecture**: Modular UI components with separation of concerns

---

## 📁 Directory Structure

```
RealTime-Chat-App/
├── backend/                  # Node.js + Express + Socket.io Server
│   ├── middleware/           # JWT Auth, validation, rate limiting
│   ├── models/               # MongoDB Mongoose models (User, Message, Group, Achievement, UserStats)
│   ├── routes/               # REST API endpoints (auth, users, messages, groups, ai, admin, gamification)
│   ├── services/             # Business logic layer (auth, message, user, group, gamification, AI)
│   ├── uploads/              # Chat media & profile images storage
│   └── server.js             # Express app & Socket.io server listener
│
└── mobile-app/               # React Native Expo Mobile Frontend
    ├── components/           # UI Components (Avatar, MessageBubble, ReactionPicker, SmartReplyBar)
    ├── constants/            # Theme design system & tokens (theme.js)
    ├── context/              # Global Providers (AuthContext, ThemeContext)
    ├── hooks/                # Custom React hooks (useMessages, useFriends, useGroups)
    ├── screens/              # App Screens (Splash, Login, Register, Home, Chat, GroupChat, Profile, Admin)
    ├── services/             # Offline storage & cache engine (offlineStorage.js)
    ├── App.js                # App entry point & navigation router
    ├── app.json              # Expo & Android app configuration
    ├── eas.json              # Android APK build profiles
    └── build-apk.bat         # Automated Android APK builder script
```

---

## 🚀 Getting Started

### 1️⃣ Run Backend Server

```bash
cd backend
npm install
node server.js
```
*Server will run on `http://localhost:5000` (or `http://YOUR_LAN_IP:5000`)*

---

### 2️⃣ Run Mobile Frontend (Expo)

Navigate into `mobile-app` directory:

```bash
cd mobile-app
npm install
npx expo start -c
```

---

### 📦 3. Build Android APK File

To generate your Android APK file, run inside `mobile-app`:

```bash
cd mobile-app
.\build-apk.bat
```
Or execute via Expo EAS CLI directly:
```bash
cd mobile-app
npx eas-cli login
npx eas-cli build -p android --profile preview
```

---

## 📋 Complete Feature Directory

See [FEATURES.md](./FEATURES.md) for the complete feature checklist including new gamification and enhanced AI features.
