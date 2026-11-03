package com.daytoday.expenses

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.lifecycle.lifecycleScope
import com.daytoday.expenses.data.database.AppDatabase
import com.daytoday.expenses.data.repository.ExpenseRepository
import com.daytoday.expenses.ui.viewmodel.ExpenseViewModel

class MainActivity : ComponentActivity() {

    private lateinit var viewModel: ExpenseViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val database = AppDatabase.getDatabase(applicationContext, lifecycleScope)
        val repository = ExpenseRepository(
            database.transactionDao(),
            database.categoryDao(),
            database.accountDao(),
            database.profileDao()
        )
        viewModel = ExpenseViewModel(repository)

        setContent {
            DayToDayExpensesTheme {
                MainAppScreen(viewModel = viewModel)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainAppScreen(viewModel: ExpenseViewModel) {
    var selectedTab by remember { mutableStateOf(0) }
    val currentProfileId by viewModel.selectedProfileId.collectAsState()
    val profiles by viewModel.profiles.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Day-to-day Expenses", style = MaterialTheme.typography.titleMedium)
                        Text(
                            text = "Scope: ${profiles.find { it.id == currentProfileId }?.name ?: "Home"}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                actions = {
                    IconButton(onClick = {
                        val nextProfile = if (currentProfileId == "home") "office" else "home"
                        viewModel.setProfile(nextProfile)
                    }) {
                        Icon(Icons.Default.SwitchAccount, contentDescription = "Switch Profile")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surfaceColorAtElevation(3.dp)
                )
            )
        },
        bottomBar = {
            NavigationBar {
                val items = listOf("Dashboard", "Transactions", "Reports", "Accounts", "Settings")
                val icons = listOf(Icons.Default.Dashboard, Icons.Default.List, Icons.Default.BarChart, Icons.Default.AccountBalance, Icons.Default.Settings)

                items.forEachIndexed { index, item ->
                    NavigationBarItem(
                        icon = { Icon(icons[index], contentDescription = item) },
                        label = { Text(item) },
                        selected = selectedTab == index,
                        onClick = { selectedTab = index }
                    )
                }
            }
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { /* Open Add Transaction Bottom Sheet */ },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = Color.White
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Transaction")
            }
        }
    ) { innerPadding ->
        Box(modifier = Modifier.padding(innerPadding).fillMaxSize()) {
            when (selectedTab) {
                0 -> Text("Dashboard View - Home & Office isolation active", modifier = Modifier.padding(16.dp))
                1 -> Text("Transactions View - Filterable by date, type, account", modifier = Modifier.padding(16.dp))
                2 -> Text("Reports View - Daily, Weekly, Monthly, FY with PDF/Excel exports", modifier = Modifier.padding(16.dp))
                3 -> Text("Accounts View - Cash, Bank, Digital Wallets & transfers", modifier = Modifier.padding(16.dp))
                4 -> Text("Settings View - NPR/INR currency, Language, Biometric PIN", modifier = Modifier.padding(16.dp))
            }
        }
    }
}

@Composable
fun DayToDayExpensesTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = lightColorScheme(
            primary = Color(0xFF10B981),
            secondary = Color(0xFF3B82F6),
            tertiary = Color(0xFF8B5CF6),
            background = Color(0xFFF8FAFC),
            surface = Color.White
        ),
        content = content
    )
}
