# CI/CD Setup Guide for Satguru Panth Android App

This document explains how to set up continuous integration and deployment for the Satguru Panth Android application.

## Overview

The CI/CD pipeline automatically:
1. Runs tests and type checking on every push
2. Builds Android APK for all branches
3. Builds Android AAB (App Bundle) for main branch
4. Automatically deploys to Google Play Store Internal Testing on main branch updates

## Workflows

### 1. android-test.yml
- **Triggers**: Every push and pull request
- **Purpose**: Run TypeScript checks, linting, and tests
- **No secrets required**

### 2. android-build-deploy.yml
- **Triggers**: Push to main/develop, pull requests to main, manual dispatch
- **Purpose**: Build APK/AAB and deploy to Play Store
- **Requires secrets** (see below)

## Required GitHub Secrets

You need to add the following secrets to your GitHub repository:

### 1. KEYSTORE_BASE64
Your Android keystore file encoded in base64.

**How to create:**
```bash
cd android/app
base64 -i satguruapp-release.keystore | pbcopy
```
Then paste the output into GitHub Secrets.

### 2. KEYSTORE_PASSWORD
The password for your keystore file.
- **Current value**: `satguru@2026`
- Add this to GitHub Secrets → Settings → Secrets and variables → Actions → New repository secret

### 3. KEY_ALIAS
The alias name for your signing key.
- **Current value**: `satguruapp-release`
- Add this to GitHub Secrets

### 4. KEY_PASSWORD
The password for your signing key.
- **Current value**: `satguru@2026`
- Add this to GitHub Secrets

### 5. PLAY_STORE_SERVICE_ACCOUNT_JSON
Google Play Console service account JSON for automated deployment.

**How to create:**
1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app
3. Go to Setup → API access
4. Create a new service account or use existing one
5. Grant "Release Manager" role
6. Download the JSON key file
7. Copy the entire JSON content and add it to GitHub Secrets

## Setting Up Google Play Console

### Step 1: Create Service Account
1. Go to Google Play Console
2. Navigate to Setup → API access
3. Click "Create new service account"
4. Follow the link to Google Cloud Console
5. Create a service account with name like "github-actions-deployer"
6. Download the JSON key

### Step 2: Grant Permissions
1. Back in Play Console → API access
2. Find your service account
3. Grant access and select "Release Manager" role
4. Save changes

### Step 3: Enable Internal Testing Track
1. Go to Release → Testing → Internal testing
2. Create a release track if not exists
3. Add testers email addresses

## Adding Secrets to GitHub

1. Go to your GitHub repository
2. Click Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret with exact names as listed above

## Version Management

The app version is managed in:
- [`app.json`](./app.json) - `expo.version` and `expo.android.versionCode`
- [`android/app/build.gradle`](./android/app/build.gradle) - `versionCode` and `versionName`

**Before each release, increment:**
1. `versionCode` (must be an integer, increment by 1)
2. `versionName` (semantic version like "1.0.1", "1.1.0", etc.)

## Manual Deployment

If you want to trigger a build manually:
1. Go to Actions tab in GitHub
2. Select "Android Build and Deploy" workflow
3. Click "Run workflow"
4. Select branch
5. Click "Run workflow" button

## Build Artifacts

After each build:
- **APK**: Available in Actions → Workflow run → Artifacts
- **AAB**: Available for main branch builds only
- Artifacts are retained for 30 days

## Troubleshooting

### Build fails with keystore error
- Verify KEYSTORE_BASE64 is correctly encoded
- Check keystore passwords match

### Play Store upload fails
- Ensure service account JSON is valid
- Check service account has "Release Manager" permissions
- Verify `com.satgurupanth.satguruapp` package name matches Play Console

### Version conflict
- Increment versionCode in both app.json and build.gradle
- versionCode must be higher than any previous release

## Local Testing

Before pushing, test locally:

```bash
# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Build Android
cd android
./gradlew assembleRelease
./gradlew bundleRelease
```

## Release Workflow

1. **Development**: Work on feature branches
2. **Testing**: Merge to `develop` branch - builds APK only
3. **Release**: Merge to `main` branch - builds AAB and deploys to Play Store Internal Testing
4. **Production**: Promote from Internal Testing to Production in Play Console

## Security Notes

- **Never commit** keystore files, passwords, or service account JSONs
- All sensitive data must be in GitHub Secrets
- Rotate service account keys periodically
- Review Play Console permissions regularly

## Support

For issues with:
- **GitHub Actions**: Check workflow logs in Actions tab
- **Play Store API**: Check Google Play Console → API access
- **Build errors**: Review gradle build logs in workflow output

---

**Last Updated**: 2026-02-02
**Maintained By**: Development Team
