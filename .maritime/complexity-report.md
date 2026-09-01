## 🚨 Automated Complexity Report

**Last Updated:** 2026-09-01

### 🏥 Repository Health Score: **72.0 / 100**

*   **Formula**: 100 - Penalties for Files exceeding thresholds (LOC > 300, Complexity > 10, Fan-Out > 15).
*   **Total Graph Files**: 45
*   **Measured Files**: 45
*   **Unmeasured Files**: 0

### 🔥 Top 10 High-Complexity Files (Compound Score)
_Score = (LOC/10) + (Complexity*2) + (FanOut*2) + (Instability*20)_

| File | Score | LOC | Complexity | Fan-Out | Instability |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `app/domain/projection.ts` | **392** | 660 | 154 | 3 | 0.6 |
| `app/domain/countdowns.ts` | **231.1** | 401 | 92 | 1 | 0.25 |
| `app/domain/validation.ts` | **221.9** | 481 | 71 | 9 | 0.69 |
| `src/features/timeline/TimelineScrubber.tsx` | **194.9** | 834 | 40 | 7 | 0.88 |
| `src/CrawlerApp.tsx` | **190.5** | 520 | 36 | 24 | 0.92 |
| `src/features/inventory/InventoryView.tsx` | **181.8** | 727 | 40 | 6 | 0.86 |
| `app/domain/compiler.ts` | **128.6** | 333 | 39 | 2 | 0.67 |
| `app/domain/fixtures/floor6.ts` | **103.4** | 774 | 1 | 2 | 1 |
| `app/domain/observations.ts` | **97.2** | 322 | 29 | 1 | 0.25 |
| `app/domain/types.ts` | **83.9** | 819 | 1 | 0 | 0 |

### 🧠 Top 10 Logic-Heavy Files (Cyclomatic Complexity)
| File | Max Complexity | LOC |
| :--- | :--- | :--- |
| `app/domain/projection.ts` | **154** | 660 |
| `app/domain/countdowns.ts` | **92** | 401 |
| `app/domain/validation.ts` | **71** | 481 |
| `src/features/inventory/InventoryView.tsx` | **40** | 727 |
| `src/features/timeline/TimelineScrubber.tsx` | **40** | 834 |
| `app/domain/compiler.ts` | **39** | 333 |
| `src/CrawlerApp.tsx` | **36** | 520 |
| `app/domain/observations.ts` | **29** | 322 |
| `src/features/crawler/stats/PlayerStats.tsx` | **18** | 36 |
| `app/domain/stats.ts` | **17** | 183 |
