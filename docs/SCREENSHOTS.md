# Interface Screenshots

These images are generated **canonical product views** of the Crawler Command Interface. Refresh the complete set with `npm run test:screenshots`; do not retouch generated images manually.

Canonical screenshots obey the same source-honesty rule as the application: a documented product view must come from real supported story/application state or an explicitly truthful unavailable state. Isolated synthetic Playwright fixtures may exercise rendering behavior, but they are not promoted into `docs/images/` or presented here as story-backed product state.

The persistent replay surface remains available in every view. Root navigation is capability-driven at the selected sequence: Crawler, Inventory, and Skills are baseline destinations; Ratings, Party, Notifications, Quests, and future domains appear only when meaningful projected state supports them. Magic remains modeled without a feature/navigation surface.

## Top-level views

### Crawler
![Crawler view](images/screenshot-crawler.png)

### Inventory
![Inventory view](images/screenshot-inventory.png)

### Awards / Boxes
Awards and Boxes appear only after an explicit, source-backed award-to-inventory transition. The ledger preserves award history after a box is opened without claiming that it remains in inventory.
![Awards and Boxes view](images/screenshot-awards.png)

### Skills
![Skills view](images/screenshot-skills.png)

### Ratings
Broadcast-domain observations are presented in canon-aligned Ratings groups without renaming the underlying data model.
![Ratings view](images/screenshot-ratings.png)

### Party
The Party roster appears only after the sourced Floor 1 formation sequence and shows no inferred teammate state.
![Party view](images/screenshot-party.png)

### Notifications
Only crawler-visible delivered semantics are represented; generic Timeline activity remains separate.
![Notifications view](images/screenshot-notifications.png)

## Crawler views

### Player Stats
![Crawler stats](images/screenshot-crawler-stats.png)

### Health / Conditions
Vitals are separate from beneficial, harmful, injury, and other condition presentation. Injuries are never inferred from effect text.
![Crawler health and conditions](images/screenshot-crawler-health.png)

## Timeline and floor context views

### Floor Rules
![Floor rules view](images/screenshot-floor-rules.png)

### Timeline History
![Timeline history view](images/screenshot-timeline-history.png)

## Noncanonical visual scenarios

Playwright may use isolated synthetic timelines for component behavior that has no source-backed Floors 1–2 product state yet. Quests currently fall into this category: the browser test verifies that a projected Quest can render and become navigable, but no Quests screenshot is published as canonical until authored source-backed quest state exists in the supported story scope.
