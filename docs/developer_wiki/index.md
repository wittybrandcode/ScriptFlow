# 📚 دليل المطورين الشامل (ScriptFlow Enterprise Developer Wiki)

مرحباً بك في المرجع الهندسي الشامل لتطبيق **ScriptFlow Enterprise**. 
هذا الدليل مصمم ليوفر للمطورين، المهندسين المعماريين، وفرق الصيانة فهماً عميقاً لكل ميكانيكية، زر، وخوارزمية تعمل خلف الكواليس. 

لقد تم تقسيم الدليل إلى 6 مراحل منطقية تغطي **13 نظاماً معمارياً**، مرتبة من الأساسيات وحتى المحركات الثقيلة.

---

## 🏗️ المرحلة 1: الأساسيات المعمارية وقواعد البيانات
هنا تجد الهيكلة العامة للتطبيق وطريقة تخزين البيانات.
1. [01_System_Architecture.md](./01_System_Architecture.md) - المعمارية العامة (Monorepo, Tauri, React).
2. [02_Database_and_Repositories.md](./02_Database_and_Repositories.md) - محرك SQLite، طابور الكتابة المتسلسلة، وخوارزميات الحزم الذكية.

## 📝 المرحلة 2: النواة والمحرر السينمائي
قلب التطبيق النابض، حيث يقضي الكاتب معظم وقته.
3. [03_Screenplay_Editor_Engine.md](./03_Screenplay_Editor_Engine.md) - محرك التحرير (TipTap)، الترجمة عبر `bridge.ts` والاختصارات الذكية.
4. [04_Text_Measurement_Engine.md](./04_Text_Measurement_Engine.md) - محرك القياس الدقيق (Canvas 2D) وتقسيم الصفحات وفقاً لقواعد منع كسر الحوار.
5. [05_Autosave_and_State.md](./05_Autosave_and_State.md) - طابور الحفظ التلقائي الصارم ودالة حماية البيانات `flush`.

## 🖼️ المرحلة 3: إدارة الوسائط والتخزين
كيفية التعامل مع الملفات والصور الثقيلة بأمان.
6. [06_Local_Disk_Media_Storage.md](./06_Local_Disk_Media_Storage.md) - بروتوكول التخزين المحلي `project-media://` وكيفية فك وتشفير الروابط.
7. [07_Autobackup_Service.md](./07_Autobackup_Service.md) - خدمة النسخ الاحتياطي التلقائي الصامتة (كل 30 دقيقة).

## 🕌 المرحلة 4: محركات النسب والعلاقات الإسلامية
الميزة الاستثنائية التي تفرد بها ScriptFlow لضبط علاقات الشخصيات فقهياً.
8. [08_Nasab_and_Inheritance_Engine.md](./08_Nasab_and_Inheritance_Engine.md) - محرك الحسابات الشرعية (المواريث، الرضاع، وتوليد الكنى).
9. [09_Kinship_React_Flow_Visualizer.md](./09_Kinship_React_Flow_Visualizer.md) - شبكة العلاقات البصرية التفاعلية وإدارة إحداثيات السحب والإفلات.

## 🎬 المرحلة 5: الإنتاج والمخرجات
تحويل العمل الكتابي إلى جداول ومستندات ورقية جاهزة للتنفيذ.
10. [10_Export_and_PDF_Engine.md](./10_Export_and_PDF_Engine.md) - محرك التصدير الخفي للـ PDF ותضمين الخطوط العربية بصيغة Vector.
11. [11_Sflow_Package_Manager.md](./11_Sflow_Package_Manager.md) - محرك الحزم وضغط المشروع لملف `.sflow` عبر الـ Web Workers.
12. [12_Timeline_and_Scheduling_Engine.md](./12_Timeline_and_Scheduling_Engine.md) - محرك الجدولة بـ 4 عروض متزامنة (Kanban, Grid, Calendar, Timeline).

## 🛡️ المرحلة 6: الأمان والنواة
كيف يتفاعل التطبيق مع نظام التشغيل بأقصى درجات الأمان.
13. [13_Web_Workers_and_Rust_Core.md](./13_Web_Workers_and_Rust_Core.md) - طبقة العمال الموازية، دوال Rust الأمنية، وصلاحيات الوصول للقرص.

---
*تم إنشاء هذا التوثيق بدقة متناهية ليعكس أحدث حالة لكود المصدر، وهو يضمن أن يمتلك أي مطور ينضم للمشروع "خريطة كنز" واضحة تقوده عبر آلاف السطور البرمجية.*
