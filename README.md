# 🚀 PAGE ON — AI Self-Growth Writing Assistant
AI 기반 글쓰기 분석 · 힌트 · 피드백 · 주제 추천까지
스스로 성장하는 글쓰기 루틴을 완성하는 올인원 앱입니다.

Expo Go 앱으로 QR 찍고 실행 가능.

🖥️ Tech Stack
App Development:
-React Native (Expo)
-TypeScript
-Expo Router
-React Native UI Components

AI & Backend:
-Google Gemini API (1.5-flash-preview-09-2025)
-Custom prompt engineering
-Topic suggestion model
-Sentence-level hint extraction

Build Tools:
-Expo Go
-VS Code
-Node.js / npm
-Git & GitHub

myApp/
│
├── app/
│   ├── (tabs)/
│   │     └── index.tsx        # 메인 로직, 모든 화면 포함
│   ├── _layout.tsx
│   └── other screens...
│
├── scripts/
│   ├── gemini.ts              # Gemini API 연동 + prompt 시스템
│   └── reset-project.js
│
├── assets/
│   └── images/
│        ├── assetspage_on_icon.png
│        └── assetspage_on_text.png
│
├── .env                       # EXPO_PUBLIC_* 환경변수 저장
├── package.json
└── tsconfig.json


This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
