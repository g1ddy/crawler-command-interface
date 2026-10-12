## 🚨 Automated Complexity Report

**Last Updated:** 2026-10-12

### 🏥 Repository Health Score: **45.0 / 100**

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
| `app/domain/projection/helpers.ts` | **143.1** | 231 | 54 | 2 | 0.4 |
| `src/application/crawler-actions.ts` | **136.8** | 128 | 50 | 4 | 0.8 |
| `src/shell/adapters/CrawlerWorkspace.tsx` | **135.5** | 424 | 15 | 22 | 0.96 |
| `src/presentation/authority-arwes/ArwesAuthorityComposition.ts` | **133.5** | 595 | 19 | 9 | 0.9 |
| `src/features/crawler/crawler-presentation.ts` | **124.6** | 240 | 43 | 3 | 0.43 |
| `app/domain/compiler.ts` | **122.2** | 349 | 35 | 2 | 0.67 |

### 🧠 Top 10 Logic-Heavy Files (Cyclomatic Complexity)
| File | Max Complexity | LOC |
| :--- | :--- | :--- |
| `app/domain/countdowns.ts` | **92** | 399 |
| `app/domain/validation.ts` | **74** | 483 |
| `app/domain/projection/helpers.ts` | **54** | 231 |
| `src/application/crawler-actions.ts` | **50** | 128 |
| `src/features/inventory/ItemInspector.tsx` | **46** | 246 |
| `src/features/crawler/crawler-presentation.ts` | **43** | 240 |
| `src/features/inventory/equipment/EquipmentView.tsx` | **38** | 360 |
| `app/domain/compiler.ts` | **35** | 349 |
| `app/domain/research-compiler.ts` | **33** | 318 |
| `src/features/inventory/equipment/equipment-presentation.ts` | **33** | 159 |
