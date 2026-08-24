## 🚨 Automated Complexity Report

**Last Updated:** 2026-08-24

### 🏥 Repository Health Score: **86.0 / 100**

*   **Formula**: 100 - Penalties for Files exceeding thresholds (LOC > 300, Complexity > 10, Fan-Out > 15).
*   **Total Graph Files**: 19
*   **Measured Files**: 19
*   **Unmeasured Files**: 0

### 🔥 Top 10 High-Complexity Files (Compound Score)
_Score = (LOC/10) + (Complexity*2) + (FanOut*2) + (Instability*20)_

| File | Score | LOC | Complexity | Fan-Out | Instability |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `app/domain/projection.ts` | **372.8** | 668 | 146 | 2 | 0.5 |
| `src/CrawlerApp.tsx` | **262.7** | 1698 | 27 | 11 | 0.85 |
| `app/domain/validation.ts` | **186.5** | 400 | 58 | 8 | 0.73 |
| `app/domain/compiler.ts` | **128** | 327 | 39 | 2 | 0.67 |
| `app/domain/countdowns.ts` | **125.9** | 209 | 49 | 1 | 0.25 |
| `app/components/TimelineScrubber.tsx` | **111.7** | 437 | 22 | 4 | 0.8 |
| `app/domain/fixtures/floor6.ts` | **102.2** | 762 | 1 | 2 | 1 |
| `app/domain/types.ts` | **72.6** | 706 | 1 | 0 | 0 |
| `app/domain/stats.ts` | **60.5** | 178 | 17 | 1 | 0.33 |
| `app/chatgpt-auth.ts` | **44.7** | 87 | 6 | 2 | 1 |

### 🧠 Top 10 Logic-Heavy Files (Cyclomatic Complexity)
| File | Max Complexity | LOC |
| :--- | :--- | :--- |
| `app/domain/projection.ts` | **146** | 668 |
| `app/domain/validation.ts` | **58** | 400 |
| `app/domain/countdowns.ts` | **49** | 209 |
| `app/domain/compiler.ts` | **39** | 327 |
| `src/CrawlerApp.tsx` | **27** | 1698 |
| `app/components/TimelineScrubber.tsx` | **22** | 437 |
| `app/domain/stats.ts` | **17** | 178 |
| `app/domain/raw-adapter.ts` | **8** | 54 |
| `app/components/ItemProvenanceDrawer.tsx` | **7** | 130 |
| `app/chatgpt-auth.ts` | **6** | 87 |
