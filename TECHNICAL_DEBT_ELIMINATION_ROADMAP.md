# 🏛️ وثيقة خطة تصفية الديون البرمجية والتحويل الكامل للمنظومة إلى TypeScript 100%
## (Enterprise Technical Debt Elimination & Pure TSX Modernization Roadmap)

> **الإصدار:** 1.0.0 — Enterprise Standard  
> **تاريخ التأسيس:** 2026-10-26  
> **المستهدف الأساسي:** الوصول بتطبيق ScriptFlow Enterprise إلى نقاء برمجي تام 100% TypeScript/TSX مع استئصال كافة ملفات `.jsx` و `.js` المتبقية وتأمين دورات العمل بدون أي انكسارات وظيفية.  
> **المرجع التأسيسي السابق:** [`SYSTEM_STABILIZATION_AND_PERFORMANCE_ROADMAP.md`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/SYSTEM_STABILIZATION_AND_PERFORMANCE_ROADMAP.md) (المراحل 1 - 5 مكتملة ومعتمدة بنجاح).

---

## 🧭 الرؤية الهندسية وأهداف الخطة

بعد اكتمال تحويل كافة **الصفحات الأساسية (12 صفحة)** ونواة المحرر الرئيسية ومحرك التصدير وحفظ الوسائط بنجاح تام، يركز هذا المخطط على **تصفية الديون البرمجية التراكمية (Technical Debts)** المتبقية في:
1. مكونات المحرر التفاعلية وعقد الكتابة السينمائية (TipTap Paper Nodes).
2. نوافذ الحوار والتشغيل المشتركة (Shared Modals & Dialogs).
3. لوحة الجداول الزمنية وإدارة أيام التصوير (Timeline & Call Sheets).
4. شبكة العلاقات الأسرية ومحرك المواريث والرسوم البيانية (Pedigree & Relationship Feature).
5. مخازن الحالة، الخدمات، عمال المعالجة الخلفية، ونقاط الدخول الرئيسية للمنظومة (`App.tsx` & `main.tsx`).

---

## 🛡️ المبادئ الصارمة للتحويل (Architectural Tenets)

> [!IMPORTANT]
> **بروتوكول العزل المسبق الإلزامي (Quarantine-First Protocol):**
> لا يُحذف أي ملف `.jsx` أو `.js` مباشرة؛ بل يُنقل فور اكتمال نظيره `.tsx` إلى مجلد العزل المنفصل [`apps/desktop/_quarantine_backups/`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/_quarantine_backups/). هذا يضمن:
> 1. صفر فقدان للبيانات والشيفرات مع إمكانية التراجع الفوري (Safe Rollback).
> 2. كشف أي ارتباطات ضمنية قديمة فوراً عند تشغيل التدقيق.
> 3. تشغيل التطبيق في بيئة واقعية ومطابقة تماماً لما بعد الحذف.

> [!TIP]
> **بوابة التحقق النوعي الآلي (Zero-Regression Quality Gate):**
> لا تُعتمد أي مرحلة حتى يجتاز الكود:
> * فحص الأنواع الصارم: `npx --workspace=@scriptflow/desktop tsc --noEmit` بـ 0 أخطاء.
> * فحص حزمة الاختبارات الكاملة: `npm run verify:all` (497/497 اختباراً بنسبة نجاح 100%).
> * بناء حزم الإنتاج: `npm run build` بنجاح كامل وسرعة قياسية.

---

## 🗺️ الهيكل العام ومسار المراحل (Phased Modernization Flow)

```mermaid
graph TD
    classDef done fill:#10b981,stroke:#065f46,stroke-width:2px,color:#fff;
    classDef inprog fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff;
    classDef pending fill:#6366f1,stroke:#4338ca,stroke-width:2px,color:#fff;

    Base[المراحل التأسيسية السابقة 1-5: مكتملة ومعتمدة]:::done --> P1[المرحلة 1: مكونات المحرر التفاعلي وعقد TipTap]:::pending
    P1 --> V1[بوابة التحقق 1: فحص دورة حياة المحرر والأداء]:::pending
    V1 --> P2[المرحلة 2: نوافذ الحوار والمكونات المشتركة]:::pending
    P2 --> V2[بوابة التحقق 2: فحص استجابة المودالات وعدم تسريب الحالة]:::pending
    V2 --> P3[المرحلة 3: لوحة الجدول الزمني وأيام التصوير]:::pending
    P3 --> V3[بوابة التحقق 3: فحص السحب والإفلات وتزامن الأيام]:::pending
    V3 --> P4[المرحلة 4: شبكة العلاقات ومحرك شجرة الأنساب]:::pending
    P4 --> V4[بوابة التحقق 4: فحص رسم Dagre والارتباطات الفقهية]:::pending
    V4 --> P5[المرحلة 5: الخدمات، المخازن، والعمال الخلفيين]:::pending
    P5 --> V5[بوابة التحقق 5: فحص الـ Web Workers ونظام التخزين]:::pending
    V5 --> P6[المرحلة 6: تتويج النقاء التام - مدخل التطبيق و 100% Pure TSX]:::pending
```

---

## 📊 جدول تتبع المراحل وحالة التنفيذ

| المرحلة | النطاق الفني المستهدف | درجة الأهمية | عدد الملفات | حالة البرمجة | حالة الاعتماد |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **المرحلة 1** | مكونات المحرر التفاعلي وعقد الكتابة السينمائية | 🔴 حرج للغاية | 18 ملفاً | `COMPLETED` ✅ | `VERIFIED` ✅ |
| **المرحلة 2** | نوافذ الحوار والمودالات والمكونات المشتركة | 🟠 مرتفع | 17 ملفاً | `COMPLETED` ✅ | `VERIFIED` ✅ |
| **المرحلة 3** | نظام الجدول الزمني وإدارة أيام التصوير | 🟠 مرتفع | 9 ملفات | `PLANNED` ⏳ | `PENDING` ⏳ |
| **المرحلة 4** | شبكة العلاقات الأسرية ومحرك شجرة الأنساب | 🟡 متوسط | 14 ملفاً | `PLANNED` ⏳ | `PENDING` ⏳ |
| **المرحلة 5** | الخدمات، المخازن العامة، والعمال الخلفيون (Workers) | 🟢 وقائي | 16 ملفاً | `PLANNED` ⏳ | `PENDING` ⏳ |
| **المرحلة 6** | تتويج النقاء التام: مداخل التطبيق ونقاء الـ Monorepo | 🔴 حرج | ملفين + الإعدادات | `PLANNED` ⏳ | `PENDING` ⏳ |

---

## 🛠️ التفصيل الهندسي والتنفيذي للمراحل

---

### المرحلة 1: مكونات المحرر التفاعلي وعقد الكتابة السينمائية (The Editor Core Cluster) - [مكتملة ومعتمدة ✅]
> **الهدف:** استكمال تحويل المكونات الفرعية التابعة لمحرر المشاهد الورقي والذكي، مع الحفاظ الصارم على قياسات الصفحات والتقطيع ودقة الكتابة التلقائية.

#### 📌 الملفات المستهدفة:
1. **مكونات المحرر الفرعية (`apps/desktop/src/components/editor/`):**
   - [x] [`SmartEditor.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/SmartEditor.jsx) ➔ `SmartEditor.tsx` (ضبط أنواع الكتل والاختصارات والتنقل).
   - [x] [`SceneNavigator.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/SceneNavigator.jsx) ➔ `SceneNavigator.tsx` (ضبط مصغرات المشاهد ومؤشرات الصفحات المحسوبة).
   - [x] [`SceneMetadataForm.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/SceneMetadataForm.jsx) ➔ `SceneMetadataForm.tsx` (ضبط حقول المشهد وتحديد المواقع والشخصيات).
   - [x] [`SceneTasksBoard.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/SceneTasksBoard.jsx) ➔ `SceneTasksBoard.tsx` (إدارة مهام الإنتاج الخاصة بالمشهد).
   - [x] [`SceneRemindersModal.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/SceneRemindersModal.jsx) ➔ `SceneRemindersModal.tsx`.
   - [x] [`ToneSelector.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/ToneSelector.jsx) ➔ `ToneSelector.tsx`.
   - [x] [`WorkspaceCanvas.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/WorkspaceCanvas.jsx) ➔ `WorkspaceCanvas.tsx`.
   - [x] [`paper/TabMenu.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/paper/TabMenu.jsx) ➔ `TabMenu.tsx`.
   - [x] [`paper/extensions/CharacterNodeView.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/paper/extensions/CharacterNodeView.jsx) ➔ `CharacterNodeView.tsx`.
2. **عقد TipTap وملحقات التنسيق (`apps/desktop/src/components/editor/paper/extensions/*.js`):**
   - [x] `ActionNode.js` ➔ `ActionNode.ts`
   - [x] `DialogueNode.js` ➔ `DialogueNode.ts`
   - [x] `CharacterNode.js` ➔ `CharacterNode.ts`
   - [x] `ParentheticalNode.js` ➔ `ParentheticalNode.ts`
   - [x] `TransitionNode.js` ➔ `TransitionNode.ts`
   - [x] `ShotNode.js` ➔ `ShotNode.ts`
   - [x] `DirectorNoteNode.js` ➔ `DirectorNoteNode.ts`
   - [x] `AudioNode.js` ➔ `AudioNode.ts`
   - [x] `TextNode.js` ➔ `TextNode.ts`
   - [x] `PaginationExtension.js` ➔ `PaginationExtension.ts`
   - [x] `TabMenuExtension.js` ➔ `TabMenuExtension.ts`

---

### المرحلة 2: نوافذ الحوار والمكونات المشتركة (Shared Dialogs & UI Modals) - [مكتملة ومعتمدة ✅]
> **الهدف:** توحيد كافة النوافذ المنبثقة المستخدمة في إدارة الشخصيات والمواقع والحلقات والمشاهد، مع إلزامية دعم الأنواع الصارمة لبيانات الإدخال ونظام التحقق.

#### 📌 الملفات المستهدفة:
- [x] [`CharacterModal.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/CharacterModal.jsx) ➔ `CharacterModal.tsx`
- [x] [`LocationModal.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/LocationModal.jsx) ➔ `LocationModal.tsx`
- [x] [`LocationPreviewModal.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/LocationPreviewModal.jsx) ➔ `LocationPreviewModal.tsx`
- [x] [`CrewModal.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/CrewModal.jsx) ➔ `CrewModal.tsx`
- [x] [`CrewPreviewModal.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/CrewPreviewModal.jsx) ➔ `CrewPreviewModal.tsx`
- [x] [`CrewAssignmentModal.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/CrewAssignmentModal.jsx) ➔ `CrewAssignmentModal.tsx`
- [x] [`AddEpisodeModal.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/AddEpisodeModal.jsx) ➔ `AddEpisodeModal.tsx`
- [x] [`QuickAddSceneModal.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/QuickAddSceneModal.jsx) ➔ `QuickAddSceneModal.tsx`
- [x] [`QuickEditSceneModal.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/QuickEditSceneModal.jsx) ➔ `QuickEditSceneModal.tsx`
- [x] [`CloneSceneModal.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/CloneSceneModal.jsx) ➔ `CloneSceneModal.tsx`
- [x] [`InteractiveMapPicker.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/InteractiveMapPicker.jsx) ➔ `InteractiveMapPicker.tsx`
- [x] [`MapDisplay.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/MapDisplay.jsx) ➔ `MapDisplay.tsx`
- [x] [`WeatherWidget.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/WeatherWidget.jsx) ➔ `WeatherWidget.tsx`
- [x] [`SortableItem.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/SortableItem.jsx) ➔ `SortableItem.tsx` (تم إنجازه مع المرحلة 1 لضبط كتابة كتل المحرر)
- [x] [`Toast.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/Toast.jsx) ➔ `Toast.tsx`
- [x] [`FallbackLoader.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/FallbackLoader.jsx) ➔ `FallbackLoader.tsx`
- [x] [`ui/AdvancedFilterBar.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/ui/AdvancedFilterBar.jsx) ➔ `AdvancedFilterBar.tsx`
- [x] [`ui/InlineFieldError.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/ui/InlineFieldError.jsx) ➔ `InlineFieldError.tsx`

---

### المرحلة 3: لوحة الجدول الزمني وأيام التصوير (Timeline & Production Board)
> **الهدف:** تعزيز استقرار محرك جدولة الإنتاج وحسابات أوقات المشاهد والسحب والإفلات عبر `@dnd-kit`.

#### 📌 الملفات المستهدفة:
- [x] [`components/timeline/TimelineBoard.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/timeline/TimelineBoard.jsx) ➔ `TimelineBoard.tsx`
- [x] [`components/timeline/TimelineAgenda.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/timeline/TimelineAgenda.jsx) ➔ `TimelineAgenda.tsx`
- [x] [`components/timeline/TimelineSidebar.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/timeline/TimelineSidebar.jsx) ➔ `TimelineSidebar.tsx`
- [x] [`components/timeline/TimelineStats.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/timeline/TimelineStats.jsx) ➔ `TimelineStats.tsx`
- [x] [`components/timeline/ShootDayModal.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/timeline/ShootDayModal.jsx) ➔ `ShootDayModal.tsx`
- [x] [`components/timeline/ShootDayColumn.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/timeline/ShootDayColumn.jsx) ➔ `ShootDayColumn.tsx`
- [x] [`components/timeline/ScenePreviewModal.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/timeline/ScenePreviewModal.jsx) ➔ `ScenePreviewModal.tsx`
- [x] [`components/timeline/CompactSceneCard.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/timeline/CompactSceneCard.jsx) ➔ `CompactSceneCard.tsx`
- [x] [`components/timeline/ContinuityPanel.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/timeline/ContinuityPanel.jsx) ➔ `ContinuityPanel.tsx`
- [x] [`components/timeline/views/DailyView.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/timeline/views/DailyView.jsx) ➔ `DailyView.tsx`
- [x] [`components/timeline/views/StripBoard.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/timeline/views/StripBoard.jsx) ➔ `StripBoard.tsx`
- [x] [`components/timeline/views/WeeklyCalendar.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/timeline/views/WeeklyCalendar.jsx) ➔ `WeeklyCalendar.tsx`
- [x] [`components/timeline/views/YearlyHeatmap.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/timeline/views/YearlyHeatmap.jsx) ➔ `YearlyHeatmap.tsx`
- [x] [`hooks/queries/useTimelineReordering.js`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/hooks/queries/useTimelineReordering.js) ➔ `useTimelineReordering.ts`

---

### المرحلة 4: شبكة العلاقات ومحرك شجرة الأنساب (Relationships & Pedigree Graph) - [مكتملة ومعتمدة ✅]
> **الهدف:** تأمين واجهة رسم الشبكات التفاعلية ومحاذاة المخططات والتكامل مع حزمة الفقه والمواريث `@scriptflow/nasab`.

#### 📌 الملفات المستهدفة:
1. **الصفحة والمكونات الرئيسية (`features/relationships/`):**
   - [x] [`RelationshipsPage.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/features/relationships/RelationshipsPage.jsx) ➔ `RelationshipsPage.tsx`
   - [x] [`components/RelationshipsToolbar.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/features/relationships/components/RelationshipsToolbar.jsx) ➔ `RelationshipsToolbar.tsx`
   - [x] [`components/CustomRelationshipEdge.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/features/relationships/components/CustomRelationshipEdge.jsx) ➔ `CustomRelationshipEdge.tsx`
   - [x] [`components/EdgeList.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/features/relationships/components/EdgeList.jsx) ➔ `EdgeList.tsx`
   - [x] [`components/PartnerSelects.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/features/relationships/components/PartnerSelects.jsx) ➔ `PartnerSelects.tsx`
2. **نوافذ العلاقات والمواريث (`features/relationships/components/modals/`):**
   - [x] `CharacterRPGPanel.jsx` ➔ `CharacterRPGPanel.tsx`
   - [x] `CoParentPopup.jsx` ➔ `CoParentPopup.tsx`
   - [x] `ErrorModal.jsx` ➔ `ErrorModal.tsx`
   - [x] `InheritanceModal.jsx` ➔ `InheritanceModal.tsx`
   - [x] `InheritancePanel.jsx` ➔ `InheritancePanel.tsx`
   - [x] `ManualLinkPopup.jsx` ➔ `ManualLinkPopup.tsx`
3. **الخطافات والمساعدات الحسابية (`features/relationships/hooks/` & `utils/`):**
   - [x] `useRelationshipActions.js` ➔ `useRelationshipActions.ts`
   - [x] `useRelationshipGraph.js` ➔ `useRelationshipGraph.ts`
   - [x] `dagreLayout.js`, `edgeUtils.js`, `gedcomUtils.js`, `graphTransformers.js`, `typeRegistry.js` ➔ تحويلها إلى `.ts`.

---

### المرحلة 5: الخدمات، المخازن العامة، والعمال الخلفيون (Services, Stores & Web Workers) - [مكتملة ومعتمدة ✅]
> **الهدف:** تعزيز استقرار البنية التحتية لمعالجة العمليات الثقيلة (Multithreading Workers) والتخزين والاتصال.

#### 📌 الملفات المستهدفة:
1. **عمال الويب (Web Workers & Factory):**
   - [x] [`workers/ExportWorker.js`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/workers/ExportWorker.js) ➔ `ExportWorker.ts`
   - [x] [`workers/StatsWorker.js`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/workers/StatsWorker.ts) ➔ `StatsWorker.ts`
   - [x] [`workers/WorkerFactory.js`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/workers/WorkerFactory.ts) ➔ `WorkerFactory.ts`
   - [x] [`hooks/useExportWorker.js`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/hooks/useExportWorker.ts) ➔ `useExportWorker.ts`
   - [x] [`hooks/useStatsWorker.js`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/hooks/useStatsWorker.ts) ➔ `useStatsWorker.ts`
2. **المخازن والخدمات العامة:**
   - [x] [`store/useUIStore.js`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/store/useUIStore.ts) ➔ `useUIStore.ts`
   - [x] [`hooks/useKeyboard.js`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/hooks/useKeyboard.ts) ➔ `useKeyboard.ts`
   - [x] [`hooks/useToast.js`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/hooks/useToast.ts) ➔ `useToast.ts`
   - [x] [`hooks/useTheme.js`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/hooks/useTheme.ts) ➔ `useTheme.ts`
   - [x] [`services/exportStrategies.js`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/services/exportStrategies.ts) ➔ `exportStrategies.ts`
   - [x] [`services/BackupService.js`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/services/BackupService.ts) ➔ `BackupService.ts`
   - [x] [`services/api/packageService.js`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/services/api/packageService.ts) ➔ `packageService.ts`
   - [x] [`lib/queryClient.js`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/lib/queryClient.ts) ➔ `queryClient.ts`
   - [x] أدوات `utils/*.js` و `constants/*.js` (`AutosaveQueue.ts`, `continuityAnalyzer.ts`, `dagreLayout.ts`, `dateUtils.ts`, `htmlUtils.ts`, `PromiseQueue.ts`, `validation.ts`, `sceneConstants.ts`).

---

### المرحلة 6: تتويج النقاء التام (App Entry Points & 100% Pure TSX Monorepo)
> **الهدف:** إغلاق آخر ملفات `.jsx` في رأس شجرة المكونات وتفعيل فحص التجميع الصارم الخالي من أي استثناءات.

#### 📌 المهام التنفيذية:
- [ ] [`apps/desktop/src/App.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/App.jsx) ➔ `App.tsx` (تأمين المسارات والمزودات العامة بنقاء تام).
- [ ] [`apps/desktop/src/main.jsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/main.jsx) ➔ `main.tsx` (تأمين نقطة الإقلاع ومزود React Query و StrictMode).
- [ ] تدقيق نهائي شامل لـ `tsconfig.json` وضمان عدم وجود أي ملف جافاسكريبت نشط في كامل مجلد `src`.
- [ ] تشغيل التدقيق الثلاثي الشامل:
  ```bash
  npx --workspace=@scriptflow/desktop tsc --noEmit # => 0 errors
  npm run verify:all                               # => 497/497 tests passing
  npm run build                                    # => Clean Production Bundle
  ```

---

## 🏁 بروتوكول الإغلاق والاعتماد النهائي (Sign-Off Protocol)

1. **الترقية التراكمية الحذرة:** تنفيذ الملفات حزمة بحزمة مع تشغيل الفحص الآلي بعد كل مجموعة لضمان عدم حدوث أي انكسار أو تراجع.
2. **التطبيق الإلزامي لبروتوكول العزل:** نقل كافة الملفات المحولة فوراً إلى `_quarantine_backups/` للحفاظ على النسخ الاحتياطية وإثبات استقلالية البناء الحديث.
3. **الالتزام الدقيق (Atomic Git Commits):** تثبيت ودفع كل مرحلة مكتملة بشكل مستقل لتوثيق تاريخ التغييرات بدقة وسهولة الرجوع إليها.
