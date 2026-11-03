package com.daytoday.expenses.data.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import com.daytoday.expenses.data.dao.AccountDao
import com.daytoday.expenses.data.dao.CategoryDao
import com.daytoday.expenses.data.dao.ProfileDao
import com.daytoday.expenses.data.dao.TransactionDao
import com.daytoday.expenses.data.entity.AccountEntity
import com.daytoday.expenses.data.entity.CategoryEntity
import com.daytoday.expenses.data.entity.ProfileEntity
import com.daytoday.expenses.data.entity.TransactionEntity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Database(
    entities = [
        TransactionEntity::class,
        CategoryEntity::class,
        AccountEntity::class,
        ProfileEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {

    abstract fun transactionDao(): TransactionDao
    abstract fun categoryDao(): CategoryDao
    abstract fun accountDao(): AccountDao
    abstract fun profileDao(): ProfileDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context, scope: CoroutineScope): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "day_to_day_expenses.db"
                )
                .addCallback(DatabaseCallback(scope))
                .build()
                INSTANCE = instance
                instance
            }
        }

        private class DatabaseCallback(
            private val scope: CoroutineScope
        ) : RoomDatabase.Callback() {
            override fun onCreate(db: SupportSQLiteDatabase) {
                super.onCreate(db)
                INSTANCE?.let { database ->
                    scope.launch(Dispatchers.IO) {
                        populateInitialDefaults(database)
                    }
                }
            }

            private suspend fun populateInitialDefaults(database: AppDatabase) {
                // Pre-populate Default Profiles: Home and Office
                val profileDao = database.profileDao()
                profileDao.insertAll(
                    listOf(
                        ProfileEntity(id = "home", name = "Home", icon = "Home", colorHex = "#10B981", isDefault = true),
                        ProfileEntity(id = "office", name = "Office / Business", icon = "Briefcase", colorHex = "#3B82F6", isDefault = false)
                    )
                )

                // Pre-populate Default Accounts
                val accountDao = database.accountDao()
                accountDao.insertAll(
                    listOf(
                        AccountEntity(id = "acc_cash", name = "Cash in Hand", type = "cash", initialBalanceMinorUnits = 1500000L, colorHex = "#10B981", icon = "Banknote"),
                        AccountEntity(id = "acc_bank", name = "Bank Account", type = "bank", initialBalanceMinorUnits = 8500000L, colorHex = "#3B82F6", icon = "Landmark"),
                        AccountEntity(id = "acc_wallet", name = "Digital Wallet (eSewa / UPI)", type = "wallet", initialBalanceMinorUnits = 550000L, colorHex = "#8B5CF6", icon = "Smartphone"),
                        AccountEntity(id = "acc_card", name = "Credit Card", type = "credit_card", initialBalanceMinorUnits = 0L, colorHex = "#F59E0B", icon = "CreditCard")
                    )
                )

                // Pre-populate Categories from specification
                val categoryDao = database.categoryDao()
                val defaultCategories = listOf(
                    CategoryEntity(id = "cat_groceries", name = "Groceries", nameHi = "किराना", type = "expense", icon = "ShoppingCart", colorHex = "#10B981", isSystem = true),
                    CategoryEntity(id = "cat_milk", name = "Milk and Dairy", nameHi = "दूध व डेयरी", type = "expense", icon = "Coffee", colorHex = "#06B6D4", isSystem = true),
                    CategoryEntity(id = "cat_veg_fruits", name = "Vegetables and Fruits", nameHi = "सब्जियां व फल", type = "expense", icon = "Apple", colorHex = "#84CC16", isSystem = true),
                    CategoryEntity(id = "cat_food_dining", name = "Food and Dining", nameHi = "खानपान", type = "expense", icon = "Utensils", colorHex = "#F97316", isSystem = true),
                    CategoryEntity(id = "cat_petrol", name = "Petrol and Fuel", nameHi = "पेट्रोल व ईंधन", type = "expense", icon = "Fuel", colorHex = "#EF4444", isSystem = true),
                    CategoryEntity(id = "cat_electricity", name = "Electricity Bill", nameHi = "बिजली बिल", type = "expense", icon = "Zap", colorHex = "#EAB308", isSystem = true),
                    CategoryEntity(id = "cat_water", name = "Water Bill", nameHi = "पानी बिल", type = "expense", icon = "Droplets", colorHex = "#38BDF8", isSystem = true),
                    CategoryEntity(id = "cat_internet_mobile", name = "Internet and Mobile", nameHi = "इंटरनेट व मोबाइल", type = "expense", icon = "Wifi", colorHex = "#6366F1", isSystem = true),
                    CategoryEntity(id = "cat_rent", name = "Rent", nameHi = "किराया", type = "expense", icon = "Building", colorHex = "#8B5CF6", isSystem = true),
                    CategoryEntity(id = "cat_maintenance", name = "House Maintenance", nameHi = "रख-रखाव", type = "expense", icon = "Wrench", colorHex = "#A855F7", isSystem = true),
                    CategoryEntity(id = "cat_transport", name = "Transport and Travel", nameHi = "यात्रा", type = "expense", icon = "Bus", colorHex = "#EC4899", isSystem = true),
                    CategoryEntity(id = "cat_medical", name = "Medical and Health", nameHi = "स्वास्थ्य व दवा", type = "expense", icon = "HeartPulse", colorHex = "#F43F5E", isSystem = true),
                    CategoryEntity(id = "cat_education", name = "Education", nameHi = "शिक्षा", type = "expense", icon = "GraduationCap", colorHex = "#14B8A6", isSystem = true),
                    CategoryEntity(id = "cat_shopping", name = "Shopping", nameHi = "शॉपिंग", type = "expense", icon = "ShoppingBag", colorHex = "#D946EF", isSystem = true),
                    CategoryEntity(id = "cat_entertainment", name = "Entertainment", nameHi = "मनोरंजन", type = "expense", icon = "Tv", colorHex = "#F59E0B", isSystem = true),
                    CategoryEntity(id = "cat_office_supplies", name = "Office Supplies", nameHi = "कार्यालय सामग्री", type = "expense", icon = "FileText", colorHex = "#64748B", isSystem = true),
                    CategoryEntity(id = "cat_staff_business", name = "Staff and Business Expenses", nameHi = "स्टाफ व व्यापार", type = "expense", icon = "Users", colorHex = "#475569", isSystem = true),
                    CategoryEntity(id = "cat_other_expenses", name = "Other Expenses", nameHi = "अन्य विविध", type = "expense", icon = "HelpCircle", colorHex = "#94A3B8", isSystem = true),
                    // Incomes
                    CategoryEntity(id = "cat_salary", name = "Salary", nameHi = "वेतन", type = "income", icon = "Wallet", colorHex = "#10B981", isSystem = true),
                    CategoryEntity(id = "cat_business_income", name = "Business Income", nameHi = "व्यापारिक आय", type = "income", icon = "TrendingUp", colorHex = "#0EA5E9", isSystem = true),
                    CategoryEntity(id = "cat_sales", name = "Sales", nameHi = "बिक्री", type = "income", icon = "BarChart2", colorHex = "#8B5CF6", isSystem = true),
                    CategoryEntity(id = "cat_interest", name = "Interest", nameHi = "ब्याज", type = "income", icon = "Percent", colorHex = "#F59E0B", isSystem = true),
                    CategoryEntity(id = "cat_gifts", name = "Gifts", nameHi = "उपहार", type = "income", icon = "Gift", colorHex = "#EC4899", isSystem = true),
                    CategoryEntity(id = "cat_other_income", name = "Other Income", nameHi = "अन्य आय", type = "income", icon = "DollarSign", colorHex = "#14B8A6", isSystem = true)
                )
                categoryDao.insertAll(defaultCategories)
            }
        }
    }
}
