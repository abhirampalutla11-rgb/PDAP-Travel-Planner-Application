# WanderWise | Budget Travel Planner

WanderWise is an India-first travel-planning project built as a responsive website with an installable Progressive Web App (PWA) experience.

## Current experience

- Trip creation and itinerary planning
- Destination discovery and budget-based suggestions
- Hotel/stay search links and recent-search history
- Expense tracking and budget overview
- Saved trips and guest browser storage
- Optional account sign-in and cloud sync through the project's configured Supabase connection
- Light/dark theme
- Responsive navigation for mobile and desktop

## PWA and offline support

The project includes:
- `manifest.webmanifest` for app name, theme and install metadata
- `sw.js` for caching the application shell and providing a navigation fallback
- `offline.html` for a clear offline message
- `icons/wanderwise.svg` for the app icon

The service worker is registered only on HTTPS (such as GitHub Pages). The cached shell can reopen offline, but live destination information, external booking providers, remote images, authentication and cloud synchronization require an internet connection.

## Free-first development principles

- Keep the initial development budget at ₹0.
- Prefer open-source tools, public datasets and free service tiers.
- Check provider quotas, terms, attribution requirements and data freshness before integration.
- Never label sample data or calculated estimates as live, confirmed prices or availability.
- Use external booking links; do not collect payments in the initial version.
- Do not add paid dependencies without explicit project-owner approval.

## Development status

The current working branch is `website-first-clean-start`. PWA support is the first foundation improvement in this development pass. Further work should be incremental and preserve existing working features.

## Testing the PWA

1. Publish the branch to an HTTPS hosting environment or test it through a local HTTPS development server.
2. Open the site in a supported browser.
3. Use the browser's install option when available.
4. Open the app once while online, then test the offline fallback by disconnecting the network.
5. Confirm that features requiring live data clearly indicate when the device is offline.

## Important limitations

A free prototype is achievable, but free tiers have quotas and may change. Guaranteed live hotel inventory, transport fares, commercial map services, production-scale hosting and premium AI inference cannot be promised at no cost.
