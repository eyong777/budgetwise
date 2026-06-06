# BudgetWise APK Build Guide

This APK uses Capacitor to open the live BudgetWise website:

https://budgetwise-ptb5.vercel.app

When you update the website on Vercel, the APK will show the updated website too.

## One-Time Setup

Install Android Studio first:

https://developer.android.com/studio

Then run these commands in the project terminal:

```powershell
npm install
npm run android:add
npm run android:sync
npm run android:open
```

Android Studio will open the Android project.

## Build APK

In Android Studio:

1. Click `Build`
2. Click `Build Bundle(s) / APK(s)`
3. Click `Build APK(s)`
4. Wait for the build to finish
5. Click `locate`

The APK is usually created here:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## Install On Your Phone

Copy `app-debug.apk` to your Android phone, then open it.

If Android blocks it, allow install from unknown apps for your file manager.

## After Website Changes

Because this APK loads the live Vercel website, normal website updates only need:

```powershell
git add .
git commit -m "Your update message"
git push
```

No new APK is needed unless you change app icon, app name, package ID, or native Android settings.
