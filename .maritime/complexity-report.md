## 🚨 Automated Complexity Report

**Last Updated:** 2026-08-28

### 🏥 Repository Health Score: **80.0 / 100**

*   **Formula**: 100 - Penalties for Files exceeding thresholds (LOC > 300, Complexity > 10, Fan-Out > 15).
*   **Total Graph Files**: 25
*   **Measured Files**: 25
*   **Unmeasured Files**: 0

### 🔥 Top 10 High-Complexity Files (Compound Score)
_Score = (LOC/10) + (Complexity*2) + (FanOut*2) + (Instability*20)_

| File | Score | LOC | Complexity | Fan-Out | Instability |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `app/domain/projection.ts` | **398.7** | 667 | 157 | 3 | 0.6 |
| `src/CrawlerApp.tsx` | **350.6** | 2128 | 44 | 16 | 0.89 |
| `app/domain/countdowns.ts` | **231.1** | 401 | 92 | 1 | 0.25 |
| `app/domain/validation.ts` | **221.9** | 481 | 71 | 9 | 0.69 |
| `app/components/TimelineScrubber.tsx` | **203.6** | 841 | 44 | 7 | 0.88 |
| `app/domain/compiler.ts` | **128.2** | 329 | 39 | 2 | 0.67 |
| `app/domain/fixtures/floor6.ts` | **102.2** | 762 | 1 | 2 | 1 |
| `app/domain/observations.ts` | **97.4** | 294 | 28 | 1 | 0.5 |
| `app/domain/types.ts` | **81.9** | 799 | 1 | 0 | 0 |
| `app/components/TelemetryInspectorModal.tsx` | **63.5** | 182 | 14 | 2 | 0.67 |

### 🧠 Top 10 Logic-Heavy Files (Cyclomatic Complexity)
| File | Max Complexity | LOC |
| :--- | :--- | :--- |
| `app/domain/projection.ts` | **157** | 667 |
| `app/domain/countdowns.ts` | **92** | 401 |
| `app/domain/validation.ts` | **71** | 481 |
| `app/components/TimelineScrubber.tsx` | **44** | 841 |
| `src/CrawlerApp.tsx` | **44** | 2128 |
| `app/domain/compiler.ts` | **39** | 329 |
| `app/domain/observations.ts` | **28** | 294 |
| `app/domain/stats.ts` | **17** | 183 |
| `app/components/TelemetryBadge.tsx` | **14** | 104 |
| `app/components/TelemetryInspectorModal.tsx` | **14** | 182 |
