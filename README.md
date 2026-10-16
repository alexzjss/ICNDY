# ICNDY

ICNDY is an offline-first Android training companion focused on the Cindy benchmark. Its product scope includes configurable Classic and Beginner Cindy sessions, timestamp-based workout timing, round tracking, local workout history, progress metrics, planned-training streaks, optional reminders, and local JSON backup/restore.

## Download the Android APK

**[Download the latest ICNDY APK](https://github.com/alexzjss/ICNDY/releases/latest/download/ICNDY.apk)** · [Browse all releases](https://github.com/alexzjss/ICNDY/releases)

The direct download link becomes available after the first successful GitHub Release publishes `ICNDY.apk`. If GitHub reports that the asset or latest release does not exist yet, no public APK has been released. Do not download unofficial copies from other repositories.

### Install on Android

1. Open the [latest release](https://github.com/alexzjss/ICNDY/releases/latest) and download **`ICNDY.apk`** under **Assets**. You can also use the direct download link above once a release exists.
2. Open the downloaded APK on your Android phone.
3. If Android asks, allow your browser or file manager to install apps from that source. Only grant this permission to the app you used to download the file; you can revoke it after installation.
4. Confirm the installation and open ICNDY.

This is a sideloaded APK distributed through GitHub Releases, not an app installed from Google Play. Android wording can vary by device and OS version.

## Before the first public release

The repository must contain the app source code, and the app must be tested on an Android emulator or physical device. In particular, verify the full workout flow, pause/resume and timer recovery, saved history, streak behavior, and backup/restore. Passing TypeScript, lint, unit tests, and Expo Doctor is necessary but does not replace device testing.

## Release automation

A GitHub Actions workflow validates the project, builds an Android APK through Expo Application Services (EAS), and attaches `ICNDY.apk` to a GitHub Release when a version tag such as `v0.1.0` is pushed.

One-time setup:

1. Link the app to an EAS project from the project root with `npx eas-cli@latest login` and `npx eas-cli@latest init`. Commit the resulting `extra.eas.projectId` configuration.
2. Ensure `eas.json` has a `preview` profile configured with `distribution: "internal"` and `android.buildType: "apk"`.
3. Create an Expo access token, then add it to the GitHub repository at **Settings → Secrets and variables → Actions → New repository secret**. Name the secret `EXPO_TOKEN`. Never write the token into source code, `app.json`, or a committed `.env` file.
4. Push the complete, reviewed source code and lockfile to `main`.
5. After the manual Android smoke test and repository checks pass, create and push a version tag:

   ```bash
   git checkout main
   git pull --ff-only
   git tag v0.1.0
   git push origin v0.1.0
   ```

6. Check the run under the repository's **Actions** tab. The release is published only if the quality checks, EAS build, and APK download all succeed.

For each later release, use a new version tag (for example `v0.1.1`). Do not reuse an existing release tag.

## Local development

```bash
npm ci
npx expo start
npm run test
npx tsc --noEmit
npm run lint
npx expo-doctor
```

Native capabilities such as SQLite, notifications, keep-awake, and file sharing should be checked on an Android device or compatible development build. The standalone release APK must launch without a development server and continue to work offline after installation.

## Privacy and data

Workout records are intended to remain on the device. Use the in-app JSON export to maintain your own backup. Restoring a backup replaces local records, so inspect the file and confirmation screen before proceeding.

ICNDY is a training tracker, not medical advice. Choose exercise variants appropriate to your ability and stop if an exercise causes pain or concerning symptoms.
