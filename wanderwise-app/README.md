# WanderWise Android App

A native React Native + Expo starter for the PDAP Travel Planner Application.

## Included in this first MVP
- Native Android screen layout with Explore, Plan Trip, and Saved Trips tabs.
- Searchable destination suggestions.
- Editable trip duration, travellers, and cost estimates.
- Automatic total and per-person budget calculations.
- Save/remove trips locally on the device using AsyncStorage.
- WanderWise brand styling and Android application ID.

## Run locally
1. Install Node.js LTS.
2. Install dependencies: `npm install`
3. Start Expo: `npx expo start`
4. Install Expo Go on an Android phone and scan the QR code, or run on an Android emulator.

## Build a shareable APK
1. Create/sign in to a free Expo account.
2. Install EAS CLI: `npm install -g eas-cli`
3. Sign in: `eas login`
4. From this folder, run: `eas build -p android --profile preview`
5. Download the APK from the completed build page and install it on your Android phone.

Cloud build quotas and account requirements may change. An APK can be shared directly; Google Play publishing is separate and may require a registration fee.

## Current scope / important notes
This is a native-app MVP, not a finished production release. The first version stores saved trips on the current device only. It does not yet sync trips to Supabase, use live hotel prices, or provide live maps. The website and this app are separate projects, so changes to one do not automatically change the other.
