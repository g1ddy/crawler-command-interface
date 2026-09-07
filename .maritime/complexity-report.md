## 🚨 Automated Complexity Report

**Last Updated:** 2026-09-07

### 🏥 Repository Health Score: **67.0 / 100**

*   **Formula**: 100 - Penalties for Files exceeding thresholds (LOC > 300, Complexity > 10, Fan-Out > 15).
*   **Total Graph Files**: 78
*   **Measured Files**: 78
*   **Unmeasured Files**: 0

### 🔥 Top 10 High-Complexity Files (Compound Score)
_Score = (LOC/10) + (Complexity*2) + (FanOut*2) + (Instability*20)_

| File | Score | LOC | Complexity | Fan-Out | Instability |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `app/domain/countdowns.ts` | **230.1** | 401 | 92 | 1 | 0.2 |
| `app/domain/validation.ts` | **197.7** | 459 | 60 | 9 | 0.69 |
| `app/domain/projection/helpers.ts` | **164.2** | 202 | 66 | 2 | 0.4 |
| `src/CrawlerApp.tsx` | **157.5** | 433 | 28 | 20 | 0.91 |
| `app/domain/compiler.ts` | **124.1** | 368 | 35 | 2 | 0.67 |
| `src/features/inventory/ItemInspector.tsx` | **111.7** | 247 | 33 | 3 | 0.75 |
| `app/domain/fixtures/floor6.ts` | **103.4** | 774 | 1 | 2 | 1 |
| `app/domain/observations.ts` | **97.2** | 322 | 29 | 1 | 0.25 |
| `app/domain/projection/index.ts` | **89.8** | 195 | 15 | 11 | 0.92 |
| `src/features/inventory/equipment/EquipmentView.tsx` | **86.2** | 55 | 27 | 5 | 0.83 |

### 🧠 Top 10 Logic-Heavy Files (Cyclomatic Complexity)
| File | Max Complexity | LOC |
| :--- | :--- | :--- |
| `app/domain/countdowns.ts` | **92** | 401 |
| `app/domain/projection/helpers.ts` | **66** | 202 |
| `app/domain/validation.ts` | **60** | 459 |
| `app/domain/compiler.ts` | **35** | 368 |
| `src/features/inventory/ItemInspector.tsx` | **33** | 247 |
| `app/domain/observations.ts` | **29** | 322 |
| `src/CrawlerApp.tsx` | **28** | 433 |
| `src/features/inventory/equipment/EquipmentView.tsx` | **27** | 55 |
| `src/features/timeline/diagnostics/SequenceInspector.tsx` | **25** | 50 |
| `src/features/timeline/diagnostics/TimelineDiagnostics.tsx` | **21** | 48 |
