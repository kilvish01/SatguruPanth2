# Satguru Panth - Deployment Guide

## 🚀 Automated Deployment Overview

This app uses GitHub Actions for automated building and deployment to Google Play Store.

## 📋 Quick Links

- **[Quick Start Guide](./QUICK_START_CICD.md)** - 30 minutes to full CI/CD setup
- **[Detailed CI/CD Guide](./CI_CD_SETUP.md)** - Complete technical documentation
- **[Encode Keystore Script](./scripts/encode-keystore.sh)** - Helper script

## ✅ Current Status

### Fixed Issues
- ✅ All TypeScript errors resolved
- ✅ Type definitions properly exported
- ✅ Component prop types fixed
- ✅ Navigation types corrected
- ✅ Book interface unified across components
- ✅ Image module declarations fixed
- ✅ Android build configuration verified

### App Configuration
- **App Name**: Satguru Panth
- **Package**: com.satgurupanth.satguruapp
- **Current Version**: 1.0.0
- **Version Code**: 1
- **Build Tools**: Expo 54, React Native 0.81.5
- **Target SDK**: Latest (configured in gradle)

## 🏗️ Build System

### Local Development Build

```bash
# Install dependencies
npm install

# Run on Android
npx expo run:android

# Or start metro bundler
npm start
```

### Local Production Build

```bash
# Build APK (for testing)
cd android
./gradlew assembleRelease

# Build AAB (for Play Store)
./gradlew bundleRelease
```

**Output Locations:**
- APK: `android/app/build/outputs/apk/release/app-release.apk`
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`

## 🔄 CI/CD Workflows

### 1. Continuous Testing (`android-test.yml`)
**Triggers**: Every push and PR
- TypeScript type checking
- ESLint code quality checks
- Build verification
- No deployment

### 2. Build & Deploy (`android-build-deploy.yml`)
**Triggers**: Push to main/develop, manual dispatch

**On any branch:**
- Builds signed APK
- Uploads artifact to GitHub

**On main branch only:**
- Builds signed AAB
- Deploys to Play Store Internal Testing
- Notifies on completion

## 🔑 Required Secrets

Add these in: GitHub → Settings → Secrets and variables → Actions

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `KEYSTORE_BASE64` | Base64 encoded keystore | Run `./scripts/encode-keystore.sh` |
| `KEYSTORE_PASSWORD` | Keystore password | `satguru@2026` |
| `KEY_ALIAS` | Key alias name | `satguruapp-release` |
| `KEY_PASSWORD` | Key password | `satguru@2026` |
| `PLAY_STORE_SERVICE_ACCOUNT_JSON` | Google service account | Create in Play Console → API Access |

## 📱 Deployment Tracks

### Internal Testing (Automated)
- **Who**: Selected testers
- **When**: Automatic on main branch push
- **Purpose**: QA and testing
- **Rollout**: Immediate

### Production (Manual Promotion)
- **Who**: All users on Play Store
- **When**: Manual promotion from Internal Testing
- **Purpose**: Public release
- **Rollout**: Staged rollout recommended

## 🔢 Version Management

Before each release, update version in `app.json`:

```json
{
  "expo": {
    "version": "1.0.1",      // Semantic version (user-facing)
    "android": {
      "versionCode": 2      // Integer (must increment)
    }
  }
}
```

**Version Code Rules:**
- Must be an integer
- Must be greater than previous version
- Cannot reuse version codes
- Increment by 1 for each release

## 🎯 Release Process

### Standard Release
1. Update version in `app.json`
2. Commit changes: `git commit -am "Release v1.0.1"`
3. Push to main: `git push origin main`
4. Wait for GitHub Actions (10-15 min)
5. Test in Internal Testing
6. Promote to Production in Play Console

### Hotfix Release
1. Create hotfix branch from main
2. Fix the issue
3. Update version (increment patch number)
4. Merge to main
5. CI/CD handles the rest

## 🛠️ Backend Configuration

### Current Setup
- **Backend**: AWS Lambda + API Gateway
- **Base URL**: `https://k14jep2w9e.execute-api.us-east-1.amazonaws.com/dev`
- **Configuration**: `src/config/api.config.ts`

### API Endpoints
- Books: `/api/books/all`
- Book Details: `/api/books/:id`
- Most Viewed: `/api/books/popular/viewed`
- Most Liked: `/api/books/popular/liked`

## 🔍 Verification Checklist

Before pushing to main:

- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] No lint errors: `npm run lint`
- [ ] App builds locally: `cd android && ./gradlew assembleRelease`
- [ ] Version numbers incremented
- [ ] Backend API accessible
- [ ] Keystore file present and valid

## 📊 Monitoring & Logs

### GitHub Actions
- View workflow runs: Repository → Actions tab
- Download build artifacts: Actions → Workflow run → Artifacts
- Check logs: Click on failed step in workflow

### Play Console
- Release status: Play Console → Release → Internal testing
- Crash reports: Play Console → Quality → Crashes & ANRs
- User feedback: Play Console → Ratings and reviews

## 🐛 Troubleshooting

### Build Failures

**Error: Keystore not found**
```
Solution: Verify KEYSTORE_BASE64 secret is correctly encoded
Run: ./scripts/encode-keystore.sh
```

**Error: Version conflict**
```
Solution: Increment versionCode in app.json
Must be higher than previous releases
```

**Error: Gradle build failed**
```
Solution: Check gradle logs in GitHub Actions
Verify android/gradle.properties settings
Clear gradle cache if needed
```

### Deployment Failures

**Error: Service account permission denied**
```
Solution: In Play Console → API access
Grant "Release Manager" role to service account
```

**Error: Package name mismatch**
```
Solution: Verify package name is com.satgurupanth.satguruapp
Check app.json and android/app/build.gradle
```

## 📞 Support

For deployment issues:
- Check [CI_CD_SETUP.md](./CI_CD_SETUP.md) for detailed troubleshooting
- Review GitHub Actions logs
- Verify all secrets are correctly configured
- Check Play Console API access settings

## 🔒 Security Best Practices

- ✅ Never commit keystore files
- ✅ Never commit passwords or secrets
- ✅ Use GitHub Secrets for sensitive data
- ✅ Rotate service account keys annually
- ✅ Review Play Console access permissions regularly
- ✅ Enable 2FA on Google Play Console account

## 📈 Future Enhancements

Planned improvements:
- [ ] Add unit tests to CI pipeline
- [ ] Implement E2E testing
- [ ] Add beta testing track
- [ ] Automatic changelog generation
- [ ] Slack/Discord notifications
- [ ] Performance monitoring integration
- [ ] Automated screenshot generation

---

**Last Updated**: 2026-02-02
**Maintained By**: Development Team
**CI/CD Status**: ✅ Active and Configured
