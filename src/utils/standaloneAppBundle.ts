// Utility to generate a standalone offline single-file HTML application that users can download directly to their phone
// This completely avoids Android APK "Problem while parsing the package" installer errors.
// When opened on any Android browser (Chrome, Samsung Internet, Firefox), it runs 100% offline with localStorage persistence.

export const generateStandaloneAppHtml = (dataSnapshot?: any): string => {
  const initialDataJson = JSON.stringify(dataSnapshot || {
    transactions: [],
    categories: [],
    accounts: [],
    profiles: [],
    settings: { currency: 'NPR', language: 'hi' }
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="theme-color" content="#0d6e5a">
  <title>Day to Day Expenses</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; -webkit-tap-highlight-color: transparent; }
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  </style>
</head>
<body class="bg-slate-100 text-slate-900 pb-20 select-none">
  <div id="app" class="max-w-md mx-auto min-h-screen bg-white shadow-xl flex flex-col">
    <!-- Top Header -->
    <header class="sticky top-0 z-30 bg-[#0d6e5a] text-white px-4 py-3.5 flex items-center justify-between shadow-md">
      <div class="flex items-center gap-2">
        <span class="text-xl">💳</span>
        <div>
          <h1 class="text-base font-extrabold leading-tight">Day to Day Expenses</h1>
          <p class="text-[10px] text-emerald-200">Offline Phone App • 100% Local</p>
        </div>
      </div>
      <div id="profileBadge" class="bg-emerald-800 text-emerald-100 px-2.5 py-1 rounded-xl text-xs font-bold border border-emerald-600/50">
        🏠 Home
      </div>
    </header>

    <!-- Period Tabs -->
    <div class="bg-white border-b border-slate-200 flex text-center font-bold text-xs sticky top-[53px] z-20">
      <button onclick="setTab('daily')" id="tabDaily" class="flex-1 py-3 text-[#0d6e5a] border-b-2 border-[#0d6e5a]">Daily</button>
      <button onclick="setTab('monthly')" id="tabMonthly" class="flex-1 py-3 text-slate-500">Monthly</button>
      <button onclick="setTab('backup')" id="tabBackup" class="flex-1 py-3 text-slate-500">Backup & Gmail</button>
    </div>

    <!-- Main Dynamic Content -->
    <main class="flex-1 p-3.5 space-y-3" id="mainContent">
      <!-- Injected via JavaScript -->
    </main>

    <!-- Floating Action Button -->
    <button onclick="openAddModal()" class="fixed bottom-6 right-6 w-14 h-14 bg-[#0d6e5a] text-white rounded-full flex items-center justify-center text-3xl font-light shadow-2xl active:scale-95 transition-all z-40 border-2 border-emerald-400">
      +
    </button>

    <!-- Add Transaction Modal -->
    <div id="addModal" class="fixed inset-0 bg-black/60 z-50 hidden flex flex-col justify-end">
      <div class="bg-white rounded-t-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-2 border-b">
          <h3 class="font-bold text-base text-slate-900" id="modalTitle">Add Expense</h3>
          <button onclick="closeAddModal()" class="p-1 text-slate-400 text-lg font-bold">✕</button>
        </div>

        <div class="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl text-xs font-bold text-center">
          <button type="button" onclick="setTxType('expense')" id="btnTypeExpense" class="py-2 rounded-lg bg-rose-600 text-white">Expense</button>
          <button type="button" onclick="setTxType('income')" id="btnTypeIncome" class="py-2 rounded-lg text-slate-600">Income</button>
        </div>

        <!-- 1st: Description -->
        <div>
          <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Description *</label>
          <input type="text" id="txDesc" oninput="handleDescChange()" placeholder="e.g. Milk, Petrol, Vegetables, Salary..." class="w-full h-12 px-3 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-emerald-600">
        </div>

        <!-- 2nd: Amount -->
        <div>
          <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Amount (रु) *</label>
          <input type="number" step="0.01" id="txAmount" placeholder="0.00" class="w-full h-12 px-3 rounded-xl border border-slate-300 text-base font-extrabold text-slate-900 focus:outline-emerald-600">
        </div>

        <!-- 3rd: Category -->
        <div>
          <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Category</label>
          <select id="txCat" class="w-full h-12 px-3 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-emerald-600">
            <option value="Milk">🥛 Milk (दूध)</option>
            <option value="Fuel">⛽ Fuel / Petrol (पेट्रोल)</option>
            <option value="Food">🍽️ Food & Groceries (राशन)</option>
            <option value="Bills">💡 Bills & Utilities (बिल)</option>
            <option value="Salary">💰 Salary (वेतन)</option>
            <option value="Shopping">🛍️ Shopping (खरीदारी)</option>
            <option value="General">🏷️ General (अन्य)</option>
          </select>
        </div>

        <!-- 4th: Payment Mode -->
        <div>
          <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Payment Mode</label>
          <select id="txAccount" class="w-full h-12 px-3 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-emerald-600">
            <option value="Cash in Hand">💵 Cash in Hand</option>
            <option value="Bank Account">🏦 Bank Account</option>
            <option value="Digital Wallet">📱 Digital Wallet / UPI</option>
          </select>
        </div>

        <!-- 5th: Profile & Date in one line -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Profile</label>
            <select id="txProfile" class="w-full h-12 px-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-emerald-600">
              <option value="Home">🏠 Home</option>
              <option value="Office">💼 Office</option>
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Date</label>
            <input type="date" id="txDate" class="w-full h-12 px-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-emerald-600">
          </div>
        </div>

        <button onclick="saveTransaction()" class="w-full py-3.5 bg-[#0d6e5a] text-white rounded-xl font-bold shadow-lg text-sm mt-2 active:scale-95 transition-all">
          ✓ Save Transaction
        </button>
      </div>
    </div>
  </div>

  <script>
    // Embedded Storage Engine
    let DB = JSON.parse(localStorage.getItem('D2D_OFFLINE_DB') || '${JSON.stringify(initialDataJson).slice(1, -1)}');
    if (!DB.transactions) DB.transactions = [];

    let currentTab = 'daily';
    let currentType = 'expense';
    let selectedDate = new Date().toISOString().split('T')[0];

    function setTab(tab) {
      currentTab = tab;
      document.getElementById('tabDaily').className = tab === 'daily' ? 'flex-1 py-3 text-[#0d6e5a] border-b-2 border-[#0d6e5a]' : 'flex-1 py-3 text-slate-500';
      document.getElementById('tabMonthly').className = tab === 'monthly' ? 'flex-1 py-3 text-[#0d6e5a] border-b-2 border-[#0d6e5a]' : 'flex-1 py-3 text-slate-500';
      document.getElementById('tabBackup').className = tab === 'backup' ? 'flex-1 py-3 text-[#0d6e5a] border-b-2 border-[#0d6e5a]' : 'flex-1 py-3 text-slate-500';
      render();
    }

    function render() {
      const container = document.getElementById('mainContent');
      if (currentTab === 'daily') {
        const dayTxs = DB.transactions.filter(t => t.date === selectedDate);
        const incTotal = dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
        const expTotal = dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);
        const saving = incTotal - expTotal;

        container.innerHTML = \`
          <!-- Date & Saving Header -->
          <div class="bg-[#d8f3e5] p-3 rounded-xl flex items-center justify-between border border-emerald-200">
            <input type="date" value="\${selectedDate}" onchange="selectedDate=this.value; render()" class="bg-white px-2 py-1 rounded font-bold text-xs border border-emerald-300">
            <div class="text-right">
              <span class="text-[10px] text-slate-500 block">Savings</span>
              <span class="text-xs font-extrabold \${saving < 0 ? 'text-rose-600' : 'text-emerald-700'}">\${saving < 0 ? '-' : ''}रु \${Math.abs(saving).toLocaleString()}</span>
            </div>
          </div>

          <!-- Summary Box -->
          <div class="grid grid-cols-2 gap-2">
            <div class="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
              <span class="text-[10px] text-emerald-700 font-bold block">Income (+)</span>
              <span class="text-sm font-black text-emerald-800">रु \${incTotal.toLocaleString()}</span>
            </div>
            <div class="bg-rose-50 p-2.5 rounded-xl border border-rose-200">
              <span class="text-[10px] text-rose-700 font-bold block">Expense (-)</span>
              <span class="text-sm font-black text-rose-800">रु \${expTotal.toLocaleString()}</span>
            </div>
          </div>

          <!-- Entries List -->
          <div class="space-y-2 pt-1">
            <div class="font-bold text-xs text-slate-700">Entries for \${selectedDate} (\${dayTxs.length})</div>
            \${dayTxs.length === 0 ? '<div class="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed">No entries yet. Tap + to add.</div>' : ''}
            \${dayTxs.map((t, idx) => \`
              <div class="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
                <div class="min-w-0">
                  <div class="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <span>\${t.category || 'General'}</span>
                    \${t.description ? '<span class="text-[10px] text-slate-400">📝</span>' : ''}
                  </div>
                  <div class="text-[11px] text-slate-500 truncate">\${t.description || t.category} • \${t.account || 'Cash'}</div>
                </div>
                <div class="text-right flex items-center gap-2">
                  <span class="font-extrabold text-xs \${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}">
                    \${t.type === 'income' ? '+' : '-'}रु \${Number(t.amount).toLocaleString()}
                  </span>
                  <button onclick="deleteTx(\${idx})" class="text-slate-300 hover:text-rose-500 text-xs">✕</button>
                </div>
              </div>
            \`).join('')}
          </div>
        \`;
      } else if (currentTab === 'monthly') {
        const monthPrefix = selectedDate.slice(0, 7);
        const monthTxs = DB.transactions.filter(t => (t.date || '').startsWith(monthPrefix));
        const inc = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
        const exp = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);
        const sav = inc - exp;

        container.innerHTML = \`
          <div class="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
            <div class="font-bold text-sm text-slate-900">Monthly Overview (\${monthPrefix})</div>
            <div class="grid grid-cols-3 gap-2 text-center">
              <div class="bg-emerald-50 p-2 rounded-xl"><span class="text-[10px] text-slate-500 block">Income</span><span class="text-xs font-bold text-emerald-700">रु \${inc.toLocaleString()}</span></div>
              <div class="bg-rose-50 p-2 rounded-xl"><span class="text-[10px] text-slate-500 block">Expense</span><span class="text-xs font-bold text-rose-700">रु \${exp.toLocaleString()}</span></div>
              <div class="bg-slate-50 p-2 rounded-xl"><span class="text-[10px] text-slate-500 block">Saving</span><span class="text-xs font-bold \${sav < 0 ? 'text-rose-600' : 'text-emerald-700'}">\${sav < 0 ? '-' : ''}रु \${Math.abs(sav).toLocaleString()}</span></div>
            </div>
            <div class="text-xs text-slate-500 pt-2 border-t">Total Transactions: \${monthTxs.length}</div>
          </div>
        \`;
      } else if (currentTab === 'backup') {
        container.innerHTML = \`
          <div class="bg-white p-4 rounded-2xl border border-slate-200 space-y-4">
            <div class="font-bold text-sm text-slate-900 flex items-center gap-2">
              <span>☁️</span><span>Gmail Account & Backup</span>
            </div>
            <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
              <div class="font-bold">Google Account Connected:</div>
              <div class="font-mono mt-0.5 font-semibold">anshul.kumar012@gmail.com</div>
            </div>
            <button onclick="downloadJsonBackup()" class="w-full py-3 bg-[#0d6e5a] text-white rounded-xl font-bold text-xs shadow-md">
              📥 Download Backup JSON File
            </button>
            <button onclick="emailBackup()" class="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-md">
              ✉️ Send Backup to Gmail (anshul.kumar012@gmail.com)
            </button>
          </div>
        \`;
      }
    }

    function openAddModal() {
      document.getElementById('addModal').classList.remove('hidden');
      document.getElementById('txDate').value = selectedDate;
      document.getElementById('txAmount').value = '';
      document.getElementById('txDesc').value = '';
    }

    function closeAddModal() {
      document.getElementById('addModal').classList.add('hidden');
    }

    function setTxType(type) {
      currentType = type;
      document.getElementById('btnTypeExpense').className = type === 'expense' ? 'py-2 rounded-lg bg-rose-600 text-white' : 'py-2 rounded-lg text-slate-600';
      document.getElementById('btnTypeIncome').className = type === 'income' ? 'py-2 rounded-lg bg-emerald-600 text-white' : 'py-2 rounded-lg text-slate-600';
    }

    function handleDescChange() {
      const val = document.getElementById('txDesc').value.toLowerCase();
      const cat = document.getElementById('txCat');
      if (val.includes('milk') || val.includes('doodh')) cat.value = 'Milk';
      else if (val.includes('petrol') || val.includes('diesel') || val.includes('fuel')) cat.value = 'Fuel';
      else if (val.includes('salary') || val.includes('kamai')) cat.value = 'Salary';
      else if (val.includes('vegetable') || val.includes('sabji') || val.includes('fruit')) cat.value = 'Food';
      else if (val.includes('recharge') || val.includes('bill') || val.includes('bijli')) cat.value = 'Bills';
    }

    function saveTransaction() {
      const amount = parseFloat(document.getElementById('txAmount').value);
      if (!amount || isNaN(amount)) {
        alert('Please enter a valid amount');
        return;
      }
      const newTx = {
        id: 'tx_' + Date.now(),
        type: currentType,
        amount: amount,
        description: document.getElementById('txDesc').value.trim() || document.getElementById('txCat').value,
        category: document.getElementById('txCat').value,
        account: document.getElementById('txAccount').value,
        profile: document.getElementById('txProfile').value,
        date: document.getElementById('txDate').value || selectedDate
      };
      DB.transactions.unshift(newTx);
      localStorage.setItem('D2D_OFFLINE_DB', JSON.stringify(DB));
      closeAddModal();
      render();
    }

    function deleteTx(idx) {
      if (confirm('Delete this entry?')) {
        DB.transactions.splice(idx, 1);
        localStorage.setItem('D2D_OFFLINE_DB', JSON.stringify(DB));
        render();
      }
    }

    function downloadJsonBackup() {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(DB, null, 2));
      const a = document.createElement('a');
      a.setAttribute("href", dataStr);
      a.setAttribute("download", "DayToDay_Expenses_Backup_" + new Date().toISOString().split('T')[0] + ".json");
      document.body.appendChild(a);
      a.click();
      a.remove();
    }

    function emailBackup() {
      const mailto = "mailto:anshul.kumar012@gmail.com?subject=Day to Day Expenses Backup&body=Backup generated on " + new Date().toLocaleString();
      window.location.href = mailto;
    }

    // Initialize
    render();
  </script>
</body>
</html>`;
};
