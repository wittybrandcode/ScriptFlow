# 🔬 PROTOCOL: OMEGA-LEVEL SYSTEM ANALYSIS & MICROSCOPIC AUDIT
**[SYSTEM DIRECTIVE]**: This protocol constitutes a rigorous, multi-layered algorithmic reasoning engine. When supplied with a Target System, the AI must execute a deep-dive, atomic inspection across all architectural layers (Frontend, IPC, Backend, Storage) to uncover latent bugs, race conditions, memory leaks, silent failures, and boundary anomalies.

---

## 🛑 PHASE 1: BOUNDARY & IPC PENETRATION (Tauri ↔ React)
*Analyze the communication bridge and OS-level security constraints.*
1.  **Payload Serialization Overheads:** How is data transmitted across the Tauri IPC bridge? Are large binaries (images/videos) being serialized as Base64 (causing OOM), or are they passed via raw byte arrays / `convertFileSrc`?
2.  **Capability & FS Scope Violations:** Does the system write/read to directories outside the explicit Tauri `fs scope`? Are dynamic paths sanitized against path traversal (`../`) and forbidden OS characters?
3.  **Cross-OS Path Normalization:** Are hardcoded slashes (`/` or `\`) used instead of OS-agnostic path builders? How does the system handle Arabic/RTL characters and spaces in file paths?
4.  **IPC Deadlocks:** Are synchronous Tauri commands blocking the React main thread? Are asynchronous commands properly awaited with `try/catch` boundaries?

## 🧠 PHASE 2: CONCURRENCY, LIFECYCLE & STATE MUTATION (React / Zustand / Query)
*Deconstruct state management, memory allocation, and render cycles.*
1.  **Race Conditions & Promise Invalidation:** If a user triggers an async action (e.g., uploading an image) and rapidly unmounts the component, does the system attempt to update unmounted state (Memory Leak)?
2.  **Stale Closures & Dependency Arrays:** Are React Hooks capturing stale state? Are `useEffect` dependencies comprehensive, or do they trigger infinite re-render avalanches?
3.  **Cache Invalidation Flaws:** If using TanStack Query or Zustand, does a mutation in one system (e.g., changing a location name) immediately invalidate and refetch related data, or does the UI display stale artifacts?
4.  **Debounce/Throttle Collisions:** In systems like `AutosaveQueue`, what happens if the user spams inputs? Are pending timers correctly cleared?

## 💽 PHASE 3: PERSISTENCE, ATOMICITY & REFERENTIAL INTEGRITY (SQLite & FS)
*Audit data integrity, transaction safety, and orphan management.*
1.  **Orphan Generation (Dangling Pointers):** When a record (e.g., Shooting Location) is deleted from SQLite, does the system physically delete the associated media file from the disk? Or does the disk slowly bloat with orphaned files?
2.  **Transaction Atomicity:** Are multi-step database writes wrapped in atomic transactions? If step 2 fails, does step 1 rollback, or does the database enter a corrupted, half-written state?
3.  **WAL Mode & Lock Contention:** Does the system encounter `SQLITE_BUSY` errors during rapid parallel writes? Is there a Mutex/Queue (like `writeQueue`) handling concurrent DB access?
4.  **Cascade Failures:** Are `PRAGMA foreign_keys = ON` strictly enforced to ensure cascading deletes?

## ⚙️ PHASE 4: COMPUTATION & RENDERING PIPELINE (Workers, Canvas, DOM)
*Inspect computational bottlenecks and rendering heuristics.*
1.  **Main-Thread Hijacking:** Are heavy computations (e.g., PDF generation, Zipping, Kinship Graph traversal) blocking the UI thread? Are they properly offloaded to Web Workers via `Comlink`?
2.  **Worker Cloning Overhead:** Is the data passed to Web Workers too large (causing massive `structuredClone` overhead)? Are `ArrayBuffer` objects transferred via ownership rather than copied?
3.  **Layout Thrashing & Virtualization:** Does the system trigger excessive browser reflows (Layout Thrashing)? For large lists (e.g., Timeline, Script Blocks), is DOM virtualization active?

## 🧪 PHASE 5: EXTREME EDGE-CASE MATRIX (Chaos Injection)
*Simulate catastrophic and highly improbable states.*
1.  **The Zero-Byte & Corrupt Payload:** What happens if the user uploads a 0-byte image or a corrupted file masquerading as a `.png`?
2.  **Maximum Thresholds:** Inject 100,000 characters into a single text block. Inject 50MB files into the upload queue. Does the system throw a handled error, or does it crash?
3.  **Type Coercion Anomalies:** What happens if SQLite returns `null` for a field expected to be an array? Does the UI crash with `Cannot read properties of null`, or is there a safe fallback (`?? []`)?

---

**[EXECUTION DIRECTIVE]**: 
Upon receiving the target system name, the AI will bypass standard summaries and immediately output a **Vulnerability & Flaw Matrix** categorizing every discovered issue according to the 5 phases above, followed by **Atomic Surgical Solutions** for each flaw.

## 📝 PHASE 6: REPORT GENERATION & DOCUMENTATION
*Preserve the analysis outcomes for architectural tracking.*
After the complete execution of the analysis and the implementation of atomic surgical solutions, the AI **MUST** write a comprehensive markdown report.
- **Location:** The report must be saved inside a dedicated reports directory: `docs/analysis_reports/`
- **Naming Convention:** `[System_Name]_analysis_report.md` (e.g., `media_storage_analysis_report.md`)
- **Content:** The report must encompass the vulnerability matrix, the fixes applied, the files modified, and any lingering architectural warnings.
