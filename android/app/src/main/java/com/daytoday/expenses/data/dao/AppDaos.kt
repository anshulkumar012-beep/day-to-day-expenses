package com.daytoday.expenses.data.dao

import androidx.room.*
import com.daytoday.expenses.data.entity.AccountEntity
import com.daytoday.expenses.data.entity.CategoryEntity
import com.daytoday.expenses.data.entity.ProfileEntity
import com.daytoday.expenses.data.entity.TransactionEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface TransactionDao {
    @Query("""
        SELECT * FROM transactions 
        WHERE (:profileId = 'all' OR profileId = :profileId) 
          AND date BETWEEN :startDate AND :endDate 
        ORDER BY date DESC, time DESC
    """)
    fun getTransactionsByPeriod(profileId: String, startDate: String, endDate: String): Flow<List<TransactionEntity>>

    @Query("""
        SELECT * FROM transactions 
        WHERE (:profileId = 'all' OR profileId = :profileId) 
        ORDER BY date DESC, time DESC
    """)
    fun getAllTransactions(profileId: String): Flow<List<TransactionEntity>>

    @Query("""
        SELECT SUM(amountMinorUnits) FROM transactions 
        WHERE (:profileId = 'all' OR profileId = :profileId) 
          AND type = 'income' 
          AND date BETWEEN :startDate AND :endDate
    """)
    fun getTotalIncome(profileId: String, startDate: String, endDate: String): Flow<Long?>

    @Query("""
        SELECT SUM(amountMinorUnits) FROM transactions 
        WHERE (:profileId = 'all' OR profileId = :profileId) 
          AND type = 'expense' 
          AND date BETWEEN :startDate AND :endDate
    """)
    fun getTotalExpenses(profileId: String, startDate: String, endDate: String): Flow<Long?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTransaction(transaction: TransactionEntity)

    @Update
    suspend fun updateTransaction(transaction: TransactionEntity)

    @Delete
    suspend fun deleteTransaction(transaction: TransactionEntity)

    @Query("SELECT COUNT(*) FROM transactions WHERE categoryId = :categoryId")
    suspend fun countTransactionsByCategory(categoryId: String): Int

    @Query("SELECT COUNT(*) FROM transactions WHERE profileId = :profileId")
    suspend fun countTransactionsByProfile(profileId: String): Int
}

@Dao
interface CategoryDao {
    @Query("SELECT * FROM categories ORDER BY name ASC")
    fun getAllCategories(): Flow<List<CategoryEntity>>

    @Query("SELECT * FROM categories WHERE type = :type AND isArchived = 0 ORDER BY name ASC")
    fun getActiveCategoriesByType(type: String): Flow<List<CategoryEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCategory(category: CategoryEntity)

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertAll(categories: List<CategoryEntity>)

    @Update
    suspend fun updateCategory(category: CategoryEntity)

    @Delete
    suspend fun deleteCategory(category: CategoryEntity)
}

@Dao
interface AccountDao {
    @Query("SELECT * FROM accounts ORDER BY name ASC")
    fun getAllAccounts(): Flow<List<AccountEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAccount(account: AccountEntity)

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertAll(accounts: List<AccountEntity>)

    @Update
    suspend fun updateAccount(account: AccountEntity)

    @Delete
    suspend fun deleteAccount(account: AccountEntity)
}

@Dao
interface ProfileDao {
    @Query("SELECT * FROM profiles ORDER BY isDefault DESC, name ASC")
    fun getAllProfiles(): Flow<List<ProfileEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProfile(profile: ProfileEntity)

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertAll(profiles: List<ProfileEntity>)

    @Update
    suspend fun updateProfile(profile: ProfileEntity)

    @Delete
    suspend fun deleteProfile(profile: ProfileEntity)
}
