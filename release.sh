#!/usr/bin/env bash
set -euo pipefail

BUMP="${1:-}"

if [[ "$BUMP" != "patch" && "$BUMP" != "minor" && "$BUMP" != "major" ]]; then
  echo "Usage: ./release.sh <patch|minor|major>"
  exit 1
fi

echo "📦 Bumping $BUMP version..."
NEW_VERSION=$(npm version "$BUMP" --no-git-tag-version)
VERSION_NUM="${NEW_VERSION#v}"

echo "💾 Committing version bump..."
git add package.json package-lock.json
git commit --no-gpg-sign -m "chore: bump version to $NEW_VERSION"

echo "🏷️  Creating tag $NEW_VERSION..."
git tag -a "$NEW_VERSION" -m "chore: bump version to $VERSION_NUM"

echo "🚀 Pushing commit and tag..."
git push && git push --tags

echo "✅ Released $VERSION_NUM"
