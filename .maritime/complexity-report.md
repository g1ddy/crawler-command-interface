## 🚨 Automated Complexity Report

**Last Updated:** 2026-09-09

### 🏥 Repository Health Score: **65.0 / 100**

*   **Formula**: 100 - Penalties for Files exceeding thresholds (LOC > 300, Complexity > 10, Fan-Out > 15).
*   **Total Graph Files**: 83
*   **Measured Files**: 83
*   **Unmeasured Files**: 0

### 🔥 Top 10 High-Complexity Files (Compound Score)
_Score = (LOC/10) + (Complexity*2) + (FanOut*2) + (Instability*20)_

| File | Score | LOC | Complexity | Fan-Out | Instability |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `app/domain/countdowns.ts` | **230.1** | 401 | 92 | 1 | 0.2 |
| `app/domain/validation.ts` | **228.1** | 483 | 74 | 9 | 0.69 |
| `app/domain/projection/helpers.ts` | **169.8** | 218 | 68 | 2 | 0.4 |
| `src/CrawlerApp.tsx` | **158.2** | 399 | 28 | 22 | 0.92 |
| `src/application/crawler-actions.ts` | **132.1** | 128 | 49 | 4 | 0.67 |
| `app/domain/compiler.ts` | **124.1** | 368 | 35 | 2 | 0.67 |
| `src/features/inventory/ItemInspector.tsx` | **112.3** | 223 | 33 | 4 | 0.8 |
| `app/domain/fixtures/floor6.ts` | **103.4** | 774 | 1 | 2 | 1 |
| `app/domain/observations.ts` | **97.2** | 322 | 29 | 1 | 0.25 |
| `app/domain/projection/index.ts` | **93** | 205 | 15 | 12 | 0.92 |

### 🧠 Top 10 Logic-Heavy Files (Cyclomatic Complexity)
| File | Max Complexity | LOC |
| :--- | :--- | :--- |
| `app/domain/countdowns.ts` | **92** | 401 |
| `app/domain/validation.ts` | **74** | 483 |
| `app/domain/projection/helpers.ts` | **68** | 218 |
| `src/application/crawler-actions.ts` | **49** | 128 |
| `app/domain/compiler.ts` | **35** | 368 |
| `src/features/inventory/ItemInspector.tsx` | **33** | 223 |
| `app/domain/observations.ts` | **29** | 322 |
| `src/CrawlerApp.tsx` | **28** | 399 |
| `src/features/inventory/equipment/EquipmentView.tsx` | **27** | 56 |
| `src/features/timeline/diagnostics/SequenceInspector.tsx` | **25** | 50 |
