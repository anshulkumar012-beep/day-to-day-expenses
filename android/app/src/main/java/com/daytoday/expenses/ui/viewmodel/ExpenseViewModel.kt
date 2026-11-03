package com.daytoday.expenses.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.daytoday.expenses.data.entity.AccountEntity
import com.daytoday.expenses.data.entity.CategoryEntity
import com.daytoday.expenses.data.entity.ProfileEntity
import com.daytoday.expenses.data.entity.TransactionEntity
import com.daytoday.expenses.data.repository.ExpenseRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

data class DashboardUiState(
    val selectedProfileId: String = "home",
    val todayIncome: Long = 0L,
    val todayExpense: Long = 0L,
    val todayNet: Long = 0L,
    val monthIncome: Long = 0L,
    val monthExpense: Long = 0L,
    val monthSavings: Long = 0L,
    val recentTransactions: List<TransactionEntity> = emptyList(),
    val categories: List<CategoryEntity> = emptyList(),
    val accounts: List<AccountEntity> = emptyList(),
    val profiles: List<ProfileEntity> = emptyList()
)

class ExpenseViewModel(
    private val repository: ExpenseRepository
) : ViewModel() {

    private val _selectedProfileId = MutableStateFlow("home")
    val selectedProfileId: StateFlow<String> = _selectedProfileId.asStateFlow()

    private val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    private val todayStr = dateFormat.format(Date())

    val profiles: StateFlow<List<ProfileEntity>> = repository.getAllProfiles()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val categories: StateFlow<List<CategoryEntity>> = repository.getAllCategories()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val accounts: StateFlow<List<AccountEntity>> = repository.getAllAccounts()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun setProfile(profileId: String) {
        _selectedProfileId.value = profileId
    }

    fun addTransaction(
        type: String,
        amountMinorUnits: Long,
        date: String,
        time: String?,
        profileId: String,
        categoryId: String,
        subCategory: String?,
        accountId: String,
        toAccountId: String?,
        description: String,
        notes: String?,
        referenceNo: String?
    ) {
        viewModelScope.launch {
            repository.insertTransaction(
                TransactionEntity(
                    type = type,
                    amountMinorUnits = amountMinorUnits,
                    date = date,
                    time = time,
                    profileId = profileId,
                    categoryId = categoryId,
                    subCategory = subCategory,
                    accountId = accountId,
                    toAccountId = toAccountId,
                    description = description,
                    notes = notes,
                    referenceNo = referenceNo
                )
            )
        }
    }

    fun deleteTransaction(transaction: TransactionEntity) {
        viewModelScope.launch {
            repository.deleteTransaction(transaction)
        }
    }
}
