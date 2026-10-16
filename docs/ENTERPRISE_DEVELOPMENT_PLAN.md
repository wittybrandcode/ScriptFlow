# خطة التطوير والتحديث الفنية المنظمة — ScriptFlow Enterprise 🛠️
*(خطة عمل هندسية مرحلية مع نظام تتبع التطور والتنفيذ `[ ]`)*

---

## 🎯 الأهداف الإستراتيجية (Strategic Engineering Goals)

1. **التحول الكامل إلى TypeScript الصارم:** تحويل كافة مكونات وملفات `apps/desktop/src` من `.jsx` / `.js` إلى `.tsx` / `.ts` لضمان سلامة الأنواع (Type-Safety) عبر كل الطبقات.
2. **تفكيك المكونات الأحادية الضخمة (Monolith Refactoring):** إعادة بناء المكونات المعقدة (`SceneEditor`, `PaperEditor`, `CharacterProfilePage`) إلى مكونات متخصصة ومصغرة مع استخراج الـ Hooks.
3. **توحيد ومأسسة إدارة الحالة (State Management Standardization):** الاعتماد الكلي والمنسق على `@tanstack/react-query` ومتاجر Zustand المتخصصة.
4. **تقوية المحركات الأساسية والخيوط الخلفية (Engine & Worker Hardening):** رفع اعتمادية Web Workers ومحرك القياس وصيغة التصدير `.sflow`.
5. **تثبيت منظومة الاختبارات الأوتوماتيكية (Automated Testing Suite):** رفع تغطية الاختبارات لـ Unit Tests و Integration Tests فوق 85%.
6. **معالجة واستقرار تشغيل النظام (Runtime Stability & Exception Resolution):** إصلاح صلاحيات Tauri Scope وأخطاء إغلاق SQLite والنسخ التلقائي.

---

## 🗺️ خارطة الطريق والمهام التفصيلية (Implementation Roadmap)

### 📌 المرحلة 1: التحول الكامل إلى TypeScript وسلامة الأنواع (TypeScript & Type Safety Migration)

- [x] **1.1 تهيئة بيئة TypeScript في تطبيق سطح المكتب (`apps/desktop`):**
  - [x] تحديث `tsconfig.json` لتفعيل الخيارات الصارمة (`strict: true`, `noImplicitAny: true`).
  - [x] ربط أنواع الأنظمة بين الحزم المكونية (`@scriptflow/core`, `@scriptflow/database`) والواجهة.

- [x] **1.2 تحويل محركات التحرير والقياس (Editor & Measurement Engine):**
  - [x] تحويل `TextMeasurementEngine.js` إلى `TextMeasurementEngine.ts` مع تحديد أنواع الـ LayoutNodes والـ Grid.
  - [x] تحويل `bridge.js` إلى `bridge.ts` مع تحديد صريح لأنواع ProseMirror AST و SQLite ScriptBlocks.
  - [x] تحويل `PaperEditor.jsx` والمكونات التابعة إلى `PaperEditor.tsx`.

- [x] **1.3 تحويل محرك الطباعة والـ PDF (Export & Print Engine):**
  - [x] تحويل `exportPDF.jsx` إلى `exportPDF.tsx`.
  - [x] تحويل `ScenePaperRenderer.jsx` إلى `ScenePaperRenderer.tsx`.
  - [x] تحويل مكونات الـ PDF (`PageFooter.jsx`, `SceneCoverPage.jsx`, `CallSheetPage.jsx`) إلى TypeScript.

- [x] **1.4 تحويل صفحات النظام الرئيسية (Main UI Pages):**
  - [x] تحويل `SceneEditor.jsx` إلى `SceneEditor.tsx`.
  - [x] تحويل `CharacterProfilePage.jsx` و `CharactersPage.jsx` إلى TypeScript.
  - [x] تحويل `RelationshipsPage.jsx` ومكونات `@xyflow/react` الخاصة إلى TypeScript.
  - [x] تحويل `TimelinePage.jsx` وعروض الجدولة الأربعة إلى TypeScript.

---

### 📌 المرحلة 2: إعادة هيكلة وتفكيك المكونات الضخمة (Monolithic Refactoring)

- [x] **2.1 تفكيك محرر المشاهد الرئيسي (`SceneEditor.jsx`):**
  - [x] استخراج شريط الأدوات والتنقل إلى `SceneEditorTopBar.tsx`.
  - [x] استخراج لوحة الملاحظات والمهام الجانبية إلى `SceneEditorSidebar.tsx`.
  - [x] إنشاء Custom Hook لإدارة التنقل والتحميل: `useSceneEditorState.ts`.

- [x] **2.2 تفكيك محرر الورق (`PaperEditor.jsx`):**
  - [x] فصل شريط التنسيق العائم `FloatingToolbar` في ملف مستقل `FloatingToolbar.tsx`.
  - [x] فصل شريط إضافة العقد الذكي `GutterSmartAdder` وتحديث أنواعه.
  - [x] إنشاء Custom Hook للتحكم في اختصارات لوحة المفاتيح: `useEditorShortcuts.ts`.

- [x] **2.3 تفكيك صفحة العلاقات والمؤشرات (`RelationshipsPage.jsx` & `AnalyticsWidgets.jsx`):**
  - [x] استخراج منطق رسم وتحديث العلاقات إلى Hook مستقل: `useRelationshipFlow.ts`.
  - [x] تفكيك `AnalyticsWidgets.jsx` المكون من أكثر من 600 سطر إلى مكونات تحليلية فرعية مستقلة (`RhythmDNAWidget.tsx`, `ProductionDensityWidget.tsx`).

---

### 📌 المرحلة 3: توحيد إدارة الحالة وقواعد البيانات (State & Database Standardization)

- [x] **3.1 توحيد الاستعلامات عبر React Query (`@tanstack/react-query`):**
  - [x] مراجعة كافة Stale Times و Cache Keys في `apps/desktop/src/hooks/queries/`.
  - [x] إنشاء Mutation Hooks موحدة للكتل النصية (`useUpdateScriptBlockMutation`, `useDeleteScriptBlockMutation`).

- [x] **3.2 تحسين أداء SQLite وقواعد البيانات المحلي:**
  - [x] مراجعة الفهارس (Indexes) في ملفات الهجرة والتأكد من تحسين استعلامات `JOIN` بين الكتل والمشاهد والحلقات.
  - [x] إضافة آلية فحص سلامة اتصالات SQLite في بيئة Tauri Rust backend (`lib.rs`).

---

### 📌 المرحلة 4: تقوية المعالجة الموازية والـ Workers (Worker & Export Resilience)

- [x] **4.1 رفع معايير الأمان للـ Web Workers (`apps/desktop/src/workers/`):**
  - [x] إدراج حاجز أخطاء (Error Boundary) في `ExportWorker.js` لإرجاع استجابات منظمة عند فشل الـ Worker.
  - [x] دعم قياس النصوص البديل (Fallback Canvas Measurement) في الأجهزة التي لا تدعم `OffscreenCanvas`.

- [x] **4.2 تطوير حزمة وحافظة التصدير `.sflow` (`packages/export-engine`):**
  - [x] إضافة التحقق الهيكلي بـ Zod Schema لملف `project.json` أثناء الاستيراد لمنع انهيار البرنامج عند قراءة حزم سابقة.
  - [x] دعم الضغط الموازي للصورة والفيديو داخل أرشيف الـ ZIP عبر الـ Worker.

---

### 📌 المرحلة 5: الاختبارات الأوتوماتيكية وجودة الكود (Automated Testing & Quality)

- [x] **5.1 اختبارات الوحدات (Unit Tests - Vitest):**
  - [x] كتابة اختبارات شاملة لحزمة النسب والمواريث (`packages/nasab`) لتغطية حالات العلاقات المعقدة والتركات.
  - [x] كتابة اختبارات لمحرك الترقيم (`paginationCalculator.test.ts`) لضمان صحة حسابات الأغلفة والصفحات.
  - [x] كتابة اختبارات لحزمة الاستنساب (`CloneScene.test.ts`).

- [x] **5.2 اختبارات التكامل والتصحيح (Integration & End-to-End Tests):**
  - [x] إعداد سيناريوهات اختبار Playwright / Vitest لاختبار الدورة الكاملة: (إنشاء مشهد ⬅ إضافة حوارات ⬅ تفكيك ⬅ تصدير PDF و .sflow).

---

### 📌 المرحلة 6: معالجة واستقرار تشغيل النظام والتحذيرات اللحظية (Runtime Diagnostics & Bug Fixing)

- [x] **6.1 معالجة نطاق صلاحيات النسخ التلقائي (Tauri Capability Scope for AutoBackup):**
  - [x] **سبب الخلل:** حظر مسار `apps/desktop/src-tauri/scriptflow.db` أثناء عملية النسخ التلقائي (`BackupService.js`) بسبب قيود النطاق الافتراضية لملف الصلاحيات `capabilities/default.json`.
  - [x] **الحل البرمجي:** تمديد نطاق صلاحيات الملفات `fs:scope` في `apps/desktop/src-tauri/capabilities/default.json` لتشمل مسار التطبيق ومسارات قواعد البيانات، وتغليف فحص الملف بالـ Fallback Safe Copy.

- [x] **6.2 إصلاح خطأ استرجاع المعاملات (SQLite Rollback Exception):**
  - [x] **سبب الخلل:** فشل تنفيذ `ROLLBACK` ورسالة `cannot rollback - no transaction is active` في `packages/database/src/client.ts` عند حدوث خطأ أثناء بدء المعاملة نفسها (`BEGIN TRANSACTION`).
  - [x] **الحل البرمجي:** إضافة متغيّر تتبع لحالة المعاملة `transactionBegan` لضمان عدم استدعاء `ROLLBACK` إلا إذا تم بدء المعاملة بنجاح فقط.

- [x] **6.3 تدارك انغلاق قاعدة البيانات (Database Lock Mitigation in WAL Mode):**
  - [x] **سبب الخلل:** ظهور خطأ `database is locked (code: 5)` أثناء تنقلات الصفحات مثل `Insights.jsx` بسبب استعلامات متوازية تنافسية بدون تفعيل وضع الكتابة الموازية والانتظار.
  - [x] **الحل البرمجي:** تفعيل وضع `PRAGMA journal_mode = WAL;` و `PRAGMA synchronous = NORMAL;` ورفع زمن الانتظار `PRAGMA busy_timeout = 5000;` وزيادة المحاولات في `client.ts` إلى 12 محاولة بـ backoff متزايد.

---

## 📊 نظام متابعة نسبة الإنجاز (Progress Tracker)

| المرحلة | نسبة الإنجاز | المهام المكتملة / الإجمالي | الحالة الحالية |
| :--- | :---: | :---: | :---: |
| **المرحلة 1: تحول TypeScript** | `100%` | 12 / 12 | ✅ مكتملة بالكامل |
| **المرحلة 2: تفكيك المكونات** | `100%` | 8 / 8 | ✅ مكتملة بالكامل |
| **المرحلة 3: توحيد الحالة وقواعد البيانات** | `100%` | 4 / 4 | ✅ مكتملة بالكامل |
| **المرحلة 4: تقوية المحركات والـ Workers** | `100%` | 4 / 4 | ✅ مكتملة بالكامل |
| **المرحلة 5: الاختبارات الأوتوماتيكية** | `100%` | 5 / 5 | ✅ مكتملة بالكامل |
| **المرحلة 6: معالجة التشغيل والتحذيرات** | `100%` | 3 / 3 | ✅ مكتملة بالكامل |
| **الإجمالي الكلي للمشروع** | **`100%`** | **36 / 36** | 🎉 مكتمل ومحصن بالكامل |

---

> [!NOTE]
> يتم تحديث علامات التتبع `[x]` والمصفوفة أعلاه دورياً عند إنجاز كل مهمة تقنية في الكود المصدري.
