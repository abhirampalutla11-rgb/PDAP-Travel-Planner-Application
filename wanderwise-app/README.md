# WanderWise Android App

Native Android application for the PDAP Travel Planner, built with React Native and Expo.

## Current app modules

- Dashboard with a destination surprise picker, budget split assistant, and mini itinerary builder
- Explore and Discover with the same 34 destination records used by the current WanderWise website
- For You budget matches
- Plan Trip with editable costs, a budget snapshot, remaining/over-budget calculation, and a day-by-day starter itinerary
- Stay budget guides plus external hotel, review, and price searches through Google Maps, Google Travel, and Booking.com
- Expenses
- Analytics / trip insights
- Saved Trips with edit and delete
- Group trip roster with organizer, planner, traveller, and viewer roles (local draft only)
- External Google Maps hand-off for destination locations (no API key required)
- Settings with English (default), Telugu, Hindi, and Tamil navigation preferences
- User-controlled local Android trip reminders scheduled one day before saved trips
- Authenticated local encryption for app data and Supabase sessions, with the encryption key held in Android secure storage
- Email/password and Google OAuth sign-in with Supabase PKCE deep-link handling, plus cloud sync for trips and expenses using the same backend project as the website
- WanderWise compass logo in the app header, launcher icon, adaptive icon, and splash screen
- Local data export through the Android share sheet and local data deletion controls

Trip and expense data are encrypted on-device before local storage and can sync to the existing WanderWise Supabase account after sign-in. The encryption key is held in Android secure storage. Local storage remains available when offline. The app clearly labels destination and cost values as estimates, not live prices.

## Free local development

1. Install the current Node.js LTS release and Android Studio (including Android SDK and platform tools).
2. Open a terminal in this folder and run `npm install`, then `node scripts/generate-assets.cjs` to create the PNG app icons from the included vector brand artwork.
3. Run `npx expo start` and use Expo Go on an Android phone to preview the app.
4. For a native Android build, run `npx expo prebuild --platform android`.
5. Open the generated `android` folder in Android Studio, allow Gradle sync, then build an APK using **Build > Build Bundle(s) / APK(s) > Build APK(s)**. The preview APK is under `android/app/build/outputs/apk/release/`.

For a release APK from a local terminal, run `cd android && ./gradlew assembleRelease` (Windows: `cd android && gradlew.bat assembleRelease`). Android signing must be configured before distributing a production release.

## Free CI APK build

The public GitHub Actions workflow can build an APK without an Expo cloud token. Run it from the repository's **Actions** tab using **Build WanderWise Android APK**. The generated standalone preview APK is uploaded as a workflow artifact. It is debug-signed for testing, not a production-store release.

## Not yet implemented / next development stages

- Google OAuth requires one-time Google Cloud OAuth client setup and enabling the Google provider / app redirect URL in the existing Supabase project. Password-recovery deep-link flow remains to be added.
- Real shared group-trip collaboration, invitations, and synced role permissions.
- Real-time booking updates, weather warnings, transport delays, hotel/transport price-drop feeds, and itinerary-change alerts. Local pre-trip reminders are implemented; real-time alerts need reliable free data providers and background refresh support.
- Full translation of every screen (the language selector and primary navigation are localized in this pass).
- Embedded in-app maps, turn-by-turn route navigation, and live availability feeds. The app hands off map and hotel searches to external services.
- Full dark-mode theme.
- Account deletion workflow (local data export and deletion controls are available; deleting a Supabase identity requires a protected account-management flow).

No paid APIs, subscriptions, or paid SDKs are required for the current app source. The APK build can be run locally or through the public-repository workflow.


## One-time Google Sign-In setup

The app code uses Supabase OAuth with PKCE and returns to the installed app at `wanderwise://auth/callback`. To enable the Google button for real accounts:

1. In Google Cloud Console, configure the OAuth consent screen and create a **Web application** OAuth client.
2. Add this exact authorized redirect URI to that Google OAuth client: `https://hmjtzyakidwtkzhhbgzd.supabase.co/auth/v1/callback`.
3. In the existing Supabase project, open **Authentication → Sign In / Providers → Google**, enable Google, and enter the Google client ID and client secret. Keep the secret in Supabase only; never put it in the app source or GitHub.
4. In Supabase **Authentication → URL Configuration → Redirect URLs**, allow `wanderwise://auth/callback`.
5. If Google's consent screen is in Testing mode, add the Google accounts that should be allowed as test users.

The app-side integration is present, but Google authentication will not complete until this provider and redirect allowlist are configured in the Supabase dashboard.
