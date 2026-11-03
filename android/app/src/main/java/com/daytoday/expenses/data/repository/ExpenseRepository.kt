package com.daytoday.expenses.data.repository

import com.daytoday.expenses.data.dao.AccountDao
import com.daytoday.expenses.data.dao.CategoryDao
import com.daytoday.expenses.data.dao.ProfileDao
import com.daytoday.expenses.data.dao.TransactionDao
import com.daytoday.expenses.data.entity.AccountEntity
import com.daytoday.expenses.data.entity.CategoryEntity
import com.daytoday.expenses.data.entity.ProfileEntity
import com.daytoday.expenses.data.entity.TransactionEntity
import kotlinx.coroutines.flow.Flow

class ExpenseRepository(
    private val transactionDao: TransactionDao,
    private val categoryDao: CategoryDao,
    private val accountDao: AccountDao,
    private val profileDao: ProfileDao
) {
    fun getTransactionsByPeriod(profileId: String, startDate: String, endDate: String): Flow<List<TransactionEntity>> =
        transactionDao.getTransactionsByPeriod(profileId, startDate, endDate)

    fun getAllTransactions(profileId: String): Flow<List<TransactionEntity>> =
        transactionDao.getAllTransactions(profileId)

    fun getTotalIncome(profileId: String, startDate: String, endDate: String): Flow<Long?> =
        transactionDao.getTotalIncome(profileId, startDate, endDate)

    fun getTotalExpenses(profileId: String, startDate: String, endDate: String): Flow<Long?> =
        transactionDao.getTotalExpenses(profileId, startDate, endDate)

    suspend fun insertTransaction(transaction: TransactionEntity) =
        transactionDao.insertTransaction(transaction)

    suspend fun updateTransaction(transaction: TransactionEntity) =
        transactionDao.updateTransaction(transaction)

    suspend fun deleteTransaction(transaction: TransactionEntity) =
        transactionDao.deleteTransaction(transaction)

    fun getAllCategories(): Flow<List<CategoryEntity>> = categoryDao.getAllCategories()
    fun getActiveCategoriesByType(type: String): Flow<List<CategoryEntity>> = categoryDao.getActiveCategoriesByType(type)
    suspend fun insertCategory(category: CategoryEntity) = categoryDao.insertCategory(category)
    suspend fun countTransactionsByCategory(categoryId: String): Int = transactionDao.countTransactionsByCategory(categoryId)

    fun getAllAccounts(): Flow<List<AccountEntity>> = accountDao.getAllAccounts()
    suspend fun insertAccount(account: AccountEntity) = accountDao.insertAccount(account)

    fun getAllProfiles(): Flow<List<ProfileEntity>> = profileDao.getAllProfiles()
    suspend fun insertProfile(profile: ProfileEntity) = profileDao.insertProfile(profile)
}
