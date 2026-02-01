# Play Store Graphics Requirements

## Required Assets for Google Play Store

### 1. App Icon ✅ (Already configured)
- **Size:** 512 x 512 pixels
- **Format:** 32-bit PNG with alpha channel
- **Location:** `src/assets/images/icon.png`
- **Notes:**
  - Must be square
  - Should work on various backgrounds
  - No rounded corners (Android handles this automatically)
  - Already configured in app.json

### 2. Feature Graphic ⚠️ (REQUIRED - Need to create)
- **Size:** 1024 x 500 pixels
- **Format:** JPG or 24-bit PNG (no alpha)
- **File size:** Maximum 1 MB
- **Purpose:** Main promotional image shown at top of store listing
- **Content guidelines:**
  - Showcase the app name prominently
  - Feature key app functionality or UI
  - Use brand colors (your app uses #E3E0CF)
  - Keep text large and readable
  - Avoid clutter
  - No borders or device frames

**Design Tips:**
```
Layout suggestions:
┌──────────────────────────────────────────┐
│  [App Icon]  Satguru Panth               │
│              Brahm Gyan App              │
│                                          │
│  [Screenshot or Feature Visual]          │
└──────────────────────────────────────────┘
```

**Tools to create:**
- Canva: https://www.canva.com (has free templates)
- Figma: https://www.figma.com (free for individuals)
- Adobe Express: https://www.adobe.com/express

### 3. Phone Screenshots ⚠️ (REQUIRED - Minimum 2)
- **Size:** Recommended 1080 x 1920 pixels (9:16 aspect ratio)
- **Format:** JPG or 24-bit PNG
- **Quantity:** Minimum 2, maximum 8
- **File size:** Maximum 8 MB each

**Required Screenshots (Priority Order):**
1. **Home Screen** - Showing the book collection/library
2. **Book Reader** - Displaying text reading interface
3. **Library/Bookmarks** - User's saved books
4. **Profile Screen** - User profile and settings
5. **Book Details** - Individual book information

**How to Capture:**

```bash
# Method 1: Using ADB (with device/emulator running)
~/Library/Android/sdk/platform-tools/adb exec-out screencap -p > screenshot1.png

# Method 2: Using Android Studio
# Click camera icon in Running Devices tool window
```

**Screenshot Enhancement:**
- Add device frames using: https://mockuphone.com
- Or use: https://deviceframes.com
- Keep screenshots clean and representative
- Show actual app content (not Lorem Ipsum)
- Use consistent device frame for all screenshots
- Ensure text is readable

### 4. Tablet Screenshots (Optional but recommended)
- **7-inch:** 1024 x 1800 pixels
- **10-inch:** 2048 x 3840 pixels
- **Format:** JPG or 24-bit PNG
- **Quantity:** Minimum 1 (if provided), maximum 8
- **File size:** Maximum 8 MB each

### 5. App Promotional Video (Optional)
- **Format:** YouTube video URL
- **Length:** 30 seconds to 2 minutes
- **Content:** Showcase key features and user flow
- **Tips:**
  - Start with app name and purpose
  - Show main features in action
  - Keep it concise and engaging
  - Add background music (royalty-free)
  - End with call-to-action

---

## Quick Creation Guide

### Step 1: Capture App Screenshots

Run your app and capture these screens:

```bash
# Start emulator (if not running)
~/Library/Android/sdk/emulator/emulator -avd Pixel_9_API_34 &

# Wait for emulator to boot, then run app
npx expo run:android

# Capture screenshots as you navigate
# Press the screenshot button in Android Studio or use:
~/Library/Android/sdk/platform-tools/adb exec-out screencap -p > home_screen.png
```

Navigate through your app and capture:
1. Home/book collection screen
2. Open a book to the reader view
3. Library or bookmarks section
4. Profile screen
5. Any unique features

### Step 2: Resize Screenshots (if needed)

If screenshots are not 1080x1920:

```bash
# Install ImageMagick (if not installed)
brew install imagemagick

# Resize screenshot
convert input.png -resize 1080x1920 -gravity center -extent 1080x1920 output.png
```

### Step 3: Add Device Frames (Optional)

**Using MockUPhone:**
1. Go to https://mockuphone.com
2. Select Android > Pixel or Generic Android
3. Upload your screenshot
4. Download framed image

**Using Figma/Canva:**
1. Create 1080x1920 canvas
2. Import device frame template
3. Place screenshot
4. Export as PNG

### Step 4: Create Feature Graphic

**Using Canva:**
1. Go to https://www.canva.com
2. Create custom size: 1024 x 500 px
3. Use this layout:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│    [Icon]    SATGURU PANTH                             │
│              Brahm Gyan App                            │
│                                                         │
│              [Screenshot or Visual Element]            │
│                                                         │
│              "Access Divine Knowledge"                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

4. Use colors:
   - Background: #E3E0CF (your app's primary color)
   - Text: Dark/contrasting color
   - Accent: Blue (based on your navigation color)

5. Add elements:
   - App icon (from src/assets/images/icon.png)
   - App name: "Satguru Panth"
   - Tagline: "Brahm Gyan App" or "Access Divine Knowledge"
   - Optional: Small screenshot preview
   - Optional: Decorative elements (books, spiritual symbols)

6. Export as PNG (no transparency) or JPG

**Using Figma:**
```
1. Create new file
2. Frame: 1024 x 500 px
3. Add background color (#E3E0CF)
4. Import app icon
5. Add text layers:
   - Title: "Satguru Panth" (Bold, 48-64px)
   - Subtitle: "Brahm Gyan App" (Regular, 24-32px)
6. Add visual elements
7. Export as PNG or JPG
```

---

## File Organization

Create a folder structure for your store assets:

```
play-store-assets/
├── icon/
│   └── icon-512x512.png
├── feature-graphic/
│   └── feature-graphic-1024x500.png
├── phone-screenshots/
│   ├── 01-home-screen.png
│   ├── 02-book-reader.png
│   ├── 03-library.png
│   ├── 04-profile.png
│   └── 05-book-details.png
├── tablet-screenshots/ (optional)
│   └── ...
└── video/ (optional)
    └── promo-video-youtube-url.txt
```

Let me create this directory structure:

```bash
mkdir -p play-store-assets/{icon,feature-graphic,phone-screenshots,tablet-screenshots,video}
```

---

## Design Guidelines & Best Practices

### Color Scheme (Based on your app)
- **Primary:** #E3E0CF (Beige/Cream)
- **Accent:** Blue (from navigation)
- **Text:** Dark gray or black for readability
- **Background:** White or light variations

### Typography
- **Headings:** Bold, clear, sans-serif
- **Body:** Regular weight, highly readable
- **Size:** Large enough to read in thumbnails

### Visual Style
- **Clean and minimal:** Avoid clutter
- **Professional:** Maintain spiritual/educational tone
- **Consistent:** Use same style across all graphics
- **Readable:** Ensure text is legible at small sizes

### What to Avoid
- ❌ Blurry or pixelated images
- ❌ Too much text
- ❌ Misleading screenshots
- ❌ Device frames that obscure content
- ❌ Copyrighted images without permission
- ❌ Emoji or special characters that may not render
- ❌ Borders or frames on feature graphic

### What to Include
- ✅ Clear app name
- ✅ Actual app interface
- ✅ Key features visible
- ✅ Professional appearance
- ✅ Consistent branding
- ✅ High-quality images
- ✅ Readable text

---

## Checklist Before Upload

### Images Quality Check
- [ ] All images are at correct dimensions
- [ ] File sizes are under limits
- [ ] Images are not blurry or pixelated
- [ ] Colors are consistent across assets
- [ ] Text is readable
- [ ] No copyrighted content used without permission
- [ ] Images accurately represent the app

### Content Check
- [ ] App name is spelled correctly
- [ ] No placeholder or Lorem Ipsum text
- [ ] Screenshots show actual app features
- [ ] Feature graphic is professional
- [ ] All required formats provided
- [ ] Files are properly named

### Technical Check
- [ ] PNG files are 24-bit or 32-bit as required
- [ ] JPG quality is high (90%+)
- [ ] No transparency in feature graphic
- [ ] Alpha channel in app icon
- [ ] Correct aspect ratios
- [ ] Files open correctly

---

## Quick Reference: Dimensions

| Asset Type | Dimensions | Format | Required |
|---|---|---|---|
| App Icon | 512 x 512 | PNG (32-bit + alpha) | ✅ Yes |
| Feature Graphic | 1024 x 500 | PNG/JPG (no alpha) | ✅ Yes |
| Phone Screenshots | 1080 x 1920 | PNG/JPG | ✅ Yes (min 2) |
| 7" Tablet | 1024 x 1800 | PNG/JPG | ❌ Optional |
| 10" Tablet | 2048 x 3840 | PNG/JPG | ❌ Optional |
| Promo Video | N/A | YouTube URL | ❌ Optional |

---

## Resources & Tools

### Free Design Tools
- **Canva:** https://www.canva.com (Easy, templates available)
- **Figma:** https://www.figma.com (Professional, free plan)
- **Adobe Express:** https://www.adobe.com/express (Simple editor)
- **GIMP:** https://www.gimp.org (Free Photoshop alternative)

### Device Frame Generators
- **MockUPhone:** https://mockuphone.com
- **Device Frames:** https://deviceframes.com
- **Facebook Design:** https://facebook.design/devices

### Screenshot Enhancement
- **Previewed:** https://previewed.app
- **Screely:** https://screely.com
- **Screenshot Beautifier:** Various tools online

### Stock Images (if needed)
- **Unsplash:** https://unsplash.com (Free, high-quality)
- **Pexels:** https://www.pexels.com (Free stock photos)
- **Pixabay:** https://pixabay.com (Free images)

### Icon Generators
- **Android Asset Studio:** https://romannurik.github.io/AndroidAssetStudio/

### Color Tools
- **Coolors:** https://coolors.co (Color palette generator)
- **Adobe Color:** https://color.adobe.com

---

## Common Mistakes to Avoid

1. **Wrong dimensions:** Always double-check sizes
2. **Poor quality:** Use high-resolution source images
3. **Misleading content:** Show actual app features
4. **Text too small:** Ensure readability in thumbnails
5. **Inconsistent branding:** Maintain uniform style
6. **Generic screenshots:** Capture real, meaningful content
7. **Outdated screenshots:** Update after major UI changes
8. **Alpha in feature graphic:** Use solid background

---

## After Creating Assets

1. **Review all images carefully**
2. **Get feedback from others**
3. **Test how they look in different sizes**
4. **Ensure accessibility (readable text)**
5. **Check on different screens**
6. **Save source files for future updates**
7. **Upload to Play Console**
8. **Preview in store listing preview tool**

---

## Need Help?

If you need assistance creating these graphics:
- Hire a designer on Fiverr or Upwork
- Use Canva's pre-made templates
- Follow Play Store's design guidelines
- Look at successful apps in your category for inspiration

Remember: First impression matters! High-quality graphics significantly impact download rates.
