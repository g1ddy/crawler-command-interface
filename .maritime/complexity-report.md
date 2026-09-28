## 🚨 Automated Complexity Report

**Last Updated:** 2026-09-28

### 🏥 Repository Health Score: **48.0 / 100**

*   **Formula**: 100 - Penalties for Files exceeding thresholds (LOC > 300, Complexity > 10, Fan-Out > 15).
*   **Total Graph Files**: 130
*   **Measured Files**: 130
*   **Unmeasured Files**: 0

### 🔥 Top 10 High-Complexity Files (Compound Score)
_Score = (LOC/10) + (Complexity*2) + (FanOut*2) + (Instability*20)_

| File | Score | LOC | Complexity | Fan-Out | Instability |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `app/domain/countdowns.ts` | **229.4** | 401 | 92 | 1 | 0.17 |
| `app/domain/validation.ts` | **227.2** | 483 | 74 | 9 | 0.64 |
| `app/domain/projection/helpers.ts` | **170.2** | 222 | 68 | 2 | 0.4 |
| `src/features/inventory/ItemInspector.tsx` | **148.1** | 246 | 46 | 7 | 0.88 |
| `src/features/inventory/equipment/EquipmentView.tsx` | **143.5** | 360 | 38 | 7 | 0.88 |
| `src/presentation/authority-arwes/ArwesAuthorityComposition.ts` | **142.1** | 681 | 19 | 9 | 0.9 |
| `src/application/crawler-actions.ts` | **134.8** | 128 | 49 | 4 | 0.8 |
| `src/shell/hud/PersistentHud.tsx` | **134.6** | 148 | 43 | 8 | 0.89 |
| `src/shell/adapters/CrawlerWorkspace.tsx` | **132.5** | 414 | 15 | 21 | 0.95 |
| `app/domain/compiler.ts` | **124.1** | 368 | 35 | 2 | 0.67 |

### 🧠 Top 10 Logic-Heavy Files (Cyclomatic Complexity)
| File | Max Complexity | LOC |
| :--- | :--- | :--- |
| `app/domain/countdowns.ts` | **92** | 401 |
| `app/domain/validation.ts` | **74** | 483 |
| `app/domain/projection/helpers.ts` | **68** | 222 |
| `src/application/crawler-actions.ts` | **49** | 128 |
| `src/features/inventory/ItemInspector.tsx` | **46** | 246 |
| `src/shell/hud/PersistentHud.tsx` | **43** | 148 |
| `src/features/inventory/equipment/EquipmentView.tsx` | **38** | 360 |
| `app/domain/compiler.ts` | **35** | 368 |
| `src/features/inventory/equipment/equipment-presentation.ts` | **35** | 158 |
| `app/domain/research-compiler.ts` | **33** | 318 |
