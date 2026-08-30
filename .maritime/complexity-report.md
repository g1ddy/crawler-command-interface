## 🚨 Automated Complexity Report

**Last Updated:** 2026-08-30

### 🏥 Repository Health Score: **79.0 / 100**

*   **Formula**: 100 - Penalties for Files exceeding thresholds (LOC > 300, Complexity > 10, Fan-Out > 15).
*   **Total Graph Files**: 25
*   **Measured Files**: 25
*   **Unmeasured Files**: 0

### 🔥 Top 10 High-Complexity Files (Compound Score)
_Score = (LOC/10) + (Complexity*2) + (FanOut*2) + (Instability*20)_

| File | Score | LOC | Complexity | Fan-Out | Instability |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `app/domain/projection.ts` | **392.8** | 668 | 154 | 3 | 0.6 |
| `src/CrawlerApp.tsx` | **355.5** | 2156 | 44 | 17 | 0.89 |
| `app/domain/countdowns.ts` | **231.1** | 401 | 92 | 1 | 0.25 |
| `app/domain/validation.ts` | **221.9** | 481 | 71 | 9 | 0.69 |
| `app/components/TimelineScrubber.tsx` | **203.6** | 841 | 44 | 7 | 0.88 |
| `app/domain/compiler.ts` | **128.2** | 329 | 39 | 2 | 0.67 |
| `app/domain/fixtures/floor6.ts` | **102.2** | 762 | 1 | 2 | 1 |
| `app/domain/observations.ts` | **97.2** | 322 | 29 | 1 | 0.25 |
| `app/domain/types.ts` | **82.7** | 807 | 1 | 0 | 0 |
| `app/components/TelemetryInspectorModal.tsx` | **69.6** | 186 | 15 | 3 | 0.75 |

### 🧠 Top 10 Logic-Heavy Files (Cyclomatic Complexity)
| File | Max Complexity | LOC |
| :--- | :--- | :--- |
| `app/domain/projection.ts` | **154** | 668 |
| `app/domain/countdowns.ts` | **92** | 401 |
| `app/domain/validation.ts` | **71** | 481 |
| `app/components/TimelineScrubber.tsx` | **44** | 841 |
| `src/CrawlerApp.tsx` | **44** | 2156 |
| `app/domain/compiler.ts` | **39** | 329 |
| `app/domain/observations.ts` | **29** | 322 |
| `app/domain/stats.ts` | **17** | 183 |
| `app/components/TelemetryInspectorModal.tsx` | **15** | 186 |
| `app/components/TelemetryBadge.tsx` | **14** | 104 |
