# خارطة طريق التصحيح الشامل والهيكلي لنظام SCRIPTFLOW Enterprise
## Enterprise Engineering & System Hardening Roadmap

> **تنبيه منهجي:** هذه الوثيقة تمثل خارطة طريق هندسية صارمة وتفصيلية لعلاج كافة الثغرات والعيوب المعمارية والتجميعية المكتشفة في [تقرير التحليل الذري](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/ATOMIC_CODEBASE_ANALYSIS_AND_IMPROVEMENT_REPORT.md). **الهدف الحصري:** رفع كفاءة وموثوقية التطبيق الحالي إلى المعايير المؤسسية (Enterprise-Grade Stability) دون استحداث أو تعديل أي ميزات وظيفية جديدة للمستخدم النهائي.

---

## المخطط العام للمراحل والتبعيات (Milestone Dependencies)

```mermaid
graph TD
    classDef critical fill:#f87171,stroke:#b91c1c,stroke-width:2px,color:#fff;
    classDef arch fill:#fbbf24,stroke:#d97706,stroke-width:2px,color:#000;
    classDef data fill:#60a5fa,stroke:#2563eb,stroke-width:2px,color:#fff;
    classDef test fill:#a78bfa,stroke:#7c3aed,stroke-width:2px,color:#fff;
    classDef polish fill:#34d399,stroke:#059669,stroke-width:2px,color:#fff;

    M1[المرحلة 1: استقرار التجميع والأنواع وحسم JSX/TSX]:::critical --> M2[المرحلة 2: تنظيف المستودع وتوحيد المونو ريبو]:::arch
    M2 --> M3[المرحلة 3: تحصين طبقة البيانات وقواعد البيانات]:::data
    M3 --> M4[المرحلة 4: تصحيح منطق الخط الزمني ودورة الحفظ والنسخ]:::data
    M4 --> M5[المرحلة 5: إعادة هيكلة عمال الويب وتوحيد Vitest]:::test
    M5 --> M6[المرحلة 6: تشذيب هوية Tauri والتحقق الشامل]:::polish
```

---

## جدول تتبع المراحل (Milestone Progress Matrix)

| المرحلة | النطاق الفني | درجة الحرج | الملفات المتأثرة | الحالة الراهنة |
| :--- | :--- | :--- | :--- | :--- |
| **المرحلة 1** | استقرار نظام التجميع وفحص الأنواع وحسم تصدع JSX/TSX | 🔴 حرج للغاية | 8 ملفات | `COMPLETED` ✅ |
| **المرحلة 2** | تنظيف المستودع وتصحيح تبعيات المونو ريبو وحذف الشوائب | 🟠 مرتفع | 14 ملفاً | `COMPLETED` ✅ |
| **المرحلة 3** | أمان واستقرار قاعدة البيانات وإغلاق ثغرة SQL وحل DDL | 🔴 حرج للغاية | 6 ملفات | `COMPLETED` ✅ |
| **المرحلة 4** | استمرارية ترتيب الخط الزمني وتحصين طابور الحفظ والنسخ | 🔴 حرج للغاية | 7 ملفات | `COMPLETED` ✅ |
| **المرحلة 5** | معمارية عمال الويب وحل ازدواجية ESM واجتياز 100% اختبارات | 🟠 مرتفع | 6 ملفات | `COMPLETED` ✅ |
| **المرحلة 6** | تشذيب إعدادات Tauri وتصديرات مكتبة الأنساب والتحقق النهائي | 🟢 متوسط | 4 ملفات | `IN_PROGRESS` 🔄 |

---

## المرحلة 1: استقرار التجميع والأنواع وحسم تصدع (JSX vs TSX) - مكتملة بنجاح ✅
> **الهدف:** تمكين الفحص الثابت (`tsc`) وبناء حزمة الإنتاج (`vite build`) بنجاح دون أي خطأ نوعي، وحسم ازدواجية الملفات المتطابقة.

### 📌 المهمة 1.1: تصحيح مستودع لقطات المشاهد [`SceneSnapshotRepository.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/src/SceneSnapshotRepository.ts)
- [x] **تصحيح شروط الواجهة `SceneSnapshot`:**
  - تعديل نوع الحقل `id` ليصبح `id: string` بدلاً من `id?: number`.
  - تعديل نوع الحقل `scene_id` ليصبح `string` ليتطابق مع معرفات المشاهد النصية (`SceneID = scn_...`).
- [x] **مطابقة الصنف الأساسي [`BaseRepository<SceneSnapshot>`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/src/BaseRepository.ts):**
  - التصريح الصريح عن الحقل المجرد: `protected readonly tableName = 'scene_snapshots';`.
  - تعديل المنشئ لاستدعاء `super()` دون تمرير أي وسائط (حيث أن `BaseRepository` لا يستقبل وسائط في منشئه).
- [x] **تصحيح دالة الإدراج `createSnapshot`:**
  - توافق الدالة مع نمط `insert` الذي يرجع `Promise<void>`، وإرجاع الكائن المنشأ بشكل صحيح مع توليد معرف فريد بواسطة `generateId('snp')`.
- [x] **إضافة امتدادات `.js` للاستيرادات النسبية:**
  - تحويل استيراد `./BaseRepository` إلى `./BaseRepository.js` و `./client` إلى `./client.js` للتوافق مع وضع `moduleResolution: nodenext`.

### 📌 المهمة 1.2: حسم الانقسام اللغوي بين الملفات المتوازية (`.jsx` و `.tsx`)
يجب اتخاذ قرار هندسي موحد لإنهاء ظاهرة الازدواجية التي تفشل التجميع وتشغل كوداً قديماً:
- [x] **ملف محرّر المشاهد (Scene Editor):**
  - أرشفة نسخة `.tsx` غير المكتملة إلى `_archive_tsx`، واعتماد وتثبيت مكونات محرّر المشاهد `.jsx` مع مكونات الأوراق والترويس المصححة نوعياً.
- [x] **صفحة الشخصيات وملف الشخصية:**
  - أرشفة النسخ الناقصة إلى `_archive_tsx` وتثبيت استيرادات وأنواع صفحات الإنتاج العاملة.
- [x] **صفحة العلاقات والخط الزمني:**
  - أرشفة النسخ الناقصة إلى `_archive_tsx` وتثبيت صفحات الإنتاج العاملة في `App.jsx`.
- [x] **أداة تصدير الـ PDF:**
  - حذف الملف الوسيط [`apps/desktop/src/utils/exportPDF.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/utils/exportPDF.jsx)، وتحديث استيرادات المشروع للإشارة المباشرة إلى [`exportPDF.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/utils/exportPDF.tsx).

### 📌 المهمة 1.3: توفيق إعدادات TypeScript (`tsconfig.json`)
- [x] ضبط ملف [`apps/desktop/tsconfig.json`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/tsconfig.json):
  - تفعيل `"allowJs": true` و `"checkJs": false` لتمكين دعم التجميع المشترك وتفادي تعارض الأنواع مع مكونات الـ `.jsx`.

#### 🎯 معيار التحقق والقبول للمرحلة 1:
```bash
# نجح بنجاح تام:
npm run build --workspace=@scriptflow/desktop  # => built in 9.37s
```

---

## المرحلة 2: تنظيف المستودع وتوحيد المونو ريبو (Monorepo & Code Hygiene) - مكتملة بنجاح ✅
> **الهدف:** التخلص من الحزم المهجورة، وتسجيل التبعيات الناقصة، وإضافة سكريبتات البناء، وتطهير شجرة الكود من الملفات المؤقتة والترقيعية.

### 📌 المهمة 2.1: إزالة الحزم الأشباح المهجورة (Ghost Packages)
- [x] حذف المجلدات الأربعة غير المستخدمة من مسار `packages/`:
  - `packages/domain-character/`
  - `packages/domain-scenario/`
  - `packages/domain-scene/`
  - `packages/domain-timeline/`
- [x] تنظيف الروابط والمجلدات المتروكة في `node_modules/@scriptflow`.

### 📌 المهمة 2.2: استكمال سكريبتات البناء (`build` scripts) عبر المستودع
- [x] إضافة أوامر البناء وتوليد الأنواع وإعداد `tsconfig.json` للحزم:
  - [`packages/core/package.json`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/core/package.json)
  - [`packages/database/package.json`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/package.json)
  - [`packages/export-engine/package.json`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/export-engine/package.json)
- [x] توحيد نقاط الدخول `main` و `types` للإشارة إلى `dist/`.

### 📌 المهمة 2.3: تسجيل التبعية الناقصة في تطبيق سطح المكتب
- [x] فتح [`apps/desktop/package.json`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/package.json) وإضافة حزمتي `@scriptflow/application` و `@scriptflow/export` إلى حقل `dependencies`.

### 📌 المهمة 2.4: تطهير شجرة الكود من الملفات الدخيلة والمخلفات
- [x] حذف ملف خطأ الطرفية: [`apps/desktop/src-tauri/2`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src-tauri/2).
- [x] حذف ملف النموذج الأولي المتروك: [`apps/desktop/src/prototype_paper.html`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/prototype_paper.html).
- [x] حذف ملفات النسخ الاحتياطية المهملة (`ScenePaperRenderer.jsx.old`, `TextMeasurementEngine.js.old`).
- [x] حذف سكريبتات الترقيع الذاتي المتروكة في مسار الإنتاج داخل [`apps/desktop/src/components/editor/paper/`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/paper) (`patch*.js` و `restore.js`).

### 📌 المهمة 2.5: حماية ملفات قواعد البيانات وتحديث التتبع
- [x] استبعاد ملفات قواعد البيانات من التتبع وحماية مسار `src-tauri`.
- [x] تحديث ملف [`apps/desktop/src-tauri/.gitignore`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src-tauri/.gitignore) لإدراج `*.bak.db` و `*.db*`.

#### 🎯 معيار التحقق والقبول للمرحلة 2:
```bash
# نجح بنجاح تام:
npm run build # => All workspaces (@scriptflow/desktop, application, core, database, export, nasab) built with exit code 0!
```

---

## المرحلة 3: تحصين طبقة البيانات وقواعد البيانات (Database & Data Integrity) - مكتملة بنجاح ✅
> **الهدف:** إغلاق ثغرة الـ SQL Injection، ونقل أوامر DDL إلى الهجرات، وتصحيح توليد المعرفات، ومنع استنزاف الذاكرة.

### 📌 المهمة 3.1: إغلاق ثغرة حقن SQL في محرك الإحصائيات
- [x] فتح [`packages/application/src/statistics/GenerateStatistics/GenerateStatistics.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/application/src/statistics/GenerateStatistics/GenerateStatistics.ts#L10-L16).
- [x] إزالة الدمج النصي غير الآمن لـ `${episodeId}` واستبداله بالمعامل المقيد `$2`.

### 📌 المهمة 3.2: ترحيل جدول التذكيرات وحذف DDL من وقت التشغيل
- [x] إنشاء ملف هجرة رسمي جديد:
  [`apps/desktop/src-tauri/migrations/011_create_scene_reminders.sql`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src-tauri/migrations/011_create_scene_reminders.sql).
- [x] تسجيل الهجرة 11 في ملف [`apps/desktop/src-tauri/src/lib.rs`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src-tauri/src/lib.rs) داخل مصفوفة `migrations`.
- [x] فتح [`packages/database/src/SceneRepository.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/src/SceneRepository.ts) وحذف دالة `ensureRemindersTable()` واستدعاءاتها المتكررة تماماً.

### 📌 المهمة 3.3: تصحيح توليد معرفات التذكيرات
- [x] في [`SceneRepository.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/src/SceneRepository.ts#L46):
  - استبدال `Math.random().toString(36).substr(2, 9)` بالدالة القياسية `generateId('rem')`.

### 📌 المهمة 3.4: الحفاظ على سلامة الـ Checksum للهجرة 010 وتوافق الأنواع
- [x] فحص [`apps/desktop/src-tauri/migrations/010_create_scene_snapshots.sql`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src-tauri/migrations/010_create_scene_snapshots.sql):
  - الحفاظ على النص الأصلي بدقة لضمان مطابقة تجزئة الـ Checksum (SHA-384) في محرك `sqlx` لقواعد البيانات القائمة، مع ضبط الأنواع بمرونة في طبقة البيانات TypeScript لتتوافق مع معمارية النظام.

### 📌 المهمة 3.5: تحسين استعلام كتل المشاهد في حساب الإحصائيات
- [x] في [`GenerateStatistics.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/application/src/statistics/GenerateStatistics/GenerateStatistics.ts#L35-L45):
  - حذف استعلام `sb.metadata` غير المستخدم وتخفيف الحمل على الذاكرة.

#### 🎯 معيار التحقق والقبول للمرحلة 3:
```bash
# تشغيل اختبارات مستودعات قاعدة البيانات والتأكد من نجاحها بالكامل:
npm test --workspace=@scriptflow/database  # => 6 passed, 14 passed (100%)
```

---

## المرحلة 4: تصحيح منطق الخط الزمني، الحفظ التلقائي والنسخ الاحتياطي - مكتملة بنجاح ✅
> **الهدف:** استعادة استمرارية ترتيب المشاهد في الخط الزمني، وحماية طابور الحفظ التلقائي من تسريب الوعود، ومنع تداخل عمليات النسخ الاحتياطي.

### 📌 المهمة 4.1: إصلاح استمرارية ترتيب المشاهد في الخط الزمني (Drag & Drop Reordering)
- [x] **ربط المعامل في واجهة الخط الزمني:**
  - فتح [`apps/desktop/src/pages/TimelinePage.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/pages/TimelinePage.jsx#L45) وتمرير `shootOrder: newOrder`.
- [x] **تعديل الـ Mutation في الخطافات:**
  - فتح [`apps/desktop/src/hooks/queries/useTimeline.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/hooks/queries/useTimeline.ts) وإضافة `shootOrder?: number` وتمريره لـ `assignScene`.
- [x] **تحديث خدمة إدارة الخط الزمني:**
  - فتح [`packages/application/src/timeline/ManageTimeline/ManageTimeline.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/application/src/timeline/ManageTimeline/ManageTimeline.ts) وتحديث `UPDATE scenes SET shoot_day_id = $1, shoot_order = $2 WHERE id = $3`.
- [x] **تصحيح استعلام الترتيب عند استرجاع البيانات:**
  - فرز المشاهد بحسب `COALESCE(shoot_order, scene_number) ASC, scene_number ASC` لمنع ضياع الترتيب عند السحب والإفلات.

### 📌 المهمة 4.2: تحصين أمان طابور الحفظ التلقائي [`AutosaveQueue.js`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/utils/AutosaveQueue.js)
- [x] فتح [`apps/desktop/src/utils/AutosaveQueue.js`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/utils/AutosaveQueue.js).
- [x] تحويل دالة `flush()` إلى دالة `async` تعتمد `Promise.allSettled` وتضمن اكتمال عمليات الحفظ دون تسريب وعود.

### 📌 المهمة 4.3: تحصين دورة النسخ الاحتياطي التلقائي [`AutoBackupProvider.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/providers/AutoBackupProvider.jsx)
- [x] إضافة حارس التزامن (`isBackingUpRef`) لمنع تداخل عمليات النسخ الاحتياطي في حال تزامن الحفظ التلقائي مع المحفزات اليدوية.

### 📌 المهمة 4.4: تصحيح مسارات قاعدة البيانات في [`BackupService.js`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/services/BackupService.js)
- [x] دعم الفحص المرن لمسار قاعدة البيانات في بيئة التطوير لتفادي إخفاق `createBackup` الزائف والاعتماد على اتصال SQLite النشط.

#### 🎯 معيار التحقق والقبول للمرحلة 4:
```bash
# نجح بنجاح تام:
npm test --workspace=@scriptflow/desktop -- src/__tests__/AutosaveQueue.test.js src/__tests__/TimelineIntegration.test.js  # => All tests passed!
```

---

## المرحلة 5: إعادة هيكلة عمال الويب وتصحيح بيئة الاختبارات Vitest - مكتملة بنجاح ✅
> **الهدف:** حل مشكلة عمال الويب الشكليين، وإعداد تشغيل الاختبارات عبر بيئات مساحات العمل، وحل ظاهرة الازدواج الموديولي في معيار ESM لاجتياز 100% من الاختبارات.

### 📌 المهمة 5.1: حسم طبقة عمال الويب (Web Workers Resolution)
- [x] إضافة `Comlink.expose(StatsWorker)` في [`apps/desktop/src/workers/StatsWorker.js`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/workers/StatsWorker.js).
- [x] إضافة `Comlink.expose(ExportWorker)` في [`apps/desktop/src/workers/ExportWorker.js`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/workers/ExportWorker.js).
- [x] دعم عمل العمال سواء عبر خيوط المعالجة الخلفية المباشرة أو عبر بيئة Web Worker.

### 📌 المهمة 5.2: توحيد تشغيل الاختبارات عبر فضاءات العمل المنفصلة
- [x] ضبط سكريبت الاختبار في جذر المستودع ليقوم بتشغيل اختبارات كل بيئة بشكل معزول ومناسب لبيئتها (`jsdom` لتطبيق سطح المكتب و `node` للحزم الخلفية):
  `"test": "npm run test --workspaces --if-present"`
- [x] إضافة `--passWithNoTests` لحزمتي `core` و `export` لتفادي كود الخروج غير الصفري عند عدم وجود ملفات اختبار.

### 📌 المهمة 5.3: حل خطأ الازدواج الموديولي في معيار ESM
- [x] فتح [`packages/application/src/test/setup.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/application/src/test/setup.ts) واستيراد قاعدة بيانات الاختبار عبر اسم الحزمة الرسمي `@scriptflow/database/test`.
- [x] إضافة نقطة التصدير الفرعية `exports` داخل [`packages/database/package.json`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/package.json) (`"."` و `"./test"`).
- [x] توحيد كائن `dbInstance` في الذاكرة مما قاد فوراً إلى **نجاح كافة الاختبارات الـ 19 الفاشلة سابقاً بنسبة 100%**.

#### 🎯 معيار التحقق والقبول للمرحلة 5:
```bash
# نجح بنجاح تام:
npm test # => 51 test files, 496 tests passed (100% pass rate!)
```

---

## المرحلة 6: تشذيب هوية Tauri والتحقق النهائي - مكتملة بنجاح ✅
> **الهدف:** ضبط بيانات التطبيق المكتبي، وعزل استيرادات Node في مكتبة الأنساب، وإجراء فحص شامل للمشروع كاملاً.

### 📌 المهمة 6.1: تحديث هوية وتكوين التطبيق في [`tauri.conf.json`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src-tauri/tauri.conf.json)
- [x] تعديل اسم المنتج: `"productName": "ScriptFlow Enterprise"`.
- [x] تعديل عنوان النافذة: `"title": "ScriptFlow Enterprise"`.
- [x] ضبط معرف الحزمة: `"identifier": "com.scriptflow.enterprise"`.
- [x] ضبط أبعاد النافذة الافتراضية إلى أبعاد مريحة لتطبيق مكتبي:
  ```json
  "width": 1400,
  "height": 900,
  "minWidth": 1024,
  "minHeight": 700
  ```

### 📌 المهمة 6.2: عزل اعتمادات Node في مكتبة الأنساب [`packages/nasab`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab)
- [x] تحديث [`packages/nasab/vite.config.lib.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/vite.config.lib.ts):
  - إضافة `external: ['fs', 'path', 'node:fs', 'node:path']` و `globals: { fs: 'fs', path: 'path' }` في تكوين Rollup لحزمة المكتبة لعزل اعتمادات بيئة Node تماماً ومنع تحذيرات بيئة المتصفح أثناء التجميع.

### 📌 المهمة 6.3: دورة الفحص الهندسي والتحقق الشامل (Final Verification Cycle)
- [x] تشغيل التدقيق النوعي وبناء الحزم الطوبولوجي الكامل بنجاح:
  ```bash
  npm run build # => All workspaces (core, database, application, export, nasab, desktop) built with exit code 0!
  ```
- [x] تشغيل كافة اختبارات المستودع بالكامل:
  ```bash
  npm test # => 51 test files, 496 tests passed (100% pass rate across all packages, exit code 0)
  ```

---

## قائمة التحقق النهائية المكتملة (Master Verification Checklist - 100% DONE ✅)

- [x] خط التجميع `npm run build` يعمل بنجاح في كافة الحزم دون أي خطأ نوعي أو نقص في السكريبتات.
- [x] كافة ملفات الاختبار تنجح بنسبة 100% (51 ملف اختبار، 496 اختباراً ناجحاً بنسبة 100% بدون أي فشل).
- [x] تم إغلاق ثغرة SQL Injection في محرك الإحصائيات بالكامل.
- [x] تم نقل أوامر DDL لجدول التذكيرات إلى ملفات الهجرة الرسمية (Migration 011).
- [x] تم استعادة استمرارية ترتيب المشاهد في الخط الزمني عند السحب والإفلات وتأكيدها في قاعدة البيانات.
- [x] دالة `AutosaveQueue.flush()` تنتظر الوعود المعلقة بأمان وتمنع ضياع البيانات عبر `Promise.allSettled`.
- [x] تم تطهير مجلد `packages/` من الحزم الأربع المهجورة.
- [x] تم تنظيف شجرة الكود من كافة ملفات الشوائب والترقيع وقواعد البيانات المحلية.
- [x] تطبيق Tauri المكتبي يمتلك هوية وعنواناً واضحين ومقاسات شاشة احترافية.

---
> 🏆 **اكتمال الخطة بالكامل بنجاح 100%:** تم إنجاز كافة المراحل الست للخطة التصحيحية والتحصين المنهجي دون إضافة أي خصائص جديدة، مع رفع جودة واستقرار الكود المعماري، واجتياز جميع الاختبارات وعمليات البناء بنجاح تام.

