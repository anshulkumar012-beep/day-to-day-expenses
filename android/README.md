# Day-to-day Expenses — Android Native (Kotlin + Jetpack Compose)

A production-ready personal finance, income and expense tracker built with modern Android architecture.

## Architecture Highlights
- **Framework**: Kotlin 1.9+, Jetpack Compose, Material 3
- **Local-First Database**: Room (SQLite) with zero internet dependency
- **Design Pattern**: MVVM with Coroutines & StateFlow
- **Profile Isolation**: Strict separation between **Home** and **Office / Business** finances
- **Monetary Precision**: Stored in integer minor units (paisa/cents) to eliminate IEEE-754 floating-point drift
- **Reports & Analytics**: Daily, Weekly, Monthly, Quarterly, Yearly, and Nepali/Indian Financial Year periods
- **Multi-Currency & Multilingual**: Default **NPR (Nepalese Rupee)** with INR/USD support; English and Hindi (`values-hi`)

---

## Build & Run Instructions

### Prerequisites
1. **JDK 17+** installed and set as `JAVA_HOME`.
2. **Android Studio** (Hedgehog 2023.1.1 or newer recommended) with Android SDK Platform 34.

### 1. Open in Android Studio
1. Launch Android Studio.
2. Select **Open** and choose the `android/` directory.
3. Allow Gradle to sync dependencies.

### 2. Generate Debug APK
Run the following in the `android/` folder:
```bash
./gradlew assembleDebug
```
The compiled debug APK will be generated at:
```
app/build/outputs/apk/debug/app-debug.apk
```

### 3. Generate Signed Release APK
1. Create or use an existing keystore (`.jks`).
2. Add your signing configuration in `app/build.gradle.kts`:
```kotlin
signingConfigs {
    create("release") {
        storeFile = file("my-release-key.jks")
        storePassword = System.getenv("SIGNING_STORE_PASSWORD")
        keyAlias = System.getenv("SIGNING_KEY_ALIAS")
        keyPassword = System.getenv("SIGNING_KEY_PASSWORD")
    }
}
```
3. Run the release build:
```bash
./gradlew assembleRelease
```
The optimized, ProGuard-minified APK will be generated at:
```
app/build/outputs/apk/release/app-release.apk
```

### 4. Running Unit Tests
Execute the unit tests:
```bash
./gradlew test
```

---

## Data Model & Calculations Rules
- **Total Income**: Sum of all `income` transactions within the selected scope.
- **Total Expenses**: Sum of all `expense` transactions within the selected scope.
- **Net Cash Flow**: `Total Income - Total Expenses`.
- **Transfers**: Deduct from source account, credit to target account. Strictly excluded from income/expense totals.
- **Category %**: `(Category Expense / Total Expense) * 100`. Only calculated when `Total Expense > 0`.
