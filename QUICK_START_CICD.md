# Quick Start: GitHub CI/CD Setup

Follow these steps to enable automatic app deployment when you push code to GitHub.

## Prerequisites

- GitHub repository for this project
- Google Play Console account with app created
- Android keystore file (already exists in `android/app/satguruapp-release.keystore`)

## Step 1: Encode Your Keystore (5 minutes)

Run this script to get the base64-encoded keystore:

```bash
./scripts/encode-keystore.sh
```

Copy the output - you'll need it in the next step.

## Step 2: Add GitHub Secrets (10 minutes)

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these 4 secrets one by one:

| Secret Name | Value |
|-------------|-------|
| `KEYSTORE_BASE64` | Paste the base64 string from Step 1 |
| `KEYSTORE_PASSWORD` | `satguru@2026` |
| `KEY_ALIAS` | `satguruapp-release` |
| `KEY_PASSWORD` | `satguru@2026` |

## Step 3: Setup Google Play Console API (15 minutes)

### Create Service Account

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app (or create one if it doesn't exist)
3. Navigate to **Setup** → **API access**
4. Click **Create new service account**
5. Click the link to Google Cloud Console
6. In Google Cloud Console:
   - Click **+ Create Service Account**
   - Name: `github-actions-deployer`
   - Click **Create and Continue**
   - Skip the optional steps, click **Done**
7. Click on the newly created service account
8. Go to **Keys** tab
9. Click **Add Key** → **Create new key**
10. Choose **JSON** format
11. Click **Create** - a JSON file will download

### Grant Permissions

1. Return to Google Play Console → **API access**
2. Find your service account in the list
3. Click **Grant access**
4. Under **App permissions**, select your app
5. Under **Account permissions**, select **Release manager** role
6. Click **Apply**
7. Review and click **Send invitation**

### Add Service Account to GitHub

1. Open the downloaded JSON file in a text editor
2. Copy the entire contents
3. Go to GitHub → Settings → Secrets and variables → Actions
4. Click **New repository secret**
5. Name: `PLAY_STORE_SERVICE_ACCOUNT_JSON`
6. Value: Paste the entire JSON content
7. Click **Add secret**

## Step 4: Setup Internal Testing Track (5 minutes)

1. In Google Play Console, go to **Release** → **Testing** → **Internal testing**
2. Click **Create new release**
3. Upload any APK/AAB (you can use the one from your local build)
4. Add release notes
5. Click **Save** and **Review release**
6. Click **Start rollout to Internal testing**
7. Add test users:
   - Click **Testers** tab
   - Create an email list and add tester emails
   - Save

## Step 5: Test the Pipeline (2 minutes)

Now everything is ready! Let's test it:

1. Make a small change to any file (e.g., update README)
2. Commit and push to main branch:
   ```bash
   git add .
   git commit -m "Test CI/CD pipeline"
   git push origin main
   ```
3. Go to GitHub → **Actions** tab
4. Watch the workflow run!

## What Happens Automatically

### On Every Push (Any Branch)
- ✅ TypeScript type checking
- ✅ Code linting
- ✅ Build verification

### On Push to Main Branch
- ✅ All of the above
- ✅ Build signed APK
- ✅ Build signed AAB (App Bundle)
- ✅ Upload to Play Store Internal Testing
- ✅ Notify testers automatically

## Releasing a New Version

When you want to release a new version:

1. **Update version numbers** in `app.json`:
   ```json
   {
     "expo": {
       "version": "1.0.1",  // Increment this
       "android": {
         "versionCode": 2   // Increment this (must be integer)
       }
     }
   }
   ```

2. **Commit and push** to main:
   ```bash
   git add app.json
   git commit -m "Release version 1.0.1"
   git push origin main
   ```

3. **Wait** for GitHub Actions to complete (usually 10-15 minutes)

4. **Check Play Console** → Internal testing → Your testers will see the update

5. **Promote to Production** when ready:
   - Play Console → Internal testing → Click the release
   - Click **Promote release** → **Production**
   - Add production release notes
   - Submit for review

## Troubleshooting

### ❌ Build fails with "Keystore not found"
→ Check that `KEYSTORE_BASE64` secret is correctly added and properly encoded

### ❌ Play Store upload fails
→ Verify service account has "Release Manager" permissions
→ Check that package name matches: `com.satgurupanth.satguruapp`

### ❌ Version conflict error
→ Increment `versionCode` in `app.json` - it must be higher than all previous versions

### ❌ Service account JSON error
→ Make sure you copied the ENTIRE JSON file content
→ Verify the service account has access to your app in Play Console

## Manual Build (If Needed)

If you need to build manually:

```bash
# Generate APK
cd android
./gradlew assembleRelease

# Generate AAB for Play Store
./gradlew bundleRelease
```

Output locations:
- APK: `android/app/build/outputs/apk/release/app-release.apk`
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`

## Getting Help

- Check workflow logs: GitHub → Actions → Click on failed workflow
- Review Play Console status: Play Console → App → Release → Internal testing
- Verify secrets: GitHub → Settings → Secrets and variables → Actions

---

**You're all set!** 🎉

Every time you push to main, your app will automatically build and deploy to internal testing.
