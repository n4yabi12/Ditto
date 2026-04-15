@echo off
if "%~1"=="" (
  echo Usage: bump.bat ^<version^>
  echo Example: bump.bat 0.2.0
  exit /b 1
)

set VERSION=%~1

powershell -Command "(Get-Content package.json) -replace '\"version\": \".*?\"', '\"version\": \"%VERSION%\"' | Set-Content package.json"
powershell -Command "(Get-Content src-tauri\tauri.conf.json) -replace '\"version\": \".*?\"', '\"version\": \"%VERSION%\"' | Set-Content src-tauri\tauri.conf.json"
powershell -Command "(Get-Content src-tauri\Cargo.toml) -replace '^version = \".*?\"', 'version = \"%VERSION%\"' | Set-Content src-tauri\Cargo.toml"

echo Bumped to v%VERSION%
