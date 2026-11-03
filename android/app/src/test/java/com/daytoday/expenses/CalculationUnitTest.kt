package com.daytoday.expenses

import org.junit.Assert.assertEquals
import org.junit.Test

class CalculationUnitTest {

    @Test
    fun testMonetaryAddition_ExactMinorUnits() {
        // Minor unit calculations (Paisa/Cents) ensure 100% precision
        val item1 = 48050L // 480.50 NPR
        val item2 = 145025L // 1450.25 NPR
        val total = item1 + item2
        assertEquals(193075L, total)
    }

    @Test
    fun testNetCashFlowFormula() {
        val totalIncome = 8500000L // 85,000.00 NPR
        val totalExpenses = 3245000L // 32,450.00 NPR
        val netCashFlow = totalIncome - totalExpenses
        assertEquals(5255000L, netCashFlow)
    }

    @Test
    fun testCategoryPercentageCalculation() {
        val groceryExpense = 15000L
        val totalExpense = 60000L
        val percentage = (groceryExpense.toDouble() / totalExpense.toDouble()) * 100.0
        assertEquals(25.0, percentage, 0.001)
    }

    @Test
    fun testTransfersDoNotAffectIncomeOrExpenseTotals() {
        data class SimpleTx(val type: String, val amount: Long)
        val transactions = listOf(
            SimpleTx("income", 50000L),
            SimpleTx("expense", 20000L),
            SimpleTx("transfer", 10000L) // Account transfer between Bank and Cash
        )

        val totalIncome = transactions.filter { it.type == "income" }.sumOf { it.amount }
        val totalExpense = transactions.filter { it.type == "expense" }.sumOf { it.amount }

        assertEquals(50000L, totalIncome)
        assertEquals(20000L, totalExpense)
        // Transfer does not mutate net cash flow
        val netFlow = totalIncome - totalExpense
        assertEquals(30000L, netFlow)
    }
}
