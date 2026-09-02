## 🚨 Automated Complexity Report

**Last Updated:** 2026-09-02

### 🏥 Repository Health Score: **71.0 / 100**

*   **Formula**: 100 - Penalties for Files exceeding thresholds (LOC > 300, Complexity > 10, Fan-Out > 15).
*   **Total Graph Files**: 46
*   **Measured Files**: 46
*   **Unmeasured Files**: 0

### 🔥 Top 10 High-Complexity Files (Compound Score)
_Score = (LOC/10) + (Complexity*2) + (FanOut*2) + (Instability*20)_

| File | Score | LOC | Complexity | Fan-Out | Instability |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `app/domain/projection.ts` | **401.5** | 675 | 158 | 3 | 0.6 |
| `app/domain/countdowns.ts` | **231.1** | 401 | 92 | 1 | 0.25 |
| `app/domain/validation.ts` | **221.9** | 481 | 71 | 9 | 0.69 |
| `src/features/inventory/InventoryView.tsx` | **200.8** | 793 | 45 | 7 | 0.88 |
| `src/features/timeline/TimelineScrubber.tsx` | **194.9** | 834 | 40 | 7 | 0.88 |
| `src/CrawlerApp.tsx` | **190.6** | 521 | 36 | 24 | 0.92 |
| `app/domain/compiler.ts` | **132** | 347 | 40 | 2 | 0.67 |
| `app/domain/fixtures/floor6.ts` | **103.4** | 774 | 1 | 2 | 1 |
| `app/domain/observations.ts` | **97.2** | 322 | 29 | 1 | 0.25 |
| `app/domain/types.ts` | **86.5** | 845 | 1 | 0 | 0 |

### 🧠 Top 10 Logic-Heavy Files (Cyclomatic Complexity)
| File | Max Complexity | LOC |
| :--- | :--- | :--- |
| `app/domain/projection.ts` | **158** | 675 |
| `app/domain/countdowns.ts` | **92** | 401 |
| `app/domain/validation.ts` | **71** | 481 |
| `src/features/inventory/InventoryView.tsx` | **45** | 793 |
| `app/domain/compiler.ts` | **40** | 347 |
| `src/features/timeline/TimelineScrubber.tsx` | **40** | 834 |
| `src/CrawlerApp.tsx` | **36** | 521 |
| `app/domain/observations.ts` | **29** | 322 |
| `src/features/crawler/stats/PlayerStats.tsx` | **18** | 36 |
| `app/domain/stats.ts` | **17** | 183 |
