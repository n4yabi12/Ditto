#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage: ./bump.sh <version>"
  echo "Example: ./bump.sh 0.2.0"
  exit 1
fi

VERSION=$1

sed -i '' "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" package.json
sed -i '' "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" src-tauri/tauri.conf.json
sed -i '' "s/^version = \".*\"/version = \"$VERSION\"/" src-tauri/Cargo.toml

echo "Bumped to v$VERSION"
