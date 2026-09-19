## 🚨 Automated Complexity Report

**Last Updated:** 2026-09-19

### 🏥 Repository Health Score: **54.0 / 100**

*   **Formula**: 100 - Penalties for Files exceeding thresholds (LOC > 300, Complexity > 10, Fan-Out > 15).
*   **Total Graph Files**: 119
*   **Measured Files**: 119
*   **Unmeasured Files**: 0

### 🔥 Top 10 High-Complexity Files (Compound Score)
_Score = (LOC/10) + (Complexity*2) + (FanOut*2) + (Instability*20)_

| File | Score | LOC | Complexity | Fan-Out | Instability |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `app/domain/countdowns.ts` | **229.4** | 401 | 92 | 1 | 0.17 |
| `app/domain/validation.ts` | **228.1** | 483 | 74 | 9 | 0.69 |
| `app/domain/projection/helpers.ts` | **170.2** | 222 | 68 | 2 | 0.4 |
| `src/features/inventory/ItemInspector.tsx` | **148.1** | 246 | 46 | 7 | 0.88 |
| `src/shell/hud/PersistentHud.tsx` | **143.9** | 181 | 46 | 8 | 0.89 |
| `src/features/inventory/equipment/EquipmentView.tsx` | **143.5** | 360 | 38 | 7 | 0.88 |
| `src/application/crawler-actions.ts` | **134.8** | 128 | 49 | 4 | 0.8 |
| `app/domain/compiler.ts` | **124.1** | 368 | 35 | 2 | 0.67 |
| `src/shell/adapters/CrawlerWorkspace.tsx` | **120.9** | 339 | 15 | 19 | 0.95 |
| `src/application/crawler-session-controller.ts` | **111** | 307 | 20 | 11 | 0.92 |

### 🧠 Top 10 Logic-Heavy Files (Cyclomatic Complexity)
| File | Max Complexity | LOC |
| :--- | :--- | :--- |
| `app/domain/countdowns.ts` | **92** | 401 |
| `app/domain/validation.ts` | **74** | 483 |
| `app/domain/projection/helpers.ts` | **68** | 222 |
| `src/application/crawler-actions.ts` | **49** | 128 |
| `src/features/inventory/ItemInspector.tsx` | **46** | 246 |
| `src/shell/hud/PersistentHud.tsx` | **46** | 181 |
| `src/features/inventory/equipment/EquipmentView.tsx` | **38** | 360 |
| `app/domain/compiler.ts` | **35** | 368 |
| `src/features/inventory/equipment/equipment-presentation.ts` | **35** | 158 |
| `app/domain/observations.ts` | **29** | 325 |
