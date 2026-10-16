# 🗺️ خريطة المكونات المستهدفة (Target Component Map)
**النظام:** Timeline / Production Calendar  
**تاريخ:** 29 يونيو 2026

---

## البنية الحالية vs البنية المستهدفة

### الحالة الحالية (2 وضع عرض)
```
TimelinePage.jsx
├── [Tab: board]  → TimelineBoard.jsx (Kanban)
└── [Tab: agenda] → TimelineAgenda.jsx (شهري بسيط)
```

### البنية المستهدفة (6 أوضاع عرض)
```
TimelinePage.jsx
├── [Tab: board]     → TimelineBoard.jsx        (Kanban - موجود)
├── [Tab: monthly]   → MonthlyCalendar.jsx      (شهري محسّن)
├── [Tab: weekly]    → WeeklyCalendar.jsx        (أسبوعي - جديد)
├── [Tab: daily]     → DailyView.jsx             (يومي - جديد)
├── [Tab: yearly]    → YearlyHeatmap.jsx         (سنوي - جديد)
└── [Tab: strip]     → StripBoard.jsx            (لوحة شرائط - جديد)
```

---

## هيكل الملفات المستهدف

```
src/components/timeline/
├── core/                          # المكونات الأساسية المشتركة
│   ├── CompactSceneCard.jsx       ✅ موجود
│   ├── ScenePreviewModal.jsx      ✅ موجود
│   ├── ShootDayModal.jsx          🔄 يحتاج تطوير (حقول جديدة)
│   ├── DayTypeBadge.jsx           🆕 شارة نوع اليوم
│   ├── StatusBadge.jsx            🆕 شارة الحالة (مشتركة)
│   └── MilestoneMarker.jsx        🆕 علامة المعلم الإنتاجي
│
├── views/                         # أوضاع العرض
│   ├── TimelineBoard.jsx          ✅ موجود
│   ├── MonthlyCalendar.jsx        🔄 (تطوير TimelineAgenda الحالي)
│   ├── WeeklyCalendar.jsx         🆕
│   ├── DailyView.jsx              🆕
│   ├── YearlyHeatmap.jsx          🆕
│   └── StripBoard.jsx             🆕
│
├── panels/                        # اللوحات الجانبية
│   ├── TimelineSidebar.jsx        ✅ موجود
│   ├── ContinuityPanel.jsx        ✅ موجود
│   └── ProductionKPIPanel.jsx     🆕 مؤشرات الأداء
│
├── stats/
│   └── TimelineStats.jsx          🔄 يحتاج توسيع (إضافة نسبة الإنجاز)
│
└── utils/
    └── continuityAnalyzer.js      ✅ موجود
```

---

## مكونات العرض الأسبوعي (التفصيل)

```
WeeklyCalendar.jsx
├── WeekHeader (تنقل بين الأسابيع + رقم الأسبوع الإنتاجي)
├── WeekGrid (7 أعمدة)
│   └── WeekDayColumn × 7
│       ├── DayHeader (التاريخ، النوع، الحالة)
│       ├── TimeSlots (شرائح زمنية من call_time إلى wrap_time)
│       │   └── SceneBlock (بطاقة مشهد ضمن الشريحة الزمنية)
│       └── DayFooter (ملخص: مشاهد، ممثلين، تكلفة)
└── WeekSummary (إجمالي الأسبوع)
```

---

## مكونات العرض اليومي (التفصيل)

```
DailyView.jsx
├── DayNavigator (← يوم سابق | التاريخ الكامل | يوم تالي →)
├── DayInfoHeader
│   ├── العنوان والحالة والنوع
│   ├── الطقس المتوقع
│   └── أوقات الحضور / البداية / النهاية
├── SceneScheduleTable
│   └── صف لكل مشهد (الرقم، العنوان، INT/EXT، الموقع، المدة، الممثلين)
├── RequiredCastPanel
│   └── بطاقة لكل ممثل مطلوب (الاسم، الدور، وقت الحضور)
├── LocationsPanel
│   └── قائمة المواقع مع ترتيب التنقلات
├── CrewAssignmentPanel
│   └── قائمة طاقم العمل المعين
└── DirectorNotesSection
    └── ملاحظات حرة
```

---

## مكونات العرض السنوي (التفصيل)

```
YearlyHeatmap.jsx
├── YearSelector (← سنة سابقة | 2026 | سنة تالية →)
├── HeatmapGrid (12 شهر × 31 يوم)
│   └── MonthRow × 12
│       └── DayCell × 28-31
│           ├── لون الكثافة (تدرج من شفاف إلى مشبع)
│           ├── Tooltip عند التمرير (عدد المشاهد + نوع اليوم)
│           └── onClick → انتقال للعرض اليومي
├── Legend (دليل الألوان: تصوير، بروفة، راحة...)
└── YearStats (ملخص: إجمالي أيام التصوير، أيام الراحة، نسبة الإنجاز)
```

---

## Props Flow (تدفق البيانات المستهدف)

```
TimelinePage (Container)
│
├── timelineData ──→ جميع أوضاع العرض
├── shootDays ────→ جميع أوضاع العرض
├── characters ──→ DailyView, ContinuityPanel
├── locations ───→ DailyView, MonthlyCalendar
├── crew ────────→ DailyView, CrewAssignmentPanel
│
├── onCreateDay(date, type) ──→ MonthlyCalendar, WeeklyCalendar
├── onUpdateDay(id, data) ───→ ShootDayModal, DailyView
├── onDeleteDay(id) ─────────→ TimelineBoard
├── onAssignScene(sceneId, dayId) → جميع أوضاع العرض
└── onAssignCrew(crewId, dayId) ──→ DailyView (جديد)
```
