## 🚨 Automated Complexity Report

**Last Updated:** 2026-08-30

### 🏥 Repository Health Score: **77.0 / 100**

*   **Formula**: 100 - Penalties for Files exceeding thresholds (LOC > 300, Complexity > 10, Fan-Out > 15).
*   **Total Graph Files**: 33
*   **Measured Files**: 33
*   **Unmeasured Files**: 0

### 🔥 Top 10 High-Complexity Files (Compound Score)
_Score = (LOC/10) + (Complexity*2) + (FanOut*2) + (Instability*20)_

| File | Score | LOC | Complexity | Fan-Out | Instability |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `app/domain/projection.ts` | **394.9** | 669 | 155 | 3 | 0.6 |
| `src/CrawlerApp.tsx` | **329.4** | 1829 | 40 | 24 | 0.92 |
| `app/domain/countdowns.ts` | **231.1** | 401 | 92 | 1 | 0.25 |
| `app/domain/validation.ts` | **221.9** | 481 | 71 | 9 | 0.69 |
| `src/features/timeline/TimelineScrubber.tsx` | **194.9** | 834 | 40 | 7 | 0.88 |
| `app/domain/compiler.ts` | **128.2** | 329 | 39 | 2 | 0.67 |
| `app/domain/fixtures/floor6.ts` | **102.2** | 762 | 1 | 2 | 1 |
| `app/domain/observations.ts` | **96.2** | 322 | 29 | 1 | 0.2 |
| `app/domain/types.ts` | **82.6** | 806 | 1 | 0 | 0 |
| `app/components/TelemetryInspectorModal.tsx` | **69.6** | 186 | 15 | 3 | 0.75 |

### 🧠 Top 10 Logic-Heavy Files (Cyclomatic Complexity)
| File | Max Complexity | LOC |
| :--- | :--- | :--- |
| `app/domain/projection.ts` | **155** | 669 |
| `app/domain/countdowns.ts` | **92** | 401 |
| `app/domain/validation.ts` | **71** | 481 |
| `src/CrawlerApp.tsx` | **40** | 1829 |
| `src/features/timeline/TimelineScrubber.tsx` | **40** | 834 |
| `app/domain/compiler.ts` | **39** | 329 |
| `app/domain/observations.ts` | **29** | 322 |
| `app/domain/stats.ts` | **17** | 183 |
| `app/components/TelemetryBadge.tsx` | **15** | 81 |
| `app/components/TelemetryInspectorModal.tsx` | **15** | 186 |
