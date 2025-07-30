// Initialize data
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let budgets = JSON.parse(localStorage.getItem('budgets')) || [
  { id: 1, kategori: "Kebutuhan Pokok", nama: "Makan Harian", estimasi: 600000, keterangan: "20.000 x 30 hari" },
  { id: 2, kategori: "Kebutuhan Pokok", nama: "Transportasi", estimasi: 150000, keterangan: "Pulang-pergi sekolah/kampus" },
  { id: 3, kategori: "Kebutuhan Pokok", nama: "Pulsa/Internet", estimasi: 100000, keterangan: "Paket data atau kuota wifi" },
  { id: 4, kategori: "Kebersihan", nama: "Skincare dasar", estimasi: 80000, keterangan: "Sabun muka, toner, dll" },
  { id: 5, kategori: "Kebersihan", nama: "Sabun + shampoo", estimasi: 40000, keterangan: "Rutin bulanan" },
  { id: 6, kategori: "Pendidikan", nama: "Alat Tulis", estimasi: 20000, keterangan: "Pulpen, buku catatan" },
  { id: 7, kategori: "Hiburan/Jajan", nama: "Jajan mingguan", estimasi: 200000, keterangan: "50rb x 4 minggu" },
  { id: 8, kategori: "Cadangan/tabungan", nama: "Tabungan", estimasi: 150000, keterangan: "Simpanan rutin tiap bulan" }
];

// Initialize the app
document.addEventListener('DOMContentLoaded', init);

function init() {
  // Initialize data if not exists
  if (!localStorage.getItem('budgets')) {
    saveBudgets();
  }

  // Set default date to today
  document.getElementById('date').valueAsDate = new Date();
  
  // Setup event listeners
  setupTabNavigation();
  setupTransactionForm();
  setupPrintButton();
  
  // Render initial data
  renderTransactions();
  renderBudgets();
  updateSummary();
}

// Tab navigation
function setupTabNavigation() {
  const tabButtons = document.querySelectorAll('.tab-button');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      
      // Update active tab button
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Update active tab content
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(tabId).classList.add('active');
    });
  });
}

// Transaction form handling
function setupTransactionForm() {
  const form = document.getElementById('transaction-form');
  const cancelBtn = document.getElementById('cancel-edit');
  
  form.addEventListener('submit', handleTransactionSubmit);
  cancelBtn.addEventListener('click', resetTransactionForm);
}

function handleTransactionSubmit(e) {
  e.preventDefault();
  
  const transactionData = {
    id: parseInt(document.getElementById('edit-transaction-id').value) || Date.now(),
    date: document.getElementById('date').value,
    category: document.getElementById('category').value,
    description: document.getElementById('description').value,
    type: document.getElementById('type').value,
    amount: parseFloat(document.getElementById('amount').value)
  };
  
  if (document.getElementById('edit-transaction-id').value) {
    // Update existing transaction
    const index = transactions.findIndex(t => t.id === transactionData.id);
    if (index !== -1) {
      transactions[index] = transactionData;
    }
  } else {
    // Add new transaction
    transactions.push(transactionData);
  }
  
  saveTransactions();
  renderTransactions();
  updateSummary();
  resetTransactionForm();
}

function resetTransactionForm() {
  document.getElementById('transaction-form').reset();
  document.getElementById('edit-transaction-id').value = '';
  document.getElementById('cancel-edit').style.display = 'none';
  document.getElementById('save-transaction').textContent = 'Simpan';
  document.getElementById('date').valueAsDate = new Date();
}

// Budget functions
function editBudget(id) {
  const budget = budgets.find(b => b.id === id);
  if (!budget) return;

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Edit Budget</h3>
      <form id="budget-edit-form">
        <input type="hidden" id="edit-budget-id" value="${budget.id}">
        <div class="form-group">
          <label for="edit-budget-category">Kategori:</label>
          <input type="text" id="edit-budget-category" value="${budget.kategori}" required>
        </div>
        <div class="form-group">
          <label for="edit-budget-name">Nama Kebutuhan:</label>
          <input type="text" id="edit-budget-name" value="${budget.nama}" required>
        </div>
        <div class="form-group">
          <label for="edit-budget-amount">Estimasi Biaya (Rp):</label>
          <input type="number" id="edit-budget-amount" value="${budget.estimasi}" min="0" required>
        </div>
        <div class="form-group">
          <label for="edit-budget-notes">Keterangan:</label>
          <input type="text" id="edit-budget-notes" value="${budget.keterangan || ''}">
        </div>
        <div class="modal-actions">
          <button type="button" id="cancel-budget-edit">Batal</button>
          <button type="submit" id="save-budget-edit">Simpan</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  modal.style.display = 'flex';

  // Form submission
  modal.querySelector('#budget-edit-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const updatedBudget = {
      id: budget.id,
      kategori: document.getElementById('edit-budget-category').value,
      nama: document.getElementById('edit-budget-name').value,
      estimasi: parseFloat(document.getElementById('edit-budget-amount').value),
      keterangan: document.getElementById('edit-budget-notes').value
    };
    
    const index = budgets.findIndex(b => b.id === updatedBudget.id);
    if (index !== -1) {
      budgets[index] = updatedBudget;
      saveBudgets();
      renderBudgets();
    }
    
    modal.remove();
  });

  // Cancel button
  modal.querySelector('#cancel-budget-edit').addEventListener('click', () => {
    modal.remove();
  });
}

function deleteBudget(id) {
  if (confirm('Apakah Anda yakin ingin menghapus budget ini?')) {
    budgets = budgets.filter(b => b.id !== id);
    saveBudgets();
    renderBudgets();
  }
}

// Print functionality
function setupPrintButton() {
  const printBtn = document.getElementById('print-transactions');
  
  printBtn.addEventListener('click', generateTransactionReport);
}

function generateTransactionReport() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.text('Laporan Transaksi Keuangan', 105, 20, { align: 'center' });
  
  // Print date
  doc.setFontSize(10);
  const now = new Date();
  doc.text(`Dicetak pada: ${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID')}`, 14, 30);
  
  // Summary
  doc.setFontSize(12);
  doc.text(`Total Pemasukan: ${document.getElementById('total-income').textContent}`, 14, 45);
  doc.text(`Total Pengeluaran: ${document.getElementById('total-expense').textContent}`, 14, 55);
  doc.text(`Saldo: ${document.getElementById('balance').textContent}`, 14, 65);
  
  // Transactions table
  doc.autoTable({
    startY: 75,
    head: [['Tanggal', 'Kategori', 'Keterangan', 'Jumlah']],
    body: Array.from(document.querySelectorAll('#transactions-table tbody tr')).map(row => {
      return Array.from(row.querySelectorAll('td')).slice(0, -1).map(cell => cell.textContent);
    }),
    headStyles: {
      fillColor: [67, 97, 238],
      textColor: 255,
      fontStyle: 'bold'
    },
    columnStyles: {
      3: { halign: 'right' }
    },
    styles: {
      fontSize: 10,
      cellPadding: 5
    },
    margin: { top: 75 }
  });
  
  // Open PDF in new tab
  window.open(doc.output('bloburl'), '_blank');
}

// Data rendering functions
function renderTransactions() {
  const tbody = document.querySelector('#transactions-table tbody');
  tbody.innerHTML = '';
  
  // Sort by date (newest first)
  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  sortedTransactions.forEach(transaction => {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>${transaction.date}</td>
      <td>${transaction.category}</td>
      <td>${transaction.description}</td>
      <td class="${transaction.type}">${formatCurrency(transaction.amount)}</td>
      <td>
        <div class="action-buttons">
          <button class="action-btn edit-btn" onclick="editTransaction(${transaction.id})" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="action-btn delete-btn" onclick="deleteTransaction(${transaction.id})" title="Hapus">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </td>
    `;
    
    tbody.appendChild(row);
  });
}

function renderBudgets() {
  const tbody = document.querySelector('#budgets-table tbody');
  tbody.innerHTML = '';
  
  let totalEstimate = 0;
  
  budgets.forEach((budget, index) => {
    totalEstimate += budget.estimasi;
    
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${budget.kategori}</td>
      <td>${budget.nama}</td>
      <td>${formatCurrency(budget.estimasi)}</td>
      <td>${budget.keterangan || '-'}</td>
      <td>
        <div class="action-buttons">
          <button class="action-btn edit-btn" onclick="editBudget(${budget.id})" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="action-btn delete-btn" onclick="deleteBudget(${budget.id})" title="Hapus">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </td>
    `;
    
    tbody.appendChild(row);
  });
  
  // Update total estimate
  document.getElementById('total-estimate').textContent = formatCurrency(totalEstimate);
}

function updateSummary() {
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const expense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const balance = income - expense;
  
  document.getElementById('total-income').textContent = formatCurrency(income);
  document.getElementById('total-expense').textContent = formatCurrency(expense);
  document.getElementById('balance').textContent = formatCurrency(balance);
  
  // Color balance based on value
  const balanceEl = document.getElementById('balance');
  balanceEl.className = balance < 0 ? 'expense' : 'income';
}

// Helper functions
function formatCurrency(amount) {
  return 'Rp ' + amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function saveTransactions() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

function saveBudgets() {
  localStorage.setItem('budgets', JSON.stringify(budgets));
}

// Global functions needed for HTML onclick
window.editTransaction = function(id) {
  const transaction = transactions.find(t => t.id === id);
  if (transaction) {
    document.getElementById('date').value = transaction.date;
    document.getElementById('category').value = transaction.category;
    document.getElementById('description').value = transaction.description;
    document.getElementById('type').value = transaction.type;
    document.getElementById('amount').value = transaction.amount;
    document.getElementById('edit-transaction-id').value = transaction.id;
    document.getElementById('cancel-edit').style.display = 'inline-block';
    document.getElementById('save-transaction').textContent = 'Update';
    
    document.getElementById('transaction-form').scrollIntoView({ behavior: 'smooth' });
  }
};

window.deleteTransaction = function(id) {
  if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
    renderTransactions();
    updateSummary();
  }
};

// 1. Konfigurasi Firebase (Ganti dengan konfigurasi Anda)
const firebaseConfig = {
  apiKey: "AIzaSyBLJiobeOAK4Yk50IxJQWpKtuG-VNVDW6I",
  authDomain: "finance-tracker-628bd.firebaseapp.com",
  projectId: "finance-tracker-628bd",
  storageBucket: "finance-tracker-628bd.firebasestorage.app",
  messagingSenderId: "304296727764",
  appId: "1:304296727764:web:4819545acc1e44a15e5741",
  measurementId: "G-0PZJDSDSJC"
};

// 2. Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// 3. Variabel Data
let transactions = [];
let budgets = [];

// 4. Fungsi Simpan ke Firebase
function saveTransaction(transaction) {
  database.ref('transactions').push(transaction);
}

function saveBudget(budget) {
  database.ref('budgets').push(budget);
}

// 5. Fungsi Ambil Data dari Firebase
function loadTransactions() {
  database.ref('transactions').on('value', (snapshot) => {
    transactions = [];
    snapshot.forEach((childSnapshot) => {
      transactions.push(childSnapshot.val());
    });
    renderTransactions();
  });
}

function loadBudgets() {
  database.ref('budgets').on('value', (snapshot) => {
    budgets = [];
    snapshot.forEach((childSnapshot) => {
      budgets.push(childSnapshot.val());
    });
    renderBudgets();
  });
}

// 6. Fungsi Tampilkan Data di Tabel
function renderTransactions() {
  const tbody = document.querySelector('#transactions-table tbody');
  tbody.innerHTML = '';
  
  transactions.forEach(transaction => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${transaction.date}</td>
      <td>${transaction.category}</td>
      <td>${transaction.description}</td>
      <td>Rp ${transaction.amount.toLocaleString()}</td>
    `;
    tbody.appendChild(row);
  });
}

// 7. Event Listener Form
document.getElementById('transaction-form').addEventListener('submit', (e) => {
  e.preventDefault();
  
  const transaction = {
    date: document.getElementById('date').value,
    category: document.getElementById('category').value,
    description: document.getElementById('description').value,
    type: document.getElementById('type').value,
    amount: parseFloat(document.getElementById('amount').value)
  };
  
  saveTransaction(transaction);
  e.target.reset();
});

// 8. Load Data Saat Aplikasi Dibuka
loadTransactions();
loadBudgets();