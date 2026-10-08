## 🚨 Automated Complexity Report

**Last Updated:** 2026-10-08

### 🏥 Repository Health Score: **47.0 / 100**

*   **Formula**: 100 - Penalties for Files exceeding thresholds (LOC > 300, Complexity > 10, Fan-Out > 15).
*   **Total Graph Files**: 132
*   **Measured Files**: 132
*   **Unmeasured Files**: 0

### 🔥 Top 10 High-Complexity Files (Compound Score)
_Score = (LOC/10) + (Complexity*2) + (FanOut*2) + (Instability*20)_

| File | Score | LOC | Complexity | Fan-Out | Instability |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `app/domain/countdowns.ts` | **229.2** | 399 | 92 | 1 | 0.17 |
| `app/domain/validation.ts` | **227.2** | 483 | 74 | 9 | 0.64 |
| `src/features/inventory/ItemInspector.tsx` | **148.1** | 246 | 46 | 7 | 0.88 |
| `src/features/inventory/equipment/EquipmentView.tsx` | **143.5** | 360 | 38 | 7 | 0.88 |
| `app/domain/projection/helpers.ts` | **143** | 230 | 54 | 2 | 0.4 |
| `src/shell/adapters/CrawlerWorkspace.tsx` | **139.9** | 447 | 15 | 23 | 0.96 |
| `src/application/crawler-actions.ts` | **136.8** | 128 | 50 | 4 | 0.8 |
| `src/presentation/authority-arwes/ArwesAuthorityComposition.ts` | **136** | 598 | 19 | 10 | 0.91 |
| `app/domain/compiler.ts` | **124.1** | 368 | 35 | 2 | 0.67 |
| `app/domain/research-compiler.ts` | **121.8** | 318 | 33 | 2 | 1 |

### 🧠 Top 10 Logic-Heavy Files (Cyclomatic Complexity)
| File | Max Complexity | LOC |
| :--- | :--- | :--- |
| `app/domain/countdowns.ts` | **92** | 399 |
| `app/domain/validation.ts` | **74** | 483 |
| `app/domain/projection/helpers.ts` | **54** | 230 |
| `src/application/crawler-actions.ts` | **50** | 128 |
| `src/features/inventory/ItemInspector.tsx` | **46** | 246 |
| `src/features/inventory/equipment/EquipmentView.tsx` | **38** | 360 |
| `app/domain/compiler.ts` | **35** | 368 |
| `src/features/crawler/crawler-presentation.ts` | **35** | 226 |
| `src/features/inventory/equipment/equipment-presentation.ts` | **35** | 158 |
| `app/domain/research-compiler.ts` | **33** | 318 |
