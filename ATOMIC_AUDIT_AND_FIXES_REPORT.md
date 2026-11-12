# التقرير الهندسي الذري الشامل لتحليل الأخطاء والثغرات والتصويبات البرمجية
**المشروع:** `SCRIPTFLOW ENTERPRISE` (`d:\SCRIPTFLOW Pro\SCRIPTFLOW ENREPRISE`)  
**منهجية الفحص:** تحليل ذري مباشر مبني بنسبة **100%** على الشيفرة المصدرية الفعلية (`Rust`, `SQL`, `TypeScript`, `TSX`, `JavaScript`, `CSS`, `JSON`, `TOML`, `YAML`, `Batch`) عبر كافة حزم المستودع، **دون قراءة أو الاعتماد على أي ملف توثيق `Markdown` مسبق**.

---

## الملخص التنفيذي ومصفوفة المخاطر الشاملة

شمل التدقيق الذري قراءة ومطابقة العقود البرمجية (Schema-to-Repository-to-UseCase-to-UI) عبر كامل طبقات المنظومة:
1. **النواة الأصلية وتكوين Tauri v2** ([`apps/desktop/src-tauri`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src-tauri)) وجميع هجرات قاعدة البيانات `001` حتى `011`.
2. **حزمة النواة والأنواع** ([`packages/core`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/core)).
3. **حزمة قاعدة البيانات ومستودعات SQLite الثمانية عشر** ([`packages/database`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database)).
4. **حزمة حالات الاستخدام ومنطق الأعمال** ([`packages/application`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/application)).
5. **محرك التصدير وحزم `.sflow`** ([`packages/export-engine`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/export-engine)).
6. **تطبيق سطح المكتب ومحرر السيناريو والترقيم والجدولة الزمنية وخريطة العلاقات** ([`apps/desktop`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop)).
7. **محرك الأنساب والمواريث الفقهي والرياضي وحزمه الفرعية الست** ([`packages/nasab`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab)).
8. **أدوات البناء والتكامل المستمر وإدارة الحزم** ([`package.json`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/package.json), [`.github/workflows/ci.yml`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/.github/workflows/ci.yml), [`.gitignore`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/.gitignore)).

> **ملاحظة محورية حول خادعية اجتياز المترجم والاختبارات الحالية:**  
> رغم أن أوامر `tsc --noEmit` و `cargo check` و `vitest run` تجتاز ظاهرياً برمز خروج `0`، أثبت التحليل الذري أن هذا النجاح الشكلي ناتج عن:
> 1. وجود `// @ts-nocheck` في السطر الأول من محرك الاستيراد [`ImportProject.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/application/src/import/ImportProject/ImportProject.ts#L1).
> 2. استثناء مجلد الاختبارات `src/test/**/*` من فحص الأنواع في [`packages/database/tsconfig.json`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/tsconfig.json#L16) وتعطيل `PRAGMA foreign_keys = ON` في كلٍّ من الإنتاج والاختبارات.
> 3. كتابة حزمة [`export-engine`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/export-engine/package.json) بملفات JavaScript غير مفحوصة مع أمر بناء وهمي `node -e "process.exit(0)"`.
> 4. تجاهل اختبارات الحزم الفرعية الست داخل `packages/nasab/packages/*` بسبب حصر `include` في [`packages/nasab/vitest.config.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/vitest.config.ts#L5-L8).
> 5. انتشار التحويلات القسرية `as any` في استدعاءات `TipTap` ومستودعات البيانات.

### إحصائية الأخطاء والعلل المكتشفة حسب الطبقة ومستوى الخطورة

| الباب | النطاق المعماري | حرج (`CRITICAL`) | عالٍ (`HIGH`) | متوسط (`MEDIUM`) | منخفض (`LOW`) | الإجمالي |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **الأول** | النواة الأصلية والأمان (`src-tauri` / Rust / CSP) | 3 | 1 | 0 | 1 | **5** |
| **الثاني** | مخطط SQLite و `@scriptflow/core` و `@scriptflow/database` | 6 | 7 | 3 | 0 | **16** |
| **الثالث** | حالات الاستخدام والاستيراد والتصدير (`application` & `export`) | 4 | 2 | 0 | 0 | **6** |
| **الرابع** | محرر السيناريو، الترقيم، الطباعة PDF، العمال، والوسائط | 8 | 10 | 6 | 0 | **24** |
| **الخامس** | واجهة المستخدم، الحالة، الاستعلامات، الصفحات، والجدول الزمني | 5 | 10 | 6 | 1 | **22** |
| **السادس** | واجهة خريطة العلاقات وشجرة العائلة (`features/relationships`) | 2 | 4 | 1 | 0 | **7** |
| **السابع** | محرك الأنساب والمواريث (`packages/nasab` + `nasab-*`) | 7 | 9 | 4 | 0 | **20** |
| **الثامن** | البنية التحتية، أنابيب `CI/CD`، وإعدادات المستودع | 1 | 4 | 2 | 1 | **8** |
| **المجموع** | **كامل منظومة ScriptFlow Enterprise** | **36** | **47** | **22** | **3** | **108 بنداً رئيسياً (تضم +165 علة ذرية)** |

---

## الباب الأول: طبقة النواة الأصلية والأمان والصلاحيات (`apps/desktop/src-tauri`)

### `TAU-01` [CRITICAL / حرج — أمني] فتح صلاحيات نظام الملفات الشاملة (`path: "**"`) وتدمير عزل Tauri v2 Sandbox
- **الملف والأسطر:** [`default.json`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src-tauri/capabilities/default.json#L22-L48)
- **الكود المسبب للخلل:**
```json
    "fs:allow-desktop-read-recursive",
    "fs:allow-desktop-write-recursive",
    "fs:allow-document-read-recursive",
    "fs:allow-document-write-recursive",
    { "identifier": "fs:allow-exists", "allow": [{ "path": "**" }] },
    { "identifier": "fs:allow-read-file", "allow": [{ "path": "**" }] },
    { "identifier": "fs:allow-write-file", "allow": [{ "path": "**" }] },
    { "identifier": "fs:allow-copy-file", "allow": [{ "path": "**" }] },
    { "identifier": "fs:allow-mkdir", "allow": [{ "path": "**" }] },
    ...
    "core:window:allow-destroy"
```
- **التشخيص الذري وآلية العطل:**
  1. منح المسار الكوني `{ "path": "**" }` لأوامر القراءة والكتابة والنسخ وإنشاء المجلدات يلغي بالكامل جدار الحماية الخاص بـ `Tauri v2`؛ وبما أن التطبيق يحتوي على عدة ثغرات `Stored XSS` عبر `dangerouslySetInnerHTML` و `innerHTML` عند استيراد ملفات مشاريع خارجية (`.sflow` / `.json`)، فإن أي حمولة خبيثة داخل عنوان مشهد أو وصف شخصية تستطيع قراءة أو الكتابة فوق أي ملف في نظام تشغيل المستخدم بالكامل.
  2. منح `core:window:allow-destroy` يتيح إغلاق النافذة قسرياً وتجاوز حارس التغييرات غير المحفوظة `onCloseRequested` ما لم يُقصر الاستخدام على مسار الإغلاق الآمن.
- **التصويب الدقيق:** حصر النطاق الثابت لعمليات الملفات داخل `$APPDATA/**` ومجلد المشاريع المخصص فقط `$DOCUMENT/ScriptFlowProjects/**` (حيث إن `tauri-plugin-dialog` يمنح تلقائياً صلاحية مؤقتة لأي مسار يختاره المستخدم عبر نافذة الحفظ أو الفتح):
```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "opener:default",
    "sql:default",
    "sql:allow-load",
    "sql:allow-execute",
    "sql:allow-select",
    "sql:allow-close",
    "fs:default",
    "fs:allow-app-read-recursive",
    "fs:allow-app-write-recursive",
    { "identifier": "fs:allow-exists", "allow": [{ "path": "$APPDATA/**" }, { "path": "$DOCUMENT/ScriptFlowProjects/**" }] },
    { "identifier": "fs:allow-read-file", "allow": [{ "path": "$APPDATA/**" }, { "path": "$DOCUMENT/ScriptFlowProjects/**" }] },
    { "identifier": "fs:allow-write-file", "allow": [{ "path": "$APPDATA/**" }, { "path": "$DOCUMENT/ScriptFlowProjects/**" }] },
    { "identifier": "fs:allow-copy-file", "allow": [{ "path": "$APPDATA/**" }, { "path": "$DOCUMENT/ScriptFlowProjects/**" }] },
    { "identifier": "fs:allow-mkdir", "allow": [{ "path": "$APPDATA/**" }, { "path": "$DOCUMENT/ScriptFlowProjects/**" }] },
    { "identifier": "fs:allow-remove", "allow": [{ "path": "$APPDATA/**" }, { "path": "$DOCUMENT/ScriptFlowProjects/**" }] },
    "dialog:default",
    "dialog:allow-confirm",
    "dialog:allow-open",
    "dialog:allow-save"
  ]
}
```

---

### `TAU-02` [HIGH / عالٍ — أمني وعطل تشغيلي] خلل سياسة أمان المحتوى `CSP` واتساع نطاق `assetProtocol.scope`
- **الملف والأسطر:** [`tauri.conf.json`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src-tauri/tauri.conf.json#L22-L30) بالتقاطع مع [`mediaStorage.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/services/mediaStorage.ts#L39-L40) و [`MapDisplay.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/MapDisplay.tsx#L39) و [`WeatherWidget.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/WeatherWidget.tsx#L40)
- **الكود المسبب للخلل:**
```json
    "security": {
      "csp": "default-src 'self' ipc: http://ipc.localhost; img-src 'self' asset: http://asset.localhost data: blob:; media-src 'self' asset: http://asset.localhost data: blob:; connect-src 'self' ipc: http://ipc.localhost",
      "assetProtocol": {
        "enable": true,
        "scope": [
          "$DOCUMENT/**/*"
        ]
      }
    }
```
- **التشخيص الذري وآلية العطل:**
  1. **تعطل التنسيقات المضمنة في نسخة الإنتاج (`Release`):** تخلو سياسة `csp` من توجيه `style-src`، لذا يرجع المتصفح إلى `default-src 'self'` ويحظر كافة سمات `style={{ ... }}` في `React` وعناصر `<style>` الديناميكية المحقونة في محرك الطباعة والتصدير `exportPDF.tsx` وإضافة `TipTap`.
  2. **تعطل الخرائط والطقس في الإنتاج:** تحظر `img-src` بلاطات خرائط `https://*.tile.openstreetmap.org`، وتحظر `connect-src` استعلامات الطقس `https://api.open-meteo.com` والبحث الجغرافي العكسي `https://nominatim.openstreetmap.org`، كما تفتقر البروتوكولات المحلية إلى `https://ipc.localhost` و `https://asset.localhost`.
  3. **خلل نطاق `assetProtocol.scope`:** تحفظ [`mediaStorage.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/services/mediaStorage.ts#L39-L40) ملفات وسائط المشاريع في `$DOCUMENT/ScriptFlowProjects` بينما تحفظ النواة ملفاتها في `$APPDATA`؛ فتح `$DOCUMENT/**/*` يكشف كافة مستندات المستخدم الشخصية لبروتوكول `asset:`، بينما غياب `$APPDATA/**` يمنع تحميل أي أصل محفوظ داخل مجلد بيانات التطبيق (`403 Forbidden`).
- **التصويب الدقيق:**
```json
    "security": {
      "csp": "default-src 'self' ipc: http://ipc.localhost https://ipc.localhost; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' asset: http://asset.localhost https://asset.localhost data: blob: https://*.tile.openstreetmap.org; media-src 'self' asset: http://asset.localhost https://asset.localhost data: blob:; connect-src 'self' ipc: http://ipc.localhost https://ipc.localhost https://api.open-meteo.com https://nominatim.openstreetmap.org",
      "assetProtocol": {
        "enable": true,
        "scope": [
          "$DOCUMENT/ScriptFlowProjects/**",
          "$APPDATA/**"
        ]
      }
    }
```

---

### `TAU-03` [CRITICAL / حرج — فقدان بيانات كارثي] شرط الحجم `current_size < 400_000` وسباق التهيئة في `auto_migrate_and_protect_db` يمسحان قاعدة بيانات المستخدم عند كل تشغيل
- **الملف والأسطر:** [`lib.rs`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src-tauri/src/lib.rs#L65-L80) و [`lib.rs`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src-tauri/src/lib.rs#L146-L204) و [`lib.rs`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src-tauri/src/lib.rs#L279-L292)
- **الكود المسبب للخلل:**
```rust
    // lib.rs:160-185
    if current_size < 400_000 {
        let appdata = std::env::var("APPDATA").unwrap_or_default();
        ...
                    if cand_size > current_size {
                        if let Ok(_) = std::fs::copy(&candidate_db, &target_db) {
                            println!("[DB-GUARD] SUCCESS: Automatically restored legacy database!");
                            break;
                        }
                    }
    }
```
ومسار الإقلاع في الأسطر `282-292`:
```rust
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(&connection_string, migrations)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let handle = app.handle();
            auto_migrate_and_protect_db(handle);
            Ok(())
        })
```
- **التشخيص الذري وآلية العطل:**
  1. **تدمير متكرر لبيانات المستخدم النشطة عند كل إقلاع:** حجم قاعدة بيانات SQLite النصية الفعلية (بعد نقل الصور إلى ملفات خارجية عبر `mediaStorage`) يتراوح عادةً بين `80 KB` و `250 KB` أي أقل من `400,000` بايت. إذا وُجدت لدى المستخدم قاعدة قديمة بحجم `500 KB` في `com.tawfikmostefaoui.desktop` أو `com.workstation.scriptflow_pro`، فإن الشرط `current_size < 400_000 && cand_size > current_size` يتحقق **في كل مرة يفتح فيها التطبيق**، فينسخ الملف القديم فوق `scriptflow.db` ويمحو كل ما كتبه المستخدم في الجلسات السابقة!
  2. **سباق دورة حياة الإقلاع (Plugin Lifecycle Race):** ينفذ Tauri دالة `setup` الخاصة بالإضافات (`tauri_plugin_sql`) **قبل** `.setup(|app| ...)` الخاصة بالتطبيق! أي أن `tauri_plugin_sql` يفتح فعلياً مجمع اتصالات `SqlitePool` ويشغل الهجرات على `scriptflow.db`، ثم تأتي `auto_migrate_and_protect_db` بعده لتكتب بالنسخ المباشر `std::fs::copy` فوق ملف قاعدة البيانات المفتوح في وضع `WAL` دون تشغيل الهجرات `002..011` على القاعدة المنسوخة ودون نسخ أو تنظيف ملفي `-wal` و `-shm`!
  3. **تضارب المسارات على Linux:** يحل `tauri-plugin-sql` المسار `"sqlite:scriptflow.db"` نسبةً إلى `app_config_dir()`، بينما تستخدم `get_app_root` دالة `app_data_dir()`. كما يعتمد فحص القواعد القديمة على متغير البيئة `APPDATA` الخاص بـ Windows وحده، وتغفل `get_db_diagnostic_info` (السطر `66`) فحص معرف `com.workstation.scriptflow_pro`.
- **التصويب الدقيق:**
  1. توحيد مسار القاعدة عبر `app_config_dir()` (أو تمرير مسار مطلق صريح موحد لكلٍّ من `connection_string` و `get_app_root`).
  2. تنفيذ الترحيل التلقائي والنسخ الوقائي داخل إضافة تمهيدية (`tauri::plugin::Builder::new("db-bootstrap")`) تُسجَّل **قبل** `.plugin(tauri_plugin_sql::Builder::default()...)`.
  3. قصر استيراد القاعدة القديمة حصراً على حالة **عدم وجود `target_db` إطلاقاً (`!target_db.exists()`)**، وعدم الكتابة فوق قاعدة موجودة بناءً على حجمها أبداً:
```rust
fn pre_sql_bootstrap(app: &tauri::AppHandle) {
    let root_path = app
        .path()
        .app_config_dir()
        .unwrap_or_else(|_| app.path().app_data_dir().expect("Failed to resolve app dir"));
    let _ = std::fs::create_dir_all(&root_path);
    let target_db = root_path.join("scriptflow.db");

    // 1. الترحيل لمرة واحدة فقط إذا لم تكن القاعدة موجودة أصلاً
    if !target_db.exists() {
        if let Some(parent_roaming) = root_path.parent() {
            let legacy_ids = ["com.tawfikmostefaoui.desktop", "com.workstation.scriptflow_pro"];
            for id in legacy_ids {
                let candidate = parent_roaming.join(id).join("scriptflow.db");
                if candidate.exists() {
                    let _ = std::fs::copy(&candidate, &target_db);
                    let cand_wal = parent_roaming.join(id).join("scriptflow.db-wal");
                    if cand_wal.exists() {
                        let _ = std::fs::copy(&cand_wal, root_path.join("scriptflow.db-wal"));
                    }
                    break;
                }
            }
        }
    }

    // 2. أخذ نسخة أمان قبل تشغيل الهجرات وفتح SqlitePool
    if target_db.exists() {
        let backup_dir = root_path.join("backups");
        let _ = std::fs::create_dir_all(&backup_dir);
        let _ = std::fs::copy(&target_db, backup_dir.join("pre_launch_safety.db"));
    }
}
```

---

### `TAU-04` [CRITICAL / حرج — تلف قاعدة البيانات] دالة `restore_safety_backup` تنسخ فوق ملف `WAL` مفتوح وتترك ملفي `-wal` و `-shm` القديمين
- **الملف والأسطر:** [`lib.rs`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src-tauri/src/lib.rs#L109-L128) و [`LockScreen.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/auth/LockScreen.tsx#L114-L126)
- **الكود المسبب للخلل:**
```rust
#[tauri::command]
fn restore_safety_backup(app: tauri::AppHandle) -> Result<String, String> {
    let root = get_app_root(app);
    let current_dir = PathBuf::from(&root);
    let target_db = current_dir.join("scriptflow.db");
    let safety_copy = current_dir.join("backups").join("pre_launch_safety.db");
    ...
    std::fs::copy(&safety_copy, &target_db)
        .map_err(|e| format!("Failed to restore backup: {}", e))?;
    Ok("Successfully restored database from pre-launch safety backup.".to_string())
}
```
- **التشخيص الذري وآلية العطل:**
  تعمل قاعدة البيانات بوضع `PRAGMA journal_mode=WAL;`. استبدال ملف `scriptflow.db` عبر `std::fs::copy` بينما تظل مقابض الملفات مفتوحة في `SqlitePool` يفشل على نظام Windows بسبب قفل نظام التشغيل أو يتلف ذاكرة الصفحات، والأخطر أن بقاء ملفي `scriptflow.db-wal` و `scriptflow.db-shm` التابعين للنسخة التالفة يجعل SQLite يدمج إطارات `WAL` قديمة غير متوافقة فوق النسخة المستعادة فور إعادة التحميل، ما يؤدي فوراً إلى خطأ `SQLITE_CORRUPT: database disk image is malformed`.
- **التصويب الدقيق:** إغلاق اتصال قاعدة البيانات أولاً من الواجهة (`await closeDb()` قبل `invoke('restore_safety_backup')`)، وحذف ملفي `-wal` و `-shm` في Rust قبل نسخ ملف الأمان:
```rust
#[tauri::command]
fn restore_safety_backup(app: tauri::AppHandle) -> Result<String, String> {
    let root = get_app_root(app);
    let current_dir = PathBuf::from(&root);
    let target_db = current_dir.join("scriptflow.db");
    let target_wal = current_dir.join("scriptflow.db-wal");
    let target_shm = current_dir.join("scriptflow.db-shm");
    let safety_copy = current_dir.join("backups").join("pre_launch_safety.db");

    if !safety_copy.exists() {
        return Err("No pre-launch safety backup found in backups folder.".to_string());
    }

    if target_db.exists() {
        let _ = std::fs::copy(&target_db, current_dir.join("scriptflow_corrupted_archive.db"));
    }

    let _ = std::fs::remove_file(&target_wal);
    let _ = std::fs::remove_file(&target_shm);

    std::fs::copy(&safety_copy, &target_db)
        .map_err(|e| format!("Failed to restore backup (close DB pool first): {}", e))?;

    Ok("Successfully restored database from pre-launch safety backup.".to_string())
}
```

---

### `TAU-05` [LOW / منخفض — توافقية وتنظيف] تعطل `open_app_data_folder` على غير Windows، وأمر `greet` الميت، وترقيع `time` المحلي
- **الملف والأسطر:** [`lib.rs`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src-tauri/src/lib.rs#L18-L32) و [`lib.rs`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src-tauri/src/lib.rs#L92-L107) و [`Cargo.toml`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src-tauri/Cargo.toml#L29-L30)
- **التشخيص الذري والتصويب:**
  1. الدالة `open_app_data_folder` لا تفعل شيئاً على `macOS` و `Linux` رغم تثبيت `tauri_plugin_opener`؛ تُصوَّب باستخدام `use tauri_plugin_opener::OpenerExt; app.opener().open_path(&root, None::<&str>).map_err(|e| e.to_string())?;`.
  2. إزالة دالة القالب التجريبية `greet` من `lib.rs` ومن `tauri::generate_handler!`.
  3. في `Cargo.toml`، الاعتماد على نسخة `time` الرسمية الحديثة من `crates.io` بدل تثبيت نسخة محلية كاملة داخل `src-tauri/vendor/time` لتفادي تفوت التحديثات الأمنية.

---

## الباب الثاني: مخطط SQLite والهجرات (`001..011`) وحزمتا `@scriptflow/core` و `@scriptflow/database`

### `DB-01` [CRITICAL / حرج — انهيار مؤكد 100%] الهجرة `010_create_scene_snapshots.sql` تُعرِّف `id` و `scene_id` كأعداد `INTEGER` بدلاً من `TEXT`
- **الملفات والأسطر:** [`010_create_scene_snapshots.sql`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src-tauri/migrations/010_create_scene_snapshots.sql#L1-L8) مقابل [`SceneSnapshotRepository.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/src/SceneSnapshotRepository.ts#L22-L29)
- **الكود المسبب للخلل:**
```sql
CREATE TABLE IF NOT EXISTS scene_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scene_id INTEGER NOT NULL,
    snapshot_json TEXT NOT NULL,
    trigger TEXT NOT NULL DEFAULT 'auto',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(scene_id) REFERENCES scenes(id) ON DELETE CASCADE
);
```
ومقابل ذلك في `SceneSnapshotRepository.ts`:
```ts
    const newSnapshot: SceneSnapshot = {
      id: `snp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      scene_id: sId,
      snapshot_json: snapshotJson,
      trigger
    };
    await this.insert(newSnapshot);
```
- **التشخيص الذري وآلية العطل:**
  في محرك SQLite، العمود المعرّف بصيغة `INTEGER PRIMARY KEY AUTOINCREMENT` يكون اسماً مستعاراً لـ `rowid` ويرفض **بصرامة مطلقة** أي سلسلة نصية غير رقمية! إدراج `"snp_1730..."` يرمي خطأ **`SQLITE_MISMATCH (code 20): datatype mismatch` بنسبة 100% في كل محاولة حفظ لقطة مشهد**، كما أن `scene_id INTEGER` يتعارض مع نوع المفتاح المرجعي `scenes.id TEXT` (`scn_...`).
- **التصويب الدقيق:** إضافة هجرة جديدة `012_fix_scene_snapshots_schema.sql` (وتسجيلها في `lib.rs`):
```sql
CREATE TABLE scene_snapshots_new (
    id TEXT PRIMARY KEY NOT NULL,
    scene_id TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    snapshot_json TEXT NOT NULL,
    trigger TEXT NOT NULL DEFAULT 'auto',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO scene_snapshots_new (id, scene_id, snapshot_json, trigger, created_at)
SELECT 'snp_' || CAST(id AS TEXT), CAST(scene_id AS TEXT), snapshot_json, trigger, created_at
FROM scene_snapshots;
DROP TABLE scene_snapshots;
ALTER TABLE scene_snapshots_new RENAME TO scene_snapshots;
CREATE INDEX IF NOT EXISTS idx_scene_snapshots_scene_id ON scene_snapshots(scene_id, created_at DESC);
```

---

### `DB-02` [CRITICAL / حرج — انهيار SQL] جدول `tones` يفتقد أعمدة `scenario_id` و `color` و `created_at` و `deleted_at` التي يفترضها `ToneRepository`
- **الملفات والأسطر:** [`001_initial_schema.sql`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src-tauri/migrations/001_initial_schema.sql#L229-L232) مقابل [`ToneRepository.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/src/ToneRepository.ts#L3-L16)
- **الكود المسبب للخلل:**
```sql
CREATE TABLE IF NOT EXISTS tones (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);
```
مقابل `ToneRepository.ts`:
```ts
async getByScenarioId(scenarioId: string, tx?: import('./client.js').TransactionContext): Promise<ITone[]> {
  return this.findActiveBy('scenario_id', scenarioId, 'created_at DESC', tx);
}
```
- **التشخيص الذري وآلية العطل:** استدعاء `getByScenarioId` أو `softDelete` أو `insert` عبر `ToneRepository` ينهار فوراً بخطأ `SQLITE_ERROR: no such column: scenario_id` (وكذلك `deleted_at` و `created_at` و `color`)، كما أن قيد `name TEXT NOT NULL UNIQUE` يمنع تكرار نفس اسم النبرة في مشروعين مختلفين.
- **التصويب الدقيق (ضمن هجرة إصلاح المخطط):**
```sql
CREATE TABLE tones_new (
  id TEXT PRIMARY KEY NOT NULL,
  scenario_id TEXT REFERENCES scenarios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME DEFAULT NULL,
  UNIQUE(scenario_id, name)
);
INSERT INTO tones_new (id, name) SELECT id, name FROM tones;
DROP TABLE tones;
ALTER TABLE tones_new RENAME TO tones;
CREATE INDEX IF NOT EXISTS idx_tones_scenario ON tones(scenario_id);
```

---

### `DB-03` [CRITICAL / حرج — تعطل كامل للمهام] `ProductionTaskRepository.createForScene` يُدرج `id = NULL` ويستعلم بـ `lastInsertId` الرقمي فيفشل دائماً
- **الملف والأسطر:** [`ProductionTaskRepository.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/src/ProductionTaskRepository.ts#L13) و [`ProductionTaskRepository.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/src/ProductionTaskRepository.ts#L41-L55)
- **الكود المسبب للخلل:**
```ts
  async createForScene(data: { scenario_id: string; scene_id: string; department: string; title: string; crew_id: string | null }): Promise<ProductionTaskWithCrew | null> {
    const result = await dbExecute(`
      INSERT INTO production_tasks (scenario_id, scene_id, department, title, status, crew_id, created_at)
      VALUES ($1, $2, $3, $4, 'TODO', $5, CURRENT_TIMESTAMP)
    `, [data.scenario_id, data.scene_id, data.department, data.title, data.crew_id]);

    const rows = await dbSelect<ProductionTaskWithCrew>(`
      SELECT pt.*, c.name as crew_name
      FROM production_tasks pt
      LEFT JOIN crew c ON pt.crew_id = c.id
      WHERE pt.id = $1
    `, [result.lastInsertId]);

    return rows.length > 0 ? rows[0] : null;
  }
```
- **التشخيص الذري وآلية العطل:**
  1. عمود `production_tasks.id` معرّف كـ `TEXT PRIMARY KEY` بدون قيمة افتراضية (وفي SQLite عمود `TEXT PRIMARY KEY` يقبل `NULL` ما لم يُقيد بـ `NOT NULL`!). إغفال `id` في جملة `INSERT` يُخزن المهمة بمعرّف `id = NULL`!
  2. `result.lastInsertId` يُعيد رقم `rowid` الداخلي (مثل `1`)، فترجع جملة `WHERE pt.id = $1` مصفوفة فارغة وتُعيد الدالة `null` دائماً!
  3. عند إعادة الجلب، تظهر كل المهام بـ `task.id === null` فلا يمكن تحديث حالتها (`WHERE id = NULL` في SQL لا يطابق أي صف أبداً) ولا حذفها! كما تُعلن الواجهة `ProductionTask` في السطر `13` عن عمود `updated_at` غير الموجود أصلاً في الجدول.
- **التصويب الدقيق:**
```ts
  async createForScene(data: { scenario_id: string; scene_id: string; department: string; title: string; crew_id: string | null }): Promise<ProductionTaskWithCrew | null> {
    const { generateId } = await import('@scriptflow/core');
    const id = generateId('tsk');
    await dbExecute(`
      INSERT INTO production_tasks (id, scenario_id, scene_id, department, title, status, crew_id, created_at)
      VALUES ($1, $2, $3, $4, $5, 'TODO', $6, CURRENT_TIMESTAMP)
    `, [id, data.scenario_id, data.scene_id, data.department, data.title, data.crew_id]);

    const rows = await dbSelect<ProductionTaskWithCrew>(`
      SELECT pt.*, c.name as crew_name
      FROM production_tasks pt
      LEFT JOIN crew c ON pt.crew_id = c.id AND c.deleted_at IS NULL
      WHERE pt.id = $1
    `, [id]);

    return rows.length > 0 ? rows[0] : null;
  }
```

---

### `DB-04` [CRITICAL / حرج — الجمود التام `Deadlock` وانقسام المعاملات] خمس علل قاتلة في `packages/database/src/client.ts`
- **الملف والأسطر:** [`client.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/src/client.ts#L42-L55) و [`client.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/src/client.ts#L106-L171) و [`client.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/src/client.ts#L191-L212)
- **الكود المسبب للخلل:**
```ts
        await tauriDb.execute("PRAGMA journal_mode=WAL;");
        await tauriDb.execute("PRAGMA busy_timeout=5000;");
        await tauriDb.execute("PRAGMA synchronous=NORMAL;");
...
      if (item.isTransactionCallback && item.callback) {
        let transactionBegan = false;
        try {
          await safeExecute("BEGIN TRANSACTION");
          transactionBegan = true;
          const txContext: TransactionContext = {
            execute: async (q: string, b: any[] = []) => await safeExecute(q, b),
            select: async <T>(q: string, b: any[] = []) => await safeSelect<T>(q, b)
          };
          const result = await item.callback(txContext);
          await safeExecute("COMMIT");
```
- **التشخيص الذري للعلل الخمس المركبة:**
  1. **عدم تفعيل `PRAGMA foreign_keys = ON;` نهائياً:** يعطل SQLite القيود المرجعية افتراضياً في كل اتصال؛ لذا فإن جميع قيود `ON DELETE CASCADE` و `ON DELETE SET NULL` في الهجرات `001..011` غير مفعلة على الإطلاق!
  2. **انقسام `BEGIN` و `COMMIT` عبر اتصالات مختلفة في `sqlx::SqlitePool`:** تدير إضافة `tauri-plugin-sql` مجمع اتصالات متعدد (`Pool<Sqlite>`). كل استدعاء `tauriDb.execute` عبر IPC يستعير اتصالاً متاحاً من المجمع؛ فقد ينفذ `BEGIN TRANSACTION` على الاتصال `A`، وتنفذ أوامر الإدراج على الاتصال `B` (خارج المعاملة!)، ثم ينفذ `COMMIT` على الاتصال `B` فيفشل بـ `cannot commit - no transaction is active` ويترك الاتصال `A` مقفولاً للأبد!
  3. **جمود دائم (100% Permanent Promise Deadlock) عند أي نداء متداخل:** أثناء تشغيل `processQueue()` تكون الراية `isProcessingQueue = true` وينتظر الطابور اكتمال `await item.callback(txContext)`. إذا استدعى أي كود داخل `callback` دالة `dbExecute` أو `withTransaction` مباشرةً (مثل `BaseRepository.bulkInsert` أو نسيان تمرير `tx`)، يُدفع العنصر الداخلي إلى `writeQueue` وتخرج `processQueue()` فوراً بسبب `if (isProcessingQueue) return;`، فيظل الوعد الخارجي ينتظر الوعد الداخلي إلى ما لا نهاية ويتجمد الحفظ بالكامل!
  4. **قراءات `dbSelect` تتجاوز الطابور أثناء المعاملة:** تمر `dbSelect` (السطر `191`) مباشرةً دون المرور عبر سياق المعاملة النشطة، فتقرأ بيانات غير معتمدة أو تتصادم مع المعاملة الجارية (كما يحدث في `CloneScene.ts:43` و `ExportProject.ts:53`).
  5. **استخدام `BEGIN TRANSACTION` المؤجل + إنشاء 4 فهارس مكررة:** ترقية القفل من قراءة إلى كتابة في `BEGIN TRANSACTION` ترمي `SQLITE_BUSY` فوراً بدلاً من الانتظار (يجب استخدام `BEGIN IMMEDIATE`). كما أن الأسطر `48-51` تنشئ 4 فهارس موجودة مسبقاً بأسماء أخرى في `001_initial_schema.sql:244-255` مما يضاعف كلفة الفهرسة في كل كتابة.
- **التصويب الدقيق:**
  1. ضبط اتصال SQLite ليعمل باتصال واحد أو ضبط `PRAGMA foreign_keys = ON;` وتنفيذه في `initDb`، وحذف الفهارس الأربعة المكررة من `client.ts:48-51`.
  2. دعم إعادة الدخول التلقائي للمعاملات المتداخلة عبر `SAVEPOINT` واستخدام `BEGIN IMMEDIATE`:
```ts
let activeTxContext: TransactionContext | null = null;
let savepointSeq = 0;

export async function dbExecute(query: string, bindValues: any[] = []): Promise<any> {
  if (!dbInstance) throw new Error("Database not initialized. Call initDb() first.");
  if (activeTxContext) {
    return activeTxContext.execute(query, bindValues);
  }
  return new Promise((resolve, reject) => {
    writeQueue.push({ query, bindValues, resolve, reject });
    processQueue();
  });
}

export async function dbSelect<T = any>(query: string, bindValues: any[] = []): Promise<T[]> {
  if (!dbInstance) throw new Error("Database not initialized. Call initDb() first.");
  if (activeTxContext) {
    return activeTxContext.select<T>(query, bindValues);
  }
  return safeSelect<T>(query, bindValues);
}

export async function withTransaction<T>(fn: (tx: TransactionContext) => Promise<T>): Promise<T> {
  if (!dbInstance) throw new Error("Database not initialized. Call initDb() first.");
  if (activeTxContext) {
    const sp = `sp_${++savepointSeq}`;
    await activeTxContext.execute(`SAVEPOINT ${sp}`);
    try {
      const res = await fn(activeTxContext);
      await activeTxContext.execute(`RELEASE SAVEPOINT ${sp}`);
      return res;
    } catch (err) {
      await activeTxContext.execute(`ROLLBACK TO SAVEPOINT ${sp}`);
      await activeTxContext.execute(`RELEASE SAVEPOINT ${sp}`);
      throw err;
    }
  }
  return new Promise((resolve, reject) => {
    writeQueue.push({ isTransactionCallback: true, callback: fn, resolve, reject });
    processQueue();
  });
}
```
*(مع تعيين `activeTxContext = txContext` فور تنفيذ `await safeExecute("BEGIN IMMEDIATE")`، وإعادته إلى `null` داخل كتلة `finally` في `processQueue`).*

---

### `DB-05` [CRITICAL / حرج — تضارب العقد البرمجي] تعارض أسماء حقول `ILocation` (`location_type`, `image_url`) مع أعمدة SQL (`type`, `image`)
- **الملفات والأسطر:** [`types.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/core/src/types.ts#L116-L137) مقابل [`001_initial_schema.sql`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src-tauri/migrations/001_initial_schema.sql#L38-L59) و [`LocationRepository.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/src/LocationRepository.ts#L8-L14)
- **الكود المسبب للخلل:**
```ts
// packages/core/src/types.ts:121, 124
export interface ILocation {
  ...
  location_type: LocationType; // العمود الفعلي في SQLite هو `type`
  ...
  image_url: string;           // العمود الفعلي في SQLite هو `image`
```
ومقابل ذلك في `LocationRepository.ts:8-14`:
```ts
  protected readonly allowedColumns = [
    'id', 'scenario_id', 'parent_location_id', 'name', 'type', 
    'address', 'description', 'image', 'status', 'map_url', 
    ...
    'technical_notes', 'created_at', 'updated_at', 'deleted_at'
  ];
```
- **التشخيص الذري وآلية العطل:**
  1. استعلام `SELECT * FROM locations` يُعيد `{ type, image }`، بينما الكود المكتوب وفق واجهة `ILocation` يقرأ `loc.location_type` و `loc.image_url` فيحصل على `undefined`!
  2. عند تمرير كائن مطابق لـ `Partial<ILocation>` يحتوي على `{ location_type: 'EXT', image_url: '...' }` إلى `LocationRepository.insert/update`، تقوم `sanitizeEntries` **بحذف الحقلين بصمت تام** لأن `allowedColumns` لا تسمح إلا بـ `'type'` و `'image'`!
  3. في المقابل، تسمح `LocationRepository.allowedColumns` في السطر `13` بالحقل `'updated_at'` **وهو عمود غير موجود أصلاً في جدول `locations`**، مما يسبب انهيار `SQLITE_ERROR: table locations has no column named updated_at` إذا مُرِّر هذا الحقل!
- **التصويب الدقيق:** حذف `'updated_at'` من `LocationRepository.allowedColumns`، وتوحيد العقد إما بتحديث `ILocation` ليطابق الأعمدة الفعلية (`type` و `image`) أو بتحويل الحقول ذهاباً وإياباً داخل `LocationRepository`:
```ts
// LocationRepository.ts
export class LocationRepository extends BaseRepository<ILocation> {
  protected readonly allowedColumns = [
    'id', 'scenario_id', 'parent_location_id', 'name', 'type',
    'address', 'description', 'image', 'status', 'map_url',
    'latitude', 'longitude', 'contact_name', 'contact_phone',
    'permit_status', 'cost_per_day', 'cost_currency',
    'technical_notes', 'created_at', 'deleted_at'
  ];

  private normalizeInput(data: Record<string, any>): Record<string, any> {
    const copy = { ...data };
    if ('location_type' in copy && !('type' in copy)) copy.type = copy.location_type;
    if ('image_url' in copy && !('image' in copy)) copy.image = copy.image_url;
    delete copy.location_type;
    delete copy.image_url;
    delete copy.updated_at;
    return copy;
  }
```

---

### `DB-06` [CRITICAL / حرج — انهيار استيراد `OVERWRITE` وتسرب أيتام] `ScenarioRepository.hardDeleteScenario` و `clearScenarioContents` يغفلان جدول `crew` و 5 جداول فرعية أخرى
- **الملف والأسطر:** [`ScenarioRepository.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/src/ScenarioRepository.ts#L16-L17) و [`ScenarioRepository.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/src/ScenarioRepository.ts#L69-L154)
- **الكود المسبب للخلل:**
```ts
    const tables = [
      'script_blocks', 'scene_characters', 'character_relationships',
      'location_images', 'crew_assignments', 'production_tasks',
      'scenes', 'characters', 'locations', 'episodes', 'shoot_days'
    ];
    // جدول 'crew' مفقود بالكامل! وكذلك:
    // scene_snapshots, scene_reminders, location_documents, crew_day_assignments, page_numbering
```
- **التشخيص الذري وآلية العطل:**
  1. **انهيار 100% عند الاستيراد بوضع الاستبدال (`OVERWRITE`):** عندما يستورد المستخدم مشروعاً يحتوي على طاقم عمل (`crew`) بوضع `OVERWRITE`، تستدعي `ImportProject.ts:108` الدالة `clearScenarioContents` التي تمسح محتويات المشروع **ما عدا جدول `crew`**! وعندما يصل الاستيراد إلى السطر `275` (`crewRepo.insert({ id: member.id, ... })`) ينهار الاستيراد بالكامل بخطأ `UNIQUE constraint failed: crew.id`!
  2. **تسرب بيانات يتيمة:** مع كون `foreign_keys = OFF`، يترك الحذف النهائي صفوفاً يتيمة في `crew`, `scene_snapshots`, `scene_reminders`, `location_documents`, `crew_day_assignments`, و `page_numbering`.
  3. **غياب المعاملة الذرية:** إذا استُدعيت `hardDeleteScenario` أو `clearScenarioContents` بدون `tx`، تُنفذ عشرات جمل `DELETE` فرادى خارج `withTransaction`.
  4. **خطأ استعلام المخرج والكاتب (السطران `16-17` و `31-32`):** يستعلم عن `WHERE role = 'DIRECTOR'` و `role = 'WRITER'` بينما التصنيف الفعلي يُحفظ في العمود `category = 'DIRECTOR'` / `category = 'WRITER'` ويكتب المستخدم في `role` نصاً عربياً مثل `'مخرج'`، فترجع `director_name` و `writer_name` بقيمة `null` دائماً!
- **التصويب الدقيق:** راجع التصويب الكامل الجاهز للتطبيق بتضمين الجداول الـ 17 بالترتيب المرجعي الصحيح داخل `withTransaction` وتعديل الشرط إلى `(category = 'DIRECTOR' OR role = 'DIRECTOR')`:
```ts
  async clearScenarioContents(scenarioId: string, tx?: import('./client.js').TransactionContext): Promise<void> {
    if (!tx) {
      const { withTransaction } = await import('./client.js');
      return withTransaction((innerTx) => this.clearScenarioContents(scenarioId, innerTx));
    }
    await tx.execute('DELETE FROM scene_snapshots WHERE scene_id IN (SELECT id FROM scenes WHERE scenario_id = $1)', [scenarioId]);
    await tx.execute('DELETE FROM scene_reminders WHERE scene_id IN (SELECT id FROM scenes WHERE scenario_id = $1)', [scenarioId]);
    await tx.execute('DELETE FROM script_blocks WHERE scene_id IN (SELECT id FROM scenes WHERE scenario_id = $1)', [scenarioId]);
    await tx.execute('DELETE FROM scene_characters WHERE scene_id IN (SELECT id FROM scenes WHERE scenario_id = $1)', [scenarioId]);
    await tx.execute('DELETE FROM location_documents WHERE location_id IN (SELECT id FROM locations WHERE scenario_id = $1)', [scenarioId]);
    await tx.execute('DELETE FROM location_images WHERE location_id IN (SELECT id FROM locations WHERE scenario_id = $1)', [scenarioId]);
    await tx.execute('DELETE FROM crew_day_assignments WHERE shoot_day_id IN (SELECT id FROM shoot_days WHERE scenario_id = $1)', [scenarioId]);
    await tx.execute('DELETE FROM character_relationships WHERE scenario_id = $1', [scenarioId]);
    await tx.execute('DELETE FROM crew_assignments WHERE scenario_id = $1', [scenarioId]);
    await tx.execute('DELETE FROM production_tasks WHERE scenario_id = $1', [scenarioId]);
    await tx.execute('DELETE FROM page_numbering WHERE scenario_id = $1', [scenarioId]);
    await tx.execute('DELETE FROM scenes WHERE scenario_id = $1', [scenarioId]);
    await tx.execute('DELETE FROM characters WHERE scenario_id = $1', [scenarioId]);
    await tx.execute('DELETE FROM crew WHERE scenario_id = $1', [scenarioId]);
    await tx.execute('DELETE FROM locations WHERE scenario_id = $1', [scenarioId]);
    await tx.execute('DELETE FROM episodes WHERE scenario_id = $1', [scenarioId]);
    await tx.execute('DELETE FROM shoot_days WHERE scenario_id = $1', [scenarioId]);
  }
```

---

### `DB-07` [HIGH / عالٍ — أخطاء مخطط SQLite] قيود `UNIQUE` المعطلة مع `NULL`، غياب `created_at` في `characters`، وعيوب `shoot_order` و `v_scenario_stats`
- **الملفات والأسطر:**
  - [`001_initial_schema.sql`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src-tauri/migrations/001_initial_schema.sql#L99-L135) و [`001_initial_schema.sql`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src-tauri/migrations/001_initial_schema.sql#L178) و [`001_initial_schema.sql`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src-tauri/migrations/001_initial_schema.sql#L207-L215)
  - [`005_sqlite_optimizations.sql`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src-tauri/migrations/005_sqlite_optimizations.sql#L15-L24)
  - [`007_timeline_schema_evolution.sql`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src-tauri/migrations/007_timeline_schema_evolution.sql#L1-L20)
  - [`009_create_page_numbering.sql`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src-tauri/migrations/009_create_page_numbering.sql#L7-L18)
- **التشخيص الذري للعيوب الستة:**
  1. **غياب `created_at` في جدول `characters`:** بينما يستخدم `BaseRepository.findAll` و `findActiveBy` الترتيب الافتراضي `ORDER BY created_at DESC`، ما يتسبب في انهيار SQL فور استدعائهما على `CharacterRepository` بدون معيار ترتيب مخصص!
  2. **فشل `UNIQUE(crew_id, episode_id, scene_id)` في `crew_assignments`:** يعامل SQLite قيم `NULL` كقيم متمايزة غير متساوية، لذا عند إسناد عضو طاقم لمشهد بدون حلقة (`episode_id IS NULL`) يسمح الجدول بتكرار نفس الإسناد آلاف المرات!
  3. **القيمة الافتراضية الخاطئة `shoot_order REAL DEFAULT 0` في `scenes`:** تفسد التعبير `COALESCE(shoot_order, scene_number)` في [`ManageTimeline.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/application/src/timeline/ManageTimeline/ManageTimeline.ts#L14) لأن `COALESCE(0, scene_number)` يُرجع `0` دائماً بدلاً من `scene_number`!
  4. **إرجاع `NULL` بدلاً من `0` في العرض `v_scenario_stats`:** السطر `20` في `005_sqlite_optimizations.sql` يستخدم `SUM(estimated_duration)` بدون `COALESCE(..., 0)`.
  5. **نقص الفهارس والقيود في `crew_day_assignments` و `shoot_days`:** يفتقر `crew_day_assignments` لفهارس على `shoot_day_id` و `crew_id` ولقيد `UNIQUE(shoot_day_id, crew_id)`.
  6. **نقص قيد التفرد في `page_numbering`:** يفتقر لـ `UNIQUE(scenario_id, item_type, item_id)`.
- **التصويب الدقيق (هجرة SQL إضافية):**
```sql
ALTER TABLE characters ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS idx_crew_assignments_unique_scene
  ON crew_assignments(crew_id, scene_id) WHERE episode_id IS NULL AND scene_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_crew_assignments_unique_episode
  ON crew_assignments(crew_id, episode_id) WHERE scene_id IS NULL AND episode_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_crew_day_assignments_day ON crew_day_assignments(shoot_day_id);
CREATE INDEX IF NOT EXISTS idx_crew_day_assignments_crew ON crew_day_assignments(crew_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_crew_day_assignments_unique ON crew_day_assignments(shoot_day_id, crew_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_page_numbering_unique ON page_numbering(scenario_id, item_type, item_id);

DROP VIEW IF EXISTS v_scenario_stats;
CREATE VIEW v_scenario_stats AS
SELECT
    s.id as scenario_id,
    s.title as scenario_title,
    (SELECT COUNT(*) FROM scenes sc WHERE sc.scenario_id = s.id AND sc.deleted_at IS NULL) as total_scenes,
    (SELECT COALESCE(SUM(estimated_duration), 0) FROM scenes sc WHERE sc.scenario_id = s.id AND sc.deleted_at IS NULL) as total_duration,
    (SELECT COUNT(*) FROM characters c WHERE c.scenario_id = s.id AND c.deleted_at IS NULL) as total_characters,
    (SELECT COUNT(*) FROM locations l WHERE l.scenario_id = s.id AND l.deleted_at IS NULL) as total_locations
FROM scenarios s
WHERE s.deleted_at IS NULL;
```

---

### `DB-08` [HIGH / عالٍ — حقن معرفات SQL وغياب القفل المتفائل] ثغرات `BaseRepository.ts`
- **الملف والأسطر:** [`BaseRepository.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/src/BaseRepository.ts#L18-L29) و [`BaseRepository.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/src/BaseRepository.ts#L45-L173)
- **التشخيص الذري وآلية العطل:**
  1. **حقن أسماء الأعمدة ومفاتيح الكائنات:** 16 مستودعاً من أصل 18 تترك `allowedColumns = null`، فتُدمج مفاتيح الكائنات الممررة إلى `insert` و `update` ومعاملات `column` و `orderBy` نصياً داخل جملة SQL دون تحقق، مما يؤدي لانهيارات SQL (مثل تمرير `character_name` في `CloneScene` أو `cover_image_mime` في `mediaProcessor`) أو ثغرة حقن SQL إذا وصلت مفاتيح غير موثوقة.
  2. **غياب القفل المتفائل (`Optimistic Locking`) رغم وجود عمود `version`:** أضافت الهجرة `002` عمود `version` لجدولي `scenes` و `characters`، ويتوقع `SceneEditor.tsx:760` خطأ `'CONFLICT'`، لكن `BaseRepository.update` لا يتحقق أبداً من `WHERE id = $N AND version = $M`!
  3. **`bulkInsert` لا يقبل معامل `tx?: TransactionContext`** فيتسبب في جمود `writeQueue` إذا استُدعي داخل معاملة.
- **التصويب الدقيق:** فرض التحقق الصارم من المعرفات عبر `/^[a-zA-Z_][a-zA-Z0-9_]*$/`، تعريف `allowedColumns` في جميع المستودعات الـ 18، تمرير `tx?: TransactionContext` إلى `bulkInsert`، ودعم فحص `expectedVersion` في `update`.

---

### `DB-09` [HIGH / عالٍ — أخطاء SQL ومسار ملفات] ثغرتا `vacuumDatabase` و `executeHeavyQueryChunked`
- **الملفات والأسطر:** [`client.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/src/client.ts#L217-L221) و [`heavyClient.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/src/heavyClient.ts#L9-L43)
- **التشخيص الذري والتصويب:**
  1. في [`client.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/src/client.ts#L220): تبني `vacuumDatabase` الأمر نصياً ``VACUUM INTO '${safePath}'`` دون فحص المحارف الصفرية `\0` ودون حذف الملف الهدف إن كان موجوداً مسبقاً (حيث يفشل `VACUUM INTO` في SQLite إذا كان الملف موجوداً). تُصوَّب باستخدام معامل مرتبط `await dbExecute('VACUUM INTO $1', [normalized])` مع التحقق من المسار وحذف الملف الهدف المسبق بعد تأكيد المستخدم.
  2. في [`heavyClient.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/src/heavyClient.ts#L20): التعبير `.replace(/LIMIT\s+\d+/i, '')` يحذف أول `LIMIT 1` يصادفه **حتى لو كان داخل استعلام فرعي (Subquery)** مثل استعلام المخرج في `ScenarioRepository`، كما لا يزيل الفاصلة المنقوطة `;` من نهاية الاستعلام فينتج `SELECT ...; LIMIT 500 OFFSET 0` وينهار نحوياً! يُصوَّب بـ `.replace(/;+\s*$/, '').replace(/\s+OFFSET\s+\d+\s*$/i, '').replace(/\s+LIMIT\s+\d+\s*$/i, '')`.

---

### `DB-10` [HIGH / عالٍ — فساد الإحصائيات وسباق التعديل] `CharacterRepository.getCharacterStats` يتسرب إليه المشاهد المحذوفة (`appearancePercent > 100%`) ويثبت `wordCount: 0`
- **الملف والأسطر:** [`CharacterRepository.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/src/CharacterRepository.ts#L11-L41) و [`CharacterRepository.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/src/CharacterRepository.ts#L53-L65)
- **الكود المسبب للخلل:**
```ts
    // المقام يستبعد المشاهد المحذوفة:
    // WHERE scene_id IN (SELECT id FROM scenes WHERE scenario_id = $1 AND deleted_at IS NULL)
    // بينما البسط في السطر 24 يربط script_blocks مباشرة دون استبعاد المشاهد المحذوفة!
    FROM characters c
    LEFT JOIN script_blocks b ON c.id = b.character_id
    WHERE c.scenario_id = $1 AND c.deleted_at IS NULL
```
- **التشخيص الذري والتصويب:**
  1. البسط يجمع حوارات المشاهد الموجودة في سلة المحذوفات بينما المقام يستبعدها، فترتفع نسبة ظهور الشخصية `appearancePercent` فوق **100%**! كما أن السطر `35` يثبت `wordCount: 0` دائماً.
  2. في `updateRPGData` (الأسطر `53-65`): تجري عملية القراءة والتعديل والكتابة على عمود `metadata` خارج `withTransaction` وبلا `try/catch` حول `JSON.parse`.
  3. **التصويب:** ربط `script_blocks b JOIN scenes s ON b.scene_id = s.id AND s.deleted_at IS NULL` وحساب عدد الكلمات الفعلي من `b.content`، وتغليف `updateRPGData` داخل `withTransaction`.

---

### `DB-11` [HIGH / عالٍ — دوال وهمية تفقد البيانات] `CrewRepository.getAssignments` و `syncAssignments` غير منفذتين (`TODO` Stubs)
- **الملف والأسطر:** [`CrewRepository.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/src/CrewRepository.ts#L11-L23)
- **التشخيص الذري والتصويب:** تُعيد `getAssignments` مصفوفة فارغة `[]` دائماً، وتطبع `syncAssignments` تحذيراً في الطرفية وتهمل حفظ كافة الإسنادات رغم وجود جدول `crew_assignments` منذ الهجرة `001`! تُصوَّب بتنفيذ الاستعلام والمزامنة الفعلية داخل `withTransaction` باستخدام `generateId('asn')`.

---

### `DB-12` [HIGH / عالٍ — انقلاب ترتيب المشاهد والحلقات] `SceneRepository` يرتب المشاهد حسب `created_at DESC` بدلاً من `scene_number ASC`
- **الملفات والأسطر:** [`SceneRepository.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/src/SceneRepository.ts#L8-L14) و [`EpisodeRepository.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/src/EpisodeRepository.ts#L7-L9) و [`EpisodeRepository.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/src/EpisodeRepository.ts#L49-L53)
- **التشخيص الذري والتصويب:**
  1. `SceneRepository.getByScenarioId` و `getByEpisodeId` يستدعيان `findActiveBy` بالترتيب الافتراضي `'created_at DESC'` فيخرج السيناريو المصدَّر بترتيب زمني عكسي! يُصوَّب بتمرير `'scene_number ASC'`.
  2. `EpisodeRepository.getByScenarioId` يجلب الحلقات بدون `ORDER BY episode_number ASC`، و `EpisodeRepository.getStats` (السطر `52`) يغفل حالة `'REVIEW'` من `statusBreakdown`.

---

### `DB-13` [HIGH / عالٍ — فقدان ترقيم الصفحات وتضارب الجداول الوسيطة] علل مستودعات `PageNumbering`، `SceneCharacter`، `LocationImage`، `ScriptBlock`، و `ShootDay`
- **الملفات والأسطر والتصويبات الدقيقة:**
  1. [`PageNumberingRepository.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/src/PageNumberingRepository.ts#L3) و [`PageNumberingRepository.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/src/PageNumberingRepository.ts#L14-L36): يستورد `withTransaction` في السطر `3` **ولا يستخدمه إطلاقاً**! تنفذ `savePageNumbering` أمر `DELETE FROM page_numbering` ثم حلقات `INSERT` منفصلة؛ أي تداخل بين عمليتي ترقيم يمسح الجدول أو يكرر الصفوف. **التصويب:** تغليف الحذف والإدراج داخل `await withTransaction(async (tx) => { ... })`.
  2. [`SceneCharacterRepository.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/src/SceneCharacterRepository.ts#L3-L24): يرث `BaseRepository<SceneCharacter>` مع افتراض وجود عمود `id: string` غير الموجود في جدول `scene_characters` (`PRIMARY KEY (scene_id, character_id)`)، كما تُسرِّب `getByScenarioId` المشاهد والشخصيات المحذوفة ناعماً (`deleted_at IS NOT NULL`). **التصويب:** إضافة دوال مخصصة `add`/`remove` بـ `INSERT OR IGNORE` وتصفية `s.deleted_at IS NULL AND c.deleted_at IS NULL`.
  3. [`LocationImageRepository.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/src/LocationImageRepository.ts#L14-L25): تغفل `ORDER BY is_primary DESC, sort_order ASC` وتُسرِّب صور المواقع المحذوفة في `getByScenarioId`.
  4. [`ScriptBlockRepository.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/src/ScriptBlockRepository.ts#L8-L20): `getBySceneId` لا ترتب بـ `ORDER BY sort_order ASC`، و `getSceneBlocks` تربط جدول `characters` دون شرط `AND c.deleted_at IS NULL`، وتفتقر لـ `allowedColumns = ['id', 'scene_id', 'character_id', 'type', 'content', 'metadata', 'sort_order']`.
  5. [`ShootDayRepository.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/src/ShootDayRepository.ts#L19-L46): مشكلة استعلام `N+1` داخل حلقة `getTimelineData` مع الترتيب بـ `scene_number` بدلاً من `shoot_order`، وتنفيذ `deleteWithUnassign` بدون `withTransaction`.

---

### `DB-14` [HIGH / عالٍ — حذف تدميري للمهام وتكرار المنطق] ازدواجية وتضارب `TrashRepository.purgeItem` مع `ManageTrash.purgeItem`
- **الملفات والأسطر:** [`TrashRepository.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/src/TrashRepository.ts#L50-L95) مقابل [`ManageTrash.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/application/src/trash/ManageTrash/ManageTrash.ts#L39-L79)
- **التشخيص الذري وآلية العطل:**
  1. كُتب منطق الحذف النهائي (`purgeItem`) مرتين بشكل منفصل في الطبقتين وقد انحرفا بالفعل (`ManageTrash` نسي `DELETE FROM page_numbering`).
  2. كلاهما **يحذف سجلات `production_tasks` بالكامل** عند حذف مشهد أو عضو طاقم بدلاً من فك الارتباط `SET scene_id = NULL` / `SET crew_id = NULL` كما ينص مخطط `001_initial_schema.sql:220-221`!
  3. كلاهما ينسى تنظيف `scene_snapshots`، `scene_reminders`، `scenes.source_scene_id`، `location_documents`، `locations.parent_location_id`، `scenes.location_id`، `shoot_days.primary_location_id`، `characters.father_id`، `characters.mother_id`، `characters.actor_id`، و `crew_day_assignments`!
- **التصويب الدقيق:** جعل `ManageTrash` يفوض التنفيذ مباشرةً إلى `TrashRepository.purgeItem` بعد استكمال جميع جمل `DELETE` و `UPDATE ... SET ... = NULL` المذكورة داخل معاملة واحدة.

---

### `DB-15` [MEDIUM / متوسط — ثغرة نظام الأنواع في `@scriptflow/core`] عيوب `Outcome.ts` و `generateId.ts` و `ICharacter`
- **الملفات والأسطر:** [`Outcome.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/core/src/Outcome.ts#L10-L31) و [`generateId.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/core/src/generateId.ts#L3-L12) و [`types.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/core/src/types.ts#L49-L81)
- **التشخيص الذري والتصويب:**
  1. في `Outcome.ts`: التوقيع `public static ok<T>(value?: T): Outcome<T, never>` يسمح باستدعاء `Outcome.ok<IScene>()` بدون وسيط مع إرجاع `undefined` متنكراً كنوع `IScene`! كما أن `if (success && error)` يفشل إذا كان الخطأ نصاً فارغاً `""` أو `0`. يُصوَّب باستخدام التحميل الزائد للدوال (`public static ok(): Outcome<void, never>; public static ok<T>(value: T): Outcome<T, never>;`) والفحص بـ `error !== undefined`.
  2. في `generateId.ts`: الدالة تُرجع `string` عاماً بدلاً من القالب النصي المخصص `` `${P}_${string}` `` وتغفل البادئتين `'snp'` و `'cda'`. يُصوَّب بتحويلها إلى دالة عامة `export function generateId<P extends EntityPrefix>(prefix: P): `${P}_${string}``.
  3. في `types.ts`: إضافة `version: number` و `created_at?: string` لواجهة `ICharacter`.

---

### `DB-16` [MEDIUM / متوسط — خلل بيئة اختبارات قاعدة البيانات] عيوب `packages/database/src/test/setup.ts` واستثناء الاختبارات من `tsconfig.json`
- **الملفات والأسطر:** [`setup.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/src/test/setup.ts#L10-L14) و [`setup.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/src/test/setup.ts#L41-L49) و [`tsconfig.json`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/tsconfig.json#L16)
- **التشخيص الذري والتصويب:**
  1. يستخدم `__dirname` داخل حزمة `"type": "module"` (يُصوَّب بـ `dirname(fileURLToPath(import.meta.url))`).
  2. لا يفعّل `this.db.pragma('foreign_keys = ON')`، لذلك لم تكتشف الاختبارات أخطاء القيود المرجعية في الهجرة `010` ولا في `ScenarioRepository`!
  3. يستبدل `query.replace(/\$(\d+)/g, '?')` حتى داخل الثوابت النصية؛ بينما يدعم `better-sqlite3` المعاملات المرقمة مباشرة عبر `query.replace(/\$(\d+)/g, '?$1')`.
  4. إزالة `"src/test/**/*"` من `exclude` في `tsconfig.json` وإصلاح المعرفات التجريبية غير المطابقة للأنواع في ملفات `*.test.ts`.

---

## الباب الثالث: طبقة حالات الاستخدام ومحرك الاستيراد والتصدير (`@scriptflow/application` و `@scriptflow/export`)

### `APP-01` [CRITICAL / حرج — فقدان بيانات واسع، تشويه أنواع، وانهيار `MERGE` / `OVERWRITE`] عشرة أخطاء قاتلة في `ImportProject.ts` و `Validator.ts`
- **الملفات والأسطر:** [`ImportProject.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/application/src/import/ImportProject/ImportProject.ts#L1-L690) و [`Validator.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/application/src/import/ImportProject/Validator.ts#L3-L25)
- **الكود المسبب للخلل:**
```ts
// ImportProject.ts:1
// @ts-nocheck

// ImportProject.ts:407-408
latitude: loc.latitude || 0,
longitude: loc.longitude || 0,

// ImportProject.ts:546, 553
revision_color: scene.revision_color || '',
estimated_duration: scene.estimated_duration || '',

// ImportProject.ts:197, 241, 303, 381 (اختطاف سجلات مشاريع أخرى في وضع MERGE!)
const charById = await charRepo.findById(char.id, tx);

// ImportProject.ts:608-648 (انهيار مؤكد في وضع MERGE!)
await scCharRepo.insert({ scene_id: newSceneId, character_id: newCharId } as any, tx);
await charRelRepo.insert({ id: newRelId, ... }, tx);
```
- **التشخيص الذري للعلل العشر:**
  1. **تعطيل TypeScript كلياً (`// @ts-nocheck` في السطر `1`):** أخفى جميع أخطاء الأنواع والحقول الناقصة في ملف من 696 سطراً.
  2. **تشويه نوع `estimated_duration` إلى نص فارغ `''`:** في الأسطر `553` و `580`، التعبير `scene.estimated_duration || ''` يخزن سلسلة نصية فارغة `''` في عمود رقمي `REAL DEFAULT 0` كلما كانت المدة `0` أو غير محددة، كما يخزن `revision_color: ''` بدلاً من `'WHITE'`.
  3. **تحويل الإحداثيات الفارغة إلى خط الاستواء/غرينتش `(0, 0)`:** الأسطر `407-408` و `426-427` تحول `null` إلى `0` بدلاً من `null`.
  4. **حذف صامت لحقول وجداول كاملة عند الاستيراد:**
     - يحذف `Validator.ts` (لعدم استخدام `.passthrough()`) حقول أغلفة المشروع (`include_master_cover`, `include_episode_covers`, `include_scene_covers`) وجداول `page_numbering`, `scene_reminders`, `location_documents`, `crew_day_assignments`.
     - يسقط استيراد الشخصيات (`322-370`) حقول شجرة النسب والـ RPG بالكامل: `father_id`, `mother_id`, `dramatic_pos_x`, `dramatic_pos_y`, `birth_date`, `death_date`, `is_deceased`, `metadata`!
     - يسقط استيراد المواقع (`398-436`) الحقل `parent_location_id` فيدمر هرمية المواقع الفرعية!
     - يسقط استيراد أيام التصوير (`481-500`) الأعمدة التسعة المضافة في الهجرة `007` (`title`, `day_type`, `primary_location_id`, `weather_forecast`, `call_time`, `wrap_time`, `estimated_cost`, `production_phase`, `week_number`)!
     - يسقط استيراد المشاهد (`532-584`) الحقول `page_count`, `source_scene_id`, `clone_type`، وينسخ مصفوفة `present_characters` النصية **دون إعادة ربط معرفات الشخصيات عبر `characterIdMap`**!
  5. **انهيار 100% في وضع الدمج (`MERGE`):** الخطوتان `9` (`scene_characters`) و `10` (`character_relationships`) تنفذان `INSERT` أعمى بدون التحقق من الوجود المسبق أو استخدام `INSERT OR IGNORE`، فترمي SQLite خطأ `UNIQUE constraint failed` وتلغي المعاملة بالكامل فور وجود أي علاقة أو شخصية مشهد مشتركة!
  6. **اختطاف بيانات سيناريو آخر في وضع `MERGE`:** يستدعي `findById(char.id, tx)` دون التحقق من `charById.scenario_id === newScenarioId`! فإذا دمج المستخدم ملفاً مستورداً داخل المشروع `B` بينما المشروع الأصلي `A` لا يزال موجوداً بنفس المعرفات، يقوم الكود **بتعديل سجلات المشروع `A`** بدلاً من إنشاء سجلات في المشروع `B`!
  7. **تصادم المفاتيح الأساسية في وضع `OVERWRITE` بين مشروعين:** عند الكتابة فوق المشروع `B` بملف صُدِّر من المشروع `A` الموجود محلياً، يعيد `OVERWRITE` استخدام معرفات الحلقات والشخصيات والمشاهد الأصلية فيصطدم بجدول المشروع `A`!
  8. **الدمج داخل مشروع محذوف في السلة:** `checkConflict` (السطر `43`) يطابق المشاريع المحذوفة ناعماً (`deleted_at IS NOT NULL`) ولا يعيد `deleted_at: null` عند التحديث، فيختفي المشروع بعد استيراده!
  9. **إهمال وسائط المعرض وصور المراجع:** الأسطر `117-141` لا تعالج وسائط `location_images` ولا `characters.reference_images`.
  10. **بادئات معرفات غير قياسية:** تستخدم `genId('ep')`, `genId('sd')`, `genId('asg')` بدلاً من `generateId('epi' | 'shd' | 'asn')` في `@scriptflow/core`.
- **التصويب الدقيق:**
  1. إزالة `// @ts-nocheck` واستخدام `generateId` من `@scriptflow/core`، وإضافة `.passthrough()` لمخططات `Zod` في `Validator.ts`.
  2. تصويب القيم الافتراضية: `estimated_duration: Number(scene.estimated_duration) || 0`، `revision_color: scene.revision_color || 'WHITE'`، `latitude: loc.latitude ?? null`، `longitude: loc.longitude ?? null`، و `deleted_at: null`.
  3. التحقق من ملكية السجل للمشروع الهدف قبل إعادة استخدام المعرف:
     ```ts
     const existing = id ? await repo.findById(id, tx) : null;
     const belongsToTarget = existing && existing.scenario_id === newScenarioId;
     const canReuseOriginalId = !existing;
     const finalId = belongsToTarget ? existing.id : (canReuseOriginalId && mode !== 'COPY' ? id : generateId(prefix));
     ```
  4. تنفيذ تمريرة ثانية (`Second Pass`) داخل نفس المعاملة لربط `father_id` و `mother_id` عبر `characterIdMap`، و `parent_location_id` عبر `locationIdMap`، و `source_scene_id` عبر `sceneIdMap`، وتحويل معرفات `present_characters`، مع حفظ كافة الأعمدة المفقودة واستخدام `INSERT OR IGNORE` في الجداول الوسيطة.

---

### `APP-02` [CRITICAL / حرج — انهيار مؤكد 100%] `CloneScene.execute` ينهار على كل مشهد يحتوي حواراً أو وصفاً (`no such column: character_name`)
- **الملف والأسطر:** [`CloneScene.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/application/src/clone/CloneScene/CloneScene.ts#L20-L55)
- **الكود المسبب للخلل:**
```ts
        const blocks = await this.blockRepo.getSceneBlocks(request.originalSceneId);
        for (const block of blocks) {
          const blockData = {
            ...(block as any),
            id: generateId('blk'),
            scene_id: newSceneId,
          };
          await this.blockRepo.insert(blockData as any, tx);
        }
```
- **التشخيص الذري وآلية العطل:**
  1. تُرجع `blockRepo.getSceneBlocks()` حقلاً محسوباً من الربط `c.name as character_name`. وبما أن `ScriptBlockRepository` يترك `allowedColumns = null`، فإن نشر الكائن `...(block as any)` يمرر `character_name` إلى `INSERT INTO script_blocks (..., character_name)`، **فينهار استنساخ أي مشهد غير فارغ بنسبة 100%** بخطأ `table script_blocks has no column named character_name`!
  2. ينسخ `...original` بيانات الجدولة القديمة (`shoot_day_id`, `planned_shoot_date`, `shoot_order`) ورقم النسخة `version` على المشهد المستنسخ الجديد، ويغفل نسخ جدول `scene_characters`!
- **التصويب الدقيق:**
```ts
        const { created_at: _ca, deleted_at: _da, ...restOriginal } = original;
        await this.sceneRepo.insert({
          ...restOriginal,
          id: newSceneId,
          title: `${original.title || ''} (${request.cloneType})`,
          episode_id: request.targetEpisodeId || null,
          shoot_day_id: null,
          planned_shoot_date: '',
          shoot_order: null,
          source_scene_id: request.originalSceneId as any,
          clone_type: request.cloneType,
          status: 'DRAFT',
          version: 1,
          deleted_at: null,
        } as any, tx);

        const blocks = await tx.select<any>(
          'SELECT character_id, type, content, metadata, sort_order FROM script_blocks WHERE scene_id = $1 ORDER BY sort_order ASC',
          [request.originalSceneId]
        );
        for (const block of blocks) {
          await this.blockRepo.insert({
            id: generateId('blk'),
            scene_id: newSceneId,
            character_id: block.character_id,
            type: block.type,
            content: block.content,
            metadata: block.metadata,
            sort_order: block.sort_order,
          }, tx);
        }

        await tx.execute(
          'INSERT OR IGNORE INTO scene_characters (scene_id, character_id) SELECT $1, character_id FROM scene_characters WHERE scene_id = $2',
          [newSceneId, request.originalSceneId]
        );
```

---

### `APP-03` [CRITICAL / حرج — فقدان صامت للحوار في النسخ المصدَّرة وحجز قفل الكتابة] علل `ExportProject.ts`
- **الملف والأسطر:** [`ExportProject.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/application/src/export/ExportProject/ExportProject.ts#L38-L99)
- **الكود المسبب للخلل:**
```ts
        const scenesWithBlocks = await Promise.all(scenes.map(async (scene) => {
          try {
            const blocks = await this.blockRepo.getSceneBlocks(scene.id);
            return { ...scene, blocks };
          } catch (e) {
            console.warn(`Failed to fetch blocks for scene ${scene.id}`, e);
            return { ...scene, blocks: [] };
          }
        }));
        ...
        const result = await strategy.export(payload);
        return Outcome.ok(result);
```
- **التشخيص الذري وآلية العطل:**
  1. **تصدير مشاهد فارغة بصمت:** في حال حدوث خطأ عابر أثناء قراءة كتل مشهد (`SQLITE_BUSY` مثلاً)، يبتلع الكود الخطأ ويعوضه بـ `blocks: []` ثم يُرجع `Outcome.ok`، فيحصل المستخدم على ملف نسخة احتياطية يظنه سليماً بينما حواره ممسوح!
  2. **عاصفة استعلامات `N+1` خارج `tx` + قفل طابور الكتابة أثناء ضغط `ZIP`:** يشغل `strategy.export(payload)` (بما فيه ضغط ملفات الفيديو والصور عبر `JSZip`) **داخل** `withTransaction` فيوقف كافة عمليات الحفظ في التطبيق طوال فترة الضغط!
  3. يرمي استثناءً `throw new DomainError` في `catch` بدلاً من إرجاع `Outcome.fail(...)`، ويغفل تصدير `page_numbering`, `scene_reminders`, `location_documents`, `crew_day_assignments`.
- **التصويب الدقيق:** استخدام `blockRepo.getBlocksForScenes(sceneIds)` دفعة واحدة بدون ابتلاع الأخطاء، وإخراج `await strategy.export(payload)` خارج المعاملة بعد اكتمال القراءة، وإرجاع `Outcome.fail(...)` عند الفشل.

---

### `APP-04` [CRITICAL / حرج — تجميد المعالج على الفيديوهات، انهيار `*_mime`، واختراق المسارات] ثماني علل في حزمة `packages/export-engine`
- **الملفات والأسطر:**
  - [`mediaProcessor.js`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/export-engine/src/media/mediaProcessor.js#L16-L58)
  - [`packageManager.js`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/export-engine/src/sflow/packageManager.js#L10-L179)
  - [`jsonExporter.js`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/export-engine/src/json/jsonExporter.js#L23-L36)
  - [`package.json`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/export-engine/package.json#L1-L18)
- **الكود المسبب للخلل:**
```js
// mediaProcessor.js:22, 29-35
const mimeMatch = dataUri.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9\-.+]+).*,/);
const base64Data = dataUri.split(',')[1];
...
obj[field] = `media/${filename}`;
obj[`${field}_mime`] = mime;
```
- **التشخيص الذري للعلل الثماني:**
  1. **تراجع كارثي للتعبير النمطي (`Catastrophic Regex Backtracking`) وتقطيع البيانات:** التعبير الجشع `.*,` يمسح كامل سلسلة فيديو `cover_video` بحجم `50 MB` (`50,000,000` حرف) حتى آخرها ثم يتراجع حرفاً بحرف! كما أن `dataUri.split(',')[1]` يبتر أي `Data URI` غير مشفرة بـ `base64` تحتوي على فواصل (مثل `SVG`).
  2. **بقايا مفاتيح `*_mime` تفجر إدراج SQLite:** تحقن `extractMedia` خصائص مؤقتة مثل `cover_image_mime` و `actor_photo_mime` على الكائن؛ وفي `restoreMedia` (السطر `52`) لا يُحذف المفتاح `delete obj[\`${field}_mime\`]` إلا إذا وُجد الملف داخل الأرشيف! فإذا فُقد ملف صورة واحد، يبقى `actor_photo_mime` على الكائن وينهار SQLite بـ `no such column: actor_photo_mime`!
  3. **عبور المسارات (`Path Traversal`) وحقن `MIME` وقنابل الضغط (`ZIP Bomb`):** الشرط `mediaPath.startsWith('media/')` يقبل `media/../project.json`، ولا يتحقق `parsePackage` من الحجم غير المضغوط للملفات قبل فك ضغطها في الذاكرة، ولا يتحقق من سلامة `mime` قبل بناء `data:${mime};base64,...`.
  4. **انهيار مؤشر فارغ (`TypeError`) عند غياب `scenario`:** `parseJSON("null")` في `jsonExporter.js:31` و `parsePackage` في `packageManager.js:95, 116` ينهاران بـ `Cannot read properties of null/undefined` لغياب التحقق المسبق ولعدم إحاطة `JSON.parse` بـ `try/catch`.
  5. **فشل `zip.generateAsync({ type: 'blob' })` في بيئة `Node/Vitest`** وعدم وجود ملفات تعريف أنواع `.d.ts` للحزمة.
- **التصويب الدقيق في `mediaProcessor.js`:**
```js
const SAFE_MIME = /^[a-zA-Z0-9]+\/[a-zA-Z0-9\-.+]+$/;

export function extractMedia(obj, field, prefix) {
  if (!obj || typeof obj !== 'object') return null;
  const dataUri = obj[field];
  if (typeof dataUri !== 'string' || !dataUri.startsWith('data:')) return null;

  const commaIdx = dataUri.indexOf(',');
  if (commaIdx === -1) return null;

  const header = dataUri.slice(5, commaIdx);
  if (!header.toLowerCase().includes(';base64')) return null;

  const rawMime = header.split(';')[0] || 'application/octet-stream';
  const mime = SAFE_MIME.test(rawMime) ? rawMime : 'application/octet-stream';
  let ext = (mime.split('/')[1] || 'bin').split('+')[0].replace(/[^a-zA-Z0-9]/g, '') || 'bin';
  if (ext === 'jpeg') ext = 'jpg';

  const safeId = String(obj.id || crypto.randomUUID()).replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${prefix}_${safeId}.${ext}`;
  const base64Data = dataUri.slice(commaIdx + 1);

  obj[field] = `media/${filename}`;
  obj[`${field}_mime`] = mime;
  return { filename, base64Data };
}

export async function restoreMedia(obj, field, readFileAsBase64) {
  if (!obj || typeof obj !== 'object') return;
  const rawMime = obj[`${field}_mime`];
  delete obj[`${field}_mime`]; // يُحذف دائماً بلا شروط

  const mediaPath = obj[field];
  if (typeof mediaPath !== 'string' || !mediaPath.startsWith('media/') || mediaPath.includes('..')) return;

  const base64Data = await readFileAsBase64(mediaPath);
  const mime = typeof rawMime === 'string' && SAFE_MIME.test(rawMime) ? rawMime : 'application/octet-stream';
  obj[field] = base64Data ? `data:${mime};base64,${base64Data}` : '';
}
```

---

### `APP-05` [HIGH / عالٍ — مسح المعرف المولد وإفساد الترتيب والإحصائيات] علل `ManageCrew`، `ManageTimeline`، `GenerateStatistics`، و `PluginRegistry`
- **الملفات والأسطر والتصويبات الدقيقة:**
  1. [`ManageCrew.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/application/src/crew/ManageCrew/ManageCrew.ts#L68): التعبير `return { id: memberId, ...crewData }` ينشر `...crewData` **بعد** `id: memberId`! فإذا مرر المستدعي `{ id: undefined, name: 'أحمد' }` يُستبدل المعرف المولد بـ `undefined`! **التصويب:** `return { ...crewData, id: memberId };`، وتحديث `syncAssignments` (الأسطر `10-22`) ليحافظ على `episode_id` ويستخدم `generateId('asn')`.
  2. [`ManageTimeline.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/application/src/timeline/ManageTimeline/ManageTimeline.ts#L14): `ORDER BY COALESCE(shoot_order, scene_number) ASC` معطل لأن القيمة الافتراضية لـ `shoot_order` هي `0` لا `NULL`. **التصويب:** `ORDER BY CASE WHEN shoot_order IS NOT NULL AND shoot_order > 0 THEN shoot_order ELSE scene_number END ASC, scene_number ASC`.
  3. [`GenerateStatistics.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/application/src/statistics/GenerateStatistics/GenerateStatistics.ts#L105) و [`GenerateStatistics.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/application/src/statistics/GenerateStatistics/GenerateStatistics.ts#L155-L270) و [`GenerateStatistics.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/application/src/statistics/GenerateStatistics/GenerateStatistics.ts#L376-L428):
     - السطر `105` يفحص نوعي `'CAMERA'` و `'AUDIO'` غير الموجودين في `ScriptBlockType` ويغفل `'SHOT'`! **التصويب:** `['SHOT', 'TRANSITION', 'ACTION']`.
     - يفهرس مصفوفة التفاعل `interactionMatrix` بأسماء الشخصيات `c.name` مقسمة بـ `'::'` بدلاً من `c.id` فيدمج الشخصيات متشابهة الأسماء.
     - `executeGlobalStats` (الأسطر `376-382`) يحصي مشاهد وشخصيات ومواقع المشاريع المحذوفة في السلة (`scenarios.deleted_at IS NOT NULL`)! **التصويب:** إضافة `AND scenario_id IN (SELECT id FROM scenarios WHERE deleted_at IS NULL)`.
  4. [`PluginRegistry.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/application/src/plugins/PluginRegistry.ts#L27-L41): يبتلع أخطاء `plugin.onInit` دون إرجاع فشل أو إعادة رمي الخطأ.

---

## الباب الرابع: محرك كتابة السيناريو، الترقيم، الطباعة `PDF`، العمال الخلفيون، والوسائط (`apps/desktop`)

### `EDT-01` [CRITICAL / حرج — حذف وإعادة إدراج كامل جدول الكتل كل 1.2 ثانية خارج معاملة!] إسقاط سمة `block_id` في جميع إضافات `TipTap` التسع
- **الملفات والأسطر:**
  - [`ActionNode.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/paper/extensions/ActionNode.ts#L3-L27)، [`DialogueNode.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/paper/extensions/DialogueNode.ts#L3-L62)، [`ParentheticalNode.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/paper/extensions/ParentheticalNode.ts#L3-L52)، [`TransitionNode.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/paper/extensions/TransitionNode.ts#L3-L27)، [`ShotNode.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/paper/extensions/ShotNode.ts#L3-L27)، [`AudioNode.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/paper/extensions/AudioNode.ts#L3-L27)، [`DirectorNoteNode.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/paper/extensions/DirectorNoteNode.ts#L3-L36)، [`TextNode.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/paper/extensions/TextNode.ts#L3-L35)، [`CharacterNode.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/paper/extensions/CharacterNode.ts#L10-L19)
  - [`bridge.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/paper/bridge.ts#L160-L183) و [`SceneEditor.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/pages/SceneEditor.tsx#L646-L686)
- **التشخيص الذري وآلية العطل:**
  1. يمرر `blocksToTiptap` في `bridge.ts` السمة `attrs: { block_id: block.id }`، ويحاول `tiptapToBlocks` استعادتها عبر `node.attrs?.block_id || generateId()`، **إلا أن أياً من عقد `TipTap` التسع لا يُعرِّف `block_id` داخل `addAttributes()`**!
  2. يقوم `ProseMirror` تلقائياً بتجريد وحذف كافة السمات غير المعرّفة فور تحميل النص، فتولد كل ضغطة زر في `PaperEditor` معرفات `UUID` جديدة بالكامل لكل كتلة في المشهد!
  3. عندها لا تجد `saveBlocksToDb` (`SceneEditor.tsx:653-686`) أي معرف مطابق في قاعدة البيانات، فتقوم **في كل حفظ تلقائي (كل 1.2 ثانية)** بحذف كل صف في `script_blocks` واحداً تلو الآخر ثم إعادة إدراجها بالكامل **خارج معاملة SQLite (`withTransaction`)**! أي إغلاق مفاجئ أو تعارض قفل أثناء الحلقة يمحو نصف حوار المشهد للأبد!
- **التصويب الدقيق:**
  1. تعريف `block_id` و `metadata` مع الخيار الحتمي `keepOnSplit: false` (لمنع تكرار نفس المفتاح الأساسي عند شطر الفقرة بـ `Enter`!) في جميع العقد التسع:
```ts
  addAttributes() {
    return {
      block_id: { default: null, keepOnSplit: false },
      metadata: { default: null, keepOnSplit: false },
    };
  },
```
  2. إضافة حارس منع تكرار المعرفات `seenIds = new Set<string>()` داخل `tiptapToBlocks`، ونقل منطق `saveBlocksToDb` بالكامل إلى دالة ذرية واحدة داخل `withTransaction` في `ScriptBlockRepository`.

---

### `EDT-02` [CRITICAL / حرج — تضاعف `&amp;` اللانهائي، مسح مدة الكتل، ودمج الأسطر] خمس علل تدميرية في جسر التحويل `bridge.ts`
- **الملف والأسطر:** [`bridge.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/paper/bridge.ts#L50-L113) و [`bridge.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/paper/bridge.ts#L215-L315)
- **الكود المسبب للخلل:**
```ts
// bridge.ts:52-54 & 109-112
if (!html.includes('<')) {
  return [{ type: 'text', text: html }]; // يتخطى فك ترميز &amp; و &gt;!
}
...
text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
```
- **التشخيص الذري للعلل الخمس:**
  1. **تضاعف `&amp;` في كل حفظ:** عندما يكتب الكاتب نصاً يحتوي على `&` أو `>` بدون وسم `<` (مثل `"أحمد & سارة"`), يحوله `tiptapContentToHtml` إلى `"أحمد &amp; سارة"`. وعند إعادة القراءة، يتحقق الشرط `!html.includes('<')` فيعيده كنص خام دون فك الكيانات، وفي الحفظ التالي يصبح `"أحمد &amp;amp; سارة"` ثم `"&amp;amp;amp;"` إلى ما لا نهاية!
  2. **تدمير زمن الكتلة المخصص (`duration`):** يخزن `SmartEditor.tsx:235` زمن الكتلة في `metadata`، لكن `tiptapToBlocks` يستبدل `metadata` بـ `JSON.stringify(tone ? { tone } : {})` فيمسح كافة الأزمنة المخصصة فور الكتابة في المحرر الورقي!
  3. **دمج الأسطر والفقرات:** يتجاهل `htmlToTiptapContent` (الأسطر `75-92`) وسوم `<br>` وحدود `<p>...</p>` التي ينتجها `RichTextEditor` فيدمج السطرين بلا مسافة (`"سطر 1سطر 2"`).
  4. **مسح `character_id` للشخصيات ذات الأقواس:** التعبير `charName.replace(/\s*\([^)]+\)$/, '')` يقتطع الأسماء التي تضم توصيفاً بين قوسين مثل `"أحمد (الشاب)"` فيفشل البحث عن اسم الشخصية ويصفر `character_id: null` متجاهلاً `node.attrs.character_id`.
  5. **تحويل عقدة الشخصية المنفردة إلى `ACTION` (الأسطر `262-272`):** إذا أضاف الكاتب اسم شخصية وتوقف لثانية قبل كتابة الحوار، يحولها `tiptapToBlocks` إلى كتلة وصف حدث `ACTION`!
- **التصويب الدقيق:**
  1. تعديل الشرط في السطر `52` إلى `if (!html.includes('<') && !html.includes('&'))`، ومعالجة `<br>` وحدود `<p>` بإدراج `'\n'`.
  2. دمج `metadata` السابقة المحفوظة على العقدة بدلاً من الكتابة فوقها، وإعطاء الأولوية لـ `node.attrs?.character_id`، والحفاظ على عقدة `character` المنفردة ككتلة `DIALOGUE` فارغة المحتوى بدلاً من تحويلها إلى `ACTION`.

---

### `EDT-03` [CRITICAL / حرج — تعطل زر `Enter` وغياب التراجع `Ctrl+Z` نهائياً!] استدعاء `splitBlock({ type })` الخاطئ في العقد التسع وإغفال `History`/`UndoRedo` في `PaperEditor`
- **الملفات والأسطر:**
  - [`CharacterNode.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/paper/extensions/CharacterNode.ts#L39-L60)، [`ParentheticalNode.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/paper/extensions/ParentheticalNode.ts#L23-L44)، [`DialogueNode.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/paper/extensions/DialogueNode.ts#L33-L53)، وبقية العقد الست، بالإضافة إلى [`PaperEditor.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/paper/PaperEditor.tsx#L127-L176)
- **الكود المسبب للخلل:**
```ts
// CharacterNode.ts:39-42
Enter: ({ editor }) => {
  return (editor.commands as any).splitBlock({ type: 'dialogue' });
},
```
- **التشخيص الذري وآلية العطل:**
  1. **تعطل الانتقال التلقائي بـ `Enter` في كل عقد السيناريو:** استخدم المطور `(editor.commands as any)` لإخفاء خطأ المترجم؛ فالدالة `splitBlock` في `TipTap` لا تقبل إلا `{ keepMarks?: boolean }` **وتتجاهل خاصية `{ type: 'dialogue' }` تماماً**! لذا فإن الضغط على `Enter` بعد كتابة اسم الشخصية ينشئ سطراً جديداً من نوع **شخصية** لا **حوار**، والضغط على `Enter` بعد الانتقال أو اللقطة يكرر نفس النوع بدلاً من التحول إلى `action`!
  2. **غياب التراجع والإعادة (`Ctrl+Z` / `Ctrl+Y`) وكسر السطر (`Shift+Enter`):** يسجل `PaperEditor.tsx:127-176` الإضافتين الأساسيتين `Document` و `Text` يدوياً بدلاً من `StarterKit`، **ويغفل تسجيل إضافة `UndoRedo` (`History`) وإضافة `HardBreak`**! الضغط على `Ctrl+Z` داخل ورقة السيناريو لا يفعل أي شيء إطلاقاً!
  3. **خلل `Backspace` في أول كتلة بالمستند (`beforePos === 0`):** في `CharacterNode:54` و `DialogueNode:47` و `ParentheticalNode:38`، يستدعي `.focus(beforePos - 1)` أي `focus(-1)` ويحاول حذف العقدة الوحيدة من المستند فيرفض `ProseMirror` العملية ويعلق المؤشر!
- **التصويب الدقيق:**
```ts
// 1. في CharacterNode.ts و ParentheticalNode.ts:
Enter: ({ editor }) => editor.chain().splitBlock().setNode('dialogue').run(),

// 2. في DialogueNode, TransitionNode, ShotNode, AudioNode, DirectorNoteNode, TextNode:
Enter: ({ editor }) => editor.chain().splitBlock().setNode('action').run(),

// 3. تصويب Backspace عند بداية المستند:
if (parentSize === 0) {
  if (beforePos === 0) return editor.commands.setNode('action');
  return editor.chain()
    .deleteRange({ from: beforePos, to: beforePos + $anchor.parent.nodeSize })
    .focus(Math.max(1, beforePos - 1))
    .run();
}
```
وتسجيل `StarterKit.configure({ document: false, paragraph: false, text: false, heading: false, bulletList: false, orderedList: false, listItem: false, blockquote: false, codeBlock: false, horizontalRule: false, bold: false, italic: false, underline: false })` في `PaperEditor.tsx` لتفعيل `History` (`Ctrl+Z`/`Ctrl+Y`) و `HardBreak` (`Shift+Enter`).

---

### `EDT-04` [CRITICAL / حرج — حلقة تغذية راجعة وسباق كتابة مزدوج] `RichTextEditor` يطلق `onUpdate` تلقائياً عند التهيئة فيلوث المشاهد غير المعدلة!
- **الملفات والأسطر:** [`RichTextEditor.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/ui/RichTextEditor.tsx#L175-L182) و [`SceneEditor.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/pages/SceneEditor.tsx#L957-L971)
- **الكود المسبب للخلل:**
```tsx
  useEffect(() => {
    if (editor && !editor.isFocused) {
      const currentHtml = editor.getHTML();
      if (value !== currentHtml) {
        editor.commands.setContent(value || ''); // في TipTap v3 يطلق onUpdate افتراضياً!
      }
    }
  }, [value, editor]);
```
- **التشخيص الذري وآلية العطل:**
  يعرض `SceneEditor` كلاً من `SmartEditor` (الذي ينشئ `RichTextEditor` لكل كتلة) و `PaperEditor` في آنٍ واحد. يخرج `PaperEditor` نصاً بدون `<p>` بينما يغلفه `RichTextEditor` بـ `<p>...</p>`، فيتحقق الشرط `value !== currentHtml` لكل الكتل، وتستدعي `setContent(value || '')` التي في **TipTap v3** تطلق حدث `onUpdate` افتراضياً (`emitUpdate: true`)! فتنطلق فوراً عشرات استدعاءات `debouncedUpdateBlock` لمشهد لم يلمسه المستخدم أصلاً، وتتصادم مع `AutosaveQueue`!
- **التصويب الدقيق:** تمرير الخيار الصريح `editor.commands.setContent(value || '', { emitUpdate: false });` في السطر `179` من `RichTextEditor.tsx`، وعدم تعيين `setSaveStatus('saved')` في `updateBlock` إذا كان `autosaveQueueRef.current` لا يزال يحمل عناصر معلقة.

---

### `EDT-05` [CRITICAL / حرج — ابتلاع أخطاء الحفظ عند التنقل بين المشاهد وفقدان تعديلات أول 600ms] علل `AutosaveQueue.flush()` وحارس `isSettledRef` وحارس إغلاق النافذة
- **الملفات والأسطر:**
  - [`AutosaveQueue.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/utils/AutosaveQueue.ts#L66-L141)
  - [`SceneEditor.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/pages/SceneEditor.tsx#L140-L143) و [`SceneEditor.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/pages/SceneEditor.tsx#L181-L228) و [`SceneEditor.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/pages/SceneEditor.tsx#L1200-L1205)
- **التشخيص الذري وآلية العطل:**
  1. **`AutosaveQueue.flush()` يبتلع كافة الأخطاء:** يستخدم `Promise.allSettled` ولا يرمي الخطأ عند الفشل، كما لا ينتظر العملية الجارية حالياً إذا كان `this.isSaving === true` (لأن العنصر سُحب مسبقاً بـ `queue.shift()`!). ولذلك فإن كود منع الانتقال عند فشل الحفظ في `SceneNavigator` (`try { await autosaveQueueRef.current.flush(); navigate(...) } catch { ... }`) **لا يعمل أبداً** وينتقل المستخدم فاقداً تعديلاته!
  2. **ضياع تعديلات أول `600ms` (`SceneEditor.tsx:1200-1205`):** إذا بدأ المستخدم الكتابة سريعاً قبل انقضاء مؤقت `600ms` الخاص بـ `isSettledRef`، يحدث الكود `lastSavedBlocksJsonRef.current = JSON.stringify(newBlocks)` ويخرج بـ `return` دون حفظ!
  3. **تأخر `event.preventDefault()` في `onCloseRequested` (`SceneEditor.tsx:187-216`):** في `Tauri v2`، يجب استدعاء `event.preventDefault()` **بشكل متزامن قبل أول `await`**؛ استدعاؤه بعد `await tauriConfirm(...)` يسمح بإغلاق النافذة قبل ظهور مربع الحوار أصلاً!
- **التصويب الدقيق:**
  1. في `AutosaveQueue.ts`: حفظ مرجع `activeSavePromise` وانتظاره في `flush()`، وتنفيذ العناصر بالتسلسل ورمي أول خطأ عند الفشل.
  2. حذف حيلة `isSettledRef` المؤقتة (بعد إصلاح `emitUpdate: false` في `EDT-04`).
  3. في `onCloseRequested`: استدعاء `event.preventDefault()` فور التحقق من `saveStatusRef.current === 'unsaved'` قبل `await tauriConfirm(...)`، وعند موافقة المستخدم على الخروج استدعاء `await appWindow.destroy()` بعد اكتمال حفظ لقطة الطوارئ.

---

### `EDT-06` [CRITICAL / حرج — تحطيم المعرفات النصية إلى `NaN` و `"[null]"`] `SceneMetadataForm.tsx` يحول معرفات الحلقات والمواقع والشخصيات بـ `parseInt(..., 10)`
- **الملف والأسطر:** [`SceneMetadataForm.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/SceneMetadataForm.tsx#L103-L112) و [`SceneMetadataForm.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/SceneMetadataForm.tsx#L140) و [`SceneMetadataForm.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/SceneMetadataForm.tsx#L174-L177) و [`SceneMetadataForm.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/SceneMetadataForm.tsx#L387)
- **الكود المسبب للخلل:**
```tsx
// SceneMetadataForm.tsx:104, 140, 174-175, 387
const id = parseInt(String(charId), 10);
...
onChange={e => onSceneChange('episode_id', e.target.value ? parseInt(e.target.value, 10) : null)}
...
onSceneChange('location_id', val ? parseInt(val, 10) : null);
const loc = locations.find(l => l.id === parseInt(val, 10));
...
const isPresent = presentCharsIds.includes(parseInt(String(char.id), 10));
```
- **التشخيص الذري وآلية العطل:**
  جميع المعرفات في النظام سلاسل نصية مبادأة (`"epi_..."`, `"loc_..."`, `"chr_..."`). تطبيق `parseInt("loc_abc", 10)` يُنتج **`NaN`**!
  - اختيار حلقة أو موقع من تبويب بيانات المشهد يحفظ `episode_id: NaN` و `location_id: NaN`، ولا يعثر أبداً على `loc` لأن `l.id === NaN` دائماً `false`!
  - اختيار أي شخصية حاضرة يحولها إلى `NaN` وعند `JSON.stringify([NaN])` يُكتب في قاعدة البيانات النص **`"[null]"`**!
- **التصويب الدقيق:** استبدال جميع استدعاءات `parseInt(..., 10)` بتحويل نصي نظيف `String(...)`:
```tsx
const toggleCharacterPresence = (charId: string | number) => {
  const id = String(charId);
  const newIds = presentCharsIds.includes(id)
    ? presentCharsIds.filter(i => i !== id)
    : [...presentCharsIds, id];
  onSceneChange('present_characters', JSON.stringify(newIds));
};
// للحلقة والموقع:
onChange={e => onSceneChange('episode_id', e.target.value || null)}
onSceneChange('location_id', val || null);
const loc = locations.find(l => String(l.id) === val);
const isPresent = presentCharsIds.includes(String(char.id));
```

---

### `EDT-07` [CRITICAL / حرج — أمني `DOM & Stored XSS`] حقن HTML غير معقم في `PaginationExtension.ts` و `ScenePaperRenderer.tsx` و `exportPDF.tsx`
- **الملفات والأسطر:**
  - [`PaginationExtension.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/paper/extensions/PaginationExtension.ts#L87-L116)
  - [`ScenePaperRenderer.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/ScenePaperRenderer.tsx#L56-L114)
  - [`exportPDF.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/utils/exportPDF.tsx#L392-L403)
  - [`htmlUtils.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/utils/htmlUtils.ts#L5-L16)
- **التشخيص الذري وآلية العطل:**
  1. تبني `PaginationExtension.ts` ترويسة الصفحات الثانية فما فوق عبر `el.innerHTML = \`... ${options.scene?.title} ... ${options.scene?.location_name} ...\`` دون أي تهريب لمحارف HTML!
  2. يحقن `ScenePaperRenderer.tsx` محتوى الكتل السبع عبر `dangerouslySetInnerHTML={{ __html: b.content }}` دون تعقيم، ويحقن `exportPDF.tsx` نص العلامة المائية `watermarkText` وعنوان السيناريو `scenarioTitleVal` مباشرةً داخل وثيقة `iframe` تتمتع بصلاحيات نفس الأصل (`Same-Origin`) مع جسر Tauri IPC!
  3. في `htmlUtils.ts:9-11`، يجري فك ترميز `&amp;` **قبل** `&lt;` و `&gt;` مما يحول الترميز المزدوج `&amp;lt;script&amp;gt;` إلى وسم `<script>` حي!
- **التصويب الدقيق:**
  1. إضافة دالتين قياسيتين في `htmlUtils.ts`: دالة `escapeHtml(str)` لتعقيم النصوص الصرفة في `PaginationExtension.ts` و `exportPDF.tsx`، ودالة `sanitizeInlineHtml(html)` المعتمدة على `DOMParser` مع قائمة بيضاء صارمة تقتصر على `['B', 'STRONG', 'I', 'EM', 'U', 'MARK', 'BR', 'P']` وحذف جميع السمات (`attributes`) قبل تمريرها إلى `dangerouslySetInnerHTML` في `ScenePaperRenderer.tsx`.
  2. في `stripHtml`، استخدام `DOMParser` واسترجاع `body.textContent` بدلاً من التعابير النمطية.

---

### `EDT-08` [CRITICAL / حرج — عبور المسارات `Path Traversal`] عدم تطهير أسماء الملفات ومعرفات المشاريع في `mediaStorage.ts` و `BackupService.ts`
- **الملفات والأسطر:** [`mediaStorage.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/services/mediaStorage.ts#L114-L122) و [`mediaStorage.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/services/mediaStorage.ts#L169-L186) و [`BackupService.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/services/BackupService.ts#L61-L62) و [`BackupService.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/services/BackupService.ts#L123-L128)
- **التشخيص الذري والتصويب:** تقبل `resolveMediaUrl` و `getAbsoluteFilePath` و `deleteMediaFile` روابط بصيغة `project-media://../../...` دون تنقية مقاطع `..`، مما يتيح لحزمة مستوردة خبيثة تسريب ملفات محلية عند إعادة تصديرها عبر `packageService.prepareDataForExport` أو حذف ملفات خارج المجلد. **التصويب:** فرض دالة تطهير `sanitizePathSegment(seg)` ترفض أي مقطع يحتوي على `..` أو `/` أو `\` في كلتا الخدمتين، والتحقق من لاحقة `.bak.db` في `deleteBackup`.

---

### `EDT-09` [HIGH / عالٍ — انحراف حساب الأسطر والصفحات عن العرض الفعلي] ستة أخطاء رياضية وهندسية في `TextMeasurementEngine.ts` و `PaginationExtension.ts` و `ExportWorker.ts`
- **الملفات والأسطر:**
  - [`TextMeasurementEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/TextMeasurementEngine.ts#L47-L76) و [`TextMeasurementEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/TextMeasurementEngine.ts#L123-L167) و [`TextMeasurementEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/TextMeasurementEngine.ts#L240-L275)
  - [`PaginationExtension.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/paper/extensions/PaginationExtension.ts#L22-L127)
  - [`ScenePaperRenderer.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/ScenePaperRenderer.tsx#L97-L109)
  - [`ExportWorker.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/workers/ExportWorker.ts#L21-L32) و [`ExportWorker.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/workers/ExportWorker.ts#L161-L176)
- **التشخيص الذري للأخطاء الستة والتصويب:**
  1. **فشل مطابقة مفاتيح الخطوط `FONTS`:** مفاتيح الكائن `FONTS` مكتوبة بصيغة `camelCase` (`directorNote`, `textOnScreen`, `textNode`)، بينما يحول المحرك نوع الكتلة عبر `blockType.toLowerCase()` (`'directornote'`, `'director_note'`, `'textonscreen'`, `'text'`) فلا يطابق أياً منها أبداً ويقيسها جميعاً بخط `action` (`16px` بدلاً من `14px`)! **التصويب:** تحويل جميع مفاتيح `FONTS` إلى حروف صغيرة شاملة للصيغتين (`directornote`, `director_note`, `textonscreen`, `text`).
  2. **تجاهل عرض `.paper-node-text` (`70%`) وحشوة `.paper-node-character` (`48px`) وتباعد الأحرف `letter-spacing`:** يقيس المحرك عقدة النص على الشاشة بعرض كامل `602px` بينما عرضها الفعلي في [`paper-editor.css`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/paper/paper-editor.css#L253-L260) هو `407.4px` فقط! **التصويب:** ضبط العروض الفعلية بدقة وتمرير `letterSpacing` لسياق الـ `Canvas`.
  3. **إضافة نصوص غير مقيسة في `ScenePaperRenderer.tsx:99, 106`:** يضيف العارض البادئة `":: SFX - ... ::"` و `"(ملاحظة إخراجية: ...)"` عند الطباعة دون وجودها في المحرر أو محرك القياس، فتلتف الأسطر الطويلة لسطر `34` وتُقص في أسفل الصفحة (`overflow: hidden`). **التصويب:** إزالة النصوص الزائدة أو قياسها ضمن `measureBlockLines`.
  4. **تجاهل فواصل الأسطر الصريحة `\n` و `<br>` وكيانات `&nbsp;` والكلمات المتصلة الطويلة:** يقسم `measureBlockLines` النص بـ `.split(' ')` فقط فيحسب فقرة من 5 أسطر مفصولة بـ `\n` كسطر واحد! **التصويب:** تحويل `<br>` و `</p><p>` إلى `\n`، وفك كيانات HTML، وتقسيم النص على `\n` أولاً ثم قياس التفاف كل سطر على حدة.
  5. **خلل منع اليتم (`Orphan Control`) وإزاحة `28px` وصفحة أولى فارغة:** لا يحمي المحرك تتابع `character -> parenthetical -> dialogue` ولا `shot`، ويخزن `PaginationExtension.ts:127` القيمة `lastNodeLines = nodeLines` بدلاً من `currentBlockLines` مسبباً إزاحة `28px`، كما يدفع `groupBlocksByPage` صفحة أولى فارغة تماماً `blocks: []` إذا تجاوزت الكتلة الأولى `30` سطراً! **التصويب:** حفظ `lastNodeLines = currentBlockLines`، وسحب مجموعة (`character` + `parenthetical`) معاً، ومنع دفع صفحة فارغة عندما تكون `currentPageBlocks.length === 0`.
  6. **ثبات خيارات `PaginationExtension` القديمة ومعادلة `ExportWorker` الخاطئة:** لا يحدث `PaperEditor` كائن `options.scene` في `PaginationExtension` عند تعديل عنوان المشهد أو توقيته، ولا يترجم `INT/EXT` و `DAWN`/`DUSK` إلخ؛ بينما يحسب `ExportWorker.precalculatePagination` الصفحات بمعادلة بدائية تغفل أسماء الشخصيات وترويسات الصفحات التالية! **التصويب:** مزامنة `pagExt.options.scene = scene` عبر `useEffect` في `PaperEditor.tsx` واستدعاء `expandBlocksToLayoutNodes` + `groupBlocksByPage` داخل `ExportWorker`.

---

### `EDT-10` [HIGH / عالٍ — العمال الخلفيون يعملون على الخيط الرئيسي 100% وتسرب خيوط النظام] علل `useExportWorker` و `useStatsWorker` و `WorkerFactory`
- **الملفات والأسطر:** [`useExportWorker.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/hooks/useExportWorker.ts#L2) و [`useStatsWorker.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/hooks/useStatsWorker.ts#L2) و [`WorkerFactory.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/workers/WorkerFactory.ts#L11-L36) و [`TextMeasurementEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/TextMeasurementEngine.ts#L82-L89)
- **التشخيص الذري وآلية العطل:**
  1. يستورد كلٌّ من `useExportWorker.ts` و `useStatsWorker.ts` الكائنين `ExportWorker` و `StatsWorker` مباشرةً على الخيط الرئيسي للواجهة، بينما لا يستدعي أي ملف في المشروع بأكمله المصنع `workerFactory`!
  2. في `WorkerFactory.terminateAll()`، استدعاء `w[Comlink.releaseProxy]()` يغلق قناة `MessagePort` فقط **ولا يستدعي `rawWorker.terminate()`**، فتبقى خيوط النظام حية في الخلفية!
  3. إذا شُغِّل `TextMeasurementEngine` داخل `Web Worker` حقيقي، تفشل `getContext()` لأن `typeof document === 'undefined'` ولا تستخدم `OffscreenCanvas`!
- **التصويب الدقيق:** الاحتفاظ بمرجع `Worker` الأصلي في `WorkerFactory` واستدعاء `rawWorker.terminate()`، وربط `useExportWorker` و `useStatsWorker` بـ `workerFactory`، ودعم `new OffscreenCanvas(1, 1).getContext('2d')` في `TextMeasurementEngine.ts`.

---

### `EDT-11` [HIGH / عالٍ — بتر التنزيلات وتجميد الذاكرة ونقص وسائط التصدير] علل `packageService.ts` و `exportStrategies.ts`
- **الملفات والأسطر:** [`packageService.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/services/api/packageService.ts#L15-L92) و [`exportStrategies.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/services/exportStrategies.ts#L102-L108)
- **التشخيص الذري والتصويب:**
  1. **إلغاء رابط `Blob` قبل بدء التنزيل:** استدعاء `window.URL.revokeObjectURL(url)` في السطر التالي مباشرةً لـ `a.click()` يلغي الكائن قبل أن يبدأ `WebView2` عملية التنزيل غير المتزامنة! **التصويب:** إلحاق `a` بـ `document.body` وتأخير `revokeObjectURL` عبر `setTimeout(..., 10_000)` (أو الحفظ المباشر عبر حوار `save()` من `@tauri-apps/plugin-dialog`).
  2. **تجميد الواجهة عند تحويل الفيديو إلى Base64:** الدالة `uint8ArrayToBase64` تبني سلسلة نصية بحلقة بايت تلو بايت `binary += String.fromCharCode(uint8[i])`. **التصويب:** المعالجة بشرائح `32KB` أو عبر `FileReader.readAsDataURL(new Blob([uint8]))`.
  3. **سقوط صور مراجع الشخصيات ومعرض المواقع من ملف `.sflow`:** لا تحول `prepareDataForExport` روابط `project-media://` داخل مصفوفة `characters[].reference_images` ولا جدول `location_images` إلى `data:` URIs قبل التصدير، فتضيع عند نقل المشروع لجهاز آخر!

---

### `EDT-12` [HIGH / عالٍ — تجاهل إعدادات الطباعة، قص جدول الاستدعاء، ومؤقت المسح المتصادم] علل محرك التصدير `exportPDF.tsx` و `CallSheetPage.tsx` و `ScenePaperRenderer.tsx`
- **الملفات والأسطر:** [`exportPDF.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/utils/exportPDF.tsx#L171-L182) و [`exportPDF.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/utils/exportPDF.tsx#L304-L394) و [`exportPDF.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/utils/exportPDF.tsx#L524-L583) و [`CallSheetPage.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/pdf/CallSheetPage.tsx#L81) و [`ScenePaperRenderer.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/ScenePaperRenderer.tsx#L261-L271)
- **التشخيص الذري والتصويب:**
  1. **تجاهل خيار `enableCallSheet` وقص الصفحات الطويلة:** يفحص السطر `361` الشرط `options.exportType === 'CALL_SHEET'` فقط متجاهلاً `exportSettings.enableCallSheet`! كما يستخدم `CallSheetPage.tsx:81` الصنف `cover-page` المقيد بـ `max-height: 1123px !important; overflow: hidden;` فيُقص أي جدول استدعاء يزيد عن صفحة واحدة!
  2. **خطأ رقم صفحة غلاف المشهد وإهمال خيارات الترويسة والتذييل:** يزيد `cumulativePage` بعدد صفحات المشهد (السطر `307`) **قبل** حساب رقم صفحة غلاف المشهد `innerSceneCoverPageNum` (السطر `315`)، كما لا يمرر إعدادات `enablePageNumbers`, `enableHeader`, `headerText`, `enableFooter`, `footerText`, و `watermarkPosition` إلى المكونات.
  3. **تصادم مؤقت `12000ms` في `exportViaPrintEngine`:** المؤقت غير مخزن ولا يُلغى عند بدء طباعة ثانية، فيفرغ محتوى `iframe` إلى صفحة بيضاء أثناء معاينة الطباعة الثانية!
  4. **فساد ترتيب المشاهد الفرعية (`10A`, `10B`):** السطر `181` في `exportPDF.tsx` والسطر `52` في `paginationCalculator.ts` يطرحان `(a.scene_number || 0) - (b.scene_number || 0)` مما يعطي `NaN` على أرقام المشاهد الحرفية مثل `"10A"`! **التصويب:** استخدام المقارنة الطبيعية `String(a.scene_number).localeCompare(String(b.scene_number), undefined, { numeric: true })`.
  5. **مقارن `React.memo` المكسور في `ScenePaperRenderer.tsx:261-271`:** يعيد `true` (تجاهل التحديث!) كلما تغير نص الكتل دون تغير عددها (`blocks.length`)، مما يجمد شاشة المشهد المرجعي المثبت، كما يتجاهل زر الإغلاق `_onCloseReference`.

---

### `EDT-13` [MEDIUM / متوسط — خروج مفاجئ بـ `Escape`، تسرب مستمعات، وحساب الترقيم مرتين] علل التفاعل والأداء في المحرر والأدوات المساعدة
- **الملفات والأسطر والتصويبات الدقيقة:**
  1. [`SceneEditor.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/pages/SceneEditor.tsx#L1090-L1094): يربط زر `'escape': () => navigate('/')` عالمياً، فإذا ضغط الكاتب `Escape` لإغلاق قائمة `TabMenu` أو نافذة منبثقة يُطرد فوراً خارج المحرر إلى الصفحة الرئيسية! **التصويب:** قصر `Escape` على إغلاق القوائم والنوافذ المحلية المفتوحة فقط.
  2. [`SceneEditor.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/pages/SceneEditor.tsx#L745-L749) و [`useScenes.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/hooks/queries/useScenes.ts#L93-L98): يستدعي `updateSceneMutation` دالة `updateScenarioPageNumbering` **قبل** حفظ الكتل `saveBlocksToDb` (بحساب قديم!) ثم يعيد `saveScene` استدعاءها مرة ثانية! **التصويب:** حفظ الكتل أولاً قبل تحديث المشهد وإزالة الاستدعاء المكرر.
  3. [`SceneEditorModals.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/pages/editor/SceneEditorModals.tsx#L80-L91) و [`SceneEditorHeader.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/pages/editor/SceneEditorHeader.tsx#L109-L113) و [`CharacterNodeView.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/paper/extensions/CharacterNodeView.tsx#L83-L104): تحديث `setScene` دون تحديث `sceneRef.current`، والتنقل في `SceneEditorHeader` حتى لو فشل `saveScene()`، وتصفير `character_id` للشخصيات المضافة سريعاً في `CharacterNodeView` قبل تحديث `charactersRef`.
  4. [`GutterSmartAdder.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/paper/GutterSmartAdder.tsx#L179-L200): يطرح `lineH` المقياس بالزوم من `24` غير المقياسة؛ يُصوَّب بقسمة `const logicalLineH = (lineH / scale) || 28;`.
  5. [`RichTextEditor.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/ui/RichTextEditor.tsx#L45-L58) و [`FloatingToolbar.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/paper/FloatingToolbar.tsx#L38-L55): وضع `coords` في مصفوفة التبعيات يراكم مستمعات `editor.on('blur', ...)` مجهولة بلا إزالة `editor.off` عند كل تحريك للتحديد!
  6. [`PromiseQueue.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/utils/PromiseQueue.ts#L40-L46): إذا رمت `promiseFactory()` خطأً متزامناً قبل إرجاع `Promise`، يتوقف الطابور للأبد لأن `this.running--` داخل `.finally` لا يُنفذ! **التصويب:** `Promise.resolve().then(() => promiseFactory())...`.
  7. [`dagreLayout.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/utils/dagreLayout.ts#L3-L27): كائن `dagreGraph` معرّف كنسخة وحيدة على مستوى الوحدة (`Singleton`) ولا يُفرغ أبداً، فتتراكم فيه عقد وحواف المشاريع السابقة المحذوفة وتشوه الإحداثيات! **التصويب:** إنشاء `new dagre.graphlib.Graph()` داخل الدالة `getLayoutedElements` في كل استدعاء.
  8. [`dateUtils.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/utils/dateUtils.ts#L14) و [`TextMeasurementEngine.test.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/__tests__/TextMeasurementEngine.test.ts#L54) و [`paginationCalculator.test.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/__tests__/paginationCalculator.test.ts#L10-L29): إزاحة التاريخ بيوم في المناطق الزمنية السالبة عند `new Date('YYYY-MM-DD')`، وتجاهل `calculateTotalPages` لمصفوفة `s.blocks` في الاختبارات.


---

## الباب الخامس: واجهة المستخدم، المصادقة (`LockScreen`)، التنسيق (`Tailwind`/`CSS`)، الحالة (`Zustand`/`React Query`)، الصفحات، وجدول التصوير (`UI-01` – `UI-22`)

### `UI-01` [CRITICAL / حرج — تنفيذ أوامر Tauri تحكمية عبر ثغرة XSS مخزنة] حقن `dangerouslySetInnerHTML` غير معقم في صفحة ملف الشخصية
- **الملف والأسطر:** [`CharacterProfilePage.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/pages/CharacterProfilePage.tsx#L731-L734) و [`CharacterProfilePage.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/pages/CharacterProfilePage.tsx#L765-L767)
- **الكود المعطوب:**
```tsx
<div
  className="text-lg leading-relaxed text-foreground"
  dangerouslySetInnerHTML={{ __html: String(formData[activeTab]) }}
/>
// ...
{formData.description ? (
  <div dangerouslySetInnerHTML={{ __html: formData.description }} />
) : ( ... )}
```
- **التشخيص الذري:** يتم حقن حقول `description` و `backstory` و `psychology` و `physical_traits` و `arc` و `relationships` مباشرة في شجرة `DOM` دون أي تعقيم (`DOMPurify` غير مثبتة أصلاً). وبما أن المستخدمين يستوردون حزم `.sflow` وملفات `.json` خارجية عبر [`Dashboard.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/pages/Dashboard.tsx#L314-L395)، فإن أي ملف مستورد يحوي `<img src=x onerror="window.__TAURI_INTERNALS__.invoke(...)">` سيُنفذ شيفرة خبيثة بصلاحيات `@tauri-apps/plugin-fs` و `@tauri-apps/plugin-sql` الكاملة!
- **التصويب الدقيق:** تثبيت مكتبة `dompurify` (`+ @types/dompurify`) وتعقيم جميع الحقول النصية الغنية قبل العرض:
```tsx
import DOMPurify from 'dompurify';

<div
  className="text-lg leading-relaxed text-foreground"
  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(String(formData[activeTab] || '')) }}
/>
// ...
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formData.description || '') }} />
```

---

### `UI-02` [CRITICAL / حرج — تجاوز شاشة القفل، تجزئة بلا ملح، كلمة مرور افتراضية دائمة، واختفاء النموذج قبل التحقق] ثغرات المصادقة في `LockScreen.tsx`
- **الملفات والأسطر:**
  - [`LockScreen.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/auth/LockScreen.tsx#L17-L50) و [`LockScreen.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/auth/LockScreen.tsx#L128-L147) و [`LockScreen.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/auth/LockScreen.tsx#L248)
  - [`PremiumSidebar.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/layout/PremiumSidebar.tsx#L153-L155)
- **الكود المعطوب:**
```tsx
const [isLocked, setIsLocked] = useState<boolean>(() => {
  return localStorage.getItem('scriptflow_unlocked') !== 'true';
});
// ...
setIsUnlocking(true); // يُستدعى قبل التحقق من صحة كلمة المرور!
const enteredHash = await sha256(password);
if (email === storedEmail && enteredHash === storedHash) {
  localStorage.setItem('scriptflow_unlocked', 'true');
```
- **التشخيص الذري (5 علل مركبة):**
  1. **تجاوز كامل للقفل:** تخزين `'scriptflow_unlocked' = 'true'` كنص صريح في `localStorage` يبقي التطبيق مفتوحاً للأبد عبر إعادات التشغيل ويمكن تعديله من تخزين المتصفح دون معرفة كلمة المرور.
  2. **تجزئة `SHA-256` خام بلا ملح (`Salt`) أو إبطاء (`KDF`):** عرضة لكسر فوري عبر جداول القوس قزح (`Rainbow Tables`).
  3. **بيانات اعتماد ثابتة بلا واجهة تغيير:** يزرع الكود `admin@scriptflow.com` / `12345678` ولا توفر [`SettingsPage.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/pages/SettingsPage.tsx) أي نموذج لتغيير البريد أو كلمة المرور!
  4. **اختفاء شاشة الدخول عند إدخال كلمة مرور خاطئة:** السطر `131` يستدعي `setIsUnlocking(true)` **قبل** التحقق من صحة البيانات، مما يطبق الصنف `opacity-0 pointer-events-none` (السطر `248`) فيختفي النموذج بصرياً عند كل محاولة فاشلة!
  5. **مفتاح ميت عند تسجيل الخروج:** يمسح [`PremiumSidebar.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/layout/PremiumSidebar.tsx#L153) المفتاح `'scriptflow_auth_token'` غير المستخدم إطلاقاً، بينما تبقى دوال `getAuthToken` و `setAuthToken` مجرد هياكل فارغة.
- **التصويب الدقيق:**
  - نقل حالة فتح القفل إلى الذاكرة أو `sessionStorage` مع مهلة خمول تلقائية بدلاً من `localStorage` الدائم.
  - استبدال `SHA-256` الخام بخوارزمية `PBKDF2` عبر `crypto.subtle.deriveBits` (`>= 100,000` تكرار + ملح عشوائي `16-byte` مخزن في `auth_password_salt`).
  - نقل `setIsUnlocking(true)` إلى **داخل** فرع النجاح `if (email === storedEmail && enteredHash === storedHash)` فقط، وإضافة تبويب لتغيير بيانات الدخول في [`SettingsPage.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/pages/SettingsPage.tsx).

---

### `UI-03` [HIGH / عالٍ — احتجاز دائم على شاشة الطوارئ] سباق مؤقت الحراسة (`Watchdog`) في `LockScreen.tsx`
- **الملف والأسطر:** [`LockScreen.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/auth/LockScreen.tsx#L69-L82) و [`LockScreen.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/auth/LockScreen.tsx#L156) و [`LockScreen.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/auth/LockScreen.tsx#L228)
- **التشخيص الذري:** إذا استغرقت تهيئة `initDb()` عند الإقلاع البارد أكثر من `8000ms`، يضبط `watchdog` الحالة `setDbError(...)`. وعندما تكتمل `initDb()` بعد ثانية، تستدعي `setDbReady(true)` **دون مسح `setDbError(null)`**! وبما أن الشرط `if (dbError)` (السطر `156`) يُفحص قبل `if (!dbReady)` (السطر `228`)، يظل المستخدم محتجزاً للأبد في شاشة فشل قاعدة البيانات رغم نجاح التهيئة!
- **التصويب الدقيق:** استدعاء `setDbError(null)` فور نجاح `initDb()` وإلغاء المؤقت في دالة التنظيف `return () => clearTimeout(watchdog);`.

---

### `UI-04` [HIGH / عالٍ — سباق إقلاع] تشغيل `AutoBackupProvider` قبل `initDb()` وتكرار `initMediaStorage()`
- **الملفات والأسطر:** [`App.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/App.tsx#L28-L31) و [`main.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/main.tsx#L10) و [`LockScreen.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/auth/LockScreen.tsx#L77)
- **التشخيص الذري:** يلتف `<AutoBackupProvider intervalMinutes={30}>` **خارج** `<LockScreen>`، فيمكن أن يعمل النسخ الاحتياطي قبل اكتمال الهجرات أو أثناء تنفيذ `restore_safety_backup`؛ كما تُستدعى `initMediaStorage()` مرتين بالتوازي في `main.tsx:10` (دون `await`) وفي `LockScreen.tsx:77`.
- **التصويب الدقيق:** حذف `initMediaStorage()` من `main.tsx:10` ونقل `<AutoBackupProvider>` إلى **داخل** `<LockScreen>` في `App.tsx`.

---

### `UI-05` [CRITICAL / حرج — انهيار جميع الحواف الدائرية في التطبيق إلى `0px` وتعطل الوضع الليلي/النهاري] متغيرات CSS غير معرّفة وألوان ثابتة في `tailwind.config.js`
- **الملفات والأسطر:**
  - [`tailwind.config.js`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/tailwind.config.js#L7-L39)
  - [`index.css`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/index.css#L7-L61)
  - [`useTheme.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/hooks/useTheme.ts#L5-L27)
- **الكود المعطوب:**
```js
// tailwind.config.js:8-39
colors: {
  background: '#f8fafc',
  foreground: '#1e293b',
  card: '#ffffff',
  // ...
},
borderRadius: {
  DEFAULT: 'var(--radius)',
  'sm': 'calc(var(--app-radius) * 0.5)',
  'md': 'var(--app-radius)',
  'lg': 'calc(var(--app-radius) * 1.5)',
  'xl': 'calc(var(--app-radius) * 2)',
  '2xl': 'calc(var(--app-radius) * 2.5)',
  '3xl': 'calc(var(--app-radius) * 3)',
},
spacing: {
  'layout-p': 'var(--app-padding)',
  'card-p': 'var(--app-card-p)',
  'form-gap': 'var(--app-gap)',
},
```
- **التشخيص الذري:**
  1. المتغيرات `--app-radius` و `--app-padding` و `--app-card-p` و `--app-gap` **غير معرّفة إطلاقاً في `src/index.css`**! نتيجةً لذلك، تتحول كل الأصناف `rounded-sm` حتى `rounded-3xl` إلى تعبيرات `calc()` غير صالحة يتجاهلها المتصفح، فتنهار زوايا جميع البطاقات والنوافذ والأزرار في التطبيق إلى زوايا مربعة `0px`!
  2. يعرّف `src/index.css` متغيرات داكنة (`--background: 0 0% 0%`) بينما يثبت `tailwind.config.js` ألواناً فاتحة صلبة (`#ffffff`, `#f8fafc`)، فيصبح تبديل `.light`/`.dark` في `useTheme.ts` عديم الأثر على الأصناف الدلالية (`bg-card`, `bg-background`).
- **التصويب الدقيق:** تعريف المتغيرات المفقودة في `:root` داخل [`index.css`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/index.css) وربط ألوان `tailwind.config.js` بدوال `hsl(var(--...))`:
```css
:root {
  --app-radius: 0.5rem;
  --app-padding: 1.5rem;
  --app-card-p: 1.25rem;
  --app-gap: 1rem;
}
```

---

### `UI-06` [HIGH / عالٍ — كسر العمل دون إنترنت وطمس خطوط السيناريو أحادية العرض] استيراد Google Fonts خارجي وقاعدة `* { font-family: ... !important }`
- **الملفات والأسطر:** [`index.css`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/index.css#L1) و [`index.css`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/index.css#L52-L54) و [`font_faces.css`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/public/fonts/font_faces.css#L1-L73)
- **التشخيص الذري:**
  1. السطر `1` يجلب الخط من `https://fonts.googleapis.com/...` عبر الإنترنت (يفشل في الوضع غير المتصل ويتعارض مع `CSP`) بينما الخطوط المحلية المضمنة في `public/fonts/font_faces.css` مهجورة وغير مستوردة في أي مكان!
  2. السطور `52-54` تفرض `* { font-family: 'IBM Plex Sans Arabic', sans-serif !important; }` على كل عنصر في DOM، مما يطمس خط `Courier New` و `font-mono` الضروريين لقياس صفحات السيناريو والأرقام المجدولة!
- **التصويب الدقيق:** استبدال السطر الأول بـ `@import '/fonts/font_faces.css';`، ونقل `font-family` بدون `!important` إلى محدد `body` فقط، وحذف الملف الميت [`App.css`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/App.css).

---

### `UI-07` [HIGH / عالٍ — اعتماد شبحي غير مصرّح] غياب حزمة `"nasab"` من `apps/desktop/package.json`
- **الملف والأسطر:** [`apps/desktop/package.json`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/package.json#L14-L53)
- **التشخيص الذري:** تستورد 5 ملفات في واجهة سطح المكتب (`RelationshipsPage.tsx`, `useRelationshipGraph.ts`, `PartnerSelects.tsx`, `dagreLayout.ts`, `typeRegistry.ts`) حزمة `'nasab'` مباشرة، لكنها غير مدرجة في `dependencies` داخل `apps/desktop/package.json` وتعمل صدفةً عبر الرفع (`Hoisting`) فقط.
- **التصويب الدقيق:** إضافة `"nasab": "*"` ضمن `"dependencies"` في [`apps/desktop/package.json`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/package.json).

---

### `UI-08` [LOW / منخفض — أصناف Tailwind v4 في مشروع Tailwind v3] أصناف غير موجودة لا تولد أي CSS
- **الملفات والأسطر:** [`RichTextEditor.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/ui/RichTextEditor.tsx#L76-L90) (`bg-zinc-150`)، [`RhythmDNAWidget.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/analytics/RhythmDNAWidget.tsx#L31-L48) (`shadow-xs`, `rounded-xs`)، [`ProductionDensityWidget.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/analytics/ProductionDensityWidget.tsx#L29) (`shadow-xs`)، [`Insights.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/pages/Insights.tsx#L31-L38) و [`Dashboard.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/pages/Dashboard.tsx#L35-L42) (`duration-400`).
- **التصويب الدقيق:** استبدالها بـ `bg-zinc-200` و `shadow-sm` و `rounded-sm` و `duration-300`.

---

### `UI-09` [HIGH / عالٍ — تجميد التطبيق للأبد على `"Syncing Environment..."`] فشل ترطيب متجر `useUIStore.ts` عند تلف `localStorage`
- **الملف والأسطر:** [`useUIStore.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/store/useUIStore.ts#L69-L98) و [`AppLayout.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/layout/AppLayout.tsx#L29)
- **الكود المعطوب:**
```ts
onRehydrateStorage: () => (state) => {
  if (state) state.setHasHydrated(true);
},
```
- **التشخيص الذري:** إذا تلف JSON المخزن تحت `'scriptflow-ui-storage'` في `localStorage`، تستدعي `zustand/persist` الدالة مع `state === undefined`؛ فلا تُضبط `hasHydrated` على `true` مطلقاً، ويتجمد التطبيق بالكامل على شاشة التحميل `"Syncing Environment..."`! كما يحول `id ? String(id) : null` المعرّف الرقمي `0` إلى `null`.
- **التصويب الدقيق:**
```ts
onRehydrateStorage: () => (state, error) => {
  if (error) console.error('UI store rehydration error:', error);
  if (state) state.setHasHydrated(true);
  else useUIStore.setState({ hasHydrated: true });
},
```

---

### `UI-10` [MEDIUM / متوسط — فتات تنقل ناقص وتسرب حالة الشريط العلوي] عدم تطابق `pageName` مع `title` في `Topbar.tsx` وحالة `sidebarContext` الميتة
- **الملفات والأسطر:** [`Topbar.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/layout/Topbar.tsx#L80-L117)، [`TimelinePage.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/pages/TimelinePage.tsx#L89-L91)، [`RelationshipsPage.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/features/relationships/RelationshipsPage.tsx#L60)، [`TrashPage.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/pages/TrashPage.tsx#L27-L41)، و [`SettingsPage.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/pages/SettingsPage.tsx#L394-L400)
- **التشخيص الذري والتصويب:**
  1. يقرأ `Topbar.tsx:95` الخاصية `topBarConfig.pageName` بينما تمرر صفحات `TimelinePage` و `RelationshipsPage` و `TrashPage` الخاصية `title` المعرّفة في `useUIStore.ts:6`، كما يفتقر `Topbar.tsx` لفروع احتياطية للمسارات `/timeline`, `/relationships`, `/analytics`, `/trash`, `/settings`! **التصويب:** قراءة `topBarConfig?.pageName || topBarConfig?.title` وإضافة مسارات الاحتياط.
  2. لا تنظف `SettingsPage` و `TrashPage` حالة `setTopBarConfig(null)` عند إلغاء التحميل (`Unmount`)، فيتسرب عنوان `"الإعدادات"` إلى صفحات أخرى مثل `CharacterProfilePage`.
  3. تدفع 8 صفحات كائنات `setSidebarContext(...)` إلى المتجر بينما لا يقرأها [`PremiumSidebar.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/layout/PremiumSidebar.tsx) إطلاقاً!

---

### `UI-11` [MEDIUM / متوسط — اختفاء إشعارات الخطأ في 6 صفحات وتفعيل اختصارات الكيبورد أثناء الكتابة] علل `useKeyboard.ts` و `useToast.ts`
- **الملفات والأسطر:** [`useKeyboard.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/hooks/useKeyboard.ts#L9-L10) و [`useToast.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/hooks/useToast.ts#L15) و [`AppLayout.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/layout/AppLayout.tsx)
- **التشخيص الذري والتصويب:**
  1. يتحقق `useKeyboard.ts` من `['INPUT', 'TEXTAREA']` فقط ويتجاهل `activeElement.isContentEditable` وعنصر `'SELECT'`، فتُطلق الاختصارات العامة أثناء الكتابة داخل محرر Tiptap (`<div contenteditable="true">`)!
  2. يولد `useToast.ts:15` المعرّف بـ `Date.now()` (يتصادم عند إطلاق إشعارين في نفس المللي ثانية)، كما أن `<ToastContainer />` **مفقود تماماً** في 6 صفحات رئيسية (`CharactersPage`, `LocationsPage`, `ProductionReports`, `TrashPage`, `RelationshipsPage`, `TimelinePage`) فلا يرى المستخدم أي رسائل نجاح أو خطأ فيها! **التصويب:** استخدام `crypto.randomUUID()` وتركيب `<ToastContainer />` مرة واحدة مركزياً داخل `AppLayout.tsx`.

---

### `UI-12` [CRITICAL / حرج — تعطل تذكيرات المشروع بنسبة 100%] استدعاء `useRemindersQuery(sceneId)` بدلاً من `useAllRemindersQuery(scenarioId)` في `Insights.tsx`
- **الملف والأسطر:** [`Insights.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/pages/Insights.tsx#L5) و [`Insights.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/pages/Insights.tsx#L63) (مقابل [`useScenes.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/hooks/queries/useScenes.ts#L168-L182))
- **الكود المعطوب:**
```tsx
import { useRemindersQuery } from '../hooks/queries/useScenes';
// ...
const { data: rawNotesList = [], isLoading: isLoadingNotes } = useRemindersQuery(activeScenarioId || '');
```
- **التشخيص الذري:** تنفذ `useRemindersQuery` الاستعلام `WHERE scene_id = $1`. تمرير معرّف المشروع `activeScenarioId` (`scen_...`) يبحث عن مشهد يحمل معرّف المشروع، فيُرجع دائماً مصفوفة فارغة `[]`! بينما توفر `useScenes.ts:176` أصلاً الخطاف `useAllRemindersQuery(scenarioId)` المخصص لتذكيرات المشروع كاملًا.
- **التصويب الدقيق:** استبدال `useRemindersQuery` بـ `useAllRemindersQuery`.

---

### `UI-13` [HIGH / عالٍ — إحصائيات قديمة بعد تعديل المشاهد] إبطال مفاتيح استعلام وهمية في `ScenesPage.tsx`
- **الملف والأسطر:** [`ScenesPage.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/pages/ScenesPage.tsx#L88-L93) (مقابل [`useScenarios.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/hooks/queries/useScenarios.ts#L9-L15))
- **التشخيص الذري:** يبطل `fetchStats` المفتاحين `['scenario-stats', scenarioId]` و `['scenario', scenarioId]` غير الموجودين إطلاقاً في `TanStack Query` (حيث المفاتيح الفعلية هي `['scenarios', 'stats', id, episodeId]` و `['scenarios', 'detail', id]`)!
- **التصويب الدقيق:** استخدام مصنع المفاتيح الموحد `scenarioKeys.stats(scenarioId)` و `scenarioKeys.detail(scenarioId)` و `scenarioKeys.globalStats`.

---

### `UI-14` [HIGH / عالٍ — ثغرات إبطال الذاكرة المؤقتة وعدم حل روابط الصور المرجعية] فجوات منهجية في `src/hooks/queries/*`
- **الملفات والأسطر والتصويبات الدقيقة:**
  1. [`useProductionTasks.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/hooks/queries/useProductionTasks.ts#L33-L37): لا يبطل `['production_tasks']` إلا إذا تضمن التحديث الجزئي `variables.data.scenario_id` (وهو غائب عند تحديث `status` أو `title` فقط!). **التصويب:** إبطال `['production_tasks']` و `['scene_tasks']` دائماً.
  2. [`useBlocks.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/hooks/queries/useBlocks.ts#L46-L89): تعديل الكتل لا يبطل `['scenes', 'detail']` (المستخدم في `ScenePreviewModal`) ولا `['scenarios', 'stats']`.
  3. [`useCharacters.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/hooks/queries/useCharacters.ts#L34-L102): يحول `actor_photo` فقط عبر `resolveMediaUrl`، ويتجاهل `image_url` ومصفوفة `reference_images`، كما لا يبطل `['trash']` ولا `['scenarios']` عند الحذف/الإنشاء.
  4. [`useEpisodes.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/hooks/queries/useEpisodes.ts#L76-L78) و [`useCrew.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/hooks/queries/useCrew.ts#L153-L155) و [`useTrash.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/hooks/queries/useTrash.ts#L26-L35) و [`Dashboard.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/pages/Dashboard.tsx#L346-L425): حذف حلقة لا يبطل `['scenes']`؛ حذف ممثل لا يبطل `['characters']`؛ استعادة عنصر من المهملات لا تبطل `['episodes']` أو `['timeline']`؛ واستيراد مشروع بوضع `OVERWRITE`/`MERGE` يبطل `['scenarios']` فقط تاركاً مشاهد وشخصيات المشروع القديم عالقة في الذاكرة! **التصويب:** استدعاء `await queryClient.invalidateQueries()` شاملاً بعد أي استيراد أو استعادة.

---

### `UI-15` [CRITICAL / حرج — إفساد 100% من تعيينات الطاقم بقيم `NaN`] تحويل معرّفات نصية عبر `parseInt` في `CrewAssignmentModal.tsx`
- **الملفات والأسطر:** [`CrewAssignmentModal.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/CrewAssignmentModal.tsx#L87-L100) و [`CrewPreviewModal.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/CrewPreviewModal.tsx#L168)
- **الكود المعطوب:**
```tsx
selected.forEach(val => {
  if (val.startsWith('ep:')) {
    resultList.push({ episode_id: parseInt(val.split(':')[1], 10), scene_id: null });
  } else if (val.startsWith('sc:')) {
    const scId = parseInt(val.split(':')[1], 10);
    const sceneObj = (scenes as any[]).find(s => String(s.id) === String(scId));
    resultList.push({ episode_id: sceneObj?.episode_id || null, scene_id: scId });
  }
});
```
- **التشخيص الذري:** معرّفات الحلقات (`epi_...`) والمشاهد (`scn_...`) نصوص مولدة بـ `generateId()`. تطبيق `parseInt('scn_abc', 10)` يُرجع **`NaN`** دائماً! فتفشل مطابقة `sceneObj` وتُحفظ كل التعيينات في قاعدة البيانات بقيم `{ episode_id: NaN, scene_id: NaN }`! كما يعرض `CrewPreviewModal.tsx:168` المعرّف الخام `مشهد رقم ${a.scene_id}` بدلاً من `scene_number`.
- **التصويب الدقيق:**
```tsx
const resultList: Array<{ episode_id: string | null; scene_id: string | null }> = [];
selected.forEach(val => {
  if (val.startsWith('ep:')) {
    resultList.push({ episode_id: val.slice(3), scene_id: null });
  } else if (val.startsWith('sc:')) {
    const scId = val.slice(3);
    const sceneObj = (scenes as any[]).find(s => String(s.id) === scId);
    resultList.push({
      episode_id: sceneObj?.episode_id ? String(sceneObj.episode_id) : null,
      scene_id: scId,
    });
  }
});
```

---

### `UI-16` [HIGH / عالٍ — مسح مشاهد الحلقات الأخرى من حالة الصفحة وتعطل فلترة الأفلام] 6 علل مترابطة في `ScenesPage.tsx` و `SceneToolbar.tsx`
- **الملفات والأسطر:** [`ScenesPage.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/pages/ScenesPage.tsx#L73-L446) و [`SceneToolbar.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/scenes/SceneToolbar.tsx#L128) و [`SceneKanbanBoard.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/scenes/SceneKanbanBoard.tsx#L148)
- **التشخيص الذري والتصويب:**
  1. **مسح مشاهد الحلقات الأخرى من الحالة (`ScenesPage.tsx:276`):** تحتوي `workingScenes` على مشاهد الحلقة الحالية فقط؛ وعند تعديل عنوان مشهد في `QuickEdit` دون تغيير رقمه (`!isReordering`)، يعيد السطر `276` مصفوفة `workingScenes` وحدها بدلاً من `[...otherScenes, ...workingScenes]`، **فيمسح مشاهد جميع الحلقات الأخرى من شاشة المستخدم!**
  2. **تجاهل معامل الرابط `?episode=` (`السطر 73`):** تنقل `EpisodesPage.tsx:438` المستخدم إلى `/scenarios?scenario=...&episode=...` لكن `ScenesPage.tsx` يثبت `useState('ALL')` متجاهلاً `searchParams.get('episode')`.
  3. **طرح المعرّفات النصية (`الأسطر 271, 398, 444`):** `(a.episode_id || 0) - (b.episode_id || 0)` ينتج `NaN` على المعرّفات النصية؛ يجب الترتيب عبر خريطة `episode_number`.
  4. **اختفاء شريط البحث والفلترة للأفلام (`SceneToolbar.tsx:128`):** الشرط `{filterEpisode === 'ALL' && episodes.length > 0 && (` يخفي `AdvancedFilterBar` كلياً في الأفلام الروائية (`episodes.length === 0`) وعند اختيار حلقة بعينها!
  5. **زر `"تصدير JSON"` معطل (`الأسطر 166-177`)** رغم جاهزية `JSONExportStrategy` في `exportStrategies.ts`، كما يصنف `SceneKanbanBoard.tsx:148` نوع `'INT/EXT'` خطأً كـ `'خارجي'`.

---

### `UI-17` [HIGH / عالٍ — بقاء صور أغلفة المشاريع في مجلد `temp/` واختفاء أزرار الحذف والتصدير] علل `ScenarioCard.tsx` و `Dashboard.tsx`
- **الملفات والأسطر:** [`ScenarioCard.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/dashboard/ScenarioCard.tsx#L205-L206) و [`ScenarioCard.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/dashboard/ScenarioCard.tsx#L580-L598) و [`Dashboard.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/pages/Dashboard.tsx#L212-L215) و [`Dashboard.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/pages/Dashboard.tsx#L482-L489)
- **التشخيص الذري والتصويب:**
  1. **عدم نقل صورة الغلاف من `temp/`:** عند إنشاء مشروع جديد، يحفظ `ScenarioCard:206` الصورة في `temp` ثم يحول الرابط فوراً بـ `setCoverImage(resolveMediaUrl(imageUri))` إلى `http://asset.localhost/...`. وعند الحفظ في `Dashboard.tsx:212` يفشل الشرط `cover_image.startsWith('project-media://temp/')` فلا تُنقل الصورة إلى مجلد المشروع الجديد! **التصويب:** تخزين `imageUri` الخام في الحالة واستخدام `resolveMediaUrl` في خاصية `src` فقط.
  2. **إهمال خاصيتي `onDelete` و `onExportPackage`:** يمررهما `Dashboard.tsx` إلى `<ScenarioCard />` لكن `ScenarioCard.tsx` لا يستقبلهما ولا يعرض أزرار حذف المشروع أو تصدير `.sflow`!
  3. **مقارن `React.memo` المفرط (`الأسطر 593-598`):** يتجاهل تغير `description` و `genre` و `status` و `scene_count` و `episode_count`، فلا تتحدث البطاقة بعد التعديل!

---

### `UI-18` [HIGH / عالٍ — حزمة علل الصفحات الفرعية، الخرائط، الطقس، والحلقات] أخطاء منطقية في 9 مكونات
- **الملفات والأسطر والتصويبات الدقيقة:**
  1. [`CharacterProfilePage.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/pages/CharacterProfilePage.tsx#L186-L208) و [`CharacterProfilePage.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/pages/CharacterProfilePage.tsx#L834-L839): يفحص `characterDetail.role === 'FEMALE'` بدلاً من `gender === 'FEMALE'` فيلقب كل أم بـ **`'أبو فلان'`**! كما تتجاهل حلقة النسب العمود `character.father_id` وعلاقة `'PARENT_MALE'` وتخلو من `Set` لمنع الحلقات اللانهائية، وتستخدم `<a href="/scene/..." target="_blank">` الذي يفشل في بروتوكول Tauri بدلاً من `<Link to={...}>` (وكذلك في `CrewAssignmentModal.tsx:181,257,309`).
  2. [`CharactersPage.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/pages/CharactersPage.tsx#L141) و [`CharactersPage.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/pages/CharactersPage.tsx#L209) و [`CharacterCard.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/dashboard/CharacterCard.tsx#L127): يمرر فلتر `type: 'pills'` غير المدعوم في `AdvancedFilterBar.tsx` (يعيد `null`!)، ويحسب `incomplete` بشرط `!c.role && !c.description` بدلاً من `||`، ويعرض وسوم `<p>` الخام في بطاقة الشخصية.
  3. [`LocationModal.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/LocationModal.tsx#L69) و [`LocationCard.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/dashboard/LocationCard.tsx#L46) و [`LocationPreviewModal.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/LocationPreviewModal.tsx#L67): يحفظ ويقرأ `type` بدلاً من `location_type`، فيظهر كل موقع داخلي مخزن بـ `location_type: 'INT'` كـ `'خارجي'`!
  4. [`MapDisplay.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/MapDisplay.tsx#L10) و [`MapDisplay.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/MapDisplay.tsx#L21) و [`WeatherWidget.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/WeatherWidget.tsx#L29-L43): خطأ مطبعي في رابط أيقونة الخريطة `/react/leaflet/` (يعيد `404` دائماً!)، وغياب فحص `navigator.onLine`، وفحص `!latitude || !longitude` الذي يرفض خط الطول `0.0°` (خط غرينتش المار بغرب الجزائر: مستغانم، معسكر، أدرار!). **التصويب:** فحص `latitude == null || longitude == null || Number.isNaN(Number(latitude))`.
  5. [`EpisodesPage.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/pages/EpisodesPage.tsx#L65) و [`StatCard.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/dashboard/StatCard.tsx#L3-L29) و [`ProductionReports.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/pages/ProductionReports.tsx#L58-L66) و [`SettingsPage.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/pages/SettingsPage.tsx#L335): يولد `episodes.length + 1` أرقام حلقات مكررة بعد حذف حلقة وسطى؛ يتجاهل `StatCard` خاصيتي `sub` و `color`؛ يُدرج `ProductionReports` المشاهد **غير المجدولة** عند اختيار `'ALL'`؛ وزر `"استعادة"` في `SettingsPage:335` يعرض رسالة وهمية `'سيتم تفعيل ميزة الاستعادة قريباً'`!

---

### `UI-19` [CRITICAL / حرج — انهيار التطبيق الكامل بخطأ React #300/#310] انتهاك قواعد الخطافات (`Rules of Hooks`) واستدعاء `setState` أثناء التصيير في `DailyView.tsx`
- **الملف والأسطر:** [`DailyView.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/timeline/views/DailyView.tsx#L41-L90)
- **الكود المعطوب:**
```tsx
if (shootDays.length === 0) {
  return ( ... ); // خروج مبكر قبل استدعاء useMemo!
}
if (!selectedDay && shootDays.length > 0) {
  setSelectedDayId(shootDays[0].id); // استدعاء setState متزامن أثناء الرندر!
  return null; // خروج مبكر ثانٍ قبل استدعاء useMemo!
}
// ...
const requiredCast = useMemo(() => { ... }, [scenes, characters]);
const locations = useMemo(() => { ... }, [scenes]);
```
- **التشخيص الذري:** يتم استدعاء خطافي `useMemo` في السطرين `68` و `84` **بعد** جملتي `return` شرطيتين (السطران `42` و `54`)، كما يُستدعى `setSelectedDayId` مباشرة أثناء دالة العرض. بمجرد إضافة أول يوم تصوير أو حذف اليوم المحدد، يتغير عدد الخطافات بين التصييرات فينهار التطبيق كلياً بخطأ `Rendered more/fewer hooks than during the previous render`!
- **التصويب الدقيق:** نقل جميع استدعاءات `useMemo` إلى أعلى المكون **قبل** أي جملة `if (...) return`، ونقل `setSelectedDayId(shootDays[0].id)` إلى داخل `useEffect`.

---

### `UI-20` [CRITICAL / حرج — اختفاء المشاهد المسحوبة وتعطل الترتيب داخل اليوم الواحد 100%] أثر جانبي داخل محدث حالة React 19 في `useTimelineReordering.ts`
- **الملفات والأسطر:** [`useTimelineReordering.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/hooks/queries/useTimelineReordering.ts#L107-L146) و [`useTimelineReordering.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/hooks/queries/useTimelineReordering.ts#L173-L180) و [`TimelineBoard.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/timeline/TimelineBoard.tsx#L45)
- **الكود المعطوب:**
```ts
if (!activeContainer || !overContainer || activeContainer === overContainer) {
  return; // يتجاهل السحب داخل نفس يوم التصوير تماماً!
}
// ...
let sceneToMove: TimelineSceneItem | undefined;
setLocalShootDays(prev => prev.map(day => {
  if (day.id === activeContainer && day.scenes) {
    const sIndex = day.scenes.findIndex(s => s.id.toString() === active.id.toString());
    sceneToMove = day.scenes[sIndex];
    return { ...day, scenes: day.scenes.filter(s => s.id.toString() !== active.id.toString()) };
  }
  return day;
}));
if (!sceneToMove) return; // في React 19 تظل undefined قبل تفريغ الدفعة!
```
- **التشخيص الذري (3 علل قاتلة):**
  1. **اختفاء المشهد المسحوب:** في `React 19`، لا يُضمن تنفيذ دالة التحديث `prev => ...` بشكل متزامن لحظة استدعاء `setLocalShootDays`. فتكون `sceneToMove` مساوية لـ `undefined` في السطر `134` وتخرج الدالة مبكراً، ثم عندما يُنفذ التحديث المؤجل **يُحذف المشهد من اليوم المصدر دون إضافته لليوم الهدف أو البنك!**
  2. **تعطل إعادة ترتيب المشاهد داخل نفس اليوم:** يخرج `handleDragOver` عند `activeContainer === overContainer`، وفي `handleDragEnd` يقرأ الفهرس القديم من المصفوفة غير المعدلة فيرسل الترتيب القديم لقاعدة البيانات!
  3. **غياب `useDroppable` عن `DayMiniCard`:** في `TimelineBoard.tsx:45` لا تملك بطاقات الأيام المصغرة منطقة إفلات، فلا يمكن نقل مشهد بين يومين في عرض اللوحة!
- **التصويب الدقيق:** استخراج `sceneToMove` من `localShootDays` **قبل** `setLocalShootDays` ودمج الحذف والإدراج في استدعاء `setLocalShootDays` واحد نقي؛ وتنفيذ `arrayMove(day.scenes, oldIndex, newIndex)` في `handleDragEnd` عندما `String(activeContainer) === String(overContainer)`؛ وإضافة `useDroppable` إلى `DayMiniCard`.

---

### `UI-21` [HIGH / عالٍ — تضخم مدة التصوير 60 ضعفاً وتعطل فلتر داخلي/خارجي] أخطاء `scene.setting` و `page_count * 60` في جدول التصوير
- **الملفات والأسطر:** [`TimelineSidebar.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/timeline/TimelineSidebar.tsx#L35-L36)، [`TimelineBoard.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/timeline/TimelineBoard.tsx#L122) و [`TimelineBoard.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/timeline/TimelineBoard.tsx#L324)، [`CompactSceneCard.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/timeline/CompactSceneCard.tsx#L61)، و [`StripBoard.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/timeline/views/StripBoard.tsx#L52-L54) و [`StripBoard.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/timeline/views/StripBoard.tsx#L196)
- **التشخيص الذري والتصويب:**
  1. يفلتر `TimelineSidebar` ويعرض `TimelineBoard` الحقل غير الموجود `scene.setting` بدلاً من `scene.location_type`، فتُفرغ القائمة `100%` عند اختيار `"داخلي"` أو `"خارجي"`!
  2. يجمع `TimelineBoard` و `CompactSceneCard` المدة **بالدقائق** (`maxMinutes = 720`)، لكنهما يحسبان الاحتياطي بـ `duration = s.page_count * 60` (ثوانٍ تُجمع كدقائق!)، فتُحسب كل صفحة كـ **ساعة كاملة** بدلاً من دقيقة، ويطلق يوم من 13 صفحة إنذار تجاوز 12 ساعة كاذباً! بينما يقسم `StripBoard.tsx:52` أي مدة `> 30` على `60` ويمرر `episodes: []` لورقة الاستدعاء! **التصويب:** توحيد دالة `getSceneDurationMinutes` واستخدام `Math.max(1, Math.round(s.page_count))` وتمرير `episodes` الفعلية في `StripBoard.tsx:196`.

---

### `UI-22` [HIGH / عالٍ — تواريخ `Invalid Date` وإنذارات راحة كاذبة بين أيام متباعدة] علل `continuityAnalyzer.ts` و `YearlyHeatmap.tsx`
- **الملفات والأسطر:** [`continuityAnalyzer.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/utils/continuityAnalyzer.ts#L30-L40) و [`continuityAnalyzer.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/utils/continuityAnalyzer.ts#L115-L142)، [`TimelinePage.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/pages/TimelinePage.tsx#L100)، و [`YearlyHeatmap.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/timeline/views/YearlyHeatmap.tsx#L44-L45) و [`YearlyHeatmap.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/timeline/views/YearlyHeatmap.tsx#L146)
- **التشخيص الذري والتصويب:**
  1. يحفظ `TimelinePage.tsx:100` حقل `shoot_date` بصيغة `new Date().toISOString()` الكاملة، ثم يلحق `continuityAnalyzer.ts` بها `+ 'T00:00:00Z'` دون فحص (`...000ZT00:00:00Z`) فينتج `Invalid Date` (`NaN`) في كل المقارنات والتسميات! كما يطلق إنذار انتهاك راحة الـ 12 ساعة (`Turnaround`) بين `sortedDays[i]` و `sortedDays[i+1]` حتى لو كان بينهما شهر كامل! **التصويب:** استخراج `d.split('T')[0]` قبل التركيب، وقصر إنذار الراحة على الأيام المتتالية فعلياً (`diffDays === 1`).
  2. يجمع `YearlyHeatmap.tsx` إجمالي الأيام والمشاهد عبر **كل السنوات** رغم عنوان البطاقة `({currentYear})`، ويضع أسماء أيام الأسبوع لشهر يناير فوق جميع الأشهر الـ 12!

---

## الباب السادس: شجرة العلاقات والأنساب المرئية (`REL-01` – `REL-07`)

### `REL-01` [CRITICAL / حرج — تصدير ملف GEDCOM بصفر علاقات!] تمرير اسم مكون React Flow `'customRelation'` بدلاً من نوع العلاقة في `RelationshipsPage.tsx`
- **الملف والأسطر:** [`RelationshipsPage.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/features/relationships/RelationshipsPage.tsx#L300-L308) و [`RelationshipsPage.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/features/relationships/RelationshipsPage.tsx#L323-L368) (مقابل [`useRelationshipGraph.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/features/relationships/hooks/useRelationshipGraph.ts#L340-L367))
- **الكود المعطوب:**
```tsx
const nasabEdges = (rawGraphData.current?.edges || [])
  .filter((e: any) => e.category !== 'INFERRED')
  .map((e: any) => ({
    sourceId: String(e.source),
    targetId: String(e.target),
    type: e.type, // يساوي دائماً 'customRelation'!
  }));
const gedcomData = GedcomEngine.generate(nasabNodes as any, nasabEdges as any);
```
- **التشخيص الذري:** يخزن `rawGraphData.current.edges` حواف `React Flow` حيث `e.type === 'customRelation'` بينما نوع النسب الفعلي محفوظ في `e.data.relType` والفئة في `e.data.category`! النتيجة أن `GedcomEngine.generate` يستقبل `'customRelation'` لكل حافة فلا يتعرف على أي زواج أو أبوة ويصدر ملفاً خالياً تماماً من العائلات! كما أن `handleImportGedcom` لا تبطل كاش `['characters']` بعد الاستيراد، وملف [`gedcomUtils.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/features/relationships/utils/gedcomUtils.ts) كود ميت مكرر بالكامل.
- **التصويب الدقيق:** فلترة `e.data?.category === 'BIOLOGICAL'` وتمرير `type: e.data?.relType`، وإبطال `['characters']` بعد الاستيراد، واستخدام حوار `save()` من Tauri عند الحفظ.

---

### `REL-02` [CRITICAL / حرج — اختفاء أبناء المتزوجين وتعطل حذف العلاقات] تمرير حواف عقد الزواج المحوّلة إلى `CharacterRPGPanel.tsx`
- **الملفات والأسطر:** [`RelationshipsPage.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/features/relationships/RelationshipsPage.tsx#L440-L444) و [`CharacterRPGPanel.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/features/relationships/components/modals/CharacterRPGPanel.tsx#L52-L73) و [`CharacterRPGPanel.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/features/relationships/components/modals/CharacterRPGPanel.tsx#L252)
- **التشخيص الذري:** يمرر `RelationshipsPage` مصفوفة `edges` بعد تحويلها عبر `transformMarriages` (التي تستبدل حواف الزواج بعقدة وسيطة `m-chr1-chr2` وتعيد ربط الأبناء من `source: parentId` إلى `source: "m-chr1-chr2"` بمعرّف اصطناعي `${id}_via_${mId}`):
  1. يظهر الزوج في اللوحة الجانبية كمعرّف خام مشوه `m-chr_...-chr_... (MARRIAGE_LINK)`.
  2. **يختفي جميع أبناء الزوجين** من قائمة `"العلاقات المباشرة"` لأن `e.source` لم يعد معرّف الأب أو الأم!
  3. يفشل زر حذف العلاقة صامتاً لأن المعرّف الاصطناعي `_via_m-...` غير موجود في جدول `character_relationships`!
- **التصويب الدقيق:** تمرير مصفوفة الحواف الأصلية غير المحوّلة `rawEdges` (مخزنة في `useState`) إلى `<CharacterRPGPanel edges={rawEdges} />`.

---

### `REL-03` [HIGH / عالٍ — تجميد شاشة الشجرة في تحميل لانهائي] تسرب وعود غير محلولة (`Unresolved Promise`) في `debouncedProcessGraph`
- **الملف والأسطر:** [`useRelationshipGraph.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/features/relationships/hooks/useRelationshipGraph.ts#L104-L116) و [`useRelationshipGraph.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/features/relationships/hooks/useRelationshipGraph.ts#L368-L384)
- **الكود المعطوب:**
```ts
const debounced = (rawNodes: any[], rawEdges: any[]) => {
  return new Promise<void>((resolve) => {
    clearTimeout(timer); // يلغي المؤقت السابق دون استدعاء resolve لوعده!
    timer = setTimeout(() => {
      processGraph(rawNodes, rawEdges).then(resolve);
    }, 200);
  });
};
```
- **التشخيص الذري:** عند استدعاء `debouncedProcessGraph` مرتين خلال `200ms` (بسبب `StrictMode` أو تبديل `viewMode` الذي يُعيد تشغيل `loadGraph` و `useEffect` معاً!)، يلغي الاستدعاء الثاني المؤقت الأول دون حل `Promise` الأول، فيظل `await debouncedProcessGraph(...)` معلقاً للأبد أو يعيد تحميل SQLite مرتين متتاليتين!
- **التصويب الدقيق:** حفظ مرجع `pendingResolve` واستدعاؤه فوراً قبل `clearTimeout(timer)`، وإزالة `viewMode` من مصفوفة تبعيات `loadGraph`.

---

### `REL-04` [HIGH / عالٍ — انفصام بيانات الأبوة بين جدولين وغياب سلسلة النسب] عدم مزامنة `father_id`/`mother_id` مع `character_relationships`
- **الملفات والأسطر:** [`useRelationshipGraph.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/features/relationships/hooks/useRelationshipGraph.ts#L138-L208)، [`useRelationshipActions.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/features/relationships/hooks/useRelationshipActions.ts#L27-L34)، و [`CustomCharacterNode.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/dashboard/CustomCharacterNode.tsx#L45)
- **التشخيص الذري والتصويب:**
  1. تحديد الأب/الأم في `CharacterProfilePage` يحدث عمودي `characters.father_id` و `mother_id` فقط (اللذين يتجاهلهما `useRelationshipGraph` تماماً!)، بينما إضافة علاقة أب/أم في `RelationshipsPage` تدرج في جدول `character_relationships` فقط فتظل حقول الأب/الأم في ملف الشخصية فارغة! **التصويب:** توليد حواف أبوة تلقائياً من `father_id`/`mother_id` عند بناء الشجرة ومزامنة العمودين في `useRelationshipActions`.
  2. يقرأ `CustomCharacterNode.tsx:45` الحقل `data.nasabChain` الذي لا يحسبه `useRelationshipGraph.ts` مطلقاً، كما يستدعي `JSON.parse` بلا `try/catch` ويعرض معرّفات خام (`chr_...`) في تحذيرات الدورات الوراثية.

---

### `REL-05` [HIGH / عالٍ — تجاوز مدقق القرابة وتسرب العلاقات الدرامية للشجرة البيولوجية] غياب `KinshipValidator` في `useRelationshipActions.ts`
- **الملفات والأسطر:** [`useRelationshipActions.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/features/relationships/hooks/useRelationshipActions.ts#L11-L44) و [`useRelationshipGraph.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/features/relationships/hooks/useRelationshipGraph.ts#L25)
- **التشخيص الذري والتصويب:**
  1. لا يستدعي `addRelationship` مدقق `KinshipValidator.validate` قبل الإدراج في SQLite، مما يجعل نافذة `ErrorModal` وخيار `"تجاوز (كسر درامي)"` كوداً ميتاً غير قابل للوصول، ويسمح بإدراج علاقات زنا محارم أو دورات زمنية مستحيلة من `CharacterRPGPanel`!
  2. يتضمن فلتر الوضع البيولوجي في `useRelationshipGraph.ts:25` الشرط `|| e.data?.category === 'DRAMATIC'`، فتظهر علاقات العداوة والابتزاز داخل شجرة النسب البيولوجية! **التصويب:** حذف `|| e.data?.category === 'DRAMATIC'` من فرع `BIOLOGICAL` وتشغيل `KinshipValidator.validate` في `addRelationship` عندما `!isBypass`.

---

### `REL-06` [HIGH / عالٍ — نسبة أبناء الزوجة الأولى إلى الزوجة الثانية وظهور وسوم إنجليزية خام] علة تعدد الزوجات في `graphTransformers.ts` و `CustomRelationshipEdge.tsx`
- **الملفات والأسطر:** [`graphTransformers.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/features/relationships/utils/graphTransformers.ts#L50-L51) و [`graphTransformers.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/features/relationships/utils/graphTransformers.ts#L97-L105) و [`graphTransformers.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/features/relationships/utils/graphTransformers.ts#L207) و [`CustomRelationshipEdge.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/features/relationships/components/CustomRelationshipEdge.tsx#L52-L57) و [`CustomRelationshipEdge.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/features/relationships/components/CustomRelationshipEdge.tsx#L109)
- **التشخيص الذري والتصويب:**
  1. **فساد نسب الأبناء عند تعدد الزيجات:** يخزن `spouseOf[parentId] = mId` عقدة زواج **واحدة فقط** لكل شخص (آخر زواج في الحلقة). فإذا كان للأب زوجة سابقة (`EX_MARRIAGE`) وزوجة حالية (`MARRIAGE`) أو زوجتان، يُربط أبناء الزوجة الأولى جميعاً بعقدة زواج الزوجة الثانية! **التصويب:** مطابقة زوجي والدي الطفل `(fatherId, motherId)` مع مفتاح الزواج الخاص بهما `marriageMap[sortedPair]` أولاً.
  2. يحذف التمرير الرابع الحواف المتوازية بين نفس الشخصين (`${source}->${target}` دون الفئة)، ويعرض `CustomRelationshipEdge.tsx:109` التعبير `(label || relType)` فيطبع `[◆ PARENT_MALE]` بالإنجليزية عندما يفرغ `useRelationshipGraph` نص `label = ''` على أسلاك الإخوة!

---

### `REL-07` [MEDIUM / متوسط — ميزة المواريث معزولة بالكامل مع قسمة على صفر `NaN%`] عزلة `InheritanceModal.tsx` ونقص محرر سمات RPG
- **الملفات والأسطر:** [`InheritanceModal.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/features/relationships/components/modals/InheritanceModal.tsx#L72-L112) و [`RelationshipsPage.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/features/relationships/RelationshipsPage.tsx#L118-L124)
- **التشخيص الذري والتصويب:** مكون `InheritanceModal.tsx` غير مستورد في أي ملف في التطبيق (ميزة مواريث غير قابلة للوصول)، ويحوي في السطر `91` قسمة `share.share / inheritanceResult.base` غير محمية من `base === 0` (`NaN%`)؛ كما يفرغ `onPaneClick` قيمة `relType` إلى `''` فلا تعود صلاحية التحقق عند نقر عقدة تالية، وتفتقر `CharacterRPGPanel` لحقول تعديل `rpg.traits` و `birth_date` و `death_date`.


---

## الباب السابع: محرك الأنساب والمواريث (`packages/nasab` والحزم الفرعية `packages/nasab/packages/*`) (`NSB-01` – `NSB-17`)

### `NSB-01` [CRITICAL / حرج — بتر الأعداد العشرية إلى صفر `0/1` وطفحان `MAX_SAFE_INTEGER` في أصول المسائل] علل حسابية قاتلة في `Fraction.ts` و `MathEngine.ts`
- **الملفات والأسطر:**
  - [`Fraction.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/core/Fraction.ts#L12-L38) و [`Fraction.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/core/Fraction.ts#L123-L125)
  - [`MathEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/mawarith/MathEngine.ts#L128-L130)
  - [`InheritanceEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/mawarith/InheritanceEngine.ts#L45-L53)
- **الكود المعطوب:**
```ts
// Fraction.ts:24-35, 123-125
} else if (typeof numerator === 'string') {
  const parts = numerator.split('/');
  if (parts.length === 2) { ... }
  else {
    num = BigInt(Math.floor(Number(numerator))); // "0.5" -> 0n!
    den = 1n;
  }
} else {
  num = typeof numerator === 'number' ? BigInt(Math.floor(numerator)) : numerator; // 0.5 -> 0n!
}
valueOf(): number {
  return Number(this.numerator) / Number(this.denominator); // Infinity/Infinity = NaN!
}
// MathEngine.ts:128-130
private static lcm(a: number, b: number): number {
  return Math.abs(a * b) / this.gcd(a, b); // lcm(0,0) = NaN & overflow > 2^53!
}
```
- **التشخيص الذري (4 أعطال رياضية):**
  1. **بتر الأعداد العشرية صامتاً:** `new Fraction(0.5)` و `new Fraction("0.5")` يمران عبر `BigInt(Math.floor(0.5))` فيتحولان صامتاً إلى **`0/1` (`0`)**! كما أن `new Fraction(-0.5)` يتحول إلى **`-1/1`**، ولا يوجد أي حارس ضد `NaN` أو `Infinity` أو النصوص المشوهة مثل `"1/2/3"`.
  2. **فساد المقارنات عبر `valueOf()`:** تحويل `bigint` كبير يتجاوز `Number.MAX_VALUE` (`~1.8e308`) داخل `valueOf()` ينتج `Infinity / Infinity = NaN`، مما يفسد الترتيب والمقارنات في `InheritanceEngine.ts:45,53`.
  3. **طفحان `Number.MAX_SAFE_INTEGER` في `MathEngine.lcm`:** ضرب `a * b` بنوع `number` يفقد الدقة فوق $2^{53}-1$ عند تصحيح مسائل المناسخات الكبيرة، ويعيد `NaN` عند `lcm(0, 0)`.
- **التصويب الدقيق:**
```ts
// داخل باني Fraction لتحليل الأعداد العشرية بدقة تامة دون فقدان:
private static parseDecimalToBigIntRatio(val: string): [bigint, bigint] {
  const trimmed = val.trim();
  if (!/^[+-]?\d+(\.\d+)?$/.test(trimmed)) {
    throw new RangeError(`Invalid Fraction input: "${val}"`);
  }
  const [intPart, decPart = ''] = trimmed.split('.');
  const scale = 10n ** BigInt(decPart.length);
  const sign = trimmed.startsWith('-') ? -1n : 1n;
  const absInt = BigInt(intPart.replace(/^[+-]/, '') || '0');
  const num = sign * (absInt * scale + BigInt(decPart || '0'));
  return [num, scale];
}
// وحساب المضاعف المشترك الأصغر بنوع bigint:
private static lcmBigInt(a: bigint, b: bigint): bigint {
  if (a === 0n || b === 0n) return 0n;
  const absA = a < 0n ? -a : a;
  const absB = b < 0n ? -b : b;
  return (absA / this.gcdBigInt(absA, absB)) * absB;
}
```

---

### `NSB-02` [CRITICAL / حرج — كارثة فقهية: حرمان العم الشقيق وابن الأخ الشقيق وتوريث الخال وابن البنت وأب الأم بالتعصيب!] فساد تصنيف الورثة في `CategoryEngine.ts` و `RulesEngine.ts`
- **الملفات والأسطر:**
  - [`CategoryEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/mawarith/CategoryEngine.ts#L19-L63)
  - [`RulesEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/mawarith/RulesEngine.ts#L84-L109) و [`RulesEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/mawarith/RulesEngine.ts#L166-L172)
- **الكود المعطوب:**
```ts
// CategoryEngine.ts:52-61
const nephews = getRelatives([
  RelationType.NEPHEW_PATERNAL_MALE,
  RelationType.NEPHEW_MATERNAL_MALE, // ابن الأخت (ذو رحم)! وغياب NEPHEW_FULL_MALE!
]);
const uncles = getRelatives([
  RelationType.UNCLE_PATERNAL_MALE,
  RelationType.UNCLE_MATERNAL_MALE, // الخال (ذو رحم)! وغياب UNCLE_FULL_MALE!
]);
```
- **التشخيص الذري (3 أخطاء فقهية صريحة مخالفة للإجماع):**
  1. **إسقاط العم الشقيق وابن الأخ الشقيق وتوريث ذوي الأرحام عصبةً:** أسقط `CategoryEngine` كلاً من `RelationType.UNCLE_FULL_MALE` (العم الشقيق) و `RelationType.NEPHEW_FULL_MALE` (ابن الأخ الشقيق) من القوائم تماماً، وفي المقابل أدرج `UNCLE_MATERNAL_MALE` (الخال) و `NEPHEW_MATERNAL_MALE` (ابن الأخت)، ثم منحهم `RulesEngine.ts:167-172` **كامل الباقي تعصيباً بالنفس**! فإذا مات شخص عن عم شقيق وخال، يأخذ العم الشقيق **صفراً** ويأخذ الخال التركة كلها!
  2. **إلحاق أولاد البنات بأولاد الابن:** يلتقط `GRANDCHILD_MALE` و `GRANDCHILD_FEMALE` أولاد البنت (`ابن البنت` و `بنت البنت` — وهم من ذوي الأرحام عند الجمهور) ويعاملهم كـ `ابن ابن` و `بنت ابن` يحجبون الإخوة والأعمام!
  3. **مساواة الجد لأم بالجد الصحيح لأب:** يلتقط `GRANDPARENT_MALE` أبا الأم (`الجد الرحمي`) ويورثه السدس أو التعصيب كأبي الأب!
- **التصويب الدقيق:**
  - قصر `nephews` العاصبين على `[RelationType.NEPHEW_FULL_MALE, RelationType.NEPHEW_PATERNAL_MALE]` مع تقديم الشقيق على الذي لأب، وقصر `uncles` العاصبين على `[RelationType.UNCLE_FULL_MALE, RelationType.UNCLE_PATERNAL_MALE]` مع تقديم العم الشقيق على العم لأب.
  - التحقق من سلسلة النسب عبر الذكور الخلّص (`agnatic path`) عند جمع `grandsons` و `granddaughters` و `grandfathers`، وعزل أولاد البنات وأبي الأم في فئة ذوي الأرحام.

---

### `NSB-03` [CRITICAL / حرج — توريث الإخوة لأم المختلطين الثلثين `2/3` بدلاً من الثلث `1/3`!] تجزئة فرض الإخوة لأم حسب الجنس في `RulesEngine.ts` و `MathEngine.ts`
- **الملفات والأسطر:** [`RulesEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/mawarith/RulesEngine.ts#L116-L120) و [`MathEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/mawarith/MathEngine.ts#L27-L43)
- **الكود المعطوب:**
```ts
// RulesEngine.ts:118
maternalSibs.forEach(s => addHeir(s, s.gender === Gender.MALE ? 'أخ لأم' : 'أخت لأم', '1/3', 'التعدد وعدم الحجب (بالتساوي)'));

// MathEngine.ts:29-31 — يجمع الفروض المشتركة بمفتاح h.relation النصي!
const key = h.relation;
if (!fardGroups.has(key)) fardGroups.set(key, []);
```
- **التشخيص الذري:** بنص الآية الكريمة ﴿فَإِن كَانُوا أَكْثَرَ مِن ذَٰلِكَ فَهُمْ شُرَكَاءُ فِي الثُّلُثِ﴾ (النساء: 12)، يشترك الإخوة والأخوات لأم ذكوراً وإناثاً بالتساوي في فرض **واحد** هو `1/3`. لكن `RulesEngine` يسجل الذكر بعلاقة `'أخ لأم'` بفرض `'1/3'` والأنثى بعلاقة `'أخت لأم'` بفرض `'1/3'`، ثم يقسمهم `MathEngine` حسب نص `h.relation` إلى **مجموعتين مستقلتين** تأخذ كل واحدة منهما `1/3` كاملةً (أي `2/3` مجموعهما بدلاً من `1/3` = `1/6` لكل واحد)!
- **التصويب الدقيق:** إضافة خاصية `shareGroupKey?: string` إلى سجل الوارث وتمرير `shareGroupKey: 'MATERNAL_SIBLINGS'` للإخوة والأخوات لأم معاً، واستخدام `const key = h.shareGroupKey || h.relation;` في `MathEngine.ts:29`.

---

### `NSB-04` [CRITICAL / حرج — حجب وتكرار أبناء المرأة المتوفاة وإقحام غرباء الشجرة في قائمة الورثة!] خلل ترتيب `applyDynamicLineageIsolation` في `InheritanceEngine.ts` و `RulesEngine.ts`
- **الملفات والأسطر:**
  - [`InheritanceEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/mawarith/InheritanceEngine.ts#L104-L113)
  - [`RulesEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/mawarith/RulesEngine.ts#L183-L206)
  - [`MathEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/mawarith/MathEngine.ts#L87-L114)
- **التشخيص الذري (3 أخطاء متسلسلة):**
  1. **حجب الابن الصلبي لأمه المتوفاة وتكراره مرتين:** يعمل `RulesEngine.applyDynamicLineageIsolation` **قبل** `MathEngine.evaluate`، في لحظة يكون فيها الأبناء الذكور في مصفوفة `ctx.asaba` وليسوا بعد في `ctx.heirs`! وبما أن الابن يحمل `lineageId` عائلة أبيه (المختلف عن `lineageId` عائلة أمه المتوفاة)، يصنفه `applyDynamicLineageIsolation` على أنه غريب ويدفعه إلى `ctx.heirs` بصفة `'قريب بعيد/ذوي أرحام'` مع `isBlocked: true`! ثم يأتي `MathEngine` فلا يجد مطابقة غير محجوبة فيضيف الابن **مرة ثانية** كعاصب، فيظهر الابن في النتيجة النهائية مرتين متناقضتين (محجوب ووارث معاً)!
  2. **إقحام كل شخص حي في الرسم البياني:** يدور `applyDynamicLineageIsolation` على `ctx.nodes` بأكملها، فيضيف كل شخصية حية لا تمت بصلة للميت إلى قائمة `ctx.heirs`!
  3. **اختفاء العاصبين عند استغراق الفروض (`totalFard >= 1`):** في `MathEngine.ts:87`، إذا استغرقت الفروض التركة (مثل زوج + أم + أختين لأم + أخ شقيق)، لا يدخل الكود فرع `remainder > 0` فيسقط العاصبون من `ctx.heirs` تماماً دون تسجيل سقوطهم لاستغراق الفروض!
- **التصويب الدقيق:** نقل منطق العزل النسبي ليعمل على الأقارب الفعليين فقط بعد دمج `ctx.asaba` في `ctx.heirs`، واستثناء فروع الميت وأصوله المباشرين (`sons`, `daughters`, `grandsons`, `mother`, `grandmothers`) من شرط تطابق `lineageId` الأبوي، وتسجيل سقوط العصبة صراحةً عند `remainder === 0`.

---

### `NSB-05` [CRITICAL / حرج — تعطل التعديلات المذهبية 100% في المحرك الكلاسيكي] تمرير نصوص عربية بدلاً من `HeirType` الإنجليزي في `MadhabOverrides.ts`
- **الملف والأسطر:** [`MadhabOverrides.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/mawarith/MadhabOverrides.ts#L16-L31)
- **الكود المعطوب:**
```ts
const tempHeirs: Heir[] = ctx.heirs.map(h => ({
  id: h.person.id,
  type: h.relation as any, // يمرر 'زوج' و 'أم' و 'أخ شقيق' بالعربية!
```
- **التشخيص الذري:** تفحص جميع إضافات المذاهب (`ShafiiPlugin`, `HanafiPlugin`, `MalikiPlugin`, `HanbaliPlugin`, `JafariPlugin`) قيم التعداد الإنجليزية (`'SPOUSE_MALE'`, `'FULL_BROTHER'`, `'GRANDFATHER'`, `'MOTHER'`). تمرير السلسلة العربية `h.relation as any` يجعل جميع الشروط تفشل بنسبة `100%`، فضلاً عن أن `ctx.asaba` (الإخوة الأشقاء في المسألة المشتركة مثلاً) لم يُدمجوا بعد في `ctx.heirs` لحظة الاستدعاء!
- **التصويب الدقيق:** تخزين `heirType: HeirType` القياسي بجانب النص العربي `relation` في كل عنصر من `ctx.heirs` واستدعاء `MadhabOverrides` بعد دمج العصبات.

---

### `NSB-06` [CRITICAL / حرج — أخطاء فقهية صريحة في محرك الفروض والحجب المتقدم] علل `BlockingEngine.ts` و `SharesEngine.ts`
- **الملفات والأسطر:**
  - [`BlockingEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/engine/BlockingEngine.ts#L34-L67)
  - [`SharesEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/engine/SharesEngine.ts#L10-L40) و [`SharesEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/engine/SharesEngine.ts#L82-L94)
- **الكود المعطوب:**
```ts
// SharesEngine.ts:10, 15 — يحسب عدد الإخوة من الورثة غير المحجوبين فقط!
const activeHeirs = heirs.filter(h => !h.isBlocked);
const siblingsCount = activeHeirs.filter(h => [...].includes(h.type)).reduce((acc, h) => acc + h.count, 0);
```
- **التشخيص الذري (4 مخالفات فقهية):**
  1. **توريث الأم الثلث مع وجود جمع من الإخوة المحجوبين بالأب:** يحجب `BlockingEngine` الإخوة بوجود الأب (`isBlocked = true`)، ثم يعد `SharesEngine` الإخوة من `activeHeirs` فقط فيجدهم **`0`**! فيعطي الأم `1/3` (أو ثلث الباقي) بدلاً من `1/6` في مسألة (`أب + أم + أخوين`)، خلافاً لإجماع الفقهاء على أن الإخوة المحجوبين بالأب يحجبون الأم حجب نقصان من الثلث إلى السدس!
  2. **عدم حجب الجدة لأب بالأب عند الجمهور:** لا يحجب `BlockingEngine.ts:34-46` الجدة الأبوية (`GRANDMOTHER_P`) بوجود الأب (`FATHER`) إلا عند الحنابلة، مع أنه مذهب الجمهور (الحنفية والمالكية والشافعية).
  3. **سقوط الأخت لأب بلا فرض ولا حجب مع أختين شقيقتين:** عندما تستغرق أختان شقيقتان فرض الثلثين `2/3` بلا معصّب (`AGNATIC_BROTHER`)، لا يحجب `BlockingEngine` الأخت لأب (`AGNATIC_SISTER`)، ولا يمنحها `SharesEngine.ts:82-94` أي فرض، فتبقى معلقة بقيمة `share = undefined`!
  4. **نسيان `DAUGHTER_OF_SON` في قاعدة العصبة مع الغير (`السطر 64`):** يفحص `daughters.length > 0` فقط مغفلاً أن الأخت الشقيقة تصير عصبة مع الغير مع `بنت الابن` أيضاً.
- **التصويب الدقيق:** حساب `allAliveSiblingsCount` من جميع الورثة الأحياء غير الممنوعين بوصف (قتل/اختلاف دين) بصرف النظر عن حجبهم بالأب؛ وإضافة حجب `AGNATIC_SISTER` عند `fullSistersCount >= 2 && agnaticBrothersCount === 0`؛ وتمرير `madhab` إلى `BlockingEngine.applyBlocking(heirs, madhab)` لحجب `GRANDMOTHER_P` بالأب في غير الحنبلي.

---

### `NSB-07` [CRITICAL / حرج — إلغاء مقاسمة الجد للإخوة، وفساد الأكدرية وذوي الأرحام والقرابتين] علل `AsabaEngine.ts` و `BaseEngine.ts` و `DualKinshipResolver.ts`
- **الملفات والأسطر:**
  - [`AsabaEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/engine/AsabaEngine.ts#L60-L66)
  - [`BaseEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/engine/BaseEngine.ts#L33) و [`BaseEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/engine/BaseEngine.ts#L237-L380)
  - [`DualKinshipResolver.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/engine/DualKinshipResolver.ts#L1-L55)
- **التشخيص الذري والتصويب:**
  1. **إلغاء باب الجد والإخوة بالكامل (`AsabaEngine.ts:60-66`):** يعطي `GRANDFATHER` الباقي كله تعصيباً ويخرج بـ `return` قبل الوصول للإخوة الأشقاء أو لأب في جميع المذاهب (`SHAFII`, `MALIKI`, `HANBALI`, `COMMON`)، فارضاً مذهب أبي حنيفة على الجمهور ومبطلاً المقاسمة وأحكام ثلث الباقي وسدس جميع المال!
  2. **فساد المسألة الأكدرية (`BaseEngine.ts:342-380`) وتعديل كائنات المستدعي (`السطر 33`):** ينسخ `BaseEngine` المصفوفة سطحياً `[...heirs]` فيعدل كائنات المستدعي، وتنطبق `applyAkdariya` خطأً حتى مع وجود **أختين فأكثر** (`sisters.length > 0` بدلاً من `sisters.length === 1 && sisters[0].count === 1`) وتغفل الأخت لأب وتترك `awlOrigin` قديماً!
  3. **حرمان بنت البنت بوجود ابن البنت في ذوي الأرحام (`BaseEngine.ts:237-334`):** تفصل `applyDistantKindred` بين `DAUGHTER_SON` و `DAUGHTER_DAUGHTER` في مجموعتي أولوية منفصلتين فيحجب ابن البنت أخته بنت البنت كلياً بدلاً من الاشتراك للذكر مثل حظ الأنثيين، كما تقدم ابن الأخت الشقيقة على بنت الأخ الشقيق خطأً!
  4. **ضياع أحد السهمين في تعدد القرابة (`DualKinshipResolver.ts`):** يحذف القرابة ذات الوزن الأقل بدلاً من الجمع بين الجهتين عند اختلافهما (مثل **زوج هو ابن عم**، أو **أخ لأم هو ابن عم** فيفقد تعصيبه أو فرضه!).

---

### `NSB-08` [HIGH / عالٍ — عزلة المذهب الجعفري، ونقص المشتركة الشافعية، والوصية الواجبة، وتناقض الخنثى] علل `JafariPlugin` و `ShafiiPlugin` و `WasiyyaEngine` و `ValidationEngine`
- **الملفات والأسطر:**
  - [`plugins/index.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/plugins/index.ts#L13-L36) و [`JafariPlugin.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/plugins/madhabs/JafariPlugin.ts)
  - [`ShafiiPlugin.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/plugins/madhabs/ShafiiPlugin.ts#L35-L66)
  - [`WasiyyaEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/engine/WasiyyaEngine.ts) و [`EstateEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/engine/EstateEngine.ts)
  - [`ValidationEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/engine/ValidationEngine.ts)
- **التشخيص الذري والتصويب:**
  1. `JafariPlugin` مصدَّر في `plugins/index.ts` لكنه **غير مسجل إطلاقاً** في `_PM.register(...)`! وحتى لو سُجّل، فإنه يعمل كـ `post-hook` بعد تطبيق العول والتعصيب السنيين (وهما باطلان في الفقه الجعفري القائم على الطبقات الثلاث ورد النقص على البنت أو الزوجين!).
  2. تغفل المسألة المشتركة (الحمارية/اليمية) في `ShafiiPlugin.ts:35-66` حالة وجود `GRANDMOTHER` مكان `MOTHER` أو وجودهما معاً حين يستغرق `زوج (1/2) + أم/جدة (1/6) + إخوة لأم (1/3)` التركة كلها، كما يتجاهل `AdvancedMathEngine` نوع الفرض `'FARD_MUSHARRAKA'` عند جمع الفروض الأولية!
  3. يثبت كل من `WasiyyaEngine` و `EstateEngine` المذهب على `'COMMON'` دائماً، ولا تعمل الوصية الواجبة لأولاد البنت لأن `BlockingEngine` لا يضع عليهم `isBlocked = true`، ويفترض المحاكي دائماً أن المتوفى أصلاً هو `'SON'` حتى لأولاد البنت، كما يفتقر `EstateEngine` لحراسة القيم السالبة في الديون وتجهيز الجنازة!
  4. يرفض `ValidationEngine` كلاً من `'MALE'` و `'FEMALE'` عندما `isHermaphrodite: true` بينما نوع `Heir.gender` لا يقبل أصلاً غير `'MALE' | 'FEMALE'` (حالة مستحيلة برمجياً!).

---

### `NSB-09` [HIGH / عالٍ — تحويل الأخ لأم للأب إلى عم عاصب لأب وتعطل استنتاج الأعمام الأشقاء] علل `InferenceEngine.ts` و `InverseMap.ts`
- **الملفات والأسطر:**
  - [`InferenceEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/kinship/InferenceEngine.ts#L19-L50) و [`InferenceEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/kinship/InferenceEngine.ts#L336-L430)
  - [`InverseMap.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/core/InverseMap.ts)
- **التشخيص الذري والتصويب:**
  1. **ترقية أخ الأب لأمه إلى عم لأب عاصب (`الأسطر 336-340`):** عندما يكون للأب أخ من أمه فقط (`SIBLING_MATERNAL_MALE` — وهو عم رحمي غير وارث بالاتفاق)، يدخل فرع `else` لأن `isTargetFather === true` فيستنتج له علاقة `UNCLE_PATERNAL_MALE` (`عم لأب` عاصب يرث التركة)! **التصويب:** فحص نوع أخوة الأب بدقة وتمييز `UNCLE_MATERNAL_SIDE` (ذو رحم) عن `UNCLE_FULL_MALE` و `UNCLE_PATERNAL_MALE`.
  2. **تعطل استنتاج العم الشقيق وابن الأخ الشقيق:** تجري ترقية الأخوة المشتركة في الأبوين إلى `SIBLING_FULL_*` في نهاية `infer` **بعد** انتهاء طابور `BFS` دون إعادة إدخال الحواف في الطابور، فلا يُستنتج `UNCLE_FULL_*` ولا `NEPHEW_FULL_*` أبداً!
  3. تعيد `getInverseRelation` نصوصاً غير قابلة للتحليل مثل `'عم/خال'`، بينما يقلب `InverseMap.ts` علاقة `FATHER_IN_LAW` إلى `MOTHER_IN_LAW` بدلاً من `SON_IN_LAW`/`DAUGHTER_IN_LAW`!

---

### `NSB-10` [HIGH / عالٍ — تحويل تاريخ `"01/05/1980"` إلى سنة `1` ميلادية، وتحديد سقف الزوجات بزوجتين، وولادة الأم بعد وفاتها بسنة] علل `KinshipValidator.ts`
- **الملف والأسطر:** [`KinshipValidator.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/kinship/KinshipValidator.ts#L61-L255)
- **التشخيص الذري (5 علل منطقية):**
  1. **خطأ `parseYear("01/05/1980")` (`السطر 83`):** يستخدم `parseInt(dateStr, 10)` مباشرة فيقرأ اليوم `"01"` كأنه **سنة `1` ميلادية**! **التصويب:** البحث عن مطابقة سنة من 4 أرقام `/(\d{4})/` أو تحليل صيغة ISO أولاً.
  2. **ولادة من أم ميتة (`الأسطر 125-142`):** يطبق هامش الحمل بعد الوفاة (`maxPregnancyYears = 1`) على الأب **والأم معاً**، فيسمح بأن تلد أم متوفاة طفلاً بعد سنة كاملة من موتها!
  3. **عدّ الحواف ثنائية الاتجاه مرتين في تعدد الزوجات (`الأسطر 162-185`):** يعدّ الحواف الخام بدلاً من معرّفات الزوجات الفريدة `new Set(...)`، فتُحسب الزوجتان `4` حواف (`>= maxWives`) ويُمنع الزوج المسلم من الزواج بالثالثة!
  4. يضع جنساً افتراضياً `MALE`/`FEMALE` عند غياب الجنس فيتجاوز فحص الجنس (`السطران 61-62`)، ويتجاهل حواف `CHILD_*` عند فحص الدورات (`الأسطر 210-215`)، ويغفل زواج الجد بحفيدته وزواج أبناء العمومة الدمويين في `getDegreeOfConsanguinity`.

---

### `NSB-11` [HIGH / عالٍ — تسمية الرضيعة الأنثى `FOSTER_SON` وإغفال نصاب الرضعات الخمس ولبن الفحل] علل محرك الرضاع `FosterEngine.ts`
- **الملف والأسطر:** [`FosterEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/kinship/FosterEngine.ts)
- **التشخيص الذري والتصويب:** يثبت المحرك نوع `FOSTER_SON` حتى للرضيعات الإناث (لا ينتج `FOSTER_DAUGHTER` أبداً!)؛ ولا يتحقق `findNurseChildren` من شرطي الحولين (`ageInMonths <= 24`) وعدد الرضعات المشبعات (`feedingsCount >= 5`)؛ ويغفل إخوة الرضاع من **لبن الفحل** (أبناء الزوج من زوجة أخرى تشترك في `husbandId`)؛ كما يفحص `fosterAncestorsA` دون التماثل العكسي `fosterAncestorsB` عند استخراج المحرمات!

---

### `NSB-12` [HIGH / عالٍ — إرجاع معامل زواج الأقارب `COI = 0` دائماً وكسر كنية الأسماء المركبة ودمج أنساب غير مرتبطة] علل `GraphEngine.ts` و `KunyaEngine.ts` و `LineageEngine.ts`
- **الملفات والأسطر:**
  - [`GraphEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/core/GraphEngine.ts)
  - [`KunyaEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/kinship/KunyaEngine.ts)
  - [`LineageEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/kinship/LineageEngine.ts#L66-L71)
- **التشخيص الذري والتصويب:**
  1. **معامل القرابة الجيني `calculateCOI` (`GraphEngine.ts`):** يفحص `if (parents.length !== 2) return 0` دون إزالة تكرار معرّفات الوالدين الناتجة عن الحواف العكسية (`PARENT_*` + `CHILD_*` = `4` عناصر)، فيعيد **`0` دائماً** على أي رسم مستنتج! كما يخزن عمقاً واحداً لكل جد في `Map` بدلاً من تعداد المسارات المستقلة، ويغفل الحد $(1 + F_A)$ في معادلة رايت:
     $$F_X = \sum \left(\frac{1}{2}\right)^{n_1 + n_2 + 1} (1 + F_A)$$
  2. **`KunyaEngine.ts`:** تبدأ حلقة `extractKunyaFromName` من `i = 1` متخطيةً الكلمة الأولى، فتحول اسم `"عبد الله"` إلى كنية `"الله"`، وتفتقر `propagateKunya` لمجموعة `visited` لمنع الدورات اللانهائية!
  3. **`LineageEngine.ts:66-71`:** تطمس `patriarch.lineageId` حتى لو كانت `isLineageLocked === true`، وتدمج عائلات أجنبية بالكامل لمجرد تشابه الكنية مثل `"أبو بكر"`!

---

### `NSB-13` [HIGH / عالٍ — تصادم أسماء `JsonLDEngine` وحقن وسوم GEDCOM وتكرار `@` في المعرّفات] علل `GedcomEngine.ts` و `plugins/index.ts`
- **الملفات والأسطر:**
  - [`plugins/index.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/plugins/index.ts#L16-L24)
  - [`GedcomEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/plugins/importers/GedcomEngine.ts)
- **التشخيص الذري والتصويب:**
  1. يصدر `plugins/index.ts` الفئة `JsonLDEngine` من `./exporters/JsonLDEngine` ثم ينفذ `export * from './importers/JsonLDEngine'` التي تصدر فئة بنفس الاسم تماماً `JsonLDEngine`، فيحجب المصدرُ المستوردَ! **التصويب:** إعادة التسمية إلى `JsonLDExporter` و `JsonLDImporter`.
  2. يحتفظ `GedcomEngine.parse` بعلامتي `@` داخل `id` (`@I1@`)، وعند إعادة التصدير يحيطها مجدداً بـ `@${id}@` فتخرج بصيغة تالفة **`@@I1@@`**! كما يتجاهل سطور `2 DATE` تحت `1 BIRT` و `1 DEAT`، ويسمح بحقن أسطر أوامر GEDCOM عبر المحارف `\n` في `p.name`، ويكرر كتل `0 @F...@ FAM` للحواف ثنائية الاتجاه.

---

### `NSB-14` [HIGH / عالٍ — احتمالات وراثية وطبية خاطئة وتوريث الأموات في محركات النطاقات المتخصصة] علل `MedicalPedigreeEngine` و `PlinkPedigreeAdapter` و `AnimalBreedingEngine` و `RPGLineageEngine`
- **الملفات والأسطر:**
  - [`MedicalPedigreeEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/plugins/medical/MedicalPedigreeEngine.ts#L40-L131)
  - [`PlinkPedigreeAdapter.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/plugins/medical/PlinkPedigreeAdapter.ts)
  - [`AnimalBreedingEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/plugins/breeding/AnimalBreedingEngine.ts)
  - [`RPGLineageEngine.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/src/plugins/rpg/RPGLineageEngine.ts)
- **التشخيص الذري والتصويب:**
  1. **`MedicalPedigreeEngine.ts`:** يثبت للأفراد غير المصابين ظاهرياً (`UNAFFECTED`) التوزيع `{ 0: 1, 1: 0, 2: 0 }` (أي احتمال حامل للمرض المتنحي = **`0%`** دائماً حتى لو كان طفله مصاباً!)، ويعطي الإناث المؤسسات نسخ أليلات مرتبطة بالكروموسوم `Y` (`Y_LINKED`)! **التصويب:** في الأمراض الجسمية المتنحية (`AUTOSOMAL_RECESSIVE`)، احتمال كون المؤسس السليم ظاهرياً حاملاً هو $\frac{2pq}{p^2 + 2pq} = \frac{2f}{1 + f}$ وليس صفراً، وللإناث في `Y_LINKED` دائماً `{ 0: 1, 1: 0, 2: 0 }`.
  2. **`PlinkPedigreeAdapter.ts`:** يسجل عمود النمط الظاهري المرضي (`Phenotype`) في صيغة PLINK `.ped` بالتعبير `isDeceased ? 0 : 1` (حيث `1 = سليم` و `2 = مصاب` في معيار PLINK!) فيصنف جميع المرضى الأحياء كأصحاء!
  3. **`AnimalBreedingEngine.ts`:** تخلو دوال `traceLineage` و `getAncestorPaths` و `computeTabularCOI` من حماية ضد الدورات (`Stack Overflow`)، وتعيد `calculatePurebredPercentage` نسبة `100%` عند غياب سلالة الحيوان!
  4. **`RPGLineageEngine.ts`:** يستورد دائرياً من `'../../index'`، ويسقط الصفات المتنحية (`dominance < 0.5`) حتى لو اشترك فيها الأبوان، وتختار `findHeirToTitle` الأبناء **الأموات** (`isDeceased: true`) لوراثة العرش/اللقب!

---

### `NSB-15` [CRITICAL / حرج — موت قاعدتي العُمَريّتين في YAML وحجب الجدة لأم بالأب وكتابة الاختبارات فوق ملف مصدري!] علل قواعد `YAML` ومحرك `nasab-rule-engine`
- **الملفات والأسطر:**
  - [`mother_share.yaml`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/packages/nasab-rule-engine/rules/inheritance/mother_share.yaml#L30-L74)
  - [`grandmother_blocking.yaml`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/packages/nasab-rule-engine/rules/blocking/grandmother_blocking.yaml#L2-L43)
  - [`evaluator.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/packages/nasab-rule-engine/src/evaluator.ts)
  - [`parser.test.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/packages/nasab-rule-engine/tests/parser.test.ts#L169)
- **الكود المعطوب:**
```yaml
# mother_share.yaml:30-74
- id: "MOTHER_GETS_ONE_THIRD"
  priority: 95 # شروطها أعم وتشتغل دائماً قبل العُمريتين!
  # ...
- id: "MOTHER_GETS_ONE_THIRD_OF_REMAINDER"
  priority: 90 # كود ميت لا يُنفذ إطلاقاً!
```
- **التشخيص الذري (5 كوارث في حزمة القواعد):**
  1. **استحالة تنفيذ العُمَريّتين (`الغراوين`):** قاعدة `MOTHER_GETS_ONE_THIRD` ذات أولوية `95` وشروطها محتواة بالكامل في شروط `MOTHER_GETS_ONE_THIRD_OF_REMAINDER` ذات الأولوية الأدنى `90`! وبذلك تلتقط القاعدة العامة جميع حالات الغراوين 100% ولا تعمل قاعدة ثلث الباقي مطلقاً لا في YAML ولا في `src/rules_bundled.ts`!
  2. **حجب الجدة لأم بالأب خطأً وترك الجدة لأب بلا حجب (`grandmother_blocking.yaml:2, 24-43`):** وُضعت قاعدة `PATERNAL_GRANDMOTHER_BLOCKED_BY_MOTHER_OR_FATHER` تحت `target_node: "GRANDMOTHER_MATERNAL"`، فيحجب الأبُ **أمَّ الأم** (وهذا باطل بالإجماع!) بينما تبقى `GRANDMOTHER_PATERNAL` بلا أي ملف حجب!
  3. **إغفال شرط `state: "ALIVE"` في عدة قواعد YAML:** فيحجب الأقارب الموتى الورثة الأحياء!
  4. **تحويل الصفر إلى واحد في `evaluator.ts`:** التعبير `const targetCount = condition.count || 1;` يحول `count: 0` إلى `1`! **التصويب:** `condition.count ?? 1`.
  5. **تلويث شجرة المصدر أثناء الاختبار:** يكتب `parser.test.ts:169` مباشرة فوق الملف المتتبع `src/rules_bundled.ts` في كل تشغيلة اختبار!

---

### `NSB-16` [CRITICAL / حرج — انهيار وقت التشغيل `TypeError: graph.getAllNodes is not a function` وتعداد `undefined`] علل الحزم الفرعية `nasab-validator` و `nasab-inference` و `nasab-api`
- **الملفات والأسطر:**
  - `packages/nasab/packages/nasab-validator/src/structural.ts`
  - `packages/nasab/packages/nasab-inference/src/engine.ts`
  - `packages/nasab/packages/nasab-api/src/index.ts`
- **التشخيص الذري والتصويب:**
  1. **`nasab-validator`:** يستدعي الدالة غير الموجودة `graph.getAllNodes()` على كائن `NasabGraph` (فتنهار فوراً بـ `TypeError` وقت التشغيل!)، ويفحص `RelationCategory.BIOLOGICAL` غير المعرّفة (`undefined`) لأن اسم العضو الفعلي في `@nasab/core` هو `RelationCategory.BLOOD_LINEAGE`!
  2. **`nasab-inference`:** يستخدم `r.includes('SIBLING')` فيطابق `'SIBLING_MATERNAL'` خطأً عند تقييم قواعد `'SIBLING_FULL'`!
  3. **`nasab-api`:** يفترض جنس `'MALE'` صامتاً عند غياب الجنس، ويتجاهل معامل `madhab` الممرر إلى `evaluate()`، ويستخدم المتغير `__dirname` الخاص بـ CommonJS داخل حزمة ESM (`"type": "module"`).

---

### `NSB-17` [MEDIUM / متوسط — حقن صياغة Mermaid واستبدال غير شامل في المترجم] علل محولات العرض (`Adapters`) و `Translator` في `packages/nasab/src/adapters/*`
- **الملفات والأسطر:** `packages/nasab/src/adapters/MermaidAdapter.ts`، `D3TreeAdapter.ts`، `ReactFlowAdapter.ts`، و `src/i18n/Translator.ts`
- **التشخيص الذري والتصويب:**
  1. **`MermaidAdapter.ts`:** لا يزيل محارف السطر الجديد `\n` أو الأقواس من الأسماء ولا يطهر المعرّفات التي تحوي `-` أو `@`، مما يكسر بناء جملة Mermaid أو يسمح بحقن عقد؛ كما يفشل `Math.max(...[])` (`-Infinity`) على المصفوفات الفارغة في `ReactFlowAdapter.ts`.
  2. **`D3TreeAdapter.ts`:** ينسخ الأشجار الفرعية تكرارياً بتعقيد أسي عند زواج الأقارب (`Pedigree Collapse`) دون حد أقصى للعمق أو تتبع العقد المستنسخة.
  3. **`Translator.ts`:** يستخدم `str.replace(\`{${k}}\`, val)` غير الشامل (يستبدل أول ظهور فقط بدلاً من `replaceAll`).

---

## الباب الثامن: البنية التحتية للمستودع المتعدد (`Monorepo`)، أنابيب `CI/CD`، التجميع، ونظافة `Git` (`INF-01` – `INF-06`)

### `INF-01` [CRITICAL / حرج — أنبوب CI أعمى يغفل بناء الحزم، فحص Rust، فحص `nasab`، و ESLint] قصور هيكلي في `.github/workflows/ci.yml`
- **الملف والأسطر:** [`ci.yml`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/.github/workflows/ci.yml#L31-L36)
- **الكود المعطوب:**
```yaml
- name: Typecheck
  run: npx tsc --noEmit --project apps/desktop/tsconfig.json

- name: Run Unit Tests
  run: npm run test
```
- **التشخيص الذري:**
  1. لا يشغل `npm run build` قبل الفحص والاختبار (فلو تغيرت واجهة `@scriptflow/core` أو `@scriptflow/database` تفشل أو تستخدم تعريفات قديمة).
  2. يفحص أنواع `apps/desktop` وحدها مغفلاً `packages/database` و `packages/application` و `packages/nasab` و `packages/export-engine`!
  3. لا يشغل `cargo check` أو `cargo test` على الطبقة الخلفية [`apps/desktop/src-tauri`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src-tauri/Cargo.toml)، ولا يشغل `npm run lint`!
- **التصويب الدقيق:** تحديث سير عمل GitHub Actions ليشمل تثبيت Rust (`dtolnay/rust-toolchain@stable` + حزم WebKitGTK على Ubuntu)، ثم تنفيذ `npm run build`، وفحص الأنواع عبر جميع مساحات العمل (`--workspaces`)، وتشغيل `npm run lint`، و `npm run test --workspaces --if-present`، و `cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml`.

---

### `INF-02` [HIGH / عالٍ — بروتوكول `"workspace:*"` غير المدعوم في `npm` وغياب `tsconfig.json` عن حزم `nasab-*`] تعارض هيكلة مساحات العمل في `package.json` و `package-lock.json`
- **الملفات والأسطر:** [`package.json`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/package.json#L7-L11) و `packages/nasab/packages/*/package.json` و [`package-lock.json`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/package-lock.json#L12265-L12312)
- **التشخيص الذري والتصويب:**
  1. يدرج `package.json` الجذري `"tooling/*"` (حيث `tooling/tsconfig` لا يحوي `package.json`!) ويغفل `"packages/nasab/packages/*"`.
  2. تستخدم الحزم الفرعية `packages/nasab/packages/nasab-*` الصيغة `"@nasab/core": "workspace:*"` الخاصة بـ `pnpm`/`yarn` والتي يرفضها `npm` بـ `EUNSUPPORTEDPROTOCOL`، كما تعلن سكربت `"build": "tsc"` دون وجود أي ملف `tsconfig.json` بداخلها!
  3. يحتفظ `package-lock.json` بحزم محذوفة قديمة (`@scriptflow/domain-*`) موسومة بـ `"extraneous": true`. **التصويب:** توحيد `"*"` في `npm workspaces`، وإضافة `tsconfig.json` لكل حزمة فرعية، وتشغيل `npm prune`.

---

### `INF-03` [HIGH / عالٍ — اعتماد `zod` غير مصرّح به، ملفات `.d.ts` مقطوعة، وتسرب وحدات Node `fs`/`path` لحزمة المتصفح] علل تغليف ونشر `packages/nasab`
- **الملفات والأسطر:** [`packages/nasab/package.json`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/package.json#L25-L60) و [`vite.config.lib.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/vite.config.lib.ts#L7-L25)
- **التشخيص الذري والتصويب:**
  1. يستورد الكود المصدري (`src/core/schema.ts` و `nasab-rule-engine`) مكتبة `zod` في وقت التشغيل **دون إدراجها في `dependencies`**! وفي المقابل تُدرج `fraction.js` في `dependencies` رغم أنها مستخدمة في ملف اختبار `tests/fuzzing.test.ts` فقط!
  2. يغفل `vite-plugin-dts` في `vite.config.lib.ts:9` المجلد `'src/adapters'` من مصفوفة `include`، فينكسر السطر `export * from './adapters'` في `lib/src/index.d.ts` عند المستهلكين! كما يستورد `lib/src/mawarith/types.d.ts` مساراً نسبياً خارج مجلد `"files": ["lib"]` المنشور!
  3. يستورد `EvidencePlugin` وحدتي Node.js `fs` و `path` مباشرة ضمن الشجرة المصدرية المجمعة للمتصفح (`ESM`/`UMD`). **التصويب:** نقل `zod` إلى `dependencies`، ونقل `fraction.js` إلى `devDependencies`، وإضافة `'src/adapters'` إلى `dts({ include })`، وفصل إضافات Node عن مدخل المتصفح.

---

### `INF-04` [HIGH / عالٍ — إقصاء اختبارات الحزم الفرعية صامتاً وتفاوت حاد في إصدارات `vitest` و `vite` و `typescript`] فجوة `vitest.config.ts` وتضارب الإصدارات
- **الملفات والأسطر:** [`packages/nasab/vitest.config.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/vitest.config.ts#L5-L8) وملفات `package.json` عبر مساحات العمل
- **التشخيص الذري والتصويب:**
  1. يحصر `packages/nasab/vitest.config.ts` خاصية `include` في `['src/**/__tests__/**/*.test.ts', 'tests/**/*.test.ts']`، مما يتسبب في **تجاهل جميع اختبارات `packages/nasab/packages/*/tests/*.test.ts` صامتاً** أثناء تشغيل `npm test`!
  2. تتضارب إصدارات الأدوات الأساسية عبر المستودع: 3 إصدارات مختلفة جذرياً من `vitest` (`^1.4.0` في `nasab` مقابل `^4.1.2` في `desktop` و `^4.1.5` في الجذر و `application`)، وإصداران من `vite` (`^6.2.3` مقابل `^7.0.4`)، وإصداران من `typescript` (`^5.4.0` مقابل `~5.8.3`). **التصويب:** توحيد الإصدارات عبر `overrides` أو تحديث `packages/nasab/package.json` وتوسيع `include` ليشمل `'packages/*/tests/**/*.test.ts'`.

---

### `INF-05` [MEDIUM / متوسط — أوامر حذف غير متوافقة مع Windows، وإعداد `tsconfig` أساسي يمنع التجميع، وتتبع الروابط الرمزية اللانهائي] علل الأدوات المساعدة (`Tooling`)
- **الملفات والأسطر:**
  - [`packages/nasab/package.json`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/package.json#L43)
  - [`stryker.config.json`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/nasab/stryker.config.json#L2)
  - [`tooling/tsconfig/base.json`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/tooling/tsconfig/base.json#L8-L11)
  - [`tooling/generate-tree.js`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/tooling/generate-tree.js#L41)
- **التشخيص الذري والتصويب:**
  1. يستخدم سكربت `clean` في `packages/nasab/package.json` الأمر اليونكسي `rm -rf dist coverage .stryker-tmp` الذي يفشل في `cmd.exe` على Windows؛ يُستبدل بـ `node -e "['dist','lib','coverage','.stryker-tmp'].forEach(d=>require('fs').rmSync(d,{recursive:true,force:true}))"`.
  2. يضع `tooling/tsconfig/base.json` الخيارين `"allowImportingTsExtensions": true` و `"noEmit": true`، مما يمنع أي حزمة مكتبية ترث منه من إصدار ملفات `dist/` عبر `tsc`!
  3. يستخدم `tooling/generate-tree.js:41` الدالة `fs.statSync` بدلاً من `fs.lstatSync`، مما يتسبب في دوران لانهائي إذا وجدت وصلة رمزية دائرية (`Directory Junction/Symlink`).

---

### `INF-06` [MEDIUM / متوسط — تتبع مخرجات بناء وأرشيف قديم في Git ونقص تطبيع نهايات الأسطر] نظافة المستودع (`.gitignore` و `.gitattributes`)
- **الملفات والأسطر:** [`.gitignore`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/.gitignore#L1-L43) و [`.gitattributes`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/.gitattributes#L1-L2)
- **التشخيص الذري والتصويب:**
  1. يتتبع Git مجلد المخرجات المترجمة `packages/nasab/lib/` ومجلد المكونات المهجورة `apps/desktop/_archive_tsx/`! **التصويب:** إضافة `packages/nasab/lib/` إلى `.gitignore` وإزالته من الفهرس بـ `git rm -r --cached packages/nasab/lib`، وحذف `_archive_tsx` نهائياً.
  2. يطبع `.gitattributes` ملفات `*.sql` وحدها، مما يسبب ضجيج `CRLF/LF` في ملفات `.ts`, `.tsx`, `.rs`, `.json`, `.yaml` بين بيئات Windows و Linux CI. **التصويب:** إضافة `* text=auto eol=lf` مع استثناء الملفات الثنائية وملفات `.bat`/`.ps1`.

---

## الباب التاسع: خارطة الطريق التنفيذية المرتبة حسب الأولوية الهندسية (`Actionable Remediation Roadmap`)

لضمان تطبيق التصويبات بأمان تام دون كسر الاعتماديات المتبادلة، يُنصح بتنفيذ الإصلاحات وفق المراحل الأربع التالية بالترتيب:

### المرحلة `P0` — طوارئ فورية (منع مسح البيانات، الثغرات الأمنية، وانهيارات الإقلاع)
1. **حماية قاعدة البيانات عند الإقلاع والاستعادة (`TAU-02`, `TAU-03`):** حذف شرط المسح الكارثي `< 400_000` بايت من [`lib.rs`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src-tauri/src/lib.rs#L160-L185)، وتصحيح ترتيب تحميل `tauri_plugin_sql`، وحذف ملفي `-wal` و `-shm` داخل `restore_safety_backup`.
2. **إصلاح هجرة اللقطات التاريخية (`DB-01`):** إضافة هجرة `012_fix_scene_snapshots_text_ids.sql` لتحويل `scene_id` و `scenario_id` إلى `TEXT` وتفعيل `PRAGMA foreign_keys = ON` في [`client.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/packages/database/src/client.ts).
3. **إغلاق ثغرات تنفيذ الأوامر واجتياز المسارات (`TAU-01`, `EDT-07`, `EDT-08`, `UI-01`, `UI-02`):** تفعيل `CSP` وتضييق `assetProtocol.scope` وصلاحيات `capabilities/default.json`، وتثبيت `dompurify` لتعقيم `CharacterProfilePage` و `PaginationExtension` و `exportPDF`، والتحقق الصارم من مسارات `mediaStorage` و `BackupService`، وتأمين `LockScreen` بـ `PBKDF2`.
4. **وقف فقدان نصوص السيناريو عند الحفظ والإغلاق (`EDT-01`, `EDT-03`, `EDT-05`):** تعريف سمة `block_id` في جميع امتدادات العقد التسع + إضافة `UndoRedo` وإصلاح `splitBlock` في [`PaperEditor.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/paper/PaperEditor.tsx) + إصلاح انتظار `inFlightPromise` في [`AutosaveQueue.ts`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/components/editor/autosave/AutosaveQueue.ts) ومعالج `onCloseRequested` في [`SceneEditor.tsx`](file:///d:/SCRIPTFLOW%20Pro/SCRIPTFLOW%20ENREPRISE/apps/desktop/src/pages/SceneEditor.tsx).

### المرحلة `P1` — إصلاح الأعطال الوظيفية الحرجة في قاعدة البيانات، الاستيراد، والواجهات
1. **إصلاح طبقة المعاملات والمستودعات (`DB-02`..`DB-06`, `APP-01`, `APP-02`):** إصلاح طابور المعاملات الذري في `client.ts`، وحذف `id: undefined` من `ProductionTaskRepository.create`، ومزامنة `tones` و `ILocation`، وإصلاح المستورد `ImportProject.ts` (مع إزالة `// @ts-nocheck`) و `CloneScene.ts` وحزمة `export-engine`.
2. **إصلاح انهيارات الواجهة والبيانات التالفة (`UI-05`, `UI-12`, `UI-15`, `UI-19`, `UI-20`, `EDT-02`, `EDT-04`, `EDT-06`):** تعريف `--app-radius` في `index.css`، وإصلاح `DailyView.tsx` (قواعد الخطافات)، و `useTimelineReordering.ts` (حالة React 19)، و `CrewAssignmentModal.tsx` (إزالة `parseInt`)، و `SceneMetadataForm.tsx`، و `Insights.tsx` (`useAllRemindersQuery`)، وحلقة `&amp;` اللانهائية في `bridge.ts`.
3. **إصلاح شجرة العلاقات وتصدير GEDCOM (`REL-01`..`REL-06`):** تمرير `e.data?.relType` في تصدير GEDCOM، وتمرير `rawEdges` إلى `CharacterRPGPanel`، وحل وعد `debouncedProcessGraph`، وربط `KinshipValidator`، وإصلاح تعدد الزوجات في `graphTransformers.ts`.

### المرحلة `P2` — ضبط محرك الأنساب والمواريث (`nasab`) ودقة الترقيم وجدول التصوير
1. **تصحيح الحساب والفقه في `packages/nasab` (`NSB-01`..`NSB-16`):** إصلاح بتر الكسور العشرية و `lcmBigInt` في `Fraction.ts`/`MathEngine.ts`، وتصحيح فئات الورثة (`UNCLE_FULL_MALE`, `NEPHEW_FULL_MALE` وعزل الخال وأولاد البنات وأبي الأم) في `CategoryEngine.ts`، وتوحيد مجموعة فرض الإخوة لأم، وإصلاح `MadhabOverrides.ts` و `BlockingEngine`/`SharesEngine`/`AsabaEngine`/`BaseEngine`، وتصحيح أولويات `mother_share.yaml` و `grandmother_blocking.yaml`، وإصلاح `structural.ts` (`NasabGraph`) و `KinshipValidator` و `FosterEngine` و `GraphEngine.calculateCOI`.
2. **مواءمة محرك قياس الصفحات وجدول التصوير (`EDT-09`, `EDT-10`, `EDT-12`, `UI-21`, `UI-22`):** توحيد ثوابت `TextMeasurementEngine` مع `PaginationExtension` و `exportPDF`، وإلغاء تضخم مدة التصوير `page_count * 60`، وإصلاح تواريخ `continuityAnalyzer.ts`.

### المرحلة `P3` — تحصين أنابيب `CI/CD`، التغليف، والاختبارات الآلية (`INF-01`..`INF-06`)
1. تفعيل `test/**/*` في `packages/database/tsconfig.json` وتحديث `setup.ts`، وتوسيع `packages/nasab/vitest.config.ts` ليشمل الحزم الفرعية `packages/*/tests`.
2. تصحيح تبعيات `zod` و `nasab` وإعداد `vite-plugin-dts`، وتوحيد إصدارات `vitest`/`vite`/`typescript`.
3. ترقية `.github/workflows/ci.yml` لبناء وفحص واختبار كافة حزم TypeScript و Rust معاً ومنع دخول أي انحدار مستقبلي.
