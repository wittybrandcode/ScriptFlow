// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

use tauri::Manager;

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
        Ok(format!("HEALTHY: Database file exists at {:?}", path))
    } else {
        Err(format!("UNHEALTHY: Database file not found at {:?}", path))
    }
}

use tauri_plugin_sql::{Migration, MigrationKind};

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
        .invoke_handler(tauri::generate_handler![
            greet, 
            get_app_root, 
            get_db_path,
            check_db_health
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
