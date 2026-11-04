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
- Settings with English (default), Telugu, Hindi, and Tamil navigation preferences

Trip and expense data are currently stored locally on the Android device with AsyncStorage. The app clearly labels destination and cost values as estimates, not live prices.

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

- Supabase authentication and cross-device sync (the website has a Supabase setup; the native app is not connected yet).
- Real shared group-trip collaboration and role permissions.
- Native scheduled notifications and live weather, delay, or price-drop feeds. These need device notification integration and suitable data providers; no paid API is included.
- Full translation of every screen (the language selector and primary navigation are localized in this pass).
- Live maps, route navigation, and live accommodation availability.
- Full dark-mode theme.

No paid APIs, subscriptions, or paid SDKs are required for the current app source. The APK build can be run locally or through the public-repository workflow.
