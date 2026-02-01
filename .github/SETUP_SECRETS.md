# GitHub Secrets Setup - Step by Step

This guide will help you add all required secrets to your GitHub repository for CI/CD.

## Step 1: Prepare Your Keystore

First, encode your Android keystore to base64:

```bash
cd /Users/amishmishra/Documents/Working\ Book/SatguruPanth2
./scripts/encode-keystore.sh
```

**Copy the output** - you'll paste it in Step 2.

## Step 2: Add Keystore Secrets to GitHub

1. Open your repository on GitHub
2. Go to: **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add the following secrets one by one:

### Secret 1: KEYSTORE_BASE64
- **Name**: `KEYSTORE_BASE64`
- **Value**: Paste the base64 string from Step 1
- Click **"Add secret"**

### Secret 2: KEYSTORE_PASSWORD
- **Name**: `KEYSTORE_PASSWORD`
- **Value**: `satguru@2026`
- Click **"Add secret"**

### Secret 3: KEY_ALIAS
- **Name**: `KEY_ALIAS`
- **Value**: `satguruapp-release`
- Click **"Add secret"**

### Secret 4: KEY_PASSWORD
- **Name**: `KEY_PASSWORD`
- **Value**: `satguru@2026`
- Click **"Add secret"**

## Step 3: Setup Google Play Console Service Account

### 3.1 Create Service Account in Google Cloud

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app (or create one)
3. Navigate to: **Setup** → **API access**
4. Click **"Create new service account"** or **"Learn how to create service accounts"**
5. This opens Google Cloud Console
6. Click **"+ CREATE SERVICE ACCOUNT"**
7. Fill in:
   - **Service account name**: `github-actions-deployer`
   - **Service account ID**: Will auto-fill
   - **Description**: `Used by GitHub Actions for automated deployments`
8. Click **"CREATE AND CONTINUE"**
9. **Skip** the optional steps (Grant access, Grant users access)
10. Click **"DONE"**

### 3.2 Create JSON Key

1. Click on the service account you just created
2. Go to the **"KEYS"** tab
3. Click **"ADD KEY"** → **"Create new key"**
4. Select **JSON** format
5. Click **"CREATE"**
6. A JSON file will download to your computer
7. **Keep this file safe** - you'll need it in the next step

### 3.3 Grant Permissions in Play Console

1. Return to Google Play Console → **API access**
2. You should see your service account in the list
3. Click **"Grant access"** next to your service account
4. Under **App permissions**:
   - Check the box for **your app**
5. Under **Account permissions**:
   - Select **"Admin (all permissions)"** OR
   - Select **"Release manager"** for release-only permissions
6. Click **"Invite user"**
7. Click **"Send invitation"**

### 3.4 Add Service Account JSON to GitHub

1. Open the downloaded JSON file in a text editor (e.g., VSCode, Notepad)
2. **Copy the ENTIRE content** (from `{` to `}`)
3. Go back to GitHub: **Settings** → **Secrets and variables** → **Actions**
4. Click **"New repository secret"**

### Secret 5: PLAY_STORE_SERVICE_ACCOUNT_JSON
- **Name**: `PLAY_STORE_SERVICE_ACCOUNT_JSON`
- **Value**: Paste the entire JSON file content
- Click **"Add secret"**

## Step 4: Verify All Secrets

You should now have exactly **5 secrets**:

1. ✅ KEYSTORE_BASE64
2. ✅ KEYSTORE_PASSWORD
3. ✅ KEY_ALIAS
4. ✅ KEY_PASSWORD
5. ✅ PLAY_STORE_SERVICE_ACCOUNT_JSON

## Step 5: Test the Pipeline

### Option A: Make a Test Commit

```bash
# Make a small change
echo "# CI/CD Pipeline Active" >> README.md

# Commit and push
git add README.md
git commit -m "Test: Activate CI/CD pipeline"
git push origin main
```

### Option B: Manual Trigger

1. Go to your repository on GitHub
2. Click **"Actions"** tab
3. Select **"Android Build and Deploy"** workflow
4. Click **"Run workflow"**
5. Select **main** branch
6. Click **"Run workflow"** button

## Step 6: Monitor the Build

1. Go to **Actions** tab
2. Click on the running workflow
3. Watch the build process (takes 10-15 minutes)
4. If successful, you'll see:
   - ✅ Build job completed
   - ✅ Deploy job completed (if on main branch)
   - 📦 Artifacts available for download

## Troubleshooting

### ❌ Build fails at "Decode Keystore" step
**Solution**: Check that KEYSTORE_BASE64 was copied correctly. Re-run `./scripts/encode-keystore.sh` and update the secret.

### ❌ Build fails at "Build Android Release" step
**Solution**: Verify KEYSTORE_PASSWORD, KEY_ALIAS, and KEY_PASSWORD are exactly: `satguru@2026`, `satguruapp-release`, `satguru@2026`

### ❌ Deploy fails with "Permission denied"
**Solution**:
1. Go to Play Console → API access
2. Verify service account has "Release Manager" or "Admin" role
3. Verify service account is granted access to your specific app

### ❌ Deploy fails with "Package name mismatch"
**Solution**: Ensure your app in Play Console has package name: `com.satgurupanth.satguruapp`

### ❌ "Service account JSON is invalid"
**Solution**:
1. Open the JSON file again
2. Copy from the very first `{` to the very last `}`
3. Make sure no extra characters or line breaks
4. Update the PLAY_STORE_SERVICE_ACCOUNT_JSON secret

## Security Notes

🔒 **Important Security Practices:**
- Never share these secrets
- Never commit them to git
- If secrets are exposed, regenerate them immediately
- Rotate service account keys every 6-12 months
- Review Play Console access permissions quarterly

## Need Help?

- **GitHub Actions Logs**: Repository → Actions → Click on workflow run
- **Play Console Status**: Play Console → Your app → Release management
- **Service Account Issues**: Play Console → Setup → API access

---

**Setup Complete!** 🎉

Your CI/CD pipeline is now configured. Every push to `main` will automatically build and deploy to Play Store Internal Testing!
