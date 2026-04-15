#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage: ./bump.sh <version>"
  echo "Example: ./bump.sh 0.2.0"
  exit 1
fi

VERSION=$1
PREV=$(grep '"version"' package.json | head -1 | sed 's/.*"version": "\(.*\)".*/\1/')

sed -i '' "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" package.json
sed -i '' "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" src-tauri/tauri.conf.json
sed -i '' "s/^version = \".*\"/version = \"$VERSION\"/" src-tauri/Cargo.toml

git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml
git commit -m "bump: v$VERSION"
git tag "v$VERSION"
git push
git push origin "v$VERSION"

echo "Bumped v$PREV -> v$VERSION and pushed tag"
