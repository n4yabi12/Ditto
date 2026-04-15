@echo off
if "%~1"=="" (
  echo Usage: bump.bat ^<version^>
  echo Example: bump.bat 0.2.0
  exit /b 1
)

set VERSION=%~1

for /f "tokens=2 delims=:, " %%a in ('findstr /r "\"version\"" package.json') do (
  set "PREV=%%~a"
  goto :done
)
:done

powershell -Command "(Get-Content package.json) -replace '\"version\": \".*?\"', '\"version\": \"%VERSION%\"' | Set-Content package.json"
powershell -Command "(Get-Content src-tauri\tauri.conf.json) -replace '\"version\": \".*?\"', '\"version\": \"%VERSION%\"' | Set-Content src-tauri\tauri.conf.json"
powershell -Command "(Get-Content src-tauri\Cargo.toml) -replace '^version = \".*?\"', 'version = \"%VERSION%\"' | Set-Content src-tauri\Cargo.toml"

git add package.json src-tauri\tauri.conf.json src-tauri\Cargo.toml
git commit -m "bump: v%VERSION%"
git tag "v%VERSION%"
git push
git push origin "v%VERSION%"

echo Bumped v%PREV% -^> v%VERSION% and pushed tag
