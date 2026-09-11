## 🚨 Automated Complexity Report

**Last Updated:** 2026-09-11

### 🏥 Repository Health Score: **60.0 / 100**

*   **Formula**: 100 - Penalties for Files exceeding thresholds (LOC > 300, Complexity > 10, Fan-Out > 15).
*   **Total Graph Files**: 91
*   **Measured Files**: 91
*   **Unmeasured Files**: 0

### 🔥 Top 10 High-Complexity Files (Compound Score)
_Score = (LOC/10) + (Complexity*2) + (FanOut*2) + (Instability*20)_

| File | Score | LOC | Complexity | Fan-Out | Instability |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `app/domain/countdowns.ts` | **229.4** | 401 | 92 | 1 | 0.17 |
| `app/domain/validation.ts` | **228.1** | 483 | 74 | 9 | 0.69 |
| `app/domain/projection/helpers.ts` | **170.2** | 222 | 68 | 2 | 0.4 |
| `src/CrawlerApp.tsx` | **147.9** | 365 | 27 | 20 | 0.87 |
| `src/application/crawler-actions.ts` | **134.8** | 128 | 49 | 4 | 0.8 |
| `app/domain/compiler.ts` | **124.1** | 368 | 35 | 2 | 0.67 |
| `src/features/inventory/ItemInspector.tsx` | **112.6** | 226 | 33 | 4 | 0.8 |
| `src/application/crawler-session-controller.ts` | **110.9** | 306 | 20 | 11 | 0.92 |
| `app/domain/fixtures/floor6.ts` | **103.4** | 774 | 1 | 2 | 1 |
| `app/domain/observations.ts` | **97.5** | 325 | 29 | 1 | 0.25 |

### 🧠 Top 10 Logic-Heavy Files (Cyclomatic Complexity)
| File | Max Complexity | LOC |
| :--- | :--- | :--- |
| `app/domain/countdowns.ts` | **92** | 401 |
| `app/domain/validation.ts` | **74** | 483 |
| `app/domain/projection/helpers.ts` | **68** | 222 |
| `src/application/crawler-actions.ts` | **49** | 128 |
| `app/domain/compiler.ts` | **35** | 368 |
| `src/features/inventory/ItemInspector.tsx` | **33** | 226 |
| `app/domain/observations.ts` | **29** | 325 |
| `src/CrawlerApp.tsx` | **27** | 365 |
| `src/features/inventory/equipment/EquipmentView.tsx` | **27** | 57 |
| `src/features/timeline/diagnostics/SequenceInspector.tsx` | **25** | 50 |
