// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::path::{Path, PathBuf};
use tauri::Manager;
use serde::Serialize;
use tauri_plugin_sql::{Migration, MigrationKind};

#[derive(Serialize)]
pub struct DbDiagnosticInfo {
    pub app_root: String,
    pub db_path: String,
    pub db_exists: bool,
    pub db_size_bytes: u64,
    pub legacy_found: bool,
    pub legacy_path: Option<String>,
    pub status: String,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_app_root(app: tauri::AppHandle) -> String {
    let base_dir = app.path().app_data_dir().unwrap_or_else(|_| std::env::current_dir().unwrap_or_default());
    
    if !base_dir.exists() {
        let _ = std::fs::create_dir_all(&base_dir);
    }
    
    base_dir.to_string_lossy().into_owned()
}

#[tauri::command]
fn get_db_path() -> String {
    "sqlite:scriptflow.db".to_string()
}

#[tauri::command]
fn check_db_health(app: tauri::AppHandle) -> Result<String, String> {
    let root = get_app_root(app);
    let path = std::path::Path::new(&root).join("scriptflow.db");
    if path.exists() {
        let size = std::fs::metadata(&path).map(|m| m.len()).unwrap_or(0);
        Ok(format!("HEALTHY: Database file exists at {:?} ({} bytes)", path, size))
    } else {
        Err(format!("UNHEALTHY: Database file not found at {:?}", path))
    }
}

#[tauri::command]
fn get_db_diagnostic_info(app: tauri::AppHandle) -> DbDiagnosticInfo {
    let root = get_app_root(app);
    let path = std::path::Path::new(&root).join("scriptflow.db");
    let exists = path.exists();
    let size = if exists {
        std::fs::metadata(&path).map(|m| m.len()).unwrap_or(0)
    } else {
        0
    };

    let appdata = std::env::var("APPDATA").unwrap_or_default();
    let mut legacy_found = false;
    let mut legacy_path = None;
    if !appdata.is_empty() {
        let cand = PathBuf::from(&appdata).join("com.tawfikmostefaoui.desktop").join("scriptflow.db");
        if cand.exists() {
            legacy_found = true;
            legacy_path = Some(cand.to_string_lossy().into_owned());
        }
    }

    let status = if exists && size >= 400_000 {
        "HEALTHY".to_string()
    } else if exists {
        "INITIALIZING_OR_EMPTY".to_string()
    } else {
        "MISSING".to_string()
    };

    DbDiagnosticInfo {
        app_root: root,
        db_path: path.to_string_lossy().into_owned(),
        db_exists: exists,
        db_size_bytes: size,
        legacy_found,
        legacy_path,
        status,
    }
}

#[tauri::command]
fn open_app_data_folder(app: tauri::AppHandle) -> Result<String, String> {
    let root = get_app_root(app);
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&root)
            .spawn()
            .map_err(|e| e.to_string())?;
        Ok(format!("Opened folder: {}", root))
    }
    #[cfg(not(target_os = "windows"))]
    {
        Ok(root)
    }
}

#[tauri::command]
fn restore_safety_backup(app: tauri::AppHandle) -> Result<String, String> {
    let root = get_app_root(app);
    let current_dir = PathBuf::from(&root);
    let target_db = current_dir.join("scriptflow.db");
    let safety_copy = current_dir.join("backups").join("pre_launch_safety.db");

    if !safety_copy.exists() {
        return Err("No pre-launch safety backup found in backups folder.".to_string());
    }

    if target_db.exists() {
        let _ = std::fs::copy(&target_db, current_dir.join("scriptflow_corrupted_archive.db"));
    }

    std::fs::copy(&safety_copy, &target_db)
        .map_err(|e| format!("Failed to restore backup: {}", e))?;

    Ok("Successfully restored database from pre-launch safety backup.".to_string())
}

fn copy_dir_all(src: &Path, dst: &Path) -> std::io::Result<()> {
    if !dst.exists() {
        std::fs::create_dir_all(dst)?;
    }
    for entry in std::fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        if ty.is_dir() {
            copy_dir_all(&entry.path(), &dst.join(entry.file_name()))?;
        } else {
            std::fs::copy(entry.path(), dst.join(entry.file_name()))?;
        }
    }
    Ok(())
}

fn auto_migrate_and_protect_db(app: &tauri::AppHandle) {
    let current_dir = app.path().app_data_dir().unwrap_or_else(|_| std::env::current_dir().unwrap_or_default());
    if !current_dir.exists() {
        let _ = std::fs::create_dir_all(&current_dir);
    }

    let target_db = current_dir.join("scriptflow.db");
    let current_size = if target_db.exists() {
        std::fs::metadata(&target_db).map(|m| m.len()).unwrap_or(0)
    } else {
        0
    };

    // If database doesn't exist or is an unpopulated skeleton (< 400KB), check legacy paths
    if current_size < 400_000 {
        let appdata = std::env::var("APPDATA").unwrap_or_default();
        if !appdata.is_empty() {
            let legacy_candidates = vec![
                PathBuf::from(&appdata).join("com.tawfikmostefaoui.desktop"),
                PathBuf::from(&appdata).join("com.workstation.scriptflow_pro"),
            ];

            for candidate_dir in legacy_candidates {
                let candidate_db = candidate_dir.join("scriptflow.db");
                if candidate_db.exists() {
                    let cand_size = std::fs::metadata(&candidate_db).map(|m| m.len()).unwrap_or(0);
                    if cand_size > current_size {
                        println!("[ScriptFlow Auto-Migration] Found legacy database ({:?}, {} bytes). Migrating to {:?}...", candidate_db, cand_size, target_db);
                        if target_db.exists() {
                            let _ = std::fs::copy(&target_db, current_dir.join("scriptflow_pre_migration.db.bak"));
                        }
                        if let Ok(_) = std::fs::copy(&candidate_db, &target_db) {
                            println!("[ScriptFlow Auto-Migration] Database successfully migrated!");
                            let legacy_backups = candidate_dir.join("backups");
                            let target_backups = current_dir.join("backups");
                            if legacy_backups.exists() && !target_backups.exists() {
                                let _ = copy_dir_all(&legacy_backups, &target_backups);
                            }
                            break;
                        }
                    }
                }
            }
        }
    }

    // Pre-launch safety backup: if db exists and is populated (>= 400KB)
    if target_db.exists() {
        let size = std::fs::metadata(&target_db).map(|m| m.len()).unwrap_or(0);
        if size >= 400_000 {
            let backups_dir = current_dir.join("backups");
            if !backups_dir.exists() {
                let _ = std::fs::create_dir_all(&backups_dir);
            }
            let safety_copy = backups_dir.join("pre_launch_safety.db");
            let _ = std::fs::copy(&target_db, safety_copy);
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "initial_schema",
            sql: include_str!("../migrations/001_initial_schema.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "add_scenes_version",
            sql: include_str!("../migrations/002_add_scenes_version.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "add_character_dates",
            sql: include_str!("../migrations/003_add_character_dates.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "add_cover_video",
            sql: include_str!("../migrations/004_add_cover_video.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "sqlite_optimizations",
            sql: include_str!("../migrations/005_sqlite_optimizations.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 6,
            description: "add_character_metadata",
            sql: include_str!("../migrations/006_add_character_metadata.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 7,
            description: "timeline_schema_evolution",
            sql: include_str!("../migrations/007_timeline_schema_evolution.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 8,
            description: "add_scene_page_eighths",
            sql: include_str!("../migrations/008_add_scene_page_eighths.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 9,
            description: "create_page_numbering",
            sql: include_str!("../migrations/009_create_page_numbering.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 10,
            description: "create_scene_snapshots",
            sql: include_str!("../migrations/010_create_scene_snapshots.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 11,
            description: "create_scene_reminders",
            sql: include_str!("../migrations/011_create_scene_reminders.sql"),
            kind: MigrationKind::Up,
        },
    ];

    let connection_string = "sqlite:scriptflow.db".to_string();

    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
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
        .invoke_handler(tauri::generate_handler![
            greet, 
            get_app_root, 
            get_db_path,
            check_db_health,
            get_db_diagnostic_info,
            open_app_data_folder,
            restore_safety_backup
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
