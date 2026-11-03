package com.daytoday.expenses.data.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey
import java.util.UUID

@Entity(
    tableName = "profiles"
)
data class ProfileEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val name: String,
    val icon: String = "Home",
    val colorHex: String = "#10B981",
    val isArchived: Boolean = false,
    val isDefault: Boolean = false
)

@Entity(
    tableName = "categories",
    indices = [Index("type")]
)
data class CategoryEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val name: String,
    val nameHi: String? = null,
    val type: String, // "income" or "expense"
    val icon: String = "ShoppingCart",
    val colorHex: String = "#10B981",
    val isArchived: Boolean = false,
    val subcategoriesJson: String = "[]",
    val isSystem: Boolean = false
)

@Entity(
    tableName = "accounts"
)
data class AccountEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val name: String,
    val type: String, // "cash", "bank", "wallet", "credit_card", "custom"
    val initialBalanceMinorUnits: Long = 0L, // in minor units (e.g. 1000.50 NPR = 100050)
    val colorHex: String = "#3B82F6",
    val icon: String = "Landmark",
    val accountNumberMasked: String? = null
)

@Entity(
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
    val amountMinorUnits: Long, // in minor units to guarantee decimal accuracy without floating point errors
    val currency: String = "NPR",
    val date: String, // ISO "YYYY-MM-DD"
    val time: String? = null, // "HH:MM"
    val profileId: String,
    val categoryId: String,
    val subCategory: String? = null,
    val accountId: String,
    val toAccountId: String? = null, // Used for transfers
    val description: String,
    val notes: String? = null,
    val referenceNo: String? = null,
    val receiptUri: String? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)
