@echo off
docker build -t ditto-linux-builder .
docker run --rm -v %cd%:/app ditto-linux-builder bash -c "npm install && npx tauri build"
echo.
echo Build output: src-tauri/target/release/bundle/
pause
