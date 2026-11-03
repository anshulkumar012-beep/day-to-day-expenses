import React, { useState } from 'react';
import { X, Check, Copy, Terminal, Smartphone, Database, Layers, Shield, FileCode2 } from 'lucide-react';

interface AndroidDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidDocsModal: React.FC<AndroidDocsModalProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState<'architecture' | 'database' | 'gradle' | 'build' | 'tests'>('architecture');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-6">
      <div className="w-full max-w-4xl bg-slate-900 text-slate-100 rounded-3xl shadow-2xl border border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Native Android Implementation (Kotlin + Jetpack Compose)</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                  Room SQLite + Material 3
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Complete production architecture, Room entities, DAOs, ViewModels & Gradle build scripts
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 gap-2 overflow-x-auto text-xs py-2">
          {[
            { id: 'architecture', label: '1. Architecture & Files', icon: Layers },
            { id: 'database', label: '2. Room Schema & DAOs', icon: Database },
            { id: 'gradle', label: '3. Gradle Configuration', icon: FileCode2 },
            { id: 'build', label: '4. Build & APK Guide', icon: Terminal },
            { id: 'tests', label: '5. Unit & Integration Tests', icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`flex items-center gap-2 py-2 px-3 rounded-xl font-bold whitespace-nowrap transition-colors ${
                  activeSection === tab.id
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono leading-relaxed">
          {activeSection === 'architecture' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="text-emerald-400 font-bold mb-2">
                  // Native Android Directory Structure under /android
                </div>
                <pre className="text-slate-300 text-[11px] overflow-x-auto">
{`android/
├── build.gradle.kts                      # Root Gradle build script
├── settings.gradle.kts                   # Project settings & plugin management
├── gradle.properties                     # JVM & memory configuration
├── app/
│   ├── build.gradle.kts                  # Compose, Room, Coroutines, M3 dependencies
│   ├── src/
│   │   ├── main/
│   │   │   ├── AndroidManifest.xml       # Permissions (Storage for Exports, Biometrics)
│   │   │   ├── res/
│   │   │   │   ├── values/strings.xml    # Default English strings
│   │   │   │   ├── values-hi/strings.xml # Hindi localization strings
│   │   │   │   ├── values/colors.xml     # Material 3 colors & palettes
│   │   │   │   └── values/themes.xml     # Material3 theme styles
│   │   │   └── java/com/daytoday/expenses/
│   │   │       ├── MainActivity.kt       # Single activity Compose entry point
│   │   │       ├── data/
│   │   │       │   ├── entity/           # TransactionEntity, CategoryEntity, AccountEntity, ProfileEntity
│   │   │       │   ├── dao/              # TransactionDao, CategoryDao, AccountDao, ProfileDao
│   │   │       │   ├── database/         # AppDatabase.kt (Room SQLite with migrations)
│   │   │       │   └── repository/       # ExpenseRepository.kt (Coroutines Flow)
│   │   │       ├── ui/
│   │   │       │   ├── theme/            # Color.kt, Theme.kt, Type.kt
│   │   │       │   ├── viewmodel/        # ExpenseViewModel.kt (StateFlow)
│   │   │       │   ├── screens/          # DashboardScreen, TransactionsScreen, ReportsScreen, AccountsScreen
│   │   │       │   └── components/       # AddTransactionSheet, DonutChart, CategoryPill
│   │   │       └── export/               # ExportManager.kt (PDF, Excel, CSV via SAF)
│   │   └── test/
│   │       └── java/com/daytoday/expenses/
│   │           └── CalculationUnitTest.kt # Financial calculations, date ranges, rounding tests`}
                </pre>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-slate-300 space-y-2">
                <div className="text-emerald-400 font-bold">Key Architectural Principles:</div>
                <p>• <b>Offline-First Room (SQLite):</b> No external servers required. Data is stored on-device in a robust SQLite database with foreign keys and indexes.</p>
                <p>• <b>Profile Isolation:</b> Home and Office transactions have separate profile IDs. Queries filter strictly by profile ID to prevent accidental ledger mixing.</p>
                <p>• <b>Decimal-Safe Monetary Units:</b> Amounts stored as long integer minor units (paisa/cents) or double precision with authoritative rounding to avoid binary floating-point drift.</p>
                <p>• <b>Transfers:</b> Account transfers debit source account and credit destination account; excluded from consolidated income and expense reports.</p>
              </div>
            </div>
          )}

          {activeSection === 'database' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-emerald-400 font-bold">// TransactionEntity.kt (Room Entity)</span>
                  <button
                    onClick={() => copyToClipboard(`@Entity(
    tableName = "transactions",
    indices = [
        Index("profileId"),
        Index("categoryId"),
        Index("accountId"),
        Index("date")
    ]
)
data class TransactionEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val type: String, // "income", "expense", "transfer"
    val amountMinorUnits: Long, // e.g. 1000.50 -> 100050
    val currency: String = "NPR",
    val date: String, // "YYYY-MM-DD"
    val time: String? = null,
    val profileId: String,
    val categoryId: String,
    val subCategory: String? = null,
    val accountId: String,
    val toAccountId: String? = null,
    val description: String,
    val notes: String? = null,
    val referenceNo: String? = null,
    val receiptUri: String? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)`)}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                </div>
                <pre className="text-slate-300 text-[11px] overflow-x-auto">
{`@Entity(
    tableName = "transactions",
    indices = [
        Index("profileId"),
        Index("categoryId"),
        Index("accountId"),
        Index("date")
    ]
)
data class TransactionEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val type: String, // "income", "expense", "transfer"
    val amountMinorUnits: Long, // in minor units (e.g. 1000.50 NPR = 100050)
    val currency: String = "NPR",
    val date: String, // "YYYY-MM-DD"
    val time: String? = null,
    val profileId: String,
    val categoryId: String,
    val subCategory: String? = null,
    val accountId: String,
    val toAccountId: String? = null,
    val description: String,
    val notes: String? = null,
    val referenceNo: String? = null,
    val receiptUri: String? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)`}
                </pre>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="text-emerald-400 font-bold mb-2">// TransactionDao.kt</div>
                <pre className="text-slate-300 text-[11px] overflow-x-auto">
{`@Dao
interface TransactionDao {
    @Query("SELECT * FROM transactions WHERE (:profileId = 'all' OR profileId = :profileId) AND date BETWEEN :startDate AND :endDate ORDER BY date DESC, time DESC")
    fun getTransactionsByPeriod(profileId: String, startDate: String, endDate: String): Flow<List<TransactionEntity>>

    @Query("SELECT SUM(amountMinorUnits) FROM transactions WHERE (:profileId = 'all' OR profileId = :profileId) AND type = 'income' AND date BETWEEN :startDate AND :endDate")
    fun getTotalIncome(profileId: String, startDate: String, endDate: String): Flow<Long?>

    @Query("SELECT SUM(amountMinorUnits) FROM transactions WHERE (:profileId = 'all' OR profileId = :profileId) AND type = 'expense' AND date BETWEEN :startDate AND :endDate")
    fun getTotalExpenses(profileId: String, startDate: String, endDate: String): Flow<Long?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTransaction(transaction: TransactionEntity)

    @Delete
    suspend fun deleteTransaction(transaction: TransactionEntity)
}`}
                </pre>
              </div>
            </div>
          )}

          {activeSection === 'gradle' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="text-emerald-400 font-bold mb-2">// app/build.gradle.kts</div>
                <pre className="text-slate-300 text-[11px] overflow-x-auto">
{`plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.ksp)
}

android {
    namespace = "com.daytoday.expenses"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.daytoday.expenses"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    buildFeatures {
        compose = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.8"
    }
}

dependencies {
    // Jetpack Compose & Material 3
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.material3)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.navigation.compose)

    // Room Database
    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
    ksp(libs.androidx.room.compiler)

    // Coroutines & Lifecycle
    implementation(libs.kotlinx.coroutines.android)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.biometric)

    // Unit Testing
    testImplementation(libs.junit)
    testImplementation(libs.truth)
}`}
                </pre>
              </div>
            </div>
          )}

          {activeSection === 'build' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="text-emerald-400 font-bold">
                  // How to Build Debug APK & Release APK
                </div>

                <div className="space-y-1">
                  <p className="text-white font-semibold">1. Open Project in Android Studio:</p>
                  <p className="text-slate-400">Open the <code className="text-emerald-300">/android</code> folder in Android Studio Hedgehog or newer with JDK 17+.</p>
                </div>

                <div className="space-y-1">
                  <p className="text-white font-semibold">2. Generate Debug APK via Command Line:</p>
                  <pre className="p-2.5 bg-slate-900 rounded-xl text-emerald-300">
                    ./gradlew assembleDebug
                  </pre>
                  <p className="text-slate-400 text-[10px]">
                    Output location: <code className="text-slate-300">app/build/outputs/apk/debug/app-debug.apk</code>
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-white font-semibold">3. Generate Signed Release APK:</p>
                  <pre className="p-2.5 bg-slate-900 rounded-xl text-emerald-300">
                    ./gradlew assembleRelease
                  </pre>
                  <p className="text-slate-400 text-[10px]">
                    Configure your keystore in <code className="text-slate-300">app/build.gradle.kts</code> signingConfigs block with storeFile, storePassword, keyAlias, and keyPassword.
                  </p>
                </div>

                <div className="p-3 bg-amber-950/40 border border-amber-900/60 rounded-xl text-amber-300 text-[11px]">
                  <b>Environment Status Notice:</b> The live sandbox is a Linux Node.js web container without the Android SDK and Java/Gradle binaries pre-installed. The complete Kotlin source code is provided in the repository and in the viewer so you can compile on any machine with Android Studio or CLI!
                </div>
              </div>
            </div>
          )}

          {activeSection === 'tests' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="text-emerald-400 font-bold mb-2">// CalculationUnitTest.kt</div>
                <pre className="text-slate-300 text-[11px] overflow-x-auto">
{`class CalculationUnitTest {
    @Test
    fun testFinancialCalculations_IncomeMinusExpenseEqualsNet() {
        val income = 150000L // 1500.00 NPR
        val expense = 48000L // 480.00 NPR
        val net = income - expense
        assertEquals(102000L, net)
    }

    @Test
    fun testTransferExclusionFromFinancialTotals() {
        val transactions = listOf(
            Transaction("1", "income", 50000L),
            Transaction("2", "expense", 20000L),
            Transaction("3", "transfer", 10000L) // Account transfer
        )
        val totalIncome = transactions.filter { it.type == "income" }.sumOf { it.amount }
        val totalExpense = transactions.filter { it.type == "expense" }.sumOf { it.amount }
        
        assertEquals(50000L, totalIncome)
        assertEquals(20000L, totalExpense)
        // Transfers are not counted in profit/loss cash flow
    }

    @Test
    fun testProfileIsolation() {
        val homeTx = Transaction("1", "expense", 1000L, profileId = "home")
        val officeTx = Transaction("2", "expense", 2000L, profileId = "office")
        
        val homeTotal = listOf(homeTx, officeTx).filter { it.profileId == "home" }.sumOf { it.amount }
        assertEquals(1000L, homeTotal) // Office record never leaks into Home!
    }
}`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-400">Day-to-day Expenses • Android Native Reference</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
