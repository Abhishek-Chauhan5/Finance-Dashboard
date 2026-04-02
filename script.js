let transactions = JSON.parse(localStorage.getItem('transactions')) || [
  { date: '2024-04-01', amount: 50000, category: 'Salary', type: 'income' },
  { date: '2024-04-02', amount: 2000, category: 'Food', type: 'expense' },
  { date: '2024-04-03', amount: 500, category: 'Transport', type: 'expense' },
  { date: '2024-04-04', amount: 1000, category: 'Entertainment', type: 'expense' }
];
let role = 'viewer';
let budget = +localStorage.getItem('budget') || 0;

const list = document.getElementById('transactionList');
const roleSelect = document.getElementById('roleSelect');
const adminControls = document.getElementById('adminControls');
const searchInput = document.getElementById('search');
const typeFilter = document.getElementById('typeFilter');
const sortBy = document.getElementById('sortBy');

roleSelect.addEventListener('change', () => {
  role = roleSelect.value;
  adminControls.classList.toggle('hidden', role !== 'admin');
});

function renderTransactions(data = transactions) {
  // Apply filters
  let filtered = data.filter(t => {
    const matchesSearch = t.category.toLowerCase().includes(searchInput.value.toLowerCase());
    const matchesType = typeFilter.value === 'all' || t.type === typeFilter.value;
    return matchesSearch && matchesType;
  });

  // Apply sorting
  filtered.sort((a, b) => {
    if (sortBy.value === 'date') {
      return new Date(a.date) - new Date(b.date);
    } else if (sortBy.value === 'amount') {
      return b.amount - a.amount;
    } else if (sortBy.value === 'category') {
      return a.category.localeCompare(b.category);
    }
    return 0;
  });

  list.innerHTML = '';
  filtered.forEach((t, index) => {
    const originalIndex = transactions.indexOf(t);
    list.innerHTML += `<tr>
      <td>${t.date}</td>
      <td>₹${t.amount}</td>
      <td>${t.category}</td>
      <td>${t.type}</td>
      <td>
        ${role === 'admin' ? `<button onclick="editTransaction(${originalIndex})">Edit</button>
        <button onclick="deleteTransaction(${originalIndex})">Delete</button>` : ''}
      </td>
    </tr>`;
  });
}

function addTransaction() {
  const t = {
    date: document.getElementById('date').value,
    amount: +document.getElementById('amount').value,
    category: document.getElementById('category').value,
    type: document.getElementById('type').value
  };
  if (!t.date || !t.amount || !t.category) return;
  transactions.push(t);
  localStorage.setItem('transactions', JSON.stringify(transactions));
  updateUI();
}

function editTransaction(index) {
  const t = transactions[index];
  document.getElementById('date').value = t.date;
  document.getElementById('amount').value = t.amount;
  document.getElementById('category').value = t.category;
  document.getElementById('type').value = t.type;
  // Remove the old one and add new on save
  deleteTransaction(index);
}

function setBudget() {
  budget = +document.getElementById('budgetInput').value || 0;
  localStorage.setItem('budget', budget);
  updateUI();
}

function updateUI() {
  renderTransactions();
  const income = transactions.filter(t => t.type==='income').reduce((a,b)=>a+b.amount,0);
  const expense = transactions.filter(t => t.type==='expense').reduce((a,b)=>a+b.amount,0);
  document.getElementById('income').innerText = `Income: ₹${income}`;
  document.getElementById('expense').innerText = `Expenses: ₹${expense}`;
  document.getElementById('balance').innerText = `Balance: ₹${income-expense}`;
  const budgetEl = document.getElementById('budget');
  budgetEl.innerText = `Budget: ₹${budget}`;
  budgetEl.style.color = expense > budget && budget > 0 ? 'red' : 'black';

  generateInsights();
  drawCharts();
}

function generateInsights() {
  let categoryMap = {};
  transactions.forEach(t => {
    if(t.type==='expense') {
      categoryMap[t.category] = (categoryMap[t.category]||0) + t.amount;
    }
  });
  let top = Object.keys(categoryMap).sort((a,b)=>categoryMap[b]-categoryMap[a])[0];
  document.getElementById('topCategory').innerText = `Top Spending Category: ${top || 'N/A'}`;

  // Monthly comparison
  const now = new Date();
  const thisMonth = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const lastMonth = transactions.filter(t => {
    const d = new Date(t.date);
    const lm = new Date(now.getFullYear(), now.getMonth() - 1);
    return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
  });
  const thisMonthExpense = thisMonth.filter(t=>t.type==='expense').reduce((a,b)=>a+b.amount,0);
  const lastMonthExpense = lastMonth.filter(t=>t.type==='expense').reduce((a,b)=>a+b.amount,0);
  const diff = thisMonthExpense - lastMonthExpense;
  document.getElementById('monthlyCompare').innerText = `Monthly Expense Change: ${diff >= 0 ? '+' : ''}₹${diff} (${lastMonthExpense ? ((diff / lastMonthExpense) * 100).toFixed(1) : 0}%)`;
}

function drawCharts() {
  const ctx1 = document.getElementById('trendChart');
  const ctx2 = document.getElementById('categoryChart');

  new Chart(ctx1, {
    type: 'line',
    data: {
      labels: transactions.map(t=>t.date),
      datasets: [{ label:'Amount', data: transactions.map(t=>t.amount) }]
    }
  });

  let cat = {};
  transactions.forEach(t=>{
    if(t.type==='expense') cat[t.category]=(cat[t.category]||0)+t.amount;
  });

  new Chart(ctx2, {
    type: 'pie',
    data: {
      labels: Object.keys(cat),
      datasets: [{ data: Object.values(cat) }]
    }
  });
}

// search filter

searchInput.addEventListener('input', () => renderTransactions());
typeFilter.addEventListener('change', () => renderTransactions());
sortBy.addEventListener('change', () => renderTransactions());

// dark mode

document.getElementById('toggleDark').onclick = () => {
  document.body.classList.toggle('dark');
};

// Initialize
updateUI();

updateUI();
