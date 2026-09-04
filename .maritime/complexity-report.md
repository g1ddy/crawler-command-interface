## 🚨 Automated Complexity Report

**Last Updated:** 2026-09-04

### 🏥 Repository Health Score: **69.0 / 100**

*   **Formula**: 100 - Penalties for Files exceeding thresholds (LOC > 300, Complexity > 10, Fan-Out > 15).
*   **Total Graph Files**: 48
*   **Measured Files**: 48
*   **Unmeasured Files**: 0

### 🔥 Top 10 High-Complexity Files (Compound Score)
_Score = (LOC/10) + (Complexity*2) + (FanOut*2) + (Instability*20)_

| File | Score | LOC | Complexity | Fan-Out | Instability |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `app/domain/projection.ts` | **406.7** | 687 | 160 | 3 | 0.6 |
| `app/domain/countdowns.ts` | **231.1** | 401 | 92 | 1 | 0.25 |
| `app/domain/validation.ts` | **229** | 512 | 73 | 9 | 0.69 |
| `src/features/inventory/InventoryView.tsx` | **200.8** | 793 | 45 | 7 | 0.88 |
| `src/CrawlerApp.tsx` | **194.9** | 524 | 37 | 25 | 0.93 |
| `src/features/timeline/TimelineScrubber.tsx` | **194.9** | 834 | 40 | 7 | 0.88 |
| `app/domain/compiler.ts` | **136.6** | 373 | 41 | 2 | 0.67 |
| `app/domain/fixtures/floor6.ts` | **103.4** | 774 | 1 | 2 | 1 |
| `app/domain/observations.ts` | **97.2** | 322 | 29 | 1 | 0.25 |
| `app/domain/types.ts` | **88.9** | 869 | 1 | 0 | 0 |

### 🧠 Top 10 Logic-Heavy Files (Cyclomatic Complexity)
| File | Max Complexity | LOC |
| :--- | :--- | :--- |
| `app/domain/projection.ts` | **160** | 687 |
| `app/domain/countdowns.ts` | **92** | 401 |
| `app/domain/validation.ts` | **73** | 512 |
| `src/features/inventory/InventoryView.tsx` | **45** | 793 |
| `app/domain/compiler.ts` | **41** | 373 |
| `src/features/timeline/TimelineScrubber.tsx` | **40** | 834 |
| `src/CrawlerApp.tsx` | **37** | 524 |
| `app/domain/observations.ts` | **29** | 322 |
| `src/features/crawler/stats/PlayerStats.tsx` | **18** | 36 |
| `app/domain/stats.ts` | **17** | 183 |
