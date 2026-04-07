# 🏋️ FitTrack — AI-Powered Fitness Tracker

A full-stack, cross-platform fitness and nutrition tracking app built with **Expo (React Native)** + **Node.js/Express** backend. Features AI coaching, workout logging, diet tracking, water hydration monitoring, and more.

---

## 📱 Features

- **Dashboard** — Calorie ring, macro tracking, streaks, AI Smart Coach insights
- **💧 Hydration Tracker** — Log water intake by glass/bottle with animated progress bar
- **🍽️ Diet Logging** — Food database search, barcode scanner, meal-type grouping
- **💪 Workout Tracker** — Custom exercises, sets/reps/weight, rest timer, workout history
- **📊 Analytics** — Weekly/monthly charts for calories, protein, workouts
- **🧠 AI Smart Coach** — Personalized daily fitness insights powered by OpenAI
- **🔥 Streaks** — Logging and workout streaks gamification
- **🌙 Dark/Light Mode** — System-aware theme with beautiful dark UI
- **⚡ Haptic Feedback** — Subtle haptics on interactions
- **Skeleton Loaders** — Polished loading states across all screens
- **Pull-to-Refresh** — Real-time data refresh on every screen

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | Expo 54 + React Native 0.81 |
| Navigation | Expo Router (file-based) |
| State | Zustand |
| Backend | Node.js + Express + TypeScript |
| Database | MongoDB + Mongoose |
| AI | OpenAI GPT API |
| Charts | react-native-chart-kit |
| Icons | lucide-react-native |
| Build | EAS Build |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- MongoDB instance (local or Atlas)

### 1. Clone & Install

```bash
git clone https://github.com/satyam-prakash/fitness-app.git
cd fitness-app
```

### 2. Backend Setup

```bash
cd backend
npm install
# Create .env:
# MONGODB_URI=your_mongo_uri
# JWT_SECRET=your_jwt_secret
# OPENAI_API_KEY=your_openai_key
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
# Update services/api.ts with your backend URL
npx expo start
```

---

## 📦 Building APK

We use **EAS Build** for generating Android APKs.

```bash
cd frontend
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

The `preview` profile generates a **sideloadable `.apk`** (no Play Store needed).

---

## 📁 Project Structure

```
fitness-app/
├── backend/              # Express API server
│   └── src/
│       ├── routes/       # API routes (auth, diet, workout, etc.)
│       ├── models/       # Mongoose models
│       └── middleware/   # Auth middleware
└── frontend/             # Expo React Native app
    ├── app/
    │   ├── (auth)/       # Login / Register screens
    │   └── (tabs)/       # Main tab screens
    ├── components/       # Reusable UI components
    ├── hooks/            # Custom hooks (haptics, theme)
    ├── services/         # API client
    └── store/            # Zustand global state
```

---

## 🤝 Contributing

Pull requests welcome! Please open an issue first to discuss changes.

---

## 📄 License

MIT
