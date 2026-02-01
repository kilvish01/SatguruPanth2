#!/bin/bash

# Script to encode Android keystore to base64 for GitHub Secrets
# Usage: ./scripts/encode-keystore.sh

set -e

KEYSTORE_PATH="android/app/satguruapp-release.keystore"

if [ ! -f "$KEYSTORE_PATH" ]; then
    echo "Error: Keystore file not found at $KEYSTORE_PATH"
    exit 1
fi

echo "Encoding keystore to base64..."
echo ""
echo "Copy the following base64 string and add it to GitHub Secrets as KEYSTORE_BASE64:"
echo "================================================================"

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    base64 -i "$KEYSTORE_PATH"
else
    # Linux
    base64 -w 0 "$KEYSTORE_PATH"
fi

echo ""
echo "================================================================"
echo ""
echo "Next steps:"
echo "1. Go to GitHub repository → Settings → Secrets and variables → Actions"
echo "2. Click 'New repository secret'"
echo "3. Name: KEYSTORE_BASE64"
echo "4. Value: Paste the base64 string from above"
echo "5. Click 'Add secret'"
echo ""
echo "Also add these secrets with their values:"
echo "- KEYSTORE_PASSWORD: satguru@2026"
echo "- KEY_ALIAS: satguruapp-release"
echo "- KEY_PASSWORD: satguru@2026"
echo ""
