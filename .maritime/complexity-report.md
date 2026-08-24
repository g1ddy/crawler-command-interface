## 🚨 Automated Complexity Report

**Last Updated:** 2026-08-24

### 🏥 Repository Health Score: **86.0 / 100**

*   **Formula**: 100 - Penalties for Files exceeding thresholds (LOC > 300, Complexity > 10, Fan-Out > 15).
*   **Total Graph Files**: 20
*   **Measured Files**: 20
*   **Unmeasured Files**: 0

### 🔥 Top 10 High-Complexity Files (Compound Score)
_Score = (LOC/10) + (Complexity*2) + (FanOut*2) + (Instability*20)_

| File | Score | LOC | Complexity | Fan-Out | Instability |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `app/domain/projection.ts` | **372.8** | 668 | 146 | 2 | 0.5 |
| `src/CrawlerApp.tsx` | **268.6** | 1735 | 27 | 12 | 0.86 |
| `app/domain/validation.ts` | **185.3** | 400 | 58 | 8 | 0.67 |
| `app/domain/compiler.ts` | **128** | 327 | 39 | 2 | 0.67 |
| `app/domain/countdowns.ts` | **125.9** | 209 | 49 | 1 | 0.25 |
| `app/components/TimelineScrubber.tsx` | **111.7** | 437 | 22 | 4 | 0.8 |
| `app/domain/fixtures/floor6.ts` | **102.2** | 762 | 1 | 2 | 1 |
| `app/domain/types.ts` | **72.6** | 706 | 1 | 0 | 0 |
| `app/domain/stats.ts` | **60.5** | 178 | 17 | 1 | 0.33 |
| `app/domain/persistence.ts` | **52** | 187 | 8 | 2 | 0.67 |

### 🧠 Top 10 Logic-Heavy Files (Cyclomatic Complexity)
| File | Max Complexity | LOC |
| :--- | :--- | :--- |
| `app/domain/projection.ts` | **146** | 668 |
| `app/domain/validation.ts` | **58** | 400 |
| `app/domain/countdowns.ts` | **49** | 209 |
| `app/domain/compiler.ts` | **39** | 327 |
| `src/CrawlerApp.tsx` | **27** | 1735 |
| `app/components/TimelineScrubber.tsx` | **22** | 437 |
| `app/domain/stats.ts` | **17** | 178 |
| `app/domain/persistence.ts` | **8** | 187 |
| `app/domain/raw-adapter.ts` | **8** | 54 |
| `app/components/ItemProvenanceDrawer.tsx` | **7** | 130 |
