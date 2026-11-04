# WanderWise Development Roadmap

## Project constraints

- Initial development budget: ₹0.
- India-first travel planning.
- Website first, with an installable Progressive Web App (PWA) for Android-compatible use.
- Preserve existing working features and build incrementally.
- No paid API, subscription, payment gateway, or paid integration dependency.
- Clearly label estimates, sample data, public listings, and live/verified information.
- Never claim live availability, fares, weather, traffic, or safety alerts unless a source actually supplies current data.
- Free-tier quotas, terms, attribution requirements, and availability must be checked before integration.

## Existing repository baseline

The current project is a static HTML/CSS/JavaScript application in `index.html`, with:

- Trip planning and budget calculations.
- Destination discovery and rough budget recommendations.
- Accommodation search links and search history.
- Expense tracking and saved trips.
- Optional Supabase authentication and cloud synchronization.
- Light/dark theme and responsive navigation.
- PWA manifest, service worker, offline fallback, and SVG app icon.

The application currently has no package manifest or build pipeline. Keep the initial workflow dependency-light. Before changing the Supabase schema or sync behavior, inspect the existing database tables, access policies, and authentication configuration.

## Recommended free-first technical approach

| Area | Initial approach |
|---|---|
| Front end | Existing semantic HTML, CSS and modular vanilla JavaScript |
| Android experience | PWA install flow; defer paid app-store publishing |
| Local data | Browser storage with export/clear controls |
| Optional cloud sync | Existing Supabase free tier, only after validating row-level security and quotas |
| Maps | OpenStreetMap-based links and libraries with required attribution |
| Geocoding/routing | Public or self-hostable open-source services; respect usage policies and rate limits |
| Weather | Public/free source only when its current terms and quota are suitable; otherwise show a manual/offline advisory |
| AI | Rule-based planning first; optional local/open models only when practical on the user's device |
| Accommodation/transport | Search links and clearly labelled estimates until a reliable free data source is verified |
| Notifications | In-app and browser notifications; no paid SMS |
| Payments | No in-app payments in the initial release |
| Testing | Browser devtools, manual test checklist and free open-source validation tools |

## Delivery sequence

### Milestone 1: Stabilize the existing application
- Review the large single-page file for security, accessibility, reliability and mobile usability.
- Escape or safely render user-controlled content.
- Check all forms, navigation, local storage, authentication and service-worker behavior.
- Keep changes small and independently verifiable.

### Milestone 2: Establish a maintainable structure
- Gradually move inline styles and scripts into separate files without changing behavior.
- Separate data access, trip calculations, rendering and navigation.
- Add a clear data-source and estimate-label convention.
- Add a no-build local development and testing guide.

### Milestone 3: Build the planning engine
- Validate trip dates, travellers and budgets.
- Provide transparent budget allocations and per-person estimates.
- Generate editable day plans with travel/rest buffers.
- Keep destination and cost data in structured datasets rather than hard-coded UI markup.

### Milestone 4: Improve discovery and route planning
- Add destination filters and explainable recommendations.
- Add OpenStreetMap-based map views and route links with attribution.
- Show route distances and durations only when supplied by a usable source.
- Keep map results and estimates clearly distinguished.

### Milestone 5: Add safety and disruption support
- Provide offline-accessible emergency information and official contact links.
- Link to nearby services through map searches; do not imply verified proximity without a location result.
- Add weather/advisory information only when a current source is available.
- Offer alternative activities and itinerary adjustments when reliable information exists.

### Milestone 6: Accommodation and transport comparison
- Compare accessible public information and external booking links.
- Record source and last-checked time for manually verified information.
- Never invent inventory, prices, schedules or confirmed availability.

### Milestone 7: Accounts, groups and community
- Audit Supabase row-level security before enabling personal or group data.
- Add user-controlled profile, export and deletion workflows.
- Add group permissions and expense sharing only after authorization tests.
- Keep guest mode usable.

### Milestone 8: Localization, accessibility and release
- Add reviewed English, Telugu, Hindi and Tamil strings.
- Test keyboard access, contrast, reduced motion and mobile layouts.
- Test PWA installation and offline fallback on supported browsers.
- Publish only after regression checks.

## Current development changes

- Fixed the quick-itinerary preview so the user-entered destination is HTML-escaped before insertion. This prevents markup entered in the destination field from being interpreted as page HTML.
- Extracted authentication, main application logic, and PWA registration into separate JavaScript files while preserving their load order.
- Updated the service-worker cache version and precache list so the extracted JavaScript modules remain available to the offline app shell.
- Added destination-aware trip cost estimates using the curated destination dataset, with a clearly described general fallback and a rough Guntur-distance transport proxy. These values are planning estimates, not live fares or quotes.
- Added an interactive budget optimizer with Economy, Standard and Comfort scenarios, potential savings by category, budget-gap messaging, and an action to apply the Economy estimate. Scenario percentages are assumptions and are labelled as such.

## Definition of done for each change

1. Existing trip planning, saved trips, expenses and navigation still work.
2. User-controlled text is rendered safely.
3. Mobile and desktop layouts remain usable.
4. Offline behavior is honest about unavailable live information.
5. No paid dependency is introduced.
6. The change is committed to the clean-start branch and its result is verified.
