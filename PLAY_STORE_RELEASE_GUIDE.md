# Google Play Store Release Guide - Satguru Panth

## Prerequisites Checklist

### ✅ Technical Requirements
- [x] App is built and tested thoroughly
- [x] Release APK/AAB is signed with release keystore
- [x] App targets latest Android API level (API 34 or higher)
- [x] ProGuard/R8 configuration is set up
- [x] All permissions are justified and documented
- [x] Privacy Policy is created and hosted
- [x] App complies with Google Play policies

### ✅ Required Assets
- [ ] App icon (512 x 512 px, 32-bit PNG)
- [ ] Feature graphic (1024 x 500 px, JPG/PNG)
- [ ] At least 2 phone screenshots (1080 x 1920 px)
- [ ] Store listing content (title, descriptions)
- [ ] Privacy policy URL
- [ ] Content rating questionnaire completed

### ✅ Developer Account
- [ ] Google Play Developer account created ($25 one-time fee)
- [ ] Payment profile set up (if selling apps/in-app purchases)
- [ ] Tax information completed (if applicable)

---

## Step-by-Step Release Process

### Step 1: Build Release APK/AAB

The app is already configured with a release keystore at:
`android/app/satguruapp-release.keystore`

**Build the Android App Bundle (AAB) - Recommended:**

```bash
cd android
./gradlew bundleRelease
```

The AAB will be generated at:
`android/app/build/outputs/bundle/release/app-release.aab`

**Or build APK (Alternative):**

```bash
cd android
./gradlew assembleRelease
```

The APK will be at:
`android/app/build/outputs/apk/release/app-release.apk`

**Note:** Google Play now requires AAB format for new apps. APK is only for testing.

### Step 2: Test the Release Build

Before uploading, thoroughly test the release build:

```bash
# Install the release APK on a device
~/Library/Android/sdk/platform-tools/adb install android/app/build/outputs/apk/release/app-release.apk

# Or install the AAB using bundletool
# Download bundletool from: https://github.com/google/bundletool/releases
java -jar bundletool.jar build-apks --bundle=app-release.aab --output=app.apks
java -jar bundletool.jar install-apks --apks=app.apks
```

**Testing Checklist:**
- [ ] App launches without crashes
- [ ] All features work correctly
- [ ] Network requests succeed
- [ ] Books load and display properly
- [ ] User registration/login works
- [ ] Reading progress saves correctly
- [ ] App handles offline mode gracefully
- [ ] No debug logs or test data visible
- [ ] Back button navigation works
- [ ] App permissions are requested appropriately

### Step 3: Create Google Play Developer Account

1. Go to [Google Play Console](https://play.google.com/console)
2. Pay the $25 one-time registration fee
3. Complete the account details:
   - Developer name
   - Email address
   - Website URL (optional but recommended)
   - Phone number
4. Accept the Developer Distribution Agreement
5. Complete payment profile (if monetizing)

### Step 4: Create App in Play Console

1. Click "Create app" in Play Console
2. Fill in basic details:
   - **App name:** Satguru Panth
   - **Default language:** English (United States)
   - **App or game:** App
   - **Free or paid:** Free
3. Complete declarations:
   - Privacy policy
   - App access
   - Content ratings
   - Target audience
   - News app declaration

### Step 5: Set Up Store Listing

Navigate to "Store presence" > "Main store listing":

1. **App details:**
   - App name: Satguru Panth - Brahm Gyan App
   - Short description: (Copy from PLAY_STORE_LISTING.md)
   - Full description: (Copy from PLAY_STORE_LISTING.md)

2. **Graphics:**
   - App icon: 512 x 512 px
   - Feature graphic: 1024 x 500 px
   - Phone screenshots: At least 2 (1080 x 1920 px recommended)
   - Tablet screenshots: Optional

3. **Categorization:**
   - App category: Books & Reference
   - Tags: brahm gyan, spiritual books, etc.
   - Store listing contact details

4. **Contact details:**
   - Email: support@satgurupanth.com
   - Website: [Your website]
   - Phone: [Optional]

### Step 6: Set Up Privacy Policy

1. Host your privacy policy online (you can use):
   - Your own website
   - GitHub Pages
   - Google Sites (free)
   - Any web hosting service

2. Add the privacy policy URL in:
   - Store listing
   - App access section

**Privacy Policy URL must be accessible via HTTPS**

### Step 7: Complete Content Rating

1. Navigate to "Policy" > "App content" > "Content rating"
2. Select IARC questionnaire
3. Answer questions honestly about your app content
4. Common answers for a spiritual books app:
   - Violence: None
   - Sexual content: None
   - Language: None
   - Controlled substances: None
   - Gambling: None
5. Submit and receive your content ratings

### Step 8: Set Target Audience

1. Go to "Policy" > "App content" > "Target audience"
2. Select age groups:
   - Recommended: 13 and above (or all ages depending on content)
3. Specify if app appeals to children
4. Submit for review

### Step 9: Upload App Bundle

1. Navigate to "Release" > "Production"
2. Click "Create new release"
3. Upload your AAB file (`app-release.aab`)
4. Enter release notes (copy from "What's New" section)
5. Review and save

### Step 10: Set Up App Pricing & Distribution

1. Go to "Release" > "Production" > "Countries/regions"
2. Select countries where you want to distribute
3. Confirm pricing (Free)
4. Review distribution agreement

### Step 11: Complete All Required Sections

Ensure all sections have green checkmarks:
- [ ] Store presence - Main store listing
- [ ] Store presence - Store settings
- [ ] Policy - App content (Content rating, Target audience, etc.)
- [ ] Policy - Privacy policy
- [ ] Release - Production release

### Step 12: Submit for Review

1. Review all information one final time
2. Click "Send X items for review" (if any pending)
3. In Production release page, click "Review release"
4. Click "Start rollout to Production"
5. Confirm rollout

---

## After Submission

### Review Process
- **Timeline:** Usually 2-7 days (sometimes faster)
- **Status:** Check Play Console for updates
- **Email notifications:** You'll receive emails about review status

### If Rejected
1. Read the rejection email carefully
2. Fix the issues mentioned
3. Update your app accordingly
4. Resubmit with changes documented

### After Approval
- Your app will go live on Google Play Store
- Monitor initial user feedback and ratings
- Respond to user reviews promptly
- Track crash reports and fix issues
- Plan regular updates

---

## Creating Required Graphics

### Feature Graphic (1024 x 500 px)
Use design tools like:
- Canva (easiest, has templates)
- Adobe Photoshop
- Figma
- GIMP (free)

**Design Tips:**
- Use app name prominently
- Show key feature or screenshot
- Keep text minimal and readable
- Use brand colors (#E3E0CF based on app config)
- Avoid cluttering

### Screenshots
Capture screenshots from the app running on emulator:

```bash
# Take screenshot using adb
~/Library/Android/sdk/platform-tools/adb exec-out screencap -p > screenshot.png

# Or use Android Studio's built-in screenshot tool
```

**Recommended screenshots:**
1. Home screen with book collection
2. Book reader showing text
3. Library/saved books screen
4. Profile/settings screen
5. Book details page

**Enhancement:**
- Add device frames using tools like:
  - [MockUPhone](https://mockuphone.com/)
  - [Device Frame Generator](https://deviceframes.com/)
  - Android Asset Studio

---

## Keystore Management - IMPORTANT!

### ⚠️ CRITICAL: Backup Your Keystore

Your release keystore is at: `android/app/satguruapp-release.keystore`

**Keystore details:**
- File: `satguruapp-release.keystore`
- Store password: `satguru@2026`
- Key alias: `satguruapp-release`
- Key password: `satguru@2026`

**IMPORTANT SECURITY NOTES:**
1. **Backup immediately:** Copy keystore to multiple secure locations
   - External hard drive
   - Cloud storage (encrypted)
   - Password manager vault
2. **Never commit to git:** Already in .gitignore
3. **Never share publicly:** Keep credentials secret
4. **Document credentials:** Store passwords securely

**If you lose this keystore, you cannot update your app on Play Store!**

### Backup Steps

```bash
# Create a secure backup directory
mkdir -p ~/secure-backups/satgurupanth

# Copy keystore
cp android/app/satguruapp-release.keystore ~/secure-backups/satgurupanth/

# Create a credentials file (store in password manager)
cat > ~/secure-backups/satgurupanth/CREDENTIALS.txt << EOF
Keystore File: satguruapp-release.keystore
Store Password: satguru@2026
Key Alias: satguruapp-release
Key Password: satguru@2026
Generated: $(date)
EOF

# Zip with password protection (replace YOUR_SECURE_PASSWORD)
zip -e ~/secure-backups/satgurupanth-keystore.zip android/app/satguruapp-release.keystore
```

---

## App Updates Process

### For Future Updates:

1. **Update version numbers in:**
   - `android/app/build.gradle`:
     ```gradle
     versionCode 2  // Increment by 1 for each release
     versionName "1.1.0"  // Follow semantic versioning
     ```
   - `app.json`:
     ```json
     "version": "1.1.0"
     ```

2. **Build new AAB:**
   ```bash
   cd android
   ./gradlew bundleRelease
   ```

3. **Create new release in Play Console:**
   - Go to Production
   - Create new release
   - Upload new AAB
   - Add release notes
   - Roll out

### Versioning Strategy
- **Major version (X.0.0):** Major features, breaking changes
- **Minor version (1.X.0):** New features, improvements
- **Patch version (1.0.X):** Bug fixes, minor updates

---

## Monitoring & Analytics

### Set Up Analytics (Recommended)
Consider integrating:
- Google Analytics for Firebase
- Crashlytics for crash reporting
- Play Console crash reports (built-in)

### Key Metrics to Track
- Installs and uninstalls
- Active users (DAU/MAU)
- Crash rate
- ANR (Application Not Responding) rate
- User ratings and reviews
- Retention rates

---

## Pre-Launch Checklist

### Final Verification
- [ ] Test on multiple devices and Android versions
- [ ] Verify all text is spelled correctly
- [ ] Check all images load properly
- [ ] Test network error handling
- [ ] Verify deep links work (if applicable)
- [ ] Test app on low-end devices
- [ ] Verify app size is optimized
- [ ] Remove all debug/development code
- [ ] Check for memory leaks
- [ ] Verify proper logging (no sensitive data)
- [ ] Test app permissions thoroughly
- [ ] Verify in-app navigation flows
- [ ] Test back button behavior
- [ ] Verify app restarts correctly
- [ ] Test offline functionality

### Legal Checklist
- [ ] Privacy policy is complete and accessible
- [ ] Terms of service created (if needed)
- [ ] Copyright notices included
- [ ] Third-party licenses documented
- [ ] User data handling complies with GDPR/CCPA
- [ ] Age restrictions properly set
- [ ] Content is appropriate for rating

---

## Common Issues and Solutions

### Issue: "Your app bundle's version code needs to be at least 1"
**Solution:** Ensure `versionCode` in `build.gradle` is set to 1 or higher.

### Issue: "Upload failed: Release not found"
**Solution:** Create a new release first, then upload AAB.

### Issue: "API not enabled"
**Solution:** Enable Android Management API in Google Cloud Console.

### Issue: "Keystore was tampered with or password was incorrect"
**Solution:** Verify keystore password in `build.gradle` matches your keystore.

### Issue: "APK size too large"
**Solution:**
- Use AAB instead of APK (dynamic delivery)
- Enable resource shrinking
- Optimize images
- Remove unused dependencies

---

## Support & Resources

### Official Documentation
- [Play Console Help](https://support.google.com/googleplay/android-developer)
- [Launch Checklist](https://developer.android.com/distribute/best-practices/launch/launch-checklist)
- [Store Listing Guidelines](https://play.google.com/console/about/guides/releasewithconfidence/)

### Community Resources
- [Android Developers Reddit](https://reddit.com/r/androiddev)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/google-play-console)
- [Expo Forums](https://forums.expo.dev/)

### Contact
For specific questions about this app, contact your development team or refer to the project documentation.

---

## Next Steps After Launch

1. **Monitor initial feedback** (first 48 hours)
2. **Respond to reviews** (especially negative ones)
3. **Track crash reports** and fix critical issues
4. **Plan first update** based on user feedback
5. **Marketing and promotion**
6. **Gather analytics data** for improvements
7. **Regular maintenance** and updates

**Good luck with your Play Store launch! 🚀**
