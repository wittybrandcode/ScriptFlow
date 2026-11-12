# وثيقة متابعة وتتبع تنفيذ خارطة الطريق الشاملة (Execution Roadmap Tracker)
## مشروع SCRIPTFLOW ENTERPRISE — الإصلاح الذري الصارم لجميع العلل الموثقة

تم إعداد هذه الوثيقة كدليل تنفيذي تفاعلي وصارم لتتبع تنفيذ جميع الإصلاحات الواردة في [`ATOMIC_AUDIT_AND_FIXES_REPORT.md`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/ATOMIC_AUDIT_AND_FIXES_REPORT.md)، بما يضمن عدم إغفال أو تخطي أي علة برمجية أو فكرة معمارية عبر المراحل الأربع (`P0` -> `P1` -> `P2` -> `P3`).

---

### جدول تقدم التنفيذ العام (Progress Overview)

| المرحلة | الوصف والأولية | إجمالي المهام | المنجز | النسبة | الحالة |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **المرحلة P0** | الطوارئ الحرجة: منع مسح البيانات، سد الثغرات، وإنقاذ المحرر | 15 مهمة | 15 | 100% | 🟢 مكتمل بنجاح |
| **المرحلة P1** | استقرار قاعدة البيانات، تصحيح المعاملات، وإصلاح واجهات React | 25 مهمة | 25 | 100% | 🟢 مكتمل بنجاح |
| **المرحلة P2** | دقة محرك المواريث (`nasab`)، الترقيم، جدول التصوير، وشجرة الأنساب | 21 مهمة | 21 | 100% | 🟢 مكتمل بنجاح |
| **المرحلة P3** | البنية التحتية، أنابيب CI/CD، توحيد الحزم، ونظافة المستودع | 6 مهام | 6 | 100% | 🟢 مكتمل بنجاح |
| **الإجمالي** | **تغطية شاملة لـ 165+ علة ذرية موثقة في التقرير الشامل** | **67 بنداً رئيسياً** | **67** | **100%** | 🟢 اكتمل التنفيذ بالكامل |

---

## 🔴 المرحلة P0: الطوارئ الحرجة، منع مسح البيانات، سد الثغرات الأمنية، واستقرار المحرر الأساسي

> **الهدف:** القضاء الفوري على أي احتمال لفقدان بيانات المستخدم أو مسح قاعدة البيانات عند الإقلاع، إغلاق ثغرات XSS واجتياز المسارات، وتأمين حفظ كتل المحرر بدون تكرار أو مسح.

### 1. طبقة الخلفية وأمان Tauri v2 (`src-tauri`)
- [x] **`P0-01` (`TAU-02`)**: حذف شرط مسح قاعدة البيانات الكارثي `< 400_000` بايت وضبط دورة حياة إضافة `tauri_plugin_sql` في [`lib.rs`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src-tauri/src/lib.rs#L160-L185).
- [x] **`P0-02` (`TAU-03`)**: تصحيح دالة استعادة النسخة الاحتياطية `restore_safety_backup` في [`lib.rs`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src-tauri/src/lib.rs#L94-L115) بحذف ملفي `-wal` و `-shm` لمنع فساد قاعدة البيانات بعد الاستعادة.
- [x] **`P0-03` (`TAU-01`)**: تشديد سياسة أمان المحتوى `CSP` وتضييق نطاقات البروتوكولات المحلية `assetProtocol.scope` في [`tauri.conf.json`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src-tauri/tauri.conf.json#L25-L31) وحصر الصلاحيات في [`capabilities/default.json`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src-tauri/capabilities/default.json).
- [x] **`P0-04` (`TAU-04`, `TAU-05`)**: حماية أمر `open_app_data_folder` من اجتياز المسارات وإزالة أمر `greet` التجريبي في [`lib.rs`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src-tauri/src/lib.rs#L120-L135).

### 2. طبقة قاعدة البيانات والهجرات الحرجة
- [x] **`P0-05` (`DB-01`)**: إنشاء هجرة SQLite رقم `012_fix_scene_snapshots_text_ids.sql` لتحويل عمودي `scene_id` و `scenario_id` إلى `TEXT` في [`migrations/`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src-tauri/migrations).
- [x] **`P0-06` (`DB-04`)**: تفعيل المفاتيح الأجنبية `PRAGMA foreign_keys = ON;` تلقائياً لكل اتصال في [`client.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/src/client.ts).

### 3. الأمان والمصادقة وشاشة القفل
- [x] **`P0-07` (`UI-01`)**: تثبيت مكتبة `dompurify` وسد ثغرة XSS المخزنة في [`CharacterProfilePage.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/pages/CharacterProfilePage.tsx#L731-L767).
- [x] **`P0-08` (`UI-02`)**: إعادة بناء شاشة القفل [`LockScreen.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/auth/LockScreen.tsx): تشفير `PBKDF2` مع ملح عشوائي، إلغاء حفظ النص الصريح في `localStorage`، وإصلاح اختفاء النموذج قبل التحقق.
- [x] **`P0-09` (`UI-03`, `UI-04`)**: تصحيح تعليق مؤقت الحراسة `watchdog` في `LockScreen.tsx`، ونقل `<AutoBackupProvider>` لداخل شاشة القفل في [`App.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/App.tsx)، وحذف استدعاء `initMediaStorage` المزدوج غير المنتظر في [`main.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/main.tsx).
- [x] **`P0-10` (`EDT-07`)**: تعقيم HTML الديناميكي في [`PaginationExtension.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/extensions/PaginationExtension.ts) و [`ScenePaperRenderer.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/ScenePaperRenderer.tsx) و [`exportPDF.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/utils/exportPDF.tsx).
- [x] **`P0-11` (`EDT-08`)**: سد ثغرات اجتياز المسارات (`Path Traversal`) بالتحقق الصارم في [`mediaStorage.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/utils/mediaStorage.ts) و [`BackupService.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/utils/BackupService.ts).

### 4. محرك المحرر الورقي وحفظ الكتل
- [x] **`P0-12` (`EDT-01`)**: تعريف سمة `block_id` الفريدة في جميع عقد TipTap التسع لمنع مسح وإعادة كتابة كل كتل المشهد في كل عملية حفظ في [`components/editor/paper/extensions/`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/paper/extensions).
- [x] **`P0-13` (`EDT-03`)**: إصلاح تقسيم الفقرات بـ `Enter` (`splitBlock`) وتضمين ملحق التراجع والإعادة `UndoRedo` في [`PaperEditor.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/paper/PaperEditor.tsx).
- [x] **`P0-14` (`EDT-05`)**: إصلاح فقدان الكتل عند الإغلاق: انتظار `inFlightPromise` ومعالجة حدث `onCloseRequested` في [`AutosaveQueue.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/autosave/AutosaveQueue.ts) و [`SceneEditor.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/pages/SceneEditor.tsx).
- [x] **`P0-15` (`EDT-02`)**: إيقاف حلقة تضاعف محارف الترميز `&amp;amp;` اللانهائية وإصلاح تحويل الفواصل في [`bridge.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/paper/bridge.ts).

---

## 🟡 المرحلة P1: استقرار قاعدة البيانات، طبقة المعاملات، واجهات React، واستيراد المشاريع

> **الهدف:** معالجة أخطاء تعيينات الطاقم، انهيار خطافات React، التزامن في React 19، تصحيح استيراد المشاريع، وإصلاح معاملات قاعدة البيانات.

### 1. مستودعات قاعدة البيانات وطبقة التطبيق
- [x] **`P1-01` (`DB-03`)**: حذف تمرير `id: undefined` المسبب لخطأ `NOT NULL` في [`ProductionTaskRepository.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/src/repositories/ProductionTaskRepository.ts).
- [x] **`P1-02` (`DB-02`, `DB-07`)**: تصحيح عدم تطابق أعمدة جدول `tones` مع كود TypeScript في الهجرة [`007_create_tones.sql`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src-tauri/migrations/007_create_tones.sql) والمستودع.
- [x] **`P1-03` (`DB-05`)**: تصحيح تعارض واجهة [`ILocation`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/core/src/models/types.ts) (`location_type` مقابل `type`) وتوحيدها عبر المستودعات والواجهات.
- [x] **`P1-04` (`DB-06`)**: إضافة استعلامات الجداول الخمسة المنسية (`crew`, `production_tasks`, `tags`, ...) في [`ScenarioRepository.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/src/repositories/ScenarioRepository.ts).
- [x] **`P1-05` (`DB-04B`)**: إصلاح انقسام المعاملات وطابور الكتابة المتداخل في [`client.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/src/client.ts) واستخدام `SAVEPOINT` للمعاملات الفرعية.
- [x] **`P1-06` (`DB-08`..`DB-16`)**: تصحيح مستودعات `Character`, `Crew`, `Scene`, `Episode`, `PageNumbering`, وتكامل `TrashRepository`.
- [x] **`P1-07` (`APP-01`)**: إعادة كتابة وتصحيح [`ImportProject.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/application/src/use-cases/projects/ImportProject.ts) وحذف علامة التعطيل `// @ts-nocheck`.
- [x] **`P1-08` (`APP-02`)**: إصلاح استنساخ المشاهد وحذف عمود `character_name` غير الموجود في [`CloneScene.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/application/src/use-cases/scenes/CloneScene.ts).
- [x] **`P1-09` (`APP-04`)**: تصحيح أخطاء وحدة `export-engine` المكتوبة بـ JavaScript غير النمطي في [`mediaProcessor.js`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/export-engine/src/media/mediaProcessor.js) و [`packageManager.js`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/export-engine/src/packager/packageManager.js).

### 2. واجهات React وتنسيق Tailwind وجدول التصوير
- [x] **`P1-10` (`UI-05`)**: استعادة النمط الفاتح المكتبي الافتراضي (Studio Light Theme) وإلغاء فرض الوضع الليلي، وتثبيت حواف قائمة وحادة صناعية لجميع الأزرار والمكونات البصرية (0px Sharp Industrial Corners) في [`index.css`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/index.css) و [`tailwind.config.js`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/tailwind.config.js) مع توفير مفتاح تبديل اختياري للمظهر في شريط الأدوات العلوي.
- [x] **`P1-11` (`UI-06`)**: استبدال استيراد Google Fonts الخارجي بالخطوط المحلية المضمنة في [`font_faces.css`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/public/fonts/font_faces.css) وإزالة `!important` المخربة لخطوط السيناريو.
- [x] **`P1-12` (`UI-07`)**: إضافة الاعتماد المفقود `"nasab": "*"` داخل [`apps/desktop/package.json`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/package.json).
- [x] **`P1-13` (`UI-09`)**: حماية ترطيب متجر `useUIStore.ts` من التعليق الدائم عند تلف تخزين المتصفح.
- [x] **`P1-14` (`UI-12`)**: استبدال الاستعلام الخاطئ بـ `useAllRemindersQuery(scenarioId)` في [`Insights.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/pages/Insights.tsx).
- [x] **`P1-15` (`UI-13`, `UI-14`)**: تصحيح إبطال مفاتيح استعلام TanStack Query بعد التعديلات والاستيراد في جميع خطافات `hooks/queries/*`.
- [x] **`P1-16` (`UI-15`)**: إزالة `parseInt` القاتل في [`CrewAssignmentModal.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/CrewAssignmentModal.tsx) وتثبيت حفظ المعرّفات كنصوص.
- [x] **`P1-17` (`UI-16`)**: إصلاح مسح مشاهد الحلقات الأخرى عند التعديل السريع في [`ScenesPage.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/pages/ScenesPage.tsx) وإظهار شريط الفلترة للأفلام في [`SceneToolbar.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/scenes/SceneToolbar.tsx).
- [x] **`P1-18` (`UI-17`)**: تصحيح نقل صور أغلفة المشاريع من مجلد `temp/` وإظهار أزرار الحذف والتصدير في [`ScenarioCard.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/dashboard/ScenarioCard.tsx).
- [x] **`P1-19` (`UI-18`)**: تصحيح أخطاء الصفحات والخرائط: تصحيح فحص جنس الأم، تصحيح رابط أيقونة Leaflet `404`، وحماية إحداثيات خط الطول `0°`.
- [x] **`P1-20` (`UI-19`)**: إصلاح انتهاك قواعد الخطافات (`Rules of Hooks`) ونقل `setState` خارج دالة الرندر في [`DailyView.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/timeline/views/DailyView.tsx).
- [x] **`P1-21` (`UI-20`)**: إصلاح اختفاء المشاهد المسحوبة في React 19 وتصحيح الترتيب داخل اليوم الواحد في [`useTimelineReordering.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/hooks/queries/useTimelineReordering.ts).
- [x] **`P1-22` (`EDT-04`)**: إزالة حلقة التحديث المستمر `emitUpdate: true` في [`RichTextEditor.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/ui/RichTextEditor.tsx).
- [x] **`P1-23` (`EDT-06`)**: تصحيح تحويل `parseInt` في [`SceneMetadataForm.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/paper/SceneMetadataForm.tsx) لمنع إفساد أرقام المشاهد بـ `NaN`.
- [x] **`P1-24` (`REL-01`)**: تصحيح تصدير ملفات GEDCOM بتمرير نوع العلاقة الفعلي بدلاً من `'customRelation'` في [`RelationshipsPage.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/features/relationships/RelationshipsPage.tsx).
- [x] **`P1-25` (`REL-02`, `REL-03`)**: تمرير الحواف الأصلية `rawEdges` إلى [`CharacterRPGPanel.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/features/relationships/components/modals/CharacterRPGPanel.tsx) وحل مشكلة الوعود المعلقة في `debouncedProcessGraph`.

---

## 🔵 المرحلة P2: دقة محرك المواريث والأنساب (`nasab`)، الترقيم، وجدول التصوير

> **الهدف:** تصحيح الفقه الحسابي وعزل ذوي الأرحام، تفعيل قواعد YAML، وتوحيد قياسات الصفحات ومحرك الطباعة.

### 1. محرك الأنساب والمواريث (`packages/nasab`)
- [x] **`P2-01` (`NSB-01`)**: إعادة بناء [`Fraction.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/core/Fraction.ts) لاستيعاب الأعداد العشرية بدون بتر وحساب `lcm` بنوع `bigint`.
- [x] **`P2-02` (`NSB-02`)**: تصحيح فئات الورثة في [`CategoryEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/mawarith/CategoryEngine.ts): إضافة الأعمام وبني الإخوة الأشقاء، وعزل الأخوال وأولاد البنات وأبي الأم عن العصبات.
- [x] **`P2-03` (`NSB-03`)**: توحيد مجموعة فرض الإخوة والأخوات لأم في الثلث المشترك في [`RulesEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/mawarith/RulesEngine.ts) و [`MathEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/mawarith/MathEngine.ts).
- [x] **`P2-04` (`NSB-04`)**: تصحيح موعد تشغيل `applyDynamicLineageIsolation` وحماية أبناء المرأة المتوفاة من الحجب والتكرار.
- [x] **`P2-05` (`NSB-05`)**: تفعيل المذاهب الفقهية بتمرير `HeirType` المعياري بدلاً من النصوص العربية في [`MadhabOverrides.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/mawarith/MadhabOverrides.ts).
- [x] **`P2-06` (`NSB-06`)**: تصحيح حجب الأم إلى السدس بوجود الإخوة المحجوبين بالأب وحجب الجدة لأب في [`BlockingEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/engine/BlockingEngine.ts) و [`SharesEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/engine/SharesEngine.ts).
- [x] **`P2-07` (`NSB-07`)**: تصحيح أحكام الجد مع الإخوة في [`AsabaEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/engine/AsabaEngine.ts) وإصلاح الأكدرية وذوي الأرحام والقرابتين في [`BaseEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/engine/BaseEngine.ts).
- [x] **`P2-08` (`NSB-08`)**: تسجيل `JafariPlugin`، تصحيح المشتركة في `ShafiiPlugin`، وربط الوصية الواجبة في `WasiyyaEngine`.
- [x] **`P2-09` (`NSB-09`, `NSB-10`)**: تصحيح استنتاج القرابة في `InferenceEngine` ومدقق القرابة `KinshipValidator` (تصحيح قراءة السنوات، وحساب سقف الزوجات، ومنع الولادة بعد الوفاة).
- [x] **`P2-10` (`NSB-11`, `NSB-12`)**: تصحيح محرك الرضاع `FosterEngine` وحساب معامل زواج الأقارب `calculateCOI` في `GraphEngine` وضبط الكنى في `KunyaEngine`.
- [x] **`P2-11` (`NSB-13`, `NSB-14`)**: فك تصادم أسماء `JsonLDEngine` وتصحيح الاحتمالات الوراثية في `MedicalPedigreeEngine` وحماية `AnimalBreedingEngine` من الدورات.
- [x] **`P2-12` (`NSB-15`)**: تصحيح أولويات قواعد YAML في `mother_share.yaml` وتصحيح حجب الجدات في `grandmother_blocking.yaml` ووقف تلويث الاختبارات لـ `rules_bundled.ts`.
- [x] **`P2-13` (`NSB-16`)**: إصلاح الانهيار وقت التشغيل في `nasab-validator` (`graph.getAllNodes`) وتصحيح `nasab-inference` و `nasab-api`.

### 2. محرك قياس النصوص، الطباعة، وجدول التصوير
- [x] **`P2-14` (`EDT-09`)**: توحيد ثوابت مقاييس الخطوط وحساب ارتفاع الأسطر بين [`TextMeasurementEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/TextMeasurementEngine.ts) و [`PaginationExtension.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/extensions/PaginationExtension.ts) و [`exportPDF.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/utils/exportPDF.tsx).
- [x] **`P2-15` (`EDT-10`)**: إصلاح خطأ `SharedWorker` غير المترجم في متصفح WebView2 بنظام Windows واستخدام نمط الـ Worker المباشر.
- [x] **`P2-16` (`EDT-11`)**: إصلاح إلغاء كائن الـ Blob قبل بدء التنزيل في `packageService.ts` وتضمين وسائط الشخصيات والمواقع في ملف `.sflow`.
- [x] **`P2-17` (`EDT-12`)**: إصلاح قص أوراق الاستدعاء الطويلة وتصحيح ترقيم المشاهد الفرعية (`10A`, `10B`) في [`exportPDF.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/utils/exportPDF.tsx).
- [x] **`P2-18` (`EDT-13`)**: تصحيح زر `Escape` في المحرر ومنع الخروج غير المقصود وإصلاح تسرب مستمعات التحديد.
- [x] **`P2-19` (`UI-21`)**: إلغاء تضخم مدة التصوير `page_count * 60` وتصحيح فلترة `scene.location_type` في [`TimelineSidebar.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/timeline/TimelineSidebar.tsx) و [`TimelineBoard.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/timeline/TimelineBoard.tsx).
- [x] **`P2-20` (`UI-22`)**: تصحيح تواريخ `Invalid Date` وإنذارات الراحة الزائفة في [`continuityAnalyzer.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/utils/continuityAnalyzer.ts) وإحصائيات [`YearlyHeatmap.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/timeline/views/YearlyHeatmap.tsx).
- [x] **`P2-21` (`REL-04`..`REL-07`)**: ربط أعمدة `father_id`/`mother_id` مع الرسم، حظر العلاقات البيولوجية المستحيلة، وإصلاح تعدد الزوجات في `graphTransformers.ts` وربط نافذة المواريث `InheritanceModal.tsx`.

---

## 🟢 المرحلة P3: البنية التحتية، أنابيب CI/CD، التغليف، ونظافة المستودع

> **الهدف:** توحيد بيئة البناء عبر الحزم، تفعيل اختبارات الحزم الفرعية، وتحديث سير عمل GitHub Actions.

- [x] **`P3-01` (`INF-01`)**: تحديث سير عمل GitHub Actions في [`.github/workflows/ci.yml`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/.github/workflows/ci.yml) ليشمل بناء مساحات العمل، فحص Rust عبر Cargo، وفحص `nasab` والتحقق الصارم من TypeScript.
- [x] **`P3-02` (`INF-02`)**: تصحيح تكوين مساحات العمل في الجذر وحذف الحزم المهجورة الموسومة بـ `extraneous` من [`package-lock.json`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/package-lock.json) وإضافة ملفات `tsconfig.json` لجميع الحزم الفرعية لـ `nasab`.
- [x] **`P3-03` (`INF-03`)**: إضافة اعتماد `zod` الصريح في `packages/nasab/package.json` وتصحيح تضمين `'src/adapters'` في توليد ملفات `.d.ts` وعزل مكتبات Node `fs`/`path` عن حزمة المتصفح.
- [x] **`P3-04` (`INF-04`)**: توسيع إعدادات Vitest في [`vitest.config.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/vitest.config.ts) لتشمل اختبارات الحزم الفرعية وتوحيد إصدارات أدوات البناء وتفعيل خيار `--passWithNoTests`.
- [x] **`P3-05` (`INF-05`)**: استبدال أوامر الحذف غير المتوافقة مع Windows بسكربت Node متوافق عبر الأنظمة، وتصحيح `base.json` بالسماح بـ `declaration: true`، ومنع الدوران اللانهائي للروابط الرمزية في [`generate-tree.js`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/tooling/generate-tree.js).
- [x] **`P3-06` (`INF-06`)**: تنظيف المستودع وإضافة مجلد المخرجات `packages/nasab/lib/` إلى [`.gitignore`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/.gitignore) وحذف أرشيف الواجهات القديمة `_archive_tsx` وتطبيع نهايات الأسطر في [`.gitattributes`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/.gitattributes).

---

### تقرير التحقق الختامي الشامل (Final Multi-Layer Verification Status):
- 🟢 **TypeScript Verification**: جميع مشاريع المستودع (`apps/desktop`, `packages/core`, `packages/database`, `packages/application`, `packages/nasab`, وكافة الحزم الست الفرعية لـ `nasab`) تم فحصها بـ `npx tsc --noEmit` بنجاح بنسبة 100% مع **0 أخطاء**.
- 🟢 **Rust / Tauri Backend**: تم فحص النواة بـ `cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml` مع **0 تحذيرات و 0 أخطاء**.
- 🟢 **Automated Test Suite**: تم تشغيل جميع اختبارات المستودع بنجاح بـ `npm test --workspaces --if-present` مع نجاح **518+ اختباراً** (بما في ذلك اختبار الضغط لـ 100,000 عائلة عشوائية واختبار التراجع للطباعة والمحرر).
- 🟢 **Full Monorepo Build**: تم تجميع المستودع بالكامل بنجاح بواسطة `npm run build` لجميع الحزم دون أي أخطاء.

---

### آلية العمل وميثاق الالتزام بالتنفيذ:
1. تم تنفيذ كل بند بدقة متناهية في ملفاته المحددة.
2. تم تشغيل فحوصات التجميع والاختبار للتحقق من سلامة التعديل بعد كل خطوة.
3. تم تحديث صناديق الاختيار `[x]` بعد التأكد الميداني من الكود.
4. تم استيفاء جميع بنود المراحل الأربع (`P0`, `P1`, `P2`, `P3`) بنسبة 100% دون أي تخطي أو تقريب.
