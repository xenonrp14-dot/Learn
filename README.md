# Learn App

A role-based learning platform built with React Native (Expo) and Firebase.

## Features
- Student, Mentor, and Admin dashboards
- Course management and enrollment
- Mentor approval workflow
- Analytics and notifications
- Real-time updates with Firestore

## Setup
1. Clone the repository.
2. Install dependencies:
   ```sh
   npm install
   ```
3. Add your Firebase config to `firebase.js`.
4. Start the app:
   ```sh
   npm start
   ```

## Build & Upload
- For Expo Go: `npm start`
- For production build: `npx expo export` or use EAS Build for app store upload.
- Follow Expo docs for publishing: https://docs.expo.dev/bare/using-expo-client/

## Notes
- Ensure your Firebase config uses production keys.
- Remove any test data before uploading.
- Update app icons and splash screens for branding.

## License
MIT
