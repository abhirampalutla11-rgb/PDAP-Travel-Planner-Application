# WanderWise Android App

Native Android application for the PDAP Travel Planner, built with React Native and Expo.

## Current app modules

- Dashboard
- Explore and Discover with the same 34 destination records used by the current WanderWise website
- For You budget matches
- Plan Trip with editable costs, a budget snapshot, remaining/over-budget calculation, and a day-by-day starter itinerary
- Stays
- Expenses
- Analytics / trip insights
- Saved Trips with edit and delete
- Group trip roster with organizer, planner, traveller, and viewer roles (local draft only)
- External Google Maps hand-off for destination locations (no API key required)
- Settings with English (default), Telugu, Hindi, and Tamil navigation preferences
- Email/password account sign-in and Supabase cloud sync for trips and expenses, using the same backend project as the website
- Local data export through the Android share sheet and local data deletion controls

Trip and expense data are stored locally with AsyncStorage and can sync to the existing WanderWise Supabase account after sign-in. Local storage remains available when offline. The app clearly labels destination and cost values as estimates, not live prices.

## Free local development

1. Install the current Node.js LTS release and Android Studio (including Android SDK and platform tools).
2. Open a terminal in this folder and run `npm install`.
3. Run `npx expo start` and use Expo Go on an Android phone to preview the app.
4. For a native Android build, run `npx expo prebuild --platform android`.
5. Open the generated `android` folder in Android Studio, allow Gradle sync, then build an APK using **Build > Build Bundle(s) / APK(s) > Build APK(s)**. The debug APK is under `android/app/build/outputs/apk/debug/`.

For a release APK from a local terminal, run `cd android && ./gradlew assembleRelease` (Windows: `cd android && gradlew.bat assembleRelease`). Android signing must be configured before distributing a production release.

## Free CI APK build

The public GitHub Actions workflow can build an APK without an Expo cloud token. Run it from the repository's **Actions** tab using **Build WanderWise Android APK**. The generated APK is uploaded as a workflow artifact.

## Not yet implemented / next development stages

- Google sign-in and password-recovery deep-link flow (email/password sign-in and account creation are implemented).
- Real shared group-trip collaboration, invitations, and synced role permissions.
- Native scheduled notifications and live weather, delay, or price-drop feeds. These need device notification integration and suitable data providers; no paid API is included.
- Full translation of every screen (the language selector and primary navigation are localized in this pass).
- Live in-app maps, route navigation, and live accommodation availability.
- Full dark-mode theme.

No paid APIs, subscriptions, or paid SDKs are required for the current app source. The APK build can be run locally or through the public-repository workflow.
